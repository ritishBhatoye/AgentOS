// ============================================================
// AgentOS — Memory API Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { memorySystem } from '../../memory/index.js';

export const memoryRouter = Router();

// ─── GET /api/memory — All memory entries ─────────────────

memoryRouter.get('/', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const entries = memorySystem.getAllEntries(limit);

  res.json({
    success: true,
    data: {
      entries,
      stats: memorySystem.getStats(),
    },
  });
});

// ─── GET /api/memory/search ───────────────────────────────

memoryRouter.get('/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ success: false, error: { message: 'Query parameter "q" is required' } });
    return;
  }

  const results = await memorySystem.search(query, 10);
  res.json({ success: true, data: results });
});

// ─── GET /api/memory/stats ────────────────────────────────

memoryRouter.get('/stats', (_req: Request, res: Response) => {
  res.json({ success: true, data: memorySystem.getStats() });
});
