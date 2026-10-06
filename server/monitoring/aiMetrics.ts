import promClient from 'prom-client';
import { register } from './metrics.js';

export const aiRequests = new promClient.Counter({
  name: 'sonic_ai_requests_total',
  help: 'Total backend requests made to AI services',
  labelNames: ['provider', 'model', 'feature'],
  registers: [register]
});

export const aiFailures = new promClient.Counter({
  name: 'sonic_ai_failures_total',
  help: 'Total failed backend executions from AI services',
  labelNames: ['provider', 'model', 'feature'],
  registers: [register]
});

export const aiLatency = new promClient.Histogram({
  name: 'sonic_ai_latency_seconds',
  help: 'Latency distribution of completed AI service calls',
  labelNames: ['provider', 'model', 'feature'],
  buckets: [0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 30.0],
  registers: [register]
});

export const aiTokens = new promClient.Counter({
  name: 'sonic_ai_tokens_total',
  help: 'Count of prompt or completion tokens processed',
  labelNames: ['provider', 'model', 'type'], // 'prompt' or 'completion'
  registers: [register]
});
