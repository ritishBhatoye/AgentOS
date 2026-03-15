// ============================================================
// AgentOS — Shared Types
// Core type definitions for the AI Agent Platform
// ============================================================

// ─── Model Types ───────────────────────────────────────────

export type ModelId = 'llama3' | 'mistral' | 'deepseek-coder' | string;

export type TaskType = 'coding' | 'reasoning' | 'conversation' | 'analysis' | 'planning';

export interface ModelConfig {
  id: ModelId;
  name: string;
  contextWindow: number;
  strengths: TaskType[];
  priority: number;
  isAvailable: boolean;
}

export interface ModelRoutingResult {
  model: ModelId;
  confidence: number;
  taskType: TaskType;
  fallback?: ModelId;
}

// ─── Agent Types ───────────────────────────────────────────

export type AgentId = 'planner' | 'coding' | 'research' | 'execution';

export type AgentStatus = 'idle' | 'busy' | 'error' | 'offline';

export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  status: AgentStatus;
  capabilities: string[];
  currentTaskId?: string;
}

export interface AgentExecutionResult {
  agentId: AgentId;
  taskId: string;
  success: boolean;
  output: string;
  duration: number;
  modelUsed: ModelId;
  tokensUsed?: number;
}

// ─── Task Types ────────────────────────────────────────────

export type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AgentTask {
  id: string;
  type: TaskType;
  prompt: string;
  assignedTo?: AgentId;
  status: TaskStatus;
  priority: TaskPriority;
  result?: string;
  error?: string;
  parentTaskId?: string;
  subtaskIds: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TaskBreakdown {
  originalPrompt: string;
  tasks: AgentTask[];
  strategy: string;
}

// ─── Tool Types ────────────────────────────────────────────

export type ToolName = 'web_search' | 'code_executor' | 'file_reader' | 'file_writer' | 'database_query' | 'browser_automation';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
}

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: ToolParameter[];
  requiresPermission: boolean;
}

export interface ToolCallResult {
  toolName: ToolName;
  success: boolean;
  output: unknown;
  error?: string;
  duration: number;
}

// ─── Memory Types ──────────────────────────────────────────

export type MemoryType = 'short_term' | 'long_term' | 'persistent';

export interface MemoryRecord {
  id: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  conversationId?: string;
  taskId?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: ModelId;
  agentId?: AgentId;
  toolCalls?: ToolCallResult[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── API Types ─────────────────────────────────────────────

export interface ChatRequest {
  message: string;
  conversationId?: string;
  model?: ModelId;
  stream?: boolean;
}

export interface ChatResponse {
  message: ConversationMessage;
  conversationId: string;
  modelUsed: ModelId;
  tokensUsed?: number;
  duration: number;
}

export interface AgentExecuteRequest {
  prompt: string;
  agentId?: AgentId;
  tools?: ToolName[];
  model?: ModelId;
}

export interface AgentExecuteResponse {
  taskId: string;
  status: TaskStatus;
  tasks: AgentTask[];
  result?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  ollama: {
    connected: boolean;
    models: string[];
  };
  agents: Record<AgentId, AgentStatus>;
  timestamp: string;
}

// ─── System Log Types ──────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface SystemLog {
  id: string;
  level: LogLevel;
  source: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

// ─── Dashboard Stats ──────────────────────────────────────

export interface DashboardStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalConversations: number;
  modelUsage: Record<ModelId, number>;
  agentPerformance: Record<AgentId, {
    tasksCompleted: number;
    avgDuration: number;
    successRate: number;
  }>;
  memoryUsage: {
    shortTerm: number;
    longTerm: number;
    persistent: number;
  };
}
