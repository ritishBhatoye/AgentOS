// ============================================================
// AgentOS — Models API Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { listModels } from '../../lib/ollama.js';
import { getModelProfiles } from '../../router/selectModel.js';

export const modelsRouter = Router();

// ─── GET /api/models ──────────────────────────────────────

modelsRouter.get('/', async (_req: Request, res: Response) => {
  const availableModels = await listModels();
  const profiles = getModelProfiles();

  res.json({
    success: true,
    data: {
      available: availableModels,
      profiles: profiles.map(p => ({
        ...p,
        isAvailable: availableModels.some(m => m.startsWith(p.id)),
      })),
    },
  });
});
