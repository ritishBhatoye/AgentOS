// ============================================================
// AgentOS — Coding Agent
// Handles code generation, review, and debugging tasks
// ============================================================

import { BaseAgent, AgentInfo, AgentExecutionContext, AgentExecutionOutput } from '../baseAgent.js';
import { chat } from '../../lib/ollama.js';
import { selectModel } from '../../router/selectModel.js';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('CodingAgent');

const CODING_SYSTEM_PROMPT = `You are an expert coding AI agent. Your job is to write clean, production-ready code.

Guidelines:
- Write TypeScript by default unless specified otherwise
- Include proper types and interfaces
- Add meaningful comments for complex logic
- Follow best practices and design patterns
- Handle errors properly
- Keep code modular and testable

Always provide complete, runnable code snippets. If you're modifying existing code, clearly indicate what changed.`;

export class CodingAgent implements BaseAgent {
  info: AgentInfo = {
    id: 'coding',
    name: 'Coding Agent',
    description: 'Generates, reviews, and debugs code with production-quality standards',
    status: 'idle',
    capabilities: ['code_generation', 'code_review', 'debugging', 'refactoring', 'testing'],
  };

  async execute(context: AgentExecutionContext): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    this.info.status = 'busy';
    this.info.currentTaskId = context.taskId;

    try {
      // Force deepseek-coder for coding tasks
      const model = context.model || 'deepseek-coder';

      logger.info('Coding task started', { taskId: context.taskId });

      const result = await chat({
        model,
        messages: [
          { role: 'system', content: CODING_SYSTEM_PROMPT },
          { role: 'user', content: context.prompt },
        ],
      });

      this.info.status = 'idle';
      this.info.currentTaskId = undefined;

      return {
        success: true,
        output: result.content,
        modelUsed: model,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.info.status = 'error';
      logger.error('Coding execution failed', { error: String(error) });
      return {
        success: false,
        output: `Coding task failed: ${String(error)}`,
        modelUsed: 'none',
        duration: Date.now() - startTime,
      };
    }
  }
}
