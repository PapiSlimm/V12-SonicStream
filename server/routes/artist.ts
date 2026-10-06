import { Router } from 'express';
import { all, get, run } from '../db.js';
import { authenticateToken, AuthRequest, requireArtist } from '../domains/identity/auth.js';
import { ArtistAnalytics, RoyaltyStatement } from '../types.js';
import { notifyAdmins } from '../domains/social/notification.service.js';
import { AppError } from '../middleware/error.js';

const router = Router();

router.get('/profile/:id', async (req, res) => {
  const { id } = req.params;
  const userId = (req as any).user?.id;

  const artist = await get<any>(`
    SELECT a.*, u.social_links as socialLinksRaw,
    (SELECT COUNT(*) FROM followers WHERE artist_id = a.id) as followersCount
    ${userId ? `, (SELECT COUNT(*) FROM followers WHERE artist_id = a.id AND user_id = ?) as isFollowing` : ''}
    FROM artists a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `, [userId, id].filter(v => v !== undefined));

  if (!artist) {
    throw new AppError('Artist not found', 404);
  }

  if (artist.socialLinksRaw) {
    try {
      artist.socialLinks = JSON.parse(artist.socialLinksRaw);
    } catch {
      artist.socialLinks = {};
    }
  } else {
    artist.socialLinks = {};
  }

  if (artist.isFollowing !== undefined) {
    artist.isFollowing = !!artist.isFollowing;
  }

  res.json(artist);
});

router.post('/:id/follow', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    await run('INSERT INTO followers (user_id, artist_id) VALUES (?, ?)', [userId, id]);
    await run('UPDATE artists SET follower_count = follower_count + 1 WHERE id = ?', [id]);
    res.json({ success: true, following: true });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.json({ success: true, following: true });
    } else {
      throw err;
    }
  }
});

router.post('/:id/unfollow', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const result = await run('DELETE FROM followers WHERE user_id = ? AND artist_id = ?', [userId, id]);
  if ((result as any).changes > 0) {
    await run('UPDATE artists SET follower_count = MAX(0, follower_count - 1) WHERE id = ?', [id]);
  }
  
  res.json({ success: true, following: false });
});

router.get('/analytics', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const artist = await get<any>('SELECT * FROM artists WHERE user_id = ?', [req.user?.id]);
  if (!artist) throw new AppError('Artist profile not found', 404);

  const streams = await get<any>('SELECT COUNT(*) as total FROM play_history WHERE track_id IN (SELECT id FROM tracks WHERE artist_id = ?)', [artist.id]);
  const listeners = await get<any>('SELECT COUNT(DISTINCT user_id) as total FROM play_history WHERE track_id IN (SELECT id FROM tracks WHERE artist_id = ?)', [artist.id]);

  const analytics: ArtistAnalytics = {
    totalStreams: streams?.total || 0,
    monthlyListeners: listeners?.total || 0,
    revenue: artist.revenueBreakdown ? artist.revenueBreakdown : {
      total: 0,
      artistShare: 0,
      v12Share: 0
    },
    demographics: artist.demographics ? artist.demographics : {
      ageGroups: {},
      topCountries: []
    },
    platformDistribution: [
      { name: 'Spotify', streams: Math.floor((streams?.total || 0) * 0.3) },
      { name: 'Apple Music', streams: Math.floor((streams?.total || 0) * 0.2) },
      { name: 'SonicStream', streams: Math.floor((streams?.total || 0) * 0.5) }
    ]
  };
  res.json(analytics);
});

router.get('/earnings', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const user = await get<{balance: number, payoutThreshold: number, autoPayout: number}>('SELECT balance, payout_threshold, auto_payout FROM users WHERE id = ?', [req.user?.id]);
  const royalties = await all<RoyaltyStatement>('SELECT * FROM royalty_statements WHERE user_id = ? ORDER BY created_at DESC', [req.user?.id]);
  const payouts = await all<UserPayoutRequest>('SELECT * FROM payouts WHERE user_id = ? ORDER BY requested_at DESC', [req.user?.id]);
  
  res.json({
    balance: user?.balance || 0,
    threshold: user?.payoutThreshold || 50,
    autoPayout: !!user?.autoPayout,
    royalties,
    payouts
  });
});

