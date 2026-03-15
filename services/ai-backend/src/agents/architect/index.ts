// ============================================================
// AgentOS — Architect Agent
// System design, component architecture, tech stack selection
// ============================================================

import { BaseAgent, AgentInfo, AgentExecutionContext, AgentExecutionOutput } from '../baseAgent.js';
import { runReasoningLoop } from '../reasoningEngine.js';
import { selectModel } from '../../router/selectModel.js';
import { eventBus } from '../../events/eventBus.js';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('ArchitectAgent');

const SYSTEM_PROMPT = `You are the Architect Agent for AgentOS. You specialize in system design and software architecture.

Your responsibilities:
- Design system architecture for projects
- Select appropriate tech stacks
- Define component boundaries and interfaces
- Create database schemas
- Plan API structures
- Identify scalability and performance considerations

Output your analysis in this format:

ARCHITECTURE:
[Component diagrams and system design]

TECH STACK:
[Recommended technologies and why]

SCHEMA:
[Database or data model design]

API DESIGN:
[Key API endpoints and contracts]

CONSIDERATIONS:
[Scalability, security, performance notes]

Be specific, practical, and production-focused.`;

export class ArchitectAgent implements BaseAgent {
  info: AgentInfo = {
    id: 'architect',
    name: 'Architect Agent',
    description: 'Designs system architecture, selects tech stacks, and creates component blueprints',
    status: 'idle',
    capabilities: ['system_design', 'tech_stack', 'schema_design', 'api_design', 'architecture'],
  };

  async execute(context: AgentExecutionContext): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    this.info.status = 'busy';
    this.info.currentTaskId = context.taskId;
    eventBus.emit('agent:status', { agentId: 'architect', status: 'busy', taskId: context.taskId });

    try {
      const routing = selectModel(context.prompt, context.model as any);

      const result = await runReasoningLoop({
        taskId: context.taskId,
        agentId: 'architect',
        model: routing.model,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: context.prompt,
      });

      this.info.status = 'idle';
      this.info.currentTaskId = undefined;
      eventBus.emit('agent:status', { agentId: 'architect', status: 'idle' });

      return {
        success: result.success,
        output: result.finalAnswer,
        modelUsed: result.modelUsed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.info.status = 'error';
      eventBus.emit('agent:status', { agentId: 'architect', status: 'error' });
      return {
        success: false,
        output: `Architecture design failed: ${String(error)}`,
        modelUsed: 'none',
        duration: Date.now() - startTime,
      };
    }
  }
}
