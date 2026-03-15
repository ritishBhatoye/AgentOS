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
import { errorHandler } from './api/middleware/errorHandler.js';
import { requestLogger } from './api/middleware/requestLogger.js';
import { SystemLogger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 4000;
const logger = new SystemLogger('Server');

// ─── Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',  // Next.js web
    'http://localhost:8081',  // Expo mobile
    'http://localhost:19006', // Expo web
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

// ─── Root ─────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'AgentOS AI Backend',
    version: '0.1.0',
    status: 'running',
    docs: '/api/health',
  });
});

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 AgentOS AI Backend running on http://localhost:${PORT}`);
  logger.info(`📡 API ready at http://localhost:${PORT}/api`);
  logger.info(`🤖 Ollama endpoint: ${process.env.OLLAMA_HOST || 'http://localhost:11434'}`);
});

export default app;
