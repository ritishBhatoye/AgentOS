// ============================================================
// AgentOS — Agent Orchestrator (v2 — with SSE + Tools)
// Coordinates agent execution, task routing, and event streaming
// ============================================================

import { v4 as uuid } from 'uuid';
import { BaseAgent, AgentInfo } from './baseAgent.js';
import { PlannerAgent } from './planner/index.js';
import { CodingAgent } from './coding/index.js';
import { ResearchAgent } from './research/index.js';
import { ExecutionAgent } from './execution/index.js';
import { ArchitectAgent } from './architect/index.js';
import { ReviewerAgent } from './reviewer/index.js';
import { DebuggerAgent } from './debugger/index.js';
import { taskQueue, QueuedTask } from './taskQueue.js';
import { classifyTask } from '../router/selectModel.js';
import { eventBus } from '../events/eventBus.js';
import { recordRun } from '../db/sqlite.js';
import { incrementCounter, recordLatency } from '../metrics/index.js';
import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('Orchestrator');

interface ExecuteRequest {
  id: string;
  prompt: string;
  agentId?: string;
  model?: string;
}

interface OrchestratorResult {
  taskId: string;
  status: 'completed' | 'failed';
  plan?: string;
  tasks: QueuedTask[];
  finalOutput: string;
  totalDuration: number;
}

