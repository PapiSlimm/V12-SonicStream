import * as Sentry from '@sentry/node';
import { config } from '../config.js';
import pino from 'pino';

const logger = pino();

// Initialize Sentry if DSN is set
if (config.SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: config.SENTRY_DSN,
      environment: config.NODE_ENV,
      tracesSampleRate: 1.0,
    });
  } catch (err) {
    console.warn('Sentry initialization failed:', err);
  }
}

export interface ErrorContext {
  userId?: string;
  trackId?: string;
  jobId?: string;
  service?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export const errorLogger = {
  log: (error: Error | any, message: string, context: ErrorContext = {}) => {
    const err = error instanceof Error ? error : new Error(String(error));

    // Structured logging via Pino
    logger.error({
      err: {
        message: err.message,
        stack: err.stack,
      },
      ...context
    }, `${message} - ${err.message}`);

    // Capture with Sentry
    if (config.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        if (context.userId) {
          scope.setUser({ id: context.userId });
          scope.setTag('userId', context.userId);
        }
        if (context.trackId) {
          scope.setTag('trackId', context.trackId);
        }
        if (context.jobId) {
          scope.setTag('jobId', context.jobId);
        }
        if (context.service) {
          scope.setTag('service', context.service);
        }
        if (context.action) {
          scope.setTag('action', context.action);
        }
        if (context.metadata) {
          scope.setContext('metadata', context.metadata);
        }
        Sentry.captureException(err);
      });
    }
  },
  
  info: (message: string, context: Record<string, any> = {}) => {
    logger.info(context, message);
  },

  warn: (message: string, context: Record<string, any> = {}) => {
    logger.warn(context, message);
  }
};
