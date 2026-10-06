import { LRUCache } from 'lru-cache';

const options = {
  max: 500, // Store 500 items
  ttl: 1000 * 60 * 5, // 5 minute default expiration
};

const cache = new LRUCache<string, any>(options);

export class CacheService {
  /**
   * Get item from cache
   */
  static get<T>(key: string): T | undefined {
    return cache.get(key) as T | undefined;
  }

  /**
   * Set item in cache
   */
  static set(key: string, value: any, ttl?: number): void {
    cache.set(key, value, { ttl });
  }

  /**
   * Delete item from cache
   */
  static delete(key: string): void {
    cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  static clear(): void {
    cache.clear();
  }

  /**
   * Wrap a function with caching
   */
  static async wrap<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const fresh = await fetchFn();
    this.set(key, fresh, ttl);
    return fresh;
  }
}
