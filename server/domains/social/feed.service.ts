import { all, get } from '../../db.js';

export class FeedService {
  /**
   * Ranked Feed Algorithm (Production Version)
   */
  static async getRankedFeed(userId: string, options: { page?: number; limit?: number; followingOnly?: boolean }) {
    const { page = 0, limit = 20, followingOnly = false } = options;
    const offset = page * limit;

    // Check viewing user's subscription tier
    const userRecord = await get<{ subscriptionTier: string }>('SELECT subscription_tier FROM users WHERE id = ?', [userId]);
    const userTier = userRecord?.subscriptionTier || 'free';

    const tiers = ['everyone', 'free', 'listener', 'star', 'creator', 'SonicCreator', 'visionary', 'pro', 'enterprise'];
    const userIndex = tiers.indexOf(userTier);
    const actualIndex = userIndex === -1 ? tiers.indexOf('free') : userIndex;
    const allowedTiers = tiers.slice(0, actualIndex + 1);

    // Build query placeholders for allowed tiers
    const tierFilters = allowedTiers.map(() => '?').join(', ');

    // SCORE = (Engagement / (Time Decay ^ Aging)) * Relevance
    let query = `
      SELECT p.*, u.name as userName, u.avatar_url as userAvatar, u.is_pro as isPro,
             (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND type = 'like') as likesCount,
             (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND type = 'comment') as commentsCount,
             (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND type = 'share') as sharesCount,
             (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ? AND type = 'like') > 0 as hasLiked,
             (
               (
                 ((SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND type = 'like') * 1.5) +
                 ((SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND type = 'comment') * 3.0) +
                 ((SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND type = 'share') * 5.0) +
                 (CASE WHEN u.is_pro = 1 OR p.is_promotion = 1 THEN 50 ELSE 0 END)
               ) / 
               power((julianday('now') - julianday(p.created_at)) * 24 + 1, 1.2)
             ) as rank_score
      FROM posts p 
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'live'
        AND (
          p.user_id = ?
          OR p.subscription_tier_requirement IS NULL 
          OR p.subscription_tier_requirement = 'everyone'
          OR p.subscription_tier_requirement = 'free'
          OR p.subscription_tier_requirement IN (${tierFilters})
        )
    `;

    const params: any[] = [userId, userId, userId, ...allowedTiers];

    if (followingOnly) {
      query += ` AND p.user_id IN (SELECT following_id FROM user_follows WHERE follower_id = ?)`;
      params.push(userId);
    }

    query += ` ORDER BY rank_score DESC, p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rawPosts = await all<any>(query, params);

    return rawPosts.map(p => ({
      id: p.id.toString(),
      userId: p.user_id,
      content: p.content,
      type: p.type,
      media: p.media_url ? [{ url: p.media_url, type: p.type === 'video' ? 'video' : 'image' }] : [],
      status: p.status || 'live',
      isPromotion: !!p.is_promotion,
      price: p.price || 0,
      productLink: p.product_link || null,
      trackLink: p.track_link || null,
      subscriptionTierRequirement: p.subscription_tier_requirement || 'everyone',
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      user: {
        name: p.userName,
        avatarUrl: p.userAvatar,
        isVerified: !!p.isVerified,
        isPro: !!p.isPro
      },
      stats: {
        likes: p.likesCount,
        comments: p.commentsCount,
        shares: p.sharesCount
      },
      hasLiked: !!p.hasLiked
    } as any));
  }
}
