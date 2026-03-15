// ============================================================
// AgentOS — Ollama Client Wrapper
// ============================================================

import { Ollama } from 'ollama';
import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('OllamaClient');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

const ollamaClient = new Ollama({ host: OLLAMA_HOST });

export interface ChatOptions {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
}

export interface ChatResult {
  content: string;
  model: string;
  totalDuration: number;
  evalCount?: number;
}

/**
 * Send a chat completion request to Ollama
 */
export async function chat(options: ChatOptions): Promise<ChatResult> {
  const startTime = Date.now();

  try {
    logger.info(`Chat request to ${options.model}`, {
      messageCount: options.messages.length,
    });

    const response = await ollamaClient.chat({
      model: options.model,
      messages: options.messages,
      stream: false,
    });

    const duration = Date.now() - startTime;

    logger.info(`Chat response from ${options.model}`, {
      duration: `${duration}ms`,
      evalCount: response.eval_count,
    });

    return {
      content: response.message.content,
      model: options.model,
      totalDuration: duration,
      evalCount: response.eval_count,
    };
  } catch (error) {
    logger.error(`Ollama chat failed`, {
      model: options.model,
      error: String(error),
    });
    throw error;
  }
}

/**
 * Stream a chat completion (returns async generator)
 */
export async function* chatStream(options: ChatOptions): AsyncGenerator<string> {
  try {
    logger.info(`Stream chat request to ${options.model}`);

    const stream = await ollamaClient.chat({
      model: options.model,
      messages: options.messages,
      stream: true,
    });

    for await (const chunk of stream) {
      yield chunk.message.content;
    }
  } catch (error) {
    logger.error(`Ollama stream failed`, {
      model: options.model,
      error: String(error),
    });
    throw error;
  }
}

/**
 * List available models from Ollama
 */
export async function listModels(): Promise<string[]> {
  try {
    const response = await ollamaClient.list();
    return response.models.map((m) => m.name);
  } catch (error) {
    logger.error('Failed to list Ollama models', { error: String(error) });
    return [];
  }
}

/**
 * Check if Ollama is reachable
 */
export async function checkConnection(): Promise<boolean> {
  try {
    await ollamaClient.list();
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate embeddings for a text
 */
export async function generateEmbedding(text: string, model = 'llama3'): Promise<number[]> {
  try {
    const response = await ollamaClient.embed({
      model,
      input: text,
    });
    return response.embeddings[0] ?? [];
  } catch (error) {
    logger.error('Embedding generation failed', { error: String(error) });
    throw error;
  }
}

export { ollamaClient };