class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();

  constructor() {
    this.agents.set('planner', new PlannerAgent());
    this.agents.set('coding', new CodingAgent());
    this.agents.set('research', new ResearchAgent());
    this.agents.set('execution', new ExecutionAgent());
    this.agents.set('architect', new ArchitectAgent());
    this.agents.set('reviewer', new ReviewerAgent());
    this.agents.set('debugger', new DebuggerAgent());

    logger.info('Agent Orchestrator initialized', {
      agents: Array.from(this.agents.keys()),
    });
  }

  async execute(request: ExecuteRequest): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const { id: taskId, prompt, agentId, model } = request;

    logger.info('Orchestrator executing', { taskId, agentId, prompt: prompt.substring(0, 100) });

    if (agentId && this.agents.has(agentId)) {
      return this.executeSingleAgent(taskId, prompt, agentId, startTime, model);
    }

    return this.executeWithPlanner(taskId, prompt, startTime, model);
  }

  private async executeSingleAgent(
    taskId: string,
    prompt: string,
    agentId: string,
    startTime: number,
    model?: string,
  ): Promise<OrchestratorResult> {
    const agent = this.agents.get(agentId)!;

    const task: QueuedTask = {
      id: taskId,
      type: classifyTask(prompt).taskType,
      prompt,
      assignedTo: agentId,
      status: 'running',
      priority: 'medium',
      subtaskIds: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    taskQueue.add(task);
    eventBus.emit('task:created', { taskId, type: task.type, agentId });

    const result = await agent.execute({ taskId, prompt, model });

    const finalStatus = result.success ? 'completed' : 'failed';
    taskQueue.updateStatus(taskId, finalStatus, result.output, result.success ? undefined : result.output);
    eventBus.emit(result.success ? 'task:completed' : 'task:failed', {
      taskId, agentId, duration: Date.now() - startTime,
    });

    // Record run history
    const duration = Date.now() - startTime;
    try {
      recordRun({
        id: uuid(), taskId, agentId, model: result.modelUsed,
        prompt: prompt.substring(0, 2000), output: result.output?.substring(0, 5000),
        success: result.success, durationMs: duration,
      });
      incrementCounter('agent_runs', { agent: agentId });
      recordLatency('task_latency_ms', duration, { agent: agentId });
    } catch {}

    return {
      taskId,
      status: finalStatus,
      tasks: [taskQueue.getTask(taskId)!],
      finalOutput: result.output,
      totalDuration: Date.now() - startTime,
    };
  }

  private async executeWithPlanner(
    taskId: string,
    prompt: string,
    startTime: number,
    model?: string,
  ): Promise<OrchestratorResult> {
    const planner = this.agents.get('planner')!;

    // Create parent task
    const parentTask: QueuedTask = {
      id: taskId,
      type: 'planning',
      prompt,
      assignedTo: 'planner',
      status: 'running',
      priority: 'high',
      subtaskIds: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    taskQueue.add(parentTask);
    eventBus.emit('task:created', { taskId, type: 'planning', agentId: 'planner' });

    // Step 1: Plan
    logger.info('Step 1: Planning task decomposition');
    const planResult = await planner.execute({ taskId, prompt, model });

    if (!planResult.success) {
      taskQueue.updateStatus(taskId, 'failed', undefined, planResult.output);
      eventBus.emit('task:failed', { taskId, error: planResult.output });
      return {
        taskId,
        status: 'failed',
        plan: planResult.output,
        tasks: [taskQueue.getTask(taskId)!],
        finalOutput: planResult.output,
        totalDuration: Date.now() - startTime,
      };
    }

    // Step 2: Execute subtasks
    const subtaskResults: string[] = [];
    const allTasks: QueuedTask[] = [taskQueue.getTask(taskId)!];

    if (planResult.subtasks && planResult.subtasks.length > 0) {
      logger.info(`Step 2: Executing ${planResult.subtasks.length} subtasks`);

      for (const subtask of planResult.subtasks) {
        const subtaskId = uuid();
        const workerAgentId = this.mapTypeToAgent(subtask.type);

        const subTask: QueuedTask = {
          id: subtaskId,
          type: subtask.type as any,
          prompt: subtask.prompt,
          assignedTo: workerAgentId,
          status: 'running',
          priority: 'medium',
          parentTaskId: taskId,
          subtaskIds: [],
          metadata: { tools: subtask.tools },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        taskQueue.add(subTask);
        parentTask.subtaskIds.push(subtaskId);
        eventBus.emit('task:created', { taskId: subtaskId, type: subtask.type, agentId: workerAgentId, parentTaskId: taskId });

        const agent = this.agents.get(workerAgentId);
        if (agent) {
          const result = await agent.execute({ taskId: subtaskId, prompt: subtask.prompt });
          const status = result.success ? 'completed' : 'failed';
          taskQueue.updateStatus(subtaskId, status, result.output);
          eventBus.emit(result.success ? 'task:completed' : 'task:failed', {
            taskId: subtaskId, agentId: workerAgentId,
          });
          subtaskResults.push(`[${subtask.type.toUpperCase()}] ${result.output}`);
        }

        allTasks.push(taskQueue.getTask(subtaskId)!);
      }
    } else {
      subtaskResults.push(planResult.output);
    }

    const finalOutput = subtaskResults.join('\n\n---\n\n');
    taskQueue.updateStatus(taskId, 'completed', finalOutput);
    eventBus.emit('task:completed', { taskId, subtaskCount: planResult.subtasks?.length || 0 });

    return {
      taskId,
      status: 'completed',
      plan: planResult.output,
      tasks: allTasks,
      finalOutput,
      totalDuration: Date.now() - startTime,
    };
  }

  private mapTypeToAgent(type: string): string {
    const mapping: Record<string, string> = {
      coding: 'coding',
      research: 'research',
      execution: 'execution',
      analysis: 'research',
      planning: 'planner',
      architecture: 'architect',
      design: 'architect',
      review: 'reviewer',
      debug: 'debugger',
      fix: 'debugger',
    };
    return mapping[type.toLowerCase()] || 'research';
  }

  getAgentStatuses(): Record<string, AgentInfo> {
    const statuses: Record<string, AgentInfo> = {};
    for (const [id, agent] of this.agents) {
      statuses[id] = { ...agent.info };
    }
    return statuses;
  }

  getAgent(id: string): AgentInfo | undefined {
    const agent = this.agents.get(id);
    return agent ? { ...agent.info } : undefined;
  }
}

export const agentOrchestrator = new AgentOrchestrator();
