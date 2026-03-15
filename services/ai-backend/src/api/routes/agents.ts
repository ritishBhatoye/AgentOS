// ============================================================
// AgentOS — Agent API Routes
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { SystemLogger } from '../../utils/logger.js';
import { agentOrchestrator } from '../../agents/orchestrator.js';
import { taskQueue } from '../../agents/taskQueue.js';

const logger = new SystemLogger('AgentAPI');
export const agentRouter = Router();

// ─── Validation ────────────────────────────────────────────

const executeRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  agentId: z.enum(['planner', 'coding', 'research', 'execution']).optional(),
  model: z.string().optional(),
});

// ─── GET /api/agents/status ───────────────────────────────

agentRouter.get('/status', (_req: Request, res: Response) => {
  const agentStatuses = agentOrchestrator.getAgentStatuses();
  res.json({
    success: true,
    data: agentStatuses,
  });
});

// ─── POST /api/agents/execute ─────────────────────────────

agentRouter.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = executeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid request', details: parsed.error.errors },
      });
      return;
    }

    const { prompt, agentId } = parsed.data;
    const taskId = uuid();

    logger.info('Agent execution requested', { taskId, agentId, prompt: prompt.substring(0, 100) });

    // Execute through orchestrator
    const result = await agentOrchestrator.execute({
      id: taskId,
      prompt,
      agentId: agentId as any,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/agents/:id ──────────────────────────────────

agentRouter.get('/:id', (req: Request, res: Response) => {
  const agent = agentOrchestrator.getAgent(req.params.id as string);
  if (!agent) {
    res.status(404).json({ success: false, error: { message: 'Agent not found' } });
    return;
  }
  res.json({ success: true, data: agent });
});
