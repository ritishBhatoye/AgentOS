// ============================================================
// AgentOS — Research Agent
// Handles research, summarization, and information gathering
// ============================================================

import { BaseAgent, AgentInfo, AgentExecutionContext, AgentExecutionOutput } from '../baseAgent.js';
import { chat } from '../../lib/ollama.js';
import { selectModel } from '../../router/selectModel.js';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('ResearchAgent');

const RESEARCH_SYSTEM_PROMPT = `You are a research AI agent. Your job is to analyze information, provide summaries, and answer questions thoroughly.

Guidelines:
- Provide structured, well-organized responses
- Use bullet points and headers for clarity
- Cite relevant concepts and references
- Compare alternatives when applicable
- Be thorough but concise
- Highlight key insights and takeaways`;

export class ResearchAgent implements BaseAgent {
  info: AgentInfo = {
    id: 'research',
    name: 'Research Agent',
    description: 'Researches topics, summarizes information, and provides analysis',
    status: 'idle',
    capabilities: ['research', 'summarization', 'comparison', 'analysis'],
  };

  async execute(context: AgentExecutionContext): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    this.info.status = 'busy';
    this.info.currentTaskId = context.taskId;

    try {
      const routing = selectModel(context.prompt, context.model as any);

      logger.info('Research task started', { taskId: context.taskId });

      const result = await chat({
        model: routing.model,
        messages: [
          { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
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
      logger.error('Research execution failed', { error: String(error) });
      return {
        success: false,
        output: `Research task failed: ${String(error)}`,
        modelUsed: 'none',
        duration: Date.now() - startTime,
      };
    }
  }
}
