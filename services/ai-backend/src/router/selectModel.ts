// ============================================================
// AgentOS — Model Router
// Intelligent model selection based on task type
// ============================================================

import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('ModelRouter');

export type TaskType = 'coding' | 'reasoning' | 'conversation' | 'analysis' | 'planning';
export type ModelId = 'llama3' | 'mistral' | 'deepseek-coder' | 'llama3.2:1b';

interface ModelProfile {
  id: ModelId;
  name: string;
  contextWindow: number;
  strengths: TaskType[];
  priority: number; // lower = preferred
}

interface RoutingResult {
  model: ModelId;
  confidence: number;
  taskType: TaskType;
  fallback: ModelId;
}

// ─── Model Registry ───────────────────────────────────────

const MODEL_REGISTRY: ModelProfile[] = [
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    contextWindow: 16384,
    strengths: ['coding'],
    priority: 0,
  },
  {
    id: 'llama3',
    name: 'Llama 3',
    contextWindow: 8192,
    strengths: ['reasoning', 'planning', 'analysis'],
    priority: 0,
  },
  {
    id: 'mistral',
    name: 'Mistral',
    contextWindow: 8192,
    strengths: ['conversation'],
    priority: 1,
  },
  {
    id: 'llama3.2:1b',
    name: 'Llama 3.2 1B (Fast)',
    contextWindow: 131072,
    strengths: ['conversation', 'reasoning', 'planning', 'analysis'],
    priority: 2,
  },
];

// ─── Task Classification Keywords ─────────────────────────

const TASK_KEYWORDS: Record<TaskType, string[]> = {
  coding: [
    'code', 'function', 'class', 'api', 'endpoint', 'debug', 'fix', 'implement',
    'typescript', 'javascript', 'python', 'react', 'component', 'refactor',
    'bug', 'error', 'compile', 'build', 'deploy', 'test', 'unit test',
    'algorithm', 'data structure', 'sql', 'query', 'database', 'schema',
    'html', 'css', 'frontend', 'backend', 'server', 'client', 'rest',
    'graphql', 'websocket', 'middleware', 'route', 'handler',
  ],
  reasoning: [
    'explain', 'why', 'how does', 'analyze', 'compare', 'evaluate',
    'trade-off', 'tradeoff', 'pros', 'cons', 'difference', 'better',
    'architecture', 'design', 'pattern', 'strategy', 'approach',
    'logic', 'mathematical', 'proof', 'theorem', 'calculate',
  ],
  conversation: [
    'hello', 'hi', 'hey', 'thanks', 'thank you', 'chat', 'talk',
    'tell me about', 'what is', 'who is', 'suggest', 'recommend',
    'help', 'idea', 'opinion', 'think', 'feel', 'general',
  ],
  analysis: [
    'data', 'metrics', 'report', 'statistics', 'visualization',
    'trend', 'insight', 'performance', 'benchmark', 'optimize',
    'profiling', 'bottleneck', 'memory', 'cpu', 'latency',
  ],
  planning: [
    'plan', 'roadmap', 'timeline', 'milestone', 'task', 'subtask',
    'break down', 'decompose', 'steps', 'workflow', 'process',
    'project', 'sprint', 'backlog', 'priority', 'estimate',
  ],
};

// ─── Fallback Map ─────────────────────────────────────────

const FALLBACK_MAP: Record<ModelId, ModelId> = {
  'deepseek-coder': 'llama3',
  'llama3': 'mistral',
  'mistral': 'llama3.2:1b',
  'llama3.2:1b': 'llama3',
};

// ─── Core Router Functions ────────────────────────────────

/**
 * Classify a prompt into a task type based on keyword analysis
 */
export function classifyTask(prompt: string): { taskType: TaskType; confidence: number } {
  const lowerPrompt = prompt.toLowerCase();
  const scores: Record<TaskType, number> = {
    coding: 0,
    reasoning: 0,
    conversation: 0,
    analysis: 0,
    planning: 0,
  };

  // Score each task type based on keyword matches
  for (const [taskType, keywords] of Object.entries(TASK_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerPrompt.includes(keyword)) {
        scores[taskType as TaskType] += 1;
      }
    }
  }

  // Find the highest scoring task type
  let maxScore = 0;
  let bestType: TaskType = 'conversation'; // default

  for (const [taskType, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestType = taskType as TaskType;
    }
  }

  // Calculate confidence (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0.3;

  return { taskType: bestType, confidence: Math.min(confidence, 1) };
}

/**
 * Select the best model for a given prompt
 */
export function selectModel(prompt: string, preferredModel?: ModelId): RoutingResult {
  // If a specific model is preferred, use it
  if (preferredModel) {
    const { taskType, confidence } = classifyTask(prompt);
    logger.info(`Using preferred model: ${preferredModel}`, { taskType, confidence });
    return {
      model: preferredModel,
      confidence,
      taskType,
      fallback: FALLBACK_MAP[preferredModel] || 'llama3',
    };
  }

  // Classify the task
  const { taskType, confidence } = classifyTask(prompt);

  // Find the best model for this task type
  const suitable = MODEL_REGISTRY
    .filter(m => m.strengths.includes(taskType))
    .sort((a, b) => a.priority - b.priority);

  const bestModel = suitable[0] || MODEL_REGISTRY[1]; // default to llama3
  const fallback = FALLBACK_MAP[bestModel.id];

  logger.info(`Routed to ${bestModel.id}`, {
    taskType,
    confidence: confidence.toFixed(2),
    fallback,
  });

  return {
    model: bestModel.id,
    confidence,
    taskType,
    fallback,
  };
}

/**
 * Get all available model profiles
 */
export function getModelProfiles(): ModelProfile[] {
  return [...MODEL_REGISTRY];
}

/**
 * Check if a specific model is registered
 */
export function isModelRegistered(modelId: string): boolean {
  return MODEL_REGISTRY.some(m => m.id === modelId);
}
