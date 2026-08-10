import { Router } from 'express';
import { all, run, get } from '../db.js';
import { authenticateToken, AuthRequest } from '../domains/identity/auth.js';
import { AppError } from '../middleware/error.js';
import { refreshRSSFeeds } from '../services/rssService.js';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Generate/refresh feeds dynamically so they are automated daily
    await refreshRSSFeeds();
    const feeds = await all('SELECT * FROM rss_feeds ORDER BY created_at DESC LIMIT 100');
    res.json(feeds);
  } catch (err) {
    console.error('Error fetching RSS feeds:', err);
    res.status(500).json({ error: 'Failed to fetch RSS feeds' });
  }
});

router.post('/product', authenticateToken, async (req: AuthRequest, res) => {
  const { title, content, price = 0, productLink, mediaUrl } = req.body;
  try {
    // 1. Insert into rss_feeds (News Wall)
    await run(`
      INSERT INTO rss_feeds (title, content, type, category, media_url)
      VALUES (?, ?, 'product', 'New Merch', ?)
    `, [`New Product For Sale: ${title}`, `${content} — Available in Marketplace for $${price}!`, mediaUrl || null]);

    // 2. Insert into social posts feed
    await run(`
      INSERT INTO posts (user_id, content, media_url, type, is_promotion, price, product_link, subscription_tier_requirement)
      VALUES (?, ?, ?, 'product', 0, ?, ?, 'everyone')
    `, [
      req.user?.id, 
      `Check out my brand new product for sale!\n\n**${title}**\nPrice: $${price}\n\n${content}`, 
      mediaUrl || null, 
      price, 
      productLink || null
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error posting product to news wall:', err);
    res.status(500).json({ error: 'Failed to cross-post product to news wall' });
  }
});

router.post('/share', authenticateToken, async (req: AuthRequest, res) => {
  const { feedId } = req.body;
  
  try {
    const feed = await get<any>('SELECT * FROM rss_feeds WHERE id = ?', [feedId]);
    if (!feed) throw new AppError('Feed not found', 404);

    // Share to internal social feed (posts table)
    await run(`
      INSERT INTO posts (user_id, content, media_url, type)
      VALUES (?, ?, ?, ?)
    `, [req.user?.id, `Check out this news: ${feed.title}\n\n${feed.content}`, feed.media_url, 'text']);

    res.json({ success: true });
  } catch (err) {
    console.error('Error sharing RSS feed:', err);
    if (err instanceof AppError) throw err;
    res.status(500).json({ error: 'Failed to share RSS feed' });
  }
});

export default router;
