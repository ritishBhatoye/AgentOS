// ============================================================
// AgentOS — Reviewer Agent
// Code review, quality validation, anti-pattern detection
// ============================================================

import { BaseAgent, AgentInfo, AgentExecutionContext, AgentExecutionOutput } from '../baseAgent.js';
import { runReasoningLoop } from '../reasoningEngine.js';
import { selectModel } from '../../router/selectModel.js';
import { eventBus } from '../../events/eventBus.js';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('ReviewerAgent');

const SYSTEM_PROMPT = `You are the Reviewer Agent for AgentOS. You specialize in code review and quality assurance.

Your responsibilities:
- Review code for correctness, security, and maintainability
- Detect anti-patterns and code smells
- Validate error handling and edge cases
- Check type safety and API contracts
- Suggest improvements and optimizations

Output your review in this format:

VERDICT: [APPROVED | NEEDS_CHANGES | REJECTED]

ISSUES:
1. [SEVERITY: high|medium|low] Description of issue
   File: filename, Line: N
   Suggestion: How to fix

STRENGTHS:
- What's done well

IMPROVEMENTS:
- Suggested optimizations

Be thorough but constructive. Focus on production readiness.`;

export class ReviewerAgent implements BaseAgent {
  info: AgentInfo = {
    id: 'reviewer',
    name: 'Reviewer Agent',
    description: 'Reviews code quality, detects anti-patterns, and validates production readiness',
    status: 'idle',
    capabilities: ['code_review', 'quality_check', 'security_audit', 'best_practices'],
  };

  async execute(context: AgentExecutionContext): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    this.info.status = 'busy';
    this.info.currentTaskId = context.taskId;
    eventBus.emit('agent:status', { agentId: 'reviewer', status: 'busy', taskId: context.taskId });

    try {
      const routing = selectModel(context.prompt, context.model as any);

      const result = await runReasoningLoop({
        taskId: context.taskId,
        agentId: 'reviewer',
        model: routing.model,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: context.prompt,
      });

      this.info.status = 'idle';
      this.info.currentTaskId = undefined;
      eventBus.emit('agent:status', { agentId: 'reviewer', status: 'idle' });

      return {
        success: result.success,
        output: result.finalAnswer,
        modelUsed: result.modelUsed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.info.status = 'error';
      eventBus.emit('agent:status', { agentId: 'reviewer', status: 'error' });
      return {
        success: false,
        output: `Review failed: ${String(error)}`,
        modelUsed: 'none',
        duration: Date.now() - startTime,
      };
    }
  }
}
