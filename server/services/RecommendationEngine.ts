import { registry } from './ServiceRegistry.js';
import { logger } from '../middleware/error.js';
import { run, all, get } from '../db.js';

export interface FeedbackEvent {
  userId: string;
  itemId: string;
  itemType: 'track' | 'artist' | 'event';
  action: 'play' | 'skip' | 'like' | 'purchase';
  timestamp: string;
}

export class RecommendationEngine {
  static status = 'uninitialized';

  static async init() {
    logger.info('[RecommendationEngine] Waiting for database and redis in ServiceRegistry...');
    await registry.waitFor('database');
    await registry.waitFor('redis');

    logger.info('[RecommendationEngine] Awakening...');
    
    // Bootstrap feedback storage for feedback loop
    try {
      await run(`
        CREATE TABLE IF NOT EXISTS recommendation_feedback (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          item_id TEXT NOT NULL,
          item_type TEXT NOT NULL,
          action TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.info('[RecommendationEngine] Bootstrap feedback loop storage successfully.');
    } catch (err: any) {
      logger.error('[RecommendationEngine] Failed to bootstrap feedback tables:', err.message);
    }

    this.status = 'healthy';
    registry.register('recommendationEngine', this);
  }

  static async shutdown() {
    logger.info('[RecommendationEngine] Shutting down recommendation engine...');
    this.status = 'shutdown';
  }

  /**
   * Feedback Loops: Record user behaviors in database to adapt future ranking weights.
   */
  static async recordFeedback(userId: string, itemId: string, itemType: 'track' | 'artist' | 'event', action: 'play' | 'skip' | 'like' | 'purchase') {
    const id = `fbk_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    try {
      await run(
        'INSERT INTO recommendation_feedback (id, user_id, item_id, item_type, action, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [id, userId, itemId, itemType, action, timestamp]
      );
      logger.info(`[RecommendationEngine] Feedback recorded for user ${userId}: ${action} on ${itemType} ${itemId}`);
    } catch (err: any) {
      logger.error(`[RecommendationEngine] Failed to record feedback: ${err.message}`);
    }
  }

  /**
   * Generate simple text-matching profile embeddings vector
   * Uses Token-Frequency (TF) vectors comparison of terms to compute a relative Cosine Similarity
   */
  static getCosineSimilarity(textA: string, textB: string): number {
    const tokenize = (text: string) => text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
    const tokensA = tokenize(textA);
    const tokensB = tokenize(textB);
    
    if (tokensA.length === 0 || tokensB.length === 0) return 0;

    const termFreq = (tokens: string[]) => {
      const map: { [key: string]: number } = {};
      tokens.forEach(t => map[t] = (map[t] || 0) + 1);
      return map;
    };

    const freqA = termFreq(tokensA);
    const freqB = termFreq(tokensB);

    const allTerms = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    allTerms.forEach(term => {
      const valA = freqA[term] || 0;
      const valB = freqB[term] || 0;
      dotProduct += valA * valB;
      magA += valA * valA;
      magB += valB * valB;
    });

    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  /**
   * Dynamic Ranking algorithm combining User Preferences, Behavior Data, Embeddings mapping, and Feedback penalty modifiers
   */
  static async rankRecommendations(userId: string, items: { id: string; type: 'track' | 'artist' | 'event'; genre: string; textProfile: string }[]): Promise<any[]> {
    // 1. Fetch user interest profile
    const user = await get<{ preferred_genres: string }>('SELECT preferred_genres as preferredGenres FROM users WHERE id = ?', [userId]);
    const preferredGenres: string[] = user?.preferredGenres ? JSON.parse(user.preferredGenres).map((g: string) => g.toLowerCase()) : [];

    // 2. Fetch user's history of actions (Behavior Data) to compute penalties/incentives
    const feedbacks = await all<{ item_id: string; action: string }>('SELECT item_id, action FROM recommendation_feedback WHERE user_id = ?', [userId]);
    const skips = new Set(feedbacks.filter(f => f.action === 'skip').map(f => f.item_id));
    const likes = new Set(feedbacks.filter(f => f.action === 'like').map(f => f.item_id));
    const plays = feedbacks.filter(f => f.action === 'play');
    
    // Count play occurrences per genre to build a frequency map
    const playGenreCounts: { [key: string]: number } = {};
    for (const p of plays) {
      const track = await get<{ genre: string }>('SELECT genre FROM tracks WHERE id = ?', [p.item_id]);
      if (track?.genre) {
        const genLower = track.genre.toLowerCase();
        playGenreCounts[genLower] = (playGenreCounts[genLower] || 0) + 1;
      }
    }

    const userProfileText = `${preferredGenres.join(' ')} ${Object.keys(playGenreCounts).join(' ')}`;

    // 3. Compute vector-like Cosine Similarity and apply feedback modifiers
    const ranked = items.map(item => {
      let score = 0.4; // baseline probability

      // A. Term embedding match
      const similarity = this.getCosineSimilarity(userProfileText, item.textProfile);
      score += similarity * 0.4;

      // B. Direct Genre overlap match
      if (preferredGenres.includes(item.genre.toLowerCase())) {
        score += 0.2;
      }

      // C. Action modifiers (Feedback Loops and Behavior penalties)
      if (skips.has(item.id)) {
        score *= 0.15; // Brutal penalty for skipped tracks
      }
      if (likes.has(item.id)) {
        score += 0.3; // Major boost for explicitly liked tracks
      }

      // Cap score boundary [0, 1]
      score = Math.min(1.0, Math.max(0.0, score));

      // Generate context-friendly explanation
      let reason = 'Trending pick recommended for you';
      if (likes.has(item.id)) {
        reason = `Highly recommended because you liked this item!`;
      } else if (skips.has(item.id)) {
        reason = `Highly penalized because you skipped it recently`;
      } else if (similarity > 0.5) {
        reason = `Based on your semantic affinity with ${item.genre}`;
      } else if (preferredGenres.includes(item.genre.toLowerCase())) {
        reason = `Based on your interest in ${item.genre}`;
      }

      return {
        id: item.id,
        type: item.type,
        score: Math.round(score * 100) / 100,
        reason
      };
    });

    // Sort descending by calculated score rank
    return ranked.sort((a, b) => b.score - a.score);
  }

  // Backwards compatibility or alternative activation
  static async start() {
    await this.init();
  }
}

