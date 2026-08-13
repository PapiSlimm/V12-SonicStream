import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { serverErrors } from '../monitoring/metrics.js';
import { captureError } from '../agents/AgentFactory.js';

const logger = pino();

export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 500) {
    super(message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Instrument server metrics for various types of errors
  const errText = String(err?.message || '') + String(err?.stack || '');
  const isDb = /database|sqlite|postgres|query|pool/i.test(errText);
  const isRedis = /redis|ioredis/i.test(errText);

  if (isDb) {
    serverErrors.inc({ type: 'database' });
  } else if (isRedis) {
    serverErrors.inc({ type: 'redis' });
  } else if (statusCode === 500) {
    serverErrors.inc({ type: '500' });
  } else {
    serverErrors.inc({ type: 'other' });
  }

  // Feed the V12 Agent Factory's Debug agent with real runtime signals.
  if (statusCode >= 500) captureError(err, { method: req.method, url: req.url });

  logger.error({
    err,
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      user: (req as any).user
    }
  }, message);

  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export { logger };

