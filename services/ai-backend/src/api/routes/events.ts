// ============================================================
// AgentOS — SSE Events API Route
// Real-time server-sent events endpoint
// ============================================================

import { Router, Request, Response } from 'express';
import { eventBus } from '../../events/eventBus.js';

export const eventsRouter = Router();

// ─── GET /api/events — SSE stream ─────────────────────────

eventsRouter.get('/', (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Keep connection alive
  res.write(':connected\n\n');

  // Register client with event bus
  eventBus.addClient(res);

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// ─── GET /api/events/history — Recent events ──────────────

eventsRouter.get('/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const type = req.query.type as string | undefined;

  const events = eventBus.getHistory(limit, type as any);
  res.json({ success: true, data: events });
});
