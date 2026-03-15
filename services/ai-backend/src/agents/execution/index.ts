// ============================================================
// AgentOS — Execution Agent (v2 — with Tool Access)
// Command execution, file operations, automation
// ============================================================

import { BaseAgent, AgentInfo, AgentExecutionContext, AgentExecutionOutput } from '../baseAgent.js';
import { runReasoningLoop } from '../reasoningEngine.js';
import { selectModel } from '../../router/selectModel.js';
import { eventBus } from '../../events/eventBus.js';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('ExecutionAgent');

const SYSTEM_PROMPT = `You are the Execution Agent for AgentOS. You handle file operations, code execution, and system tasks.

Your capabilities:
- Read and write files using the file_system tool
- Execute code using the code_executor tool
- Create project structures
- Validate and test code

Guidelines:
- Use file_system tool with action "read" to examine existing files
- Use file_system tool with action "write" to create/modify files
- Use file_system tool with action "list" to explore directories
- Use code_executor to test JavaScript code
- Always verify results after writing files
- Report what you did step by step`;

export class ExecutionAgent implements BaseAgent {
  info: AgentInfo = {
    id: 'execution',
    name: 'Execution Agent',
    description: 'Executes tasks including file operations, code execution, and project automation',
    status: 'idle',
    capabilities: ['command_execution', 'file_operations', 'automation', 'code_executor', 'file_system'],
  };

  async execute(context: AgentExecutionContext): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    this.info.status = 'busy';
    this.info.currentTaskId = context.taskId;
    eventBus.emit('agent:status', { agentId: 'execution', status: 'busy', taskId: context.taskId });

    try {
      const routing = selectModel(context.prompt, context.model as any);

      const result = await runReasoningLoop({
        taskId: context.taskId,
        agentId: 'execution',
        model: routing.model,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: context.prompt,
      });

      this.info.status = 'idle';
      this.info.currentTaskId = undefined;
      eventBus.emit('agent:status', { agentId: 'execution', status: 'idle' });

      return {
        success: result.success,
        output: result.finalAnswer,
        modelUsed: result.modelUsed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.info.status = 'error';
      eventBus.emit('agent:status', { agentId: 'execution', status: 'error' });
      return {
        success: false,
        output: `Execution task failed: ${String(error)}`,
        modelUsed: 'none',
        duration: Date.now() - startTime,
      };
    }
  }
}