router.post('/withdraw', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { amount, method } = req.body;
  const user = await get<{balance: number}>('SELECT balance FROM users WHERE id = ?', [req.user?.id]);
  
  if (!user || user.balance < amount) {
    throw new AppError('Insufficient balance', 400);
  }

  const result = await run(
    'INSERT INTO payouts (user_id, amount, method, status) VALUES (?, ?, ?, ?)',
    [req.user?.id, amount, method, 'pending']
  );

  await run('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, req.user?.id]);

  // Notify admins
  await notifyAdmins('payout_request', `New payout request: $${amount} from ${req.user?.name}`);

  res.json({ success: true, payoutId: result.lastID });
});

router.get('/availability', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const availability = await all('SELECT * FROM artist_availability WHERE artist_id = ?', [req.user?.id]);
  res.json(availability);
});

router.post('/availability', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { slots } = req.body; // Array of { dayOfWeek, startTime, endTime }
  
  await run('DELETE FROM artist_availability WHERE artist_id = ?', [req.user?.id]);
  
  if (slots && Array.isArray(slots)) {
    for (const slot of slots) {
      await run(
        'INSERT INTO artist_availability (artist_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)',
        [req.user?.id, slot.dayOfWeek, slot.startTime, slot.endTime]
      );
    }
  }
  
  res.json({ success: true });
});

router.get('/events', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const artist = await get<any>('SELECT id FROM artists WHERE user_id = ?', [req.user?.id]);
  if (!artist) throw new AppError('Artist profile not found', 404);
  
  const events = await all('SELECT * FROM events WHERE artist_id = ? ORDER BY date ASC', [artist.id]);
  res.json(events);
});

router.post('/events', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const artist = await get<any>('SELECT id FROM artists WHERE user_id = ?', [req.user?.id]);
  if (!artist) throw new AppError('Artist profile not found', 404);

  const { title, description, date, venue, city, price, ticketsAvailable, imageUrl, genre } = req.body;
  
  const result = await run(`
    INSERT INTO events (artist_id, title, description, date, venue, city, price, tickets_available, image_url, genre)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [artist.id, title, description, date, venue, city, price, ticketsAvailable, imageUrl, genre]);

  res.json({ success: true, id: result.lastID });
});

router.put('/events/:id', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const artist = await get<any>('SELECT id FROM artists WHERE user_id = ?', [req.user?.id]);
  if (!artist) throw new AppError('Artist profile not found', 404);

  // Validate ownership
  const event = await get<any>('SELECT * FROM events WHERE id = ? AND artist_id = ?', [id, artist.id]);
  if (!event) throw new AppError('Event not found or unauthorized', 404);

  const { title, description, date, venue, city, price, ticketsAvailable, imageUrl, genre } = req.body;
  
  await run(`
    UPDATE events 
    SET title = ?, description = ?, date = ?, venue = ?, city = ?, price = ?, tickets_available = ?, image_url = ?, genre = ?
    WHERE id = ? AND artist_id = ?
  `, [title, description, date, venue, city, price, ticketsAvailable, imageUrl, genre, id, artist.id]);

  res.json({ success: true });
});

router.delete('/events/:id', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const artist = await get<any>('SELECT id FROM artists WHERE user_id = ?', [req.user?.id]);
  if (!artist) throw new AppError('Artist profile not found', 404);

  // Validate ownership
  const event = await get<any>('SELECT * FROM events WHERE id = ? AND artist_id = ?', [id, artist.id]);
  if (!event) throw new AppError('Event not found or unauthorized', 404);

  await run('DELETE FROM events WHERE id = ? AND artist_id = ?', [id, artist.id]);
  res.json({ success: true });
});

router.post('/follow/:artistId', authenticateToken, async (req: AuthRequest, res) => {
  const { artistId } = req.params;
  
  try {
    await run('INSERT INTO followers (user_id, artist_id) VALUES (?, ?)', [req.user?.id, artistId]);
    await run('UPDATE artists SET follower_count = follower_count + 1 WHERE id = ?', [artistId]);
    res.json({ success: true, following: true });
  } catch {
    // If already following, unfollow
    await run('DELETE FROM followers WHERE user_id = ? AND artist_id = ?', [req.user?.id, artistId]);
    await run('UPDATE artists SET follower_count = follower_count - 1 WHERE id = ?', [artistId]);
    res.json({ success: true, following: false });
  }
});

router.post('/site-builder', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { subdomain, theme, layout, components } = req.body;
  
  const artist = await get<any>('SELECT id FROM artists WHERE user_id = ?', [req.user?.id]);
  if (!artist) throw new AppError('Artist profile not found', 404);
  
  // Check if subdomain is taken
  const existing = await get<any>('SELECT id FROM artist_sites WHERE subdomain = ? AND artist_id != ?', [subdomain, artist.id]);
  if (existing) throw new AppError('Subdomain already taken', 400);
  
  const site = await get<any>('SELECT id FROM artist_sites WHERE artist_id = ?', [artist.id]);
  
  if (site) {
    await run(`
      UPDATE artist_sites 
      SET subdomain = ?, theme = ?, layout = ?, components = ?
      WHERE artist_id = ?
    `, [subdomain, theme, JSON.stringify(layout), JSON.stringify(components), artist.id]);
  } else {
    await run(`
      INSERT INTO artist_sites (artist_id, subdomain, theme, layout, components)
      VALUES (?, ?, ?, ?, ?)
    `, [artist.id, subdomain, theme, JSON.stringify(layout), JSON.stringify(components)]);
  }
  
  res.json({ success: true });
});

router.get('/site/:subdomain', async (req, res) => {
  const { subdomain } = req.params;
  const site = await get<any>('SELECT * FROM artist_sites WHERE subdomain = ?', [subdomain]);
  if (!site) throw new AppError('Site not found', 404);
  
  const artist = await get<any>('SELECT * FROM artists WHERE id = ?', [site.artistId]);
  res.json({ site, artist });
});

router.get('/vfx-projects', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const projects = await all('SELECT * FROM vfx_projects WHERE user_id = ? ORDER BY created_at DESC', [req.user?.id]);
  res.json(projects);
});

router.post('/approve-render', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { projectId } = req.body;
  
  const project = await get<any>('SELECT * FROM vfx_projects WHERE id = ? AND user_id = ?', [projectId, req.user?.id]);
  if (!project) throw new AppError('Project not found', 404);
  
  await run('UPDATE vfx_projects SET status = ? WHERE id = ?', ['approved', projectId]);
  
  // Notify admins for final delivery
  await notifyAdmins('vfx_approval', `Artist ${req.user?.name} approved VFX project #${projectId}`);
  
  res.json({ success: true });
});

