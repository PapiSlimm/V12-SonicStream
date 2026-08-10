import { db } from '../db.js';

export class IdempotencyService {
  /**
   * Wraps a function in an idempotency gate
   */
  static async runIdempotent<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = await db.get('SELECT response FROM idempotency_keys WHERE key = ?', [key]);
    if (existing) {
      return JSON.parse(existing.response) as T;
    }

    const result = await fn();

    const id = `idemp_${Math.random().toString(36).substr(2, 9)}`;
    await db.run(
      'INSERT INTO idempotency_keys (id, key, response) VALUES (?, ?, ?)',
      [id, key, JSON.stringify(result)]
    );

    return result;
  }
}
