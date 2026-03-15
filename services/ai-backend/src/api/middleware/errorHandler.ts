// ============================================================
// AgentOS — Error Handler Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { SystemLogger } from '../../utils/logger.js';

const logger = new SystemLogger('ErrorHandler');

export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(message, {
    statusCode,
    stack: err.stack,
    details: err.details,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

export function createApiError(message: string, statusCode: number, details?: unknown): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}
