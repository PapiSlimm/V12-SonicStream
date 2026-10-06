import { Response, NextFunction } from 'express';
import { AuthRequest } from '../domains/identity/auth.js';
import { logger } from '../middleware/error.js';
import { connection as redisConnection } from '../jobs.js';

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

// In-Memory map for sliding window rate limiting fallback
const memoryStore = new Map<string, { count: number; resetTime: number }>();

const DEFAULT_LIMITS: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // max 100 requests per minute
};

export function rateLimit(customConfig?: Partial<RateLimitConfig>) {
  const config = { ...DEFAULT_LIMITS, ...customConfig };

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Resolve qualifiers (IP, User ID, or API Key)
    const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown-ip';
    const userId = req.user?.id;
    
    // Check if an API key was used
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    const key = apiKey 
      ? `rl:apikey:${apiKey}` 
      : userId 
        ? `rl:user:${userId}` 
        : `rl:ip:${ip}`;

    // 2. Redis-backed Sliding Window if redis is connected and healthy
    if (redisConnection && redisConnection.status === 'ready') {
      try {
        const currentTime = Date.now();
        const windowStart = currentTime - config.windowMs;

        const multi = redisConnection.multi();
        // Remove old entries outside window
        multi.zremrangebyscore(key, 0, windowStart);
        // Add current timestamp
        multi.zadd(key, currentTime, `${currentTime}-${Math.random()}`);
        // Count hits inside window
        multi.zcard(key);
        // Set expiry for key
        multi.expire(key, Math.ceil(config.windowMs / 1000));

        const results = await multi.exec();
        if (results && results[2]) {
          const count = results[2][1] as number;
          
          res.setHeader('X-RateLimit-Limit', config.max);
          res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - count));

          if (count > config.max) {
            logger.warn(`[RateLimit] Limit exceeded for key: ${key}`);
            return res.status(429).json({
              error: 'Too many requests, please try again later.',
              retryAfterMs: config.windowMs
            });
          }
        }
        return next();
      } catch (err: any) {
        logger.warn('[RateLimit] Redis sliding window failed, falling back to MemoryStore:', err.message || err);
      }
    }

    // 3. Fallback: In-Memory Sliding Window
    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
      memoryStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', config.max - 1);
      return next();
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - record.count));

    if (record.count > config.max) {
      logger.warn(`[RateLimit] Memory Limit exceeded for key: ${key}`);
      return res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfterMs: record.resetTime - now
      });
    }

    next();
  };
}
