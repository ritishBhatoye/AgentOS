// ============================================================
// AgentOS — Base Agent Interface
// ============================================================

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'busy' | 'error' | 'offline';
  capabilities: string[];
  currentTaskId?: string;
}

export interface AgentExecutionContext {
  taskId: string;
  prompt: string;
  model?: string;
}

export interface AgentExecutionOutput {
  success: boolean;
  output: string;
  subtasks?: Array<{
    type: string;
    prompt: string;
    tools: string[];
  }>;
  modelUsed: string;
  duration: number;
}

export interface BaseAgent {
  info: AgentInfo;
  execute(context: AgentExecutionContext): Promise<AgentExecutionOutput>;
}
