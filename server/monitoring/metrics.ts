import promClient from 'prom-client';

export const register = new promClient.Registry();

// Default metrics collection
promClient.collectDefaultMetrics({ register });

// Request Duration Histogram with customized buckets
export const httpRequestDuration = new promClient.Histogram({
  name: 'sonic_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status', 'version'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register]
});

// Original custom legacy counters to preserve compatibility
export const stripeWebhookErrors = new promClient.Counter({
  name: 'sonic_stripe_webhook_errors_total',
  help: 'Total Stripe webhook failures',
  labelNames: ['reason', 'event'],
  registers: [register]
});

export const revenueBlockerHits = new promClient.Counter({
  name: 'sonic_revenue_blocker_hits_total',
  help: 'Revenue blocker 403 responses',
  labelNames: ['userType', 'feature'],
  registers: [register]
});

export const ffmpegQueueSize = new promClient.Gauge({
  name: 'sonic_ffmpeg_queue_size',
  help: 'Number of jobs in the FFmpeg queue',
  registers: [register]
});

export const paymentFailures = new promClient.Counter({
  name: 'sonic_payment_failures_total',
  help: 'Total number of payment failures',
  registers: [register]
});

export const subscriptionErrors = new promClient.Counter({
  name: 'sonic_subscription_errors_total',
  help: 'Total number of subscription sync errors',
  registers: [register]
});

// General server errors tracker
export const serverErrors = new promClient.Counter({
  name: 'sonic_server_errors_total',
  help: 'Total server errors',
  labelNames: ['type'],
  registers: [register]
});
