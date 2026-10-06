import promClient from 'prom-client';
import { register } from './metrics.js';

export const serviceHealth = new promClient.Gauge({
  name: 'sonic_service_health',
  help: 'Liveness of vital integration subsystems (1 = healthy, 0 = degraded)',
  labelNames: ['service'],
  registers: [register]
});

export const containerStarts = new promClient.Counter({
  name: 'sonic_container_starts_total',
  help: 'Total container startup lifecycles tracked',
  registers: [register]
});

// Automatically register a start event once on application boot/module evaluation
containerStarts.inc();

// Database Metrics
export const dbQueryDuration = new promClient.Histogram({
  name: 'sonic_db_query_duration_seconds',
  help: 'Database query total execution duration',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register]
});

export const dbErrors = new promClient.Counter({
  name: 'sonic_db_errors_total',
  help: 'Total errors encountered during database operations',
  labelNames: ['operation'],
  registers: [register]
});

export const dbPoolUsage = new promClient.Gauge({
  name: 'sonic_db_pool_usage',
  help: 'Database connection utilization breakdown metrics',
  labelNames: ['state'],
  registers: [register]
});

// Redis Metrics
export const redisErrors = new promClient.Counter({
  name: 'sonic_redis_errors_total',
  help: 'Total connection or query failures logged by Redis driver',
  labelNames: ['operation'],
  registers: [register]
});

export const redisLatency = new promClient.Histogram({
  name: 'sonic_redis_latency_seconds',
  help: 'Redis operation duration metrics',
  labelNames: ['operation'],
  buckets: [0.0005, 0.001, 0.002, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
  registers: [register]
});
