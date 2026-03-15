// ============================================================
// AgentOS — Tool Registry
// ============================================================

import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('ToolRegistry');

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
  execute: (params: any) => Promise<any>;
}

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
    logger.info(`Tool registered: ${tool.name}`);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolSchema() {
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }
}

export const toolRegistry = new ToolRegistry();
