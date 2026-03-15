// ============================================================
// AgentOS — Planner Agent (v2 — with Reasoning Engine)
// Decomposes prompts into actionable subtasks
// ============================================================

import { BaseAgent, AgentInfo, AgentExecutionContext, AgentExecutionOutput } from '../baseAgent.js';
import { runReasoningLoop } from '../reasoningEngine.js';
import { selectModel } from '../../router/selectModel.js';
import { eventBus } from '../../events/eventBus.js';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('PlannerAgent');

const SYSTEM_PROMPT = `You are the Planner Agent for AgentOS. Your job is to analyze user requests and decompose them into clear, actionable subtasks.

For each request, output a structured plan in this format:

STRATEGY: [Brief description of your approach]

TASKS:
1. [CODING] Task description
2. [RESEARCH] Task description
3. [EXECUTION] Task description

Valid task types: CODING, RESEARCH, EXECUTION, ANALYSIS

Rules:
- Keep tasks specific and actionable
- Order by dependency
- Each task should be doable by a single specialized agent
- If the request is simple enough to handle directly, just answer it without creating subtasks`;

export class PlannerAgent implements BaseAgent {
  info: AgentInfo = {
    id: 'planner',
    name: 'Planner Agent',
    description: 'Decomposes complex prompts into actionable subtasks and assigns them to worker agents',
    status: 'idle',
    capabilities: ['task_decomposition', 'planning', 'task_assignment', 'strategy'],
  };

  async execute(context: AgentExecutionContext): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    this.info.status = 'busy';
    this.info.currentTaskId = context.taskId;

    eventBus.emit('agent:status', { agentId: 'planner', status: 'busy', taskId: context.taskId });

    try {
      const routing = selectModel(context.prompt, context.model as any);

      const result = await runReasoningLoop({
        taskId: context.taskId,
        agentId: 'planner',
        model: routing.model,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: context.prompt,
      });

      const subtasks = this.parseSubtasks(result.finalAnswer);

      this.info.status = 'idle';
      this.info.currentTaskId = undefined;
      eventBus.emit('agent:status', { agentId: 'planner', status: 'idle' });

      return {
        success: result.success,
        output: result.finalAnswer,
        subtasks,
        modelUsed: result.modelUsed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.info.status = 'error';
      eventBus.emit('agent:status', { agentId: 'planner', status: 'error' });
      return {
        success: false,
        output: `Planning failed: ${String(error)}`,
        modelUsed: 'none',
        duration: Date.now() - startTime,
      };
    }
  }

  private parseSubtasks(output: string): Array<{ type: string; prompt: string; tools: string[] }> {
    const subtasks: Array<{ type: string; prompt: string; tools: string[] }> = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const match = line.match(/^\d+\.\s*\[(CODING|RESEARCH|EXECUTION|ANALYSIS)\]\s*(.+)/i);
      if (match) {
        subtasks.push({
          type: match[1].toLowerCase(),
          prompt: match[2].trim(),
          tools: [],
        });
      }
    }

    return subtasks;
  }
}
