// ============================================================
// AgentOS — Health Check API
// ============================================================

import { Router, Request, Response } from 'express';
import { checkConnection, listModels } from '../../lib/ollama.js';
import { agentOrchestrator } from '../../agents/orchestrator.js';
import { taskQueue } from '../../agents/taskQueue.js';
import { conversationStore } from '../../memory/conversationStore.js';
import { SystemLogger } from '../../utils/logger.js';

const startTime = Date.now();
export const healthRouter = Router();

// ─── GET /api/health ──────────────────────────────────────

healthRouter.get('/', async (_req: Request, res: Response) => {
  const ollamaConnected = await checkConnection();
  const models = ollamaConnected ? await listModels() : [];
  const agentStatuses = agentOrchestrator.getAgentStatuses();
  const taskStats = taskQueue.getStats();
  const convStats = conversationStore.getStats();

  const isHealthy = ollamaConnected;

  res.json({
    success: true,
    data: {
      status: isHealthy ? 'healthy' : 'degraded',
      version: '0.1.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      ollama: {
        connected: ollamaConnected,
        host: process.env.OLLAMA_HOST || 'http://localhost:11434',
        models,
      },
      agents: agentStatuses,
      tasks: taskStats,
      conversations: convStats,
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── GET /api/health/logs ─────────────────────────────────

healthRouter.get('/logs', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const level = req.query.level as string | undefined;
  const logs = SystemLogger.getLogs(limit, level as any);

  res.json({
    success: true,
    data: logs,
  });
});
