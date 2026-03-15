// ============================================================
// AgentOS — Request Logger Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('API');

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  logger.debug(`${req.method} ${req.path}`, {
    query: req.query as Record<string, unknown>,
    body: req.method !== 'GET' ? req.body : undefined,
  });
  next();
}
