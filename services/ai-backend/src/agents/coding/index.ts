// ============================================================
// AgentOS — Coding Agent (v2 — with Tool Calling)
// Code generation, review, debugging with tool access
// ============================================================

import { BaseAgent, AgentInfo, AgentExecutionContext, AgentExecutionOutput } from '../baseAgent.js';
import { runReasoningLoop } from '../reasoningEngine.js';
import { eventBus } from '../../events/eventBus.js';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('CodingAgent');

const SYSTEM_PROMPT = `You are the Coding Agent for AgentOS. You are an expert software engineer.

Your capabilities:
- Generate clean, production-ready TypeScript/JavaScript code
- Debug and fix code issues
- Write unit tests
- Create API endpoints
- Review code quality

Guidelines:
- Write TypeScript by default unless specified otherwise
- Include proper types and interfaces
- Add meaningful comments
- Handle errors properly
- If you need to verify code works, use the code_executor tool
- If you need to save code, use the file_system tool with action "write"

Always provide complete, runnable code.`;

export class CodingAgent implements BaseAgent {
  info: AgentInfo = {
    id: 'coding',
    name: 'Coding Agent',
    description: 'Generates, reviews, and debugs code with production-quality standards. Can execute and save code.',
    status: 'idle',
    capabilities: ['code_generation', 'code_review', 'debugging', 'refactoring', 'testing', 'code_executor', 'file_system'],
  };

  async execute(context: AgentExecutionContext): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    this.info.status = 'busy';
    this.info.currentTaskId = context.taskId;
    eventBus.emit('agent:status', { agentId: 'coding', status: 'busy', taskId: context.taskId });

    try {
      const model = context.model || 'deepseek-coder';

      const result = await runReasoningLoop({
        taskId: context.taskId,
        agentId: 'coding',
        model,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: context.prompt,
      });

      this.info.status = 'idle';
      this.info.currentTaskId = undefined;
      eventBus.emit('agent:status', { agentId: 'coding', status: 'idle' });

      return {
        success: result.success,
        output: result.finalAnswer,
        modelUsed: result.modelUsed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.info.status = 'error';
      eventBus.emit('agent:status', { agentId: 'coding', status: 'error' });
      return {
        success: false,
        output: `Coding task failed: ${String(error)}`,
        modelUsed: 'none',
        duration: Date.now() - startTime,
      };
    }
  }
}
