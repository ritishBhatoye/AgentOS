// ============================================================
// AgentOS — Research Agent (v2 — with Web Search)
// Research, summarization, real-time info gathering
// ============================================================

import { BaseAgent, AgentInfo, AgentExecutionContext, AgentExecutionOutput } from '../baseAgent.js';
import { runReasoningLoop } from '../reasoningEngine.js';
import { selectModel } from '../../router/selectModel.js';
import { eventBus } from '../../events/eventBus.js';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('ResearchAgent');

const SYSTEM_PROMPT = `You are the Research Agent for AgentOS. You specialize in gathering, analyzing, and summarizing information.

Your capabilities:
- Search the web for current information using the web_search tool
- Analyze and synthesize multiple sources
- Provide structured summaries
- Compare alternatives

Guidelines:
- Always use the web_search tool when you need current/real-time information
- Provide structured responses with headers and bullet points
- Cite sources when possible
- Highlight key insights and actionable takeaways
- Be thorough but concise`;

export class ResearchAgent implements BaseAgent {
  info: AgentInfo = {
    id: 'research',
    name: 'Research Agent',
    description: 'Researches topics using web search, summarizes information, and provides analysis',
    status: 'idle',
    capabilities: ['research', 'summarization', 'comparison', 'analysis', 'web_search'],
  };

  async execute(context: AgentExecutionContext): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    this.info.status = 'busy';
    this.info.currentTaskId = context.taskId;
    eventBus.emit('agent:status', { agentId: 'research', status: 'busy', taskId: context.taskId });

    try {
      const routing = selectModel(context.prompt, context.model as any);

      const result = await runReasoningLoop({
        taskId: context.taskId,
        agentId: 'research',
        model: routing.model,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: context.prompt,
      });

      this.info.status = 'idle';
      this.info.currentTaskId = undefined;
      eventBus.emit('agent:status', { agentId: 'research', status: 'idle' });

      return {
        success: result.success,
        output: result.finalAnswer,
        modelUsed: result.modelUsed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.info.status = 'error';
      eventBus.emit('agent:status', { agentId: 'research', status: 'error' });
      return {
        success: false,
        output: `Research task failed: ${String(error)}`,
        modelUsed: 'none',
        duration: Date.now() - startTime,
      };
    }
  }
}
