// ============================================================
// AgentOS — Execution Agent
// Handles command execution, file operations, and automation
// ============================================================

import { BaseAgent, AgentInfo, AgentExecutionContext, AgentExecutionOutput } from '../baseAgent.js';
import { chat } from '../../lib/ollama.js';
import { selectModel } from '../../router/selectModel.js';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('ExecutionAgent');

const EXECUTION_SYSTEM_PROMPT = `You are an execution AI agent. Your job is to plan and describe how to execute tasks, run commands, and perform operations.

Guidelines:
- Describe step-by-step execution plans
- Include exact commands when applicable
- Consider error handling and rollback
- Verify prerequisites before execution
- Report expected outputs

For now, describe the execution plan. Tool integration for actual execution will be added in Phase 4.`;

export class ExecutionAgent implements BaseAgent {
  info: AgentInfo = {
    id: 'execution',
    name: 'Execution Agent',
    description: 'Plans and executes tasks including command execution and file operations',
    status: 'idle',
    capabilities: ['command_execution', 'file_operations', 'automation', 'deployment'],
  };

  async execute(context: AgentExecutionContext): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    this.info.status = 'busy';
    this.info.currentTaskId = context.taskId;

    try {
      const routing = selectModel(context.prompt, context.model as any);

      logger.info('Execution task started', { taskId: context.taskId });

      const result = await chat({
        model: routing.model,
        messages: [
          { role: 'system', content: EXECUTION_SYSTEM_PROMPT },
          { role: 'user', content: context.prompt },
        ],
      });

      this.info.status = 'idle';
      this.info.currentTaskId = undefined;

      return {
        success: true,
        output: result.content,
        modelUsed: routing.model,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.info.status = 'error';
      logger.error('Execution task failed', { error: String(error) });
      return {
        success: false,
        output: `Execution task failed: ${String(error)}`,
        modelUsed: 'none',
        duration: Date.now() - startTime,
      };
    }
  }
}
