// ============================================================
// AgentOS — Metrics API Routes
// ============================================================

import { Router } from 'express';
import { getMetricsSummary, getMetricsTimeline } from '../../metrics/index.js';
import { workerPool } from '../../execution/workerPool.js';

const metricsRouter = Router();

// Get metrics summary
metricsRouter.get('/', (_req, res) => {
  try {
    const summary = getMetricsSummary();
    const pool = workerPool.getStatus();
    res.json({ success: true, data: { ...summary, workerPool: pool } });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get timeline data
metricsRouter.get('/timeline', (req, res) => {
  try {
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
    const timeline = getMetricsTimeline(hours);
    res.json({ success: true, data: timeline });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export { metricsRouter };
