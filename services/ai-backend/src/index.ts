// ============================================================
// AgentOS — AI Backend Server Entry Point
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { chatRouter } from './api/routes/chat.js';
import { agentRouter } from './api/routes/agents.js';
import { healthRouter } from './api/routes/health.js';
import { modelsRouter } from './api/routes/models.js';
import { tasksRouter } from './api/routes/tasks.js';
import { eventsRouter } from './api/routes/events.js';
import { memoryRouter } from './api/routes/memory.js';
import { codegraphRouter } from './api/routes/codegraph.js';
import { knowledgeRouter } from './api/routes/knowledge.js';
import { metricsRouter } from './api/routes/metrics.js';
import { jobsRouter } from './api/routes/jobs.js';
import { pluginsRouter } from './api/routes/plugins.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import { requestLogger } from './api/middleware/requestLogger.js';
import { SystemLogger } from './utils/logger.js';
import { runMigrations, closeDb } from './db/sqlite.js';

// Initialize tool registry (registers all built-in tools)
import './tools/index.js';

// Initialize database
try {
  runMigrations();
} catch (err) {
  console.error('Database initialization failed:', err);
}

const app = express();
const PORT = process.env.PORT || 4000;
const logger = new SystemLogger('Server');

// ─── Middleware ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    'http://localhost:3000',  // Next.js web
    'http://localhost:3001',  // Next.js alt
    'http://localhost:8081',  // Expo mobile
    'http://localhost:19006', // Expo web
    'http://127.0.0.1:3000',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(requestLogger);

// ─── Routes ───────────────────────────────────────────────
app.use('/api/chat', chatRouter);
app.use('/api/agents', agentRouter);
app.use('/api/health', healthRouter);
app.use('/api/models', modelsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/events', eventsRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/codegraph', codegraphRouter);
app.use('/api/knowledge-graph', knowledgeRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/plugins', pluginsRouter);

// ─── Root ─────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'AgentOS AI Backend',
    version: '0.2.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      chat: '/api/chat',
      agents: '/api/agents',
      tasks: '/api/tasks',
      models: '/api/models',
      events: '/api/events (SSE)',
      memory: '/api/memory',
      codegraph: '/api/codegraph',
      knowledgeGraph: '/api/knowledge-graph',
      metrics: '/api/metrics',
      jobs: '/api/jobs',
      plugins: '/api/plugins',
    },
  });
});

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(`🚀 AgentOS AI Backend v0.2.0 running on http://localhost:${PORT}`);
  logger.info(`📡 API ready at http://localhost:${PORT}/api`);
  logger.info(`🤖 Ollama endpoint: ${process.env.OLLAMA_HOST || 'http://localhost:11434'}`);
  logger.info(`📺 SSE events at http://localhost:${PORT}/api/events`);
  logger.info(`🧠 7 agents: planner, coding, research, execution, architect, reviewer, debugger`);
  logger.info(`📊 New APIs: /codegraph, /knowledge-graph, /metrics, /jobs, /plugins`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  closeDb();
  server.close();
  process.exit(0);
});

export default app;
