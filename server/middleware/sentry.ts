import * as Sentry from '@sentry/node';
import { config } from '../config.js';
import { Request, Response, NextFunction } from 'express';

if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

// In Sentry 10.x, the requestHandler is no longer needed as a separate middleware
// if using the new setupExpressErrorHandler. However, to maintain compatibility
// with the existing server.ts structure without major refactoring, we'll export
// no-op middlewares that handle Sentry reporting if configured.

export const sentryHandler = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const sentryErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (config.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  next(err);
};
