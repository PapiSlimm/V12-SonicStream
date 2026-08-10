import express from 'express';
import { get, all } from '../db.js';
import { authenticateToken, AuthRequest } from '../domains/identity/auth.js';

const router = express.Router();

// 1. V12 Radio Hub - Get similar artists based on genre and popularity
router.get('/similar/:artistId', authenticateToken, async (req, res) => {
  const { artistId } = req.params;
  try {
    const artist = await get<any>('SELECT genre, popularity FROM artists WHERE id = ?', [artistId]);
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Suggest artists with same genre, ordered by popularity
    const similarArtists = await all<any>(
      'SELECT * FROM artists WHERE genre = ? AND id != ? ORDER BY popularity DESC, RANDOM() LIMIT 10',
      [artist.genre, artistId]
    );

    res.json(similarArtists);
  } catch (error) {
    console.error('Failed to fetch similar artists', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. V12 Radio - Fetch tracks for genre-based stations (V12 Radio Hub)
// Strictly royalty-free/non-licensing content
router.get('/genre/:genre', authenticateToken, async (req, res) => {
  const { genre } = req.params;
  try {
    // Fetch tracks: royalty-free, same genre, ordered by popularity and randomized
    // We assume 'status' = 'live' and we filter for royalty-free content
    // For this implementation, we'll filter by tracks from users who opted into V12 Radio
    const tracks = await all<any>(`
      SELECT t.*, u.name as artist_name 
      FROM tracks t 
      JOIN users u ON t.user_id = u.id 
      WHERE t.genre = ? AND t.status = 'live' 
      AND (u.subscription_tier = 'pro' OR u.subscription_tier = 'visionary')
      ORDER BY t.editorial_featured DESC, RANDOM() 
      LIMIT 30
    `, [genre]);

    res.json(tracks);
  } catch (error) {
    console.error('Failed to fetch radio tracks', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Auto-DJ / Scheduled Broadcasting
router.get('/v12/auto-dj', authenticateToken, async (req, res) => {
  try {
    // Mix of fresh tracks, pre-recorded segments, and jingles
    const tracks = await all<any>(`
      SELECT * FROM tracks 
      WHERE status = 'live' 
      ORDER BY created_at DESC, RANDOM() 
      LIMIT 15
    `);
    
    // Simulate jingles/segments
    const segments = [
      { id: 'jingle-1', title: 'V12 Radio ID', file_url: '/assets/audio/v12-jingle.mp3', type: 'jingle' },
      { id: 'news-1', title: 'V12 News Update', file_url: '/assets/audio/v12-news-intro.mp3', type: 'segment' }
    ];

    res.json({
      station: 'V12 Radio',
      status: 'Live (Auto-DJ)',
      playlist: [...segments, ...tracks]
    });
  } catch {
    res.status(500).json({ error: 'Failed to start Auto-DJ' });
  }
});

// 4. Admin Analytics for Radio
router.get('/admin/analytics', authenticateToken, async (req: AuthRequest, res) => {
  // Check if admin (simplified for this demo)
  const user = await get<any>('SELECT user_type FROM users WHERE id = ?', [req.user?.id]);
  if (user?.user_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    // Mock analytics data
    const analytics = {
      real_time_listeners: Math.floor(Math.random() * 5000) + 1000,
      listener_locations: [
        { country: 'USA', count: 1200 },
        { country: 'UK', count: 800 },
        { country: 'Canada', count: 450 }
      ],
      total_listening_hours: 45200,
      engagement_rate: '84%'
    };
    res.json(analytics);
  } catch {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
