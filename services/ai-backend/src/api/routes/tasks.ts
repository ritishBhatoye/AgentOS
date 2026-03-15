// ============================================================
// AgentOS — Tasks API Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { taskQueue } from '../../agents/taskQueue.js';

export const tasksRouter = Router();

// ─── GET /api/tasks ───────────────────────────────────────

tasksRouter.get('/', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const limit = parseInt(req.query.limit as string) || 50;

  let tasks = taskQueue.getAllTasks();

  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }

  res.json({
    success: true,
    data: {
      tasks: tasks.slice(0, limit),
      total: tasks.length,
      stats: taskQueue.getStats(),
    },
  });
});

// ─── GET /api/tasks/:id ───────────────────────────────────

tasksRouter.get('/:id', (req: Request, res: Response) => {
  const task = taskQueue.getTask(req.params.id as string);
  if (!task) {
    res.status(404).json({ success: false, error: { message: 'Task not found' } });
    return;
  }
  res.json({ success: true, data: task });
});
