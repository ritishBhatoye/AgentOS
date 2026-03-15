// ============================================================
// AgentOS — Agent Orchestrator
// Coordinates agent execution and task routing
// ============================================================

import { v4 as uuid } from 'uuid';
import { BaseAgent, AgentInfo, AgentExecutionOutput } from './baseAgent.js';
import { PlannerAgent } from './planner/index.js';
import { CodingAgent } from './coding/index.js';
import { ResearchAgent } from './research/index.js';
import { ExecutionAgent } from './execution/index.js';
import { taskQueue, QueuedTask } from './taskQueue.js';
import { classifyTask } from '../router/selectModel.js';
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
    // Register all agents
    this.agents.set('planner', new PlannerAgent());
    this.agents.set('coding', new CodingAgent());
    this.agents.set('research', new ResearchAgent());
    this.agents.set('execution', new ExecutionAgent());

    logger.info('Agent Orchestrator initialized', {
      agents: Array.from(this.agents.keys()),
    });
  }

  /**
   * Execute a user request through the agent pipeline
   */
  async execute(request: ExecuteRequest): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const { id: taskId, prompt, agentId, model } = request;

    logger.info('Orchestrator executing', { taskId, agentId, prompt: prompt.substring(0, 100) });

    // If a specific agent is requested, route directly to it
    if (agentId && this.agents.has(agentId)) {
      return this.executeSingleAgent(taskId, prompt, agentId, startTime, model);
    }

    // Otherwise, use the planner to decompose and orchestrate
    return this.executeWithPlanner(taskId, prompt, startTime, model);
  }

  /**
   * Execute with a specific agent directly
   */
  private async executeSingleAgent(
    taskId: string,
    prompt: string,
    agentId: string,
    startTime: number,
    model?: string
  ): Promise<OrchestratorResult> {
    const agent = this.agents.get(agentId)!;

    // Create task in queue
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

    // Execute
    const result = await agent.execute({ taskId, prompt, model });

    // Update task
    taskQueue.updateStatus(
      taskId,
      result.success ? 'completed' : 'failed',
      result.output,
      result.success ? undefined : result.output
    );

    return {
      taskId,
      status: result.success ? 'completed' : 'failed',
      tasks: [taskQueue.getTask(taskId)!],
      finalOutput: result.output,
      totalDuration: Date.now() - startTime,
    };
  }

  /**
   * Execute using the planner for task decomposition
   */
  private async executeWithPlanner(
    taskId: string,
    prompt: string,
    startTime: number,
    model?: string
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

    // Step 1: Plan
    logger.info('Step 1: Planning task decomposition');
    const planResult = await planner.execute({ taskId, prompt, model });

    if (!planResult.success) {
      taskQueue.updateStatus(taskId, 'failed', undefined, planResult.output);
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
        const agentId = this.mapTypeToAgent(subtask.type);

        const subTask: QueuedTask = {
          id: subtaskId,
          type: subtask.type as any,
          prompt: subtask.prompt,
          assignedTo: agentId,
          status: 'running',
          priority: 'medium',
          parentTaskId: taskId,
          subtaskIds: [],
          metadata: {
            tools: subtask.tools
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        taskQueue.add(subTask);
        parentTask.subtaskIds.push(subtaskId);

        // Execute subtask
        const agent = this.agents.get(agentId);
        if (agent) {
          const result = await agent.execute({ taskId: subtaskId, prompt: subtask.prompt });
          taskQueue.updateStatus(
            subtaskId,
            result.success ? 'completed' : 'failed',
            result.output
          );
          subtaskResults.push(`[${subtask.type.toUpperCase()}] ${result.output}`);
        }

        allTasks.push(taskQueue.getTask(subtaskId)!);
      }
    } else {
      // No subtasks parsed — use the plan output directly
      subtaskResults.push(planResult.output);
    }

    // Mark parent task as completed
    const finalOutput = subtaskResults.join('\n\n---\n\n');
    taskQueue.updateStatus(taskId, 'completed', finalOutput);

    return {
      taskId,
      status: 'completed',
      plan: planResult.output,
      tasks: allTasks,
      finalOutput,
      totalDuration: Date.now() - startTime,
    };
  }

  /**
   * Map a task type to the appropriate agent
   */
  private mapTypeToAgent(type: string): string {
    const mapping: Record<string, string> = {
      coding: 'coding',
      research: 'research',
      execution: 'execution',
      analysis: 'research',
      planning: 'planner',
    };
    return mapping[type.toLowerCase()] || 'research';
  }

  /**
   * Get all agent statuses
   */
  getAgentStatuses(): Record<string, AgentInfo> {
    const statuses: Record<string, AgentInfo> = {};
    for (const [id, agent] of this.agents) {
      statuses[id] = { ...agent.info };
    }
    return statuses;
  }

  /**
   * Get a specific agent's info
   */
  getAgent(id: string): AgentInfo | undefined {
    const agent = this.agents.get(id);
    return agent ? { ...agent.info } : undefined;
  }
}

// Singleton instance
export const agentOrchestrator = new AgentOrchestrator();
