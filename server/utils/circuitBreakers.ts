import CircuitBreaker from 'opossum';
import { logger } from '../middleware/error.js';

// Configuration for circuit breakers
const defaultOptions: CircuitBreaker.Options = {
  timeout: 5000, // If our external call takes longer than 5s, trigger timeout
  errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
  resetTimeout: 10000 // Attempt to heal/reset after 10s of being open
};

/**
 * Stripe Circuit Breaker
 */
export const stripeBreaker = new CircuitBreaker(async <T>(fn: () => Promise<T>): Promise<T> => {
  return await fn();
}, defaultOptions);

stripeBreaker.on('open', () => logger.warn('⚠️ Stripe Circuit Breaker is OPEN due to frequent failures. Failsafe activated.'));
stripeBreaker.on('close', () => logger.info('✅ Stripe Circuit Breaker is CLOSED. Normal operations resumed.'));
stripeBreaker.on('halfOpen', () => logger.info('🟡 Stripe Circuit Breaker is HALF-OPEN. Testing health...'));

/**
 * Bandcamp Circuit Breaker
 */
export const bandcampBreaker = new CircuitBreaker(async <T>(fn: () => Promise<T>): Promise<T> => {
  return await fn();
}, defaultOptions);

bandcampBreaker.on('open', () => logger.warn('⚠️ Bandcamp Circuit Breaker is OPEN. Failsafe activated.'));
bandcampBreaker.on('close', () => logger.info('✅ Bandcamp Circuit Breaker is CLOSED.'));

/**
 * AI/Gemini Services Circuit Breaker
 */
export const aiBreaker = new CircuitBreaker(async <T>(fn: () => Promise<T>): Promise<T> => {
  return await fn();
}, {
  ...defaultOptions,
  timeout: 15000 // AI requests can take longer
});

aiBreaker.on('open', () => logger.warn('⚠️ AI Services Circuit Breaker is OPEN. AI features offline.'));
aiBreaker.on('close', () => logger.info('✅ AI Services Circuit Breaker is CLOSED. AI features back online.'));

/**
 * Redis Circuit Breaker
 */
export const redisBreaker = new CircuitBreaker(async <T>(fn: () => Promise<T>): Promise<T> => {
  return await fn();
}, defaultOptions);

redisBreaker.on('open', () => logger.warn('⚠️ Redis/Worker Circuit Breaker is OPEN.'));
redisBreaker.on('close', () => logger.info('✅ Redis/Worker Circuit Breaker satisfies health check.'));

/**
 * Generic wrapper function to easily wrap any external API call
 */
export async function runWithProtection<T>(
  breaker: CircuitBreaker<[() => Promise<T>], T>,
  action: () => Promise<T>,
  fallbackValue?: T
): Promise<T> {
  try {
    return await breaker.fire(action);
  } catch (err) {
    logger.error(`Circuit breaker error: ${err instanceof Error ? err.message : 'unknown'}`);
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    throw err;
  }
}
