import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Import existing register and other metrics to retain full compatibility
import {
  register,
  stripeWebhookErrors,
  revenueBlockerHits,
  ffmpegQueueSize,
  paymentFailures,
  subscriptionErrors,
  serverErrors
} from './monitoring/metrics.js';

import { normalizeRoute } from './monitoring/middleware.js';

import {
  ordersCreated,
  ordersFailed,
  cartAbandonments,
  bookingRequests,
  bookingFailures,
  ticketsSold,
  ticketFailures,
  activeSubscriptions,
  subscriptionRenewals,
  subscriptionFailures,
  affiliateClicks,
  affiliateConversions,
  affiliatePayouts,
  creatorRevenue
} from './monitoring/businessMetrics.js';

import {
  containerStarts,
  dbQueryDuration,
  dbErrors,
  dbPoolUsage,
  redisErrors,
  redisLatency
} from './monitoring/healthMetrics.js';

import {
  aiRequests,
  aiFailures,
  aiLatency,
  aiTokens
} from './monitoring/aiMetrics.js';

// Re-export all original metrics to guarantee zero breaking changes across domains
export {
  register,
  stripeWebhookErrors,
  revenueBlockerHits,
  ffmpegQueueSize,
  paymentFailures,
  subscriptionErrors,
  serverErrors,
  normalizeRoute,
  ordersCreated,
  ordersFailed,
  cartAbandonments,
  bookingRequests,
  bookingFailures,
  ticketsSold,
  ticketFailures,
  activeSubscriptions,
  subscriptionRenewals,
  subscriptionFailures,
  affiliateClicks,
  affiliateConversions,
  affiliatePayouts,
  creatorRevenue,
  containerStarts,
  dbQueryDuration,
  dbErrors,
  dbPoolUsage,
  redisErrors,
  redisLatency,
  aiRequests,
  aiFailures,
  aiLatency,
  aiTokens
};

// ── Enhanced Custom/Requested Metrics ────────────────────────────────────────

// Custom metrics registered to the standard registry
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});
register.registerMetric(httpRequestDuration);

export const httpRequestTotal = new client.Counter({
  name: 'http_request_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestTotal);

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});
register.registerMetric(activeConnections);

export const serviceHealth = new client.Gauge({
  name: 'service_health',
  help: 'Health status of services (1=healthy, 0=unhealthy)',
  labelNames: ['service']
});
register.registerMetric(serviceHealth);

export const memoryUsage = new client.Gauge({
  name: 'node_memory_usage_bytes',
  help: 'Node.js memory usage',
  labelNames: ['type']
});
register.registerMetric(memoryUsage);

// Update memory metrics every 10 seconds
setInterval(() => {
  const mem = process.memoryUsage();
  memoryUsage.set({ type: 'rss' }, mem.rss);
  memoryUsage.set({ type: 'heapTotal' }, mem.heapTotal);
  memoryUsage.set({ type: 'heapUsed' }, mem.heapUsed);
  memoryUsage.set({ type: 'external' }, mem.external);
}, 10000);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path || 'unknown';
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: String(res.statusCode) },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: String(res.statusCode)
    });
    
    activeConnections.dec();
  });
  
  next();
};
