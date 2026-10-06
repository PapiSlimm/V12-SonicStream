import { Router } from 'express';
import { all, run, get } from '../../db.js';
import { authenticateToken, AuthRequest } from '../identity/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CacheService } from '../../services/CacheService.js';
import { FeedService } from './feed.service.js';
import { snakeToCamel } from '../../utils/naming.js';
import { getWritablePath, getGCSBucket, uploadToGCS } from '../../utils/storage.js';

const router = Router();
const upload = multer({ dest: getWritablePath('uploads/social/') });

// Middleware: Keep requirePro as a pass-through or basic validation, allowing all authenticated users to post
const requirePro = async (req: AuthRequest, res: any, next: any) => {
  next();
};

// 1. CREATE POST
router.post('/posts', authenticateToken, requirePro, upload.single('media'), async (req: AuthRequest, res) => {
  const { content, type = 'text', price = 0, productLink, trackLink, subscriptionTierRequirement = 'everyone', externalShare, ctaLink, ctaText } = req.body;
  
  let mediaUrl = null;
  if (req.file) {
    const bucketName = getGCSBucket();
    if (bucketName) {
      try {
        const destPath = `social/${req.file.filename}${path.extname(req.file.originalname)}`;
        mediaUrl = await uploadToGCS(req.file.path, destPath);
        // Clean up the local temp file after upload
        fs.unlinkSync(req.file.path);
      } catch (err: any) {
        console.error('Failed to upload social media to GCS:', err);
        mediaUrl = `/uploads/social/${req.file.filename}`;
      }
    } else {
      mediaUrl = `/uploads/social/${req.file.filename}`;
    }
  }
  
  const result = await run(`
    INSERT INTO posts (user_id, content, media_url, type, is_promotion, price, product_link, track_link, external_share, cta_link, cta_text, subscription_tier_requirement)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
  `, [
    req.user?.id, 
    content, 
    mediaUrl, 
    type, 
    !!price, 
    price, 
    productLink, 
    trackLink,
    JSON.stringify(externalShare || {}), 
    ctaLink, 
    ctaText,
    subscriptionTierRequirement
  ]);
  
  // Invalidate feed cache
  CacheService.clear(); 
  
  // Emit real-time update
  const io = (req.app as any).get('io');
  if (io) {
    const post = await get(`
      SELECT p.*, u.name, u.avatar_url, u.is_pro
      FROM posts p 
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [result.lastID]);
    io.emit('new_post', post);
  }
  
  res.json({ postId: result.lastID });
});

// 2. FEED (Ranked Algorithm via FeedService)
router.get('/feed', authenticateToken, async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 0;
  const limit = parseInt(req.query.limit as string) || 20;
  const followingOnly = req.query.following === 'true';
  const userId = req.user?.id;
  
  const cacheKey = `feed_${userId}_${page}_${followingOnly}`;
  
  const posts = await CacheService.wrap(cacheKey, async () => {
    return FeedService.getRankedFeed(userId!, { page, limit, followingOnly });
  }, 1000 * 30); // 30 second cache for feed

  res.json(posts);
});

// 3. FOLLOW/UNFOLLOW
router.post('/follow/:userId', authenticateToken, async (req: AuthRequest, res) => {
  const { userId } = req.params;
  if (userId === req.user?.id) return res.status(400).json({ error: 'Cannot follow yourself' });
  
  try {
    await run(`INSERT INTO user_follows (follower_id, following_id) VALUES(?,?)`, [req.user?.id, userId]);
    res.json({ success: true, following: true });
  } catch {
    await run(`DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?`, [req.user?.id, userId]);
    res.json({ success: true, following: false });
  }
});

// 4. USER PROFILE
router.get('/profile/:userId', authenticateToken, async (req: AuthRequest, res) => {
  const { userId } = req.params;
  
  const profile = await get(`
    SELECT id, name, avatar_url, bio, is_pro, is_verified, last_seen, social_links,
           (SELECT COUNT(*) FROM user_follows WHERE following_id = ?) as followers_count,
           (SELECT COUNT(*) FROM user_follows WHERE follower_id = ?) as following_count,
           (SELECT COUNT(*) FROM user_follows WHERE follower_id = ? AND following_id = ?) as is_following
    FROM users WHERE id = ?
  `, [userId, userId, req.user?.id, userId, userId]);
  
  if (!profile) return res.status(404).json({ error: 'User not found' });

  // Update last seen
  await run('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
  await run('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?', [req.user?.id]);
  
  const posts = await all(`
    SELECT p.*, u.name, u.avatar_url, u.is_pro, u.is_verified,
           (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND type = 'like') as likes,
           (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND type = 'comment') as comments,
           (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND type = 'share') as shares
    FROM posts p 
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ? AND p.status = 'live'
    ORDER BY p.created_at DESC
  `, [userId]);
  
  res.json({ ...profile, posts });
});

// 5. INTERACTIONS
router.post('/interact/:postId', authenticateToken, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const { type = 'like', commentText } = req.body;
  
  if (type === 'like') {
    const existing = await get(`SELECT id FROM post_interactions WHERE post_id = ? AND user_id = ? AND type = 'like'`, [postId, req.user?.id]);
    if (existing) {
      await run(`DELETE FROM post_interactions WHERE id = ?`, [existing.id]);
      return res.json({ success: true, action: 'unliked' });
    }
  }
  
  await run(`
    INSERT INTO post_interactions (post_id, user_id, type, comment_text)
    VALUES(?,?,?,?)
  `, [postId, req.user?.id, type, commentText]);
  
  // Real-time Engagement
  const io = (req.app as any).get('io');
  if (io) {
    const post = await get('SELECT user_id FROM posts WHERE id = ?', [postId]);
    if (post && post.user_id !== req.user?.id) {
       io.to(`user-${post.user_id}`).emit('engagement_event', {
         type: type === 'like' ? 'PostLiked' : 'PostCommented',
         fromUserId: req.user?.id,
         postId,
         message: type === 'comment' ? commentText : undefined
       });
    }
  }
  
  res.json({ success: true, action: type === 'like' ? 'liked' : 'commented' });
});

// 6. GET COMMENTS
router.get('/posts/:postId/comments', authenticateToken, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const comments = await all(`
    SELECT pi.*, u.name, u.avatar_url
    FROM post_interactions pi
    JOIN users u ON pi.user_id = u.id
    WHERE pi.post_id = ? AND pi.type = 'comment'
    ORDER BY pi.created_at ASC
  `, [postId]);
  res.json(comments);
});

// 7. TARGETED ADS (Business/Pro-Only)
router.post('/ads/create', authenticateToken, requirePro, async (req: AuthRequest, res) => {
  const { targetDemo, budget, creativeUrl, brandSafety, postId } = req.body;
  
  const result = await run(`
    INSERT INTO ads (business_id, post_id, target_demo, budget, creative_url, brand_safety)
    VALUES(?,?,?,?,?,?)
  `, [req.user?.id, postId, JSON.stringify(targetDemo), budget, creativeUrl, JSON.stringify(brandSafety || {})]);
  
  res.json({ adId: result.lastID });
});

// 8. BOOST POST (Pro-Only)
router.post('/ads/boost/:postId', authenticateToken, requirePro, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const { budget, targeting, location } = req.body;
  
  const post = await get('SELECT * FROM posts WHERE id = ?', [postId]);
  const mappedPost = post ? snakeToCamel(post) : null;
  if (!mappedPost) return res.status(404).json({ error: 'Post not found' });
  
  const result = await run(`
    INSERT INTO ads (business_id, post_id, target_demo, budget, creative_url, status)
    VALUES(?,?,?,?,?,?)
  `, [req.user?.id, postId, JSON.stringify({ targeting, location }), budget, mappedPost.mediaUrl, 'active']);
  
  res.json({ adId: result.lastID, success: true });
});

// 9. NATIVE SOCIAL SHARE
router.post('/posts/:postId/share/native', authenticateToken, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const { platform } = req.body; // 'instagram', 'tiktok'
  
  const post = await get('SELECT * FROM posts WHERE id = ?', [postId]);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  
  // In a real production app, we would use the platform's API (Graph API, TikTok API, etc.)
  // with the user's stored OAuth tokens to upload the media.
  // For this implementation, we simulate the successful trigger.
  
  console.log(`Triggering native upload for post ${postId} to ${platform}`);
  
  res.json({ 
    success: true, 
    message: `Native upload to ${platform} initiated successfully`,
    platform 
  });
});

// 10. MESSAGING
router.get('/messages/:otherUserId', authenticateToken, async (req: AuthRequest, res) => {
  const { otherUserId } = req.params;
  const messages = await all(`
    SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `, [req.user?.id, otherUserId, otherUserId, req.user?.id]);
  res.json(messages);
});

router.post('/messages', authenticateToken, async (req: AuthRequest, res) => {
  const { receiverId, content, mediaUrl, groupId } = req.body;
  const result = await run(`
    INSERT INTO messages (sender_id, receiver_id, group_id, content, media_url)
    VALUES(?,?,?,?,?)
  `, [req.user?.id, receiverId, groupId, content, mediaUrl]);
  
  const io = (req.app as any).get('io');
  if (io) {
    io.to(`user-${receiverId}`).emit('new_message', { id: result.lastID, senderId: req.user?.id, content });
  }
  
  res.json({ messageId: result.lastID });
});

// 11. GROUPS
router.get('/groups', authenticateToken, async (req: AuthRequest, res) => {
  const groups = await all(`
    SELECT g.*, (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
  `, [req.user?.id]);
  res.json(groups);
});

router.post('/groups', authenticateToken, async (req: AuthRequest, res) => {
  const { name, description, avatarUrl, isPrivate } = req.body;
  const result = await run(`
    INSERT INTO groups (name, description, avatar_url, creator_id, is_private)
    VALUES(?,?,?,?,?)
  `, [name, description, avatarUrl, req.user?.id, isPrivate ? 1 : 0]);
  
  await run(`INSERT INTO group_members (group_id, user_id, role) VALUES(?,?,?)`, [result.lastID, req.user?.id, 'admin']);
  
  res.json({ groupId: result.lastID });
});

export default router;
