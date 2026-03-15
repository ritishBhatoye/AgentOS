// ============================================================
// AgentOS — Chat API Routes
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { chat, chatStream } from '../../lib/ollama.js';
import { selectModel } from '../../router/selectModel.js';
import { SystemLogger } from '../../utils/logger.js';
import { conversationStore } from '../../memory/conversationStore.js';
import { agentOrchestrator } from '../../agents/orchestrator.js';

const logger = new SystemLogger('ChatAPI');
export const chatRouter = Router();

// ─── Validation Schemas ───────────────────────────────────

const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().uuid().nullable().optional().or(z.literal('')),
  model: z.string().optional(),
  stream: z.boolean().optional().default(false),
});

// ─── POST /api/chat ───────────────────────────────────────

chatRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid request', details: parsed.error.errors },
      });
      return;
    }

    const { message, conversationId: existingConvId, model: preferredModel } = parsed.data;

    // Get or create conversation
    const conversationId = (existingConvId && existingConvId !== '') ? existingConvId : uuid();
    const conversation = conversationStore.getOrCreate(conversationId);

    // Route to best model and classify task
    const routing = selectModel(message, preferredModel as any);

    // Add user message to conversation
    const userMessage = {
      id: uuid(),
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(userMessage);

    const startTime = Date.now();
    let assistantMessage;

    // ─── DECISION: Simple Chat vs. Autonomous Task ──────────
    // If it's a task (coding, planning, etc.), trigger the orchestrator
    if (routing.taskType !== 'conversation') {
      logger.info(`Routing task to Orchestrator [${routing.taskType}]`, { conversationId });
      
      const taskId = uuid();
      const result = await agentOrchestrator.execute({
        id: taskId,
        prompt: message,
        model: routing.model,
      });

      assistantMessage = {
        id: uuid(),
        role: 'assistant' as const,
        content: result.finalOutput,
        model: routing.model,
        taskId: result.taskId,
        taskStatus: result.status,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Simple conversation - direct chat
      logger.info('Routing simple conversation to direct chat', { conversationId });
      
      // Map strictly to Ollama accepted roles
      const ollamaMessages = conversation.messages
        .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        }));

      ollamaMessages.unshift({
        role: 'system',
        content: 'You are AgentOS, an intelligent AI assistant. Be helpful, accurate, and concise.',
      });

      const result = await chat({
        model: routing.model,
        messages: ollamaMessages,
      });

      assistantMessage = {
        id: uuid(),
        role: 'assistant' as const,
        content: result.content,
        model: routing.model,
        timestamp: new Date().toISOString(),
      };
    }

    // Add assistant message to conversation
    conversation.messages.push(assistantMessage);

    const duration = Date.now() - startTime;

    logger.info('Chat processing completed', {
      conversationId,
      model: routing.model,
      taskType: routing.taskType,
      duration: `${duration}ms`,
    });

    res.json({
      success: true,
      data: {
        message: assistantMessage,
        conversationId,
        modelUsed: routing.model,
        taskType: routing.taskType,
        confidence: routing.confidence,
        duration,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/chat/stream ───────────────────────────────

chatRouter.post('/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid request', details: parsed.error.errors },
      });
      return;
    }

    const { message, model: preferredModel } = parsed.data;

    // Route to best model
    const routing = selectModel(message, preferredModel as any);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const messages = [
      { role: 'system' as const, content: 'You are AgentOS, an intelligent AI assistant.' },
      { role: 'user' as const, content: message },
    ];

    // Stream response
    const stream = chatStream({ model: routing.model, messages });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true, model: routing.model })}\n\n`);
    res.end();
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/chat/conversations ──────────────────────────

chatRouter.get('/conversations', (_req: Request, res: Response) => {
  const conversations = conversationStore.listAll();
  res.json({
    success: true,
    data: conversations.map(c => ({
      id: c.id,
      title: c.title,
      messageCount: c.messages.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
});

// ─── GET /api/chat/conversations/:id ──────────────────────

chatRouter.get('/conversations/:id', (req: Request, res: Response) => {
  const conversation = conversationStore.get(req.params.id as string);
  if (!conversation) {
    res.status(404).json({ success: false, error: { message: 'Conversation not found' } });
    return;
  }
  res.json({ success: true, data: conversation });
});
