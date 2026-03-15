// ============================================================
// AgentOS — Agent Reasoning Engine
// Multi-step reasoning loop with tool calling
// ============================================================

import { chat } from '../lib/ollama.js';
import { toolRegistry, ToolCallResult } from '../tools/index.js';
import { eventBus } from '../events/eventBus.js';
import { memorySystem } from '../memory/index.js';
import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('ReasoningEngine');

const MAX_REASONING_STEPS = 5;

export interface ReasoningStep {
  step: number;
  type: 'thought' | 'tool_call' | 'tool_result' | 'final_answer';
  content: string;
  toolCall?: { tool: string; input: Record<string, unknown> };
  toolResult?: ToolCallResult;
  timestamp: string;
}

export interface ReasoningResult {
  success: boolean;
  finalAnswer: string;
  steps: ReasoningStep[];
  modelUsed: string;
  totalDuration: number;
}

/**
 * Build system prompt with tool awareness
 */
function buildToolAwarePrompt(agentSystemPrompt: string): string {
  const toolSchemas = toolRegistry.getToolSchemas();
  const toolDescriptions = toolSchemas.map(t =>
    `- ${t.name}: ${t.description}`
  ).join('\n');

  return `${agentSystemPrompt}

You have access to the following tools:
${toolDescriptions}

To use a tool, output EXACTLY this JSON format on its own line:
TOOL_CALL: {"tool": "<tool_name>", "input": {<parameters>}}

After using a tool, wait for the result. Then continue reasoning or provide your final answer.

If you do NOT need any tools, just answer directly.

IMPORTANT: Only output ONE tool call at a time. Wait for the result before making another.`;
}

/**
 * Run multi-step reasoning loop for an agent.
 * The agent can call tools, receive results, and continue reasoning.
 */
export async function runReasoningLoop(params: {
  taskId: string;
  agentId: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<ReasoningResult> {
  const { taskId, agentId, model, systemPrompt, userPrompt } = params;
  const startTime = Date.now();
  const steps: ReasoningStep[] = [];

  // Build tool-aware system prompt
  const fullSystemPrompt = buildToolAwarePrompt(systemPrompt);

  // Retrieve relevant memories
  let memoryContext = '';
  try {
    const memories = await memorySystem.search(userPrompt, 3);
    if (memories.length > 0) {
      memoryContext = '\n\nRelevant context from past tasks (USE FOR KNOWLEDGE ONLY, DO NOT MIMIC ITS FORMATTING):\n' +
        memories.map(m => `- ${m.content}`).join('\n');
    }
  } catch {
    // Memory retrieval failed, continue without
  }

  // Build conversation messages
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: fullSystemPrompt + memoryContext },
    { role: 'user', content: userPrompt },
  ];

  let finalAnswer = '';

  for (let step = 0; step < MAX_REASONING_STEPS; step++) {
    // Emit thought event
    eventBus.emit('agent:thought', {
      agentId,
      taskId,
      step,
      message: `Step ${step + 1}: Reasoning...`,
    });

    // Call the LLM
    const llmResult = await chat({ model, messages });
    const response = llmResult.content;

    // Check for tool calls in the response
    const toolCallMatch = response.match(/TOOL_CALL:\s*(\{[\s\S]*?\})\s*/);

    if (toolCallMatch) {
      // Agent wants to call a tool
      let toolCall;
      try {
        toolCall = JSON.parse(toolCallMatch[1]);
      } catch {
        // Failed to parse tool call — treat as final answer
        finalAnswer = response;
        steps.push({
          step: step + 1,
          type: 'final_answer',
          content: response,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      // Log the thought before the tool call
      const thoughtBeforeTool = response.substring(0, response.indexOf('TOOL_CALL:')).trim();
      if (thoughtBeforeTool) {
        steps.push({
          step: step + 1,
          type: 'thought',
          content: thoughtBeforeTool,
          timestamp: new Date().toISOString(),
        });

        eventBus.emit('agent:thought', {
          agentId, taskId, step,
          message: thoughtBeforeTool.substring(0, 200),
        });
      }

      // Log the tool call
      steps.push({
        step: step + 1,
        type: 'tool_call',
        content: `Calling tool: ${toolCall.tool}`,
        toolCall: { tool: toolCall.tool, input: toolCall.input },
        timestamp: new Date().toISOString(),
      });

      logger.info(`Agent ${agentId} calling tool: ${toolCall.tool}`, { input: toolCall.input });

      // Execute the tool
      const toolResult = await toolRegistry.executeTool(toolCall);

      // Log the tool result
      steps.push({
        step: step + 1,
        type: 'tool_result',
        content: `Tool ${toolCall.tool} returned: ${JSON.stringify(toolResult.output).substring(0, 500)}`,
        toolResult,
        timestamp: new Date().toISOString(),
      });

      // Feed result back to the LLM for next step
      messages.push({ role: 'assistant', content: response });
      messages.push({
        role: 'user',
        content: `Tool result from ${toolCall.tool}:\n${JSON.stringify(toolResult.output, null, 2)}\n\nContinue with your task. If you have enough information, provide your final answer. Otherwise, use another tool.`,
      });

      // Continue reasoning loop
      continue;
    }

    // No tool call — this is the final answer
    finalAnswer = response;
    steps.push({
      step: step + 1,
      type: 'final_answer',
      content: response,
      timestamp: new Date().toISOString(),
    });

    eventBus.emit('agent:output', {
      agentId, taskId,
      output: response.substring(0, 500),
    });

    break;
  }

  const totalDuration = Date.now() - startTime;

  // Store result in memory
  // Store result in memory (skip planner to avoid saving JSON plans as memory)
  if (agentId !== 'planner') {
    try {
      await memorySystem.store('task', finalAnswer.substring(0, 1000), {
        taskId,
        agentId,
        model,
        prompt: userPrompt.substring(0, 200),
      });
    } catch {
      // Memory store failed, non-critical
    }
  }

  return {
    success: finalAnswer.length > 0,
    finalAnswer,
    steps,
    modelUsed: model,
    totalDuration,
  };
}
