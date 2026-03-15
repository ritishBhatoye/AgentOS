// ============================================================
// AgentOS — Jobs API Routes
// ============================================================

import { Router } from 'express';
import { jobRunner } from '../../execution/workerPool.js';

const jobsRouter = Router();

// List jobs
jobsRouter.get('/', (_req, res) => {
  const jobs = jobRunner.listJobs();
  res.json({ success: true, data: jobs });
});

// Get job by ID
jobsRouter.get('/:id', (req, res) => {
  const job = jobRunner.getJob(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
  res.json({ success: true, data: job });
});

// Cancel job
jobsRouter.post('/:id/cancel', (req, res) => {
  const cancelled = jobRunner.cancel(req.params.id);
  res.json({ success: true, data: { cancelled } });
});

export { jobsRouter };
