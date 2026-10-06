import { Router } from 'express';
import { get, all, run } from '../db.js';
import { authenticateToken, AuthRequest } from '../domains/identity/auth.js';
import { AppError } from '../middleware/error.js';
import { Track } from '../types.js';

const router = Router();

// "OnesToWatch" weekly curation
router.get('/ones-to-watch', async (req, res) => {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week
  
  const hotTracks = await all<Track & { artist_name: string, artist_avatar: string }>(
    `SELECT t.*, u.name as artist_name, u.avatar as artist_avatar 
     FROM tracks t 
     JOIN users u ON t.user_id = u.id 
     WHERE t.created_at >= ? AND t.plays >= 100 
     ORDER BY t.plays DESC LIMIT 20`,
    [weekStart.toISOString()]
  );
  
  res.json({ 
    title: `OnesToWatch • Week of ${weekStart.toLocaleDateString()}`,
    tracks: hotTracks,
    totalPlays: hotTracks.reduce((sum, t) => sum + (t.plays || 0), 0)
  });
});

// Artist application for editorial playlist
router.post('/apply-curation', authenticateToken, async (req: AuthRequest, res) => {
  const { trackId, pitch } = req.body;
  
  if (!trackId || !pitch) {
    throw new AppError('Track ID and pitch are required', 400);
  }

  const track = await get<Track>('SELECT * FROM tracks WHERE id = ? AND user_id = ?', [trackId, req.user?.id]);
  
  if (!track) {
    throw new AppError('Track not found or access denied', 404);
  }

  // Auto-approval for high engagement
  if ((track.plays || 0) > 500 || (track.likes || 0) > 50) {
    await run('UPDATE tracks SET editorial_featured = 1 WHERE id = ?', [trackId]);
    return res.json({ approved: true, featuredOn: 'OnesToWatch Weekly' });
  }
  
  // Queue for manual review
  await run(
    'INSERT INTO curation_applications (track_id, user_id, pitch, status) VALUES (?, ?, ?, ?)',
    [trackId, req.user?.id, pitch, 'pending']
  );
  
  res.json({ 
    status: 'submitted', 
    message: 'Under review. High engagement = auto-approval.' 
  });
});

export default router;
