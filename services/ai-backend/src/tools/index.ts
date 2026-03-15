// ============================================================
// AgentOS — Complete Tool Registry
// Dynamic tool registration + execution + agent JSON calling
// ============================================================

import { SystemLogger } from '../utils/logger.js';
import { eventBus } from '../events/eventBus.js';
import { webSearchTool } from './webSearch.js';
import { codeExecutorTool } from './codeExecutor.js';
import { fileSystemTool } from './fileSystem.js';

const logger = new SystemLogger('ToolRegistry');

export interface ToolParameter {
  type: string;
  description: string;
  required?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (params: any) => Promise<any>;
}

export interface ToolCallRequest {
  tool: string;
  input: Record<string, unknown>;
}

export interface ToolCallResult {
  tool: string;
  success: boolean;
  output: any;
  error?: string;
  duration: number;
}

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    // Register built-in tools
    this.register(webSearchTool);
    this.register(codeExecutorTool);
    this.register(fileSystemTool);
    logger.info('Tool registry initialized', { tools: this.listNames() });
  }

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    logger.info(`Tool registered: ${tool.name}`);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  listNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool schemas for injection into agent system prompts
   */
  getToolSchemas(): Array<{ name: string; description: string; parameters: Record<string, ToolParameter> }> {
    return this.getAllTools().map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  /**
   * Execute a tool call from an agent's JSON output
   */
  async executeTool(call: ToolCallRequest): Promise<ToolCallResult> {
    const startTime = Date.now();
    const tool = this.tools.get(call.tool);

    if (!tool) {
      logger.error(`Tool not found: ${call.tool}`);
      return {
        tool: call.tool,
        success: false,
        output: null,
        error: `Tool "${call.tool}" not found. Available: ${this.listNames().join(', ')}`,
        duration: 0,
      };
    }

    // Emit tool call event
    eventBus.emit('agent:tool_call', {
      tool: call.tool,
      input: call.input,
    });

    try {
      logger.info(`Executing tool: ${call.tool}`, { input: call.input });
      const output = await tool.execute(call.input);
      const duration = Date.now() - startTime;

      // Emit tool result event
      eventBus.emit('agent:tool_result', {
        tool: call.tool,
        success: true,
        duration,
      });

      return { tool: call.tool, success: true, output, duration };
    } catch (err: any) {
      const duration = Date.now() - startTime;

      eventBus.emit('agent:tool_result', {
        tool: call.tool,
        success: false,
        error: err.message,
        duration,
      });

      logger.error(`Tool execution failed: ${call.tool}`, { error: err.message });
      return { tool: call.tool, success: false, output: null, error: err.message, duration };
    }
  }

  /**
   * Parse tool calls from agent output text.
   * Agents output JSON blocks: {"tool": "...", "input": {...}}
   */
  parseToolCalls(agentOutput: string): ToolCallRequest[] {
    const calls: ToolCallRequest[] = [];

    // Match JSON blocks that look like tool calls
    const jsonPattern = /\{[\s\S]*?"tool"\s*:\s*"[^"]+?"[\s\S]*?"input"\s*:\s*\{[\s\S]*?\}\s*\}/g;
    const matches = agentOutput.match(jsonPattern) || [];

    for (const match of matches) {
      try {
        const parsed = JSON.parse(match);
        if (parsed.tool && parsed.input) {
          calls.push({ tool: parsed.tool, input: parsed.input });
        }
      } catch {
        // Not valid JSON, skip
      }
    }

    return calls;
  }
}

export const toolRegistry = new ToolRegistry();
