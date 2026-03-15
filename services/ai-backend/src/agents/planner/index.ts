// ============================================================
// AgentOS — Planner Agent
// Decomposes user prompts into actionable subtasks
// ============================================================

import { BaseAgent, AgentInfo, AgentExecutionContext, AgentExecutionOutput } from '../baseAgent.js';
import { chat } from '../../lib/ollama.js';
import { selectModel } from '../../router/selectModel.js';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('PlannerAgent');

const PLANNER_SYSTEM_PROMPT = `You are a task planning AI agent. Your job is to analyze user requests and break them down into clear, actionable subtasks.

You have access to the following TOOLS:
- web_search: Search the web for information
- code_executor: Run code in a sandbox
- file_system: Read/write local files

For each request, output a structured plan in the following format:

STRATEGY: [Brief description of the overall approach]

TASKS:
1. [CODING] Task description here (TOOLS: [list tools needed])
2. [RESEARCH] Task description here (TOOLS: web_search)
3. [EXECUTION] Task description here (TOOLS: file_system, code_executor)

Valid task types: CODING, RESEARCH, EXECUTION, ANALYSIS

Rules:
- Keep tasks specific and actionable
- Order tasks by dependency
- Each task should be completable by a single agent
- Explicitly mention tools required for each task
- Be concise but thorough`;

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

    try {
      const routing = selectModel(context.prompt, context.model as any);

      logger.info('Planning task', { taskId: context.taskId });

      const result = await chat({
        model: routing.model,
        messages: [
          { role: 'system', content: PLANNER_SYSTEM_PROMPT },
          { role: 'user', content: context.prompt },
        ],
      });

      // Parse subtasks from the output
      const subtasks = this.parseSubtasks(result.content);

      this.info.status = 'idle';
      this.info.currentTaskId = undefined;

      return {
        success: true,
        output: result.content,
        subtasks,
        modelUsed: routing.model,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.info.status = 'error';
      logger.error('Planner execution failed', { error: String(error) });
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
      const match = line.match(/^\d+\.\s*\[(CODING|RESEARCH|EXECUTION|ANALYSIS)\]\s*([^(]+)(?:\(TOOLS:\s*([^)]+)\))?/i);
      if (match) {
        const tools = match[3] ? match[3].split(',').map(t => t.trim().toLowerCase()) : [];
        subtasks.push({
          type: match[1].toLowerCase(),
          prompt: match[2].trim(),
          tools
        });
      }
    }

    return subtasks;
  }
}