router.put('/profile', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { name, bio, socialLinks, preferredGenres, avatarUrl } = req.body;
  
  await run(`
    UPDATE users 
    SET name = ?, bio = ?, social_links = ?, preferred_genres = ?, avatar_url = ?
    WHERE id = ?
  `, [name, bio, JSON.stringify(socialLinks), JSON.stringify(preferredGenres), avatarUrl, req.user?.id]);
  
  // Also update artist table if exists
  await run('UPDATE artists SET name = ?, bio = ?, image_url = ? WHERE user_id = ?', [name, bio, avatarUrl, req.user?.id]);
  
  res.json({ success: true });
});

router.get('/events/:id/stats', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const artist = await get<any>('SELECT id FROM artists WHERE user_id = ?', [req.user?.id]);
  if (!artist) throw new AppError('Artist profile not found', 404);
  
  const event = await get<any>('SELECT * FROM events WHERE id = ? AND artist_id = ?', [id, artist.id]);
  if (!event) throw new AppError('Event not found', 404);
  
  const stats = await get<any>(`
    SELECT 
      COUNT(*) as totalTicketsSold,
      SUM(amount) as totalRevenue,
      COUNT(DISTINCT user_id) as uniqueAttendees
    FROM event_sales 
    WHERE event_id = ?
  `, [id]);
  
  res.json({
    eventTitle: event.title,
    ticketsAvailable: event.ticketsAvailable,
    ...stats
  });
});

router.post('/verify', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { idUrl, socialLinks } = req.body;
  
  await run(`
    INSERT INTO artist_verifications (user_id, id_url, social_links, status)
    VALUES (?, ?, ?, ?)
  `, [req.user?.id, idUrl, JSON.stringify(socialLinks), 'pending']);
  
  await notifyAdmins('artist_verification', `New verification request from ${req.user?.name}`);
  
  res.json({ success: true });
});

router.get('/delivery-status', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const jobs = await all<any>(`
    SELECT dj.*, t.title as track_title 
    FROM delivery_jobs dj 
    JOIN tracks t ON dj.track_id = t.id 
    WHERE t.user_id = ? 
    ORDER BY dj.created_at DESC
  `, [req.user?.id]);
  res.json(jobs);
});

export default router;
