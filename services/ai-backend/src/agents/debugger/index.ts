// ============================================================
// AgentOS — Debugger Agent
// Bug detection, error analysis, root cause identification
// ============================================================

import { BaseAgent, AgentInfo, AgentExecutionContext, AgentExecutionOutput } from '../baseAgent.js';
import { runReasoningLoop } from '../reasoningEngine.js';
import { selectModel } from '../../router/selectModel.js';
import { eventBus } from '../../events/eventBus.js';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('DebuggerAgent');

const SYSTEM_PROMPT = `You are the Debugger Agent for AgentOS. You specialize in finding and fixing bugs.

Your responsibilities:
- Analyze error messages and stack traces
- Identify root causes of failures
- Suggest specific code fixes
- Trace through execution paths
- Identify edge cases that cause bugs

Output your analysis in this format:

ROOT CAUSE:
[Concise explanation of why the bug occurs]

AFFECTED FILES:
- file1.ts (line X): description
- file2.ts (line Y): description

FIX:
\`\`\`typescript
// corrected code here
\`\`\`

PREVENTION:
- How to prevent this class of bug in the future

Be precise. Include exact file paths and line numbers when possible.`;

export class DebuggerAgent implements BaseAgent {
  info: AgentInfo = {
    id: 'debugger',
    name: 'Debugger Agent',
    description: 'Detects bugs, analyzes errors, traces root causes, and suggests fixes',
    status: 'idle',
    capabilities: ['debugging', 'error_analysis', 'root_cause', 'stack_trace', 'fix_generation'],
  };

  async execute(context: AgentExecutionContext): Promise<AgentExecutionOutput> {
    const startTime = Date.now();
    this.info.status = 'busy';
    this.info.currentTaskId = context.taskId;
    eventBus.emit('agent:status', { agentId: 'debugger', status: 'busy', taskId: context.taskId });

    try {
      const routing = selectModel(context.prompt, context.model as any);

      const result = await runReasoningLoop({
        taskId: context.taskId,
        agentId: 'debugger',
        model: routing.model,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: context.prompt,
      });

      this.info.status = 'idle';
      this.info.currentTaskId = undefined;
      eventBus.emit('agent:status', { agentId: 'debugger', status: 'idle' });

      return {
        success: result.success,
        output: result.finalAnswer,
        modelUsed: result.modelUsed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.info.status = 'error';
      eventBus.emit('agent:status', { agentId: 'debugger', status: 'error' });
      return {
        success: false,
        output: `Debugging failed: ${String(error)}`,
        modelUsed: 'none',
        duration: Date.now() - startTime,
      };
    }
  }
}
