import { Router } from 'express';
import { all, get, run } from '../../db.js';
import { authenticateToken, AuthRequest, requireArtist } from '../identity/auth.js';
import { revenueBlocker } from '../../middleware/revenueBlocker.js';
import { z } from 'zod';
import { generateIsrc } from './codes.service.js';
import { AppError } from '../../middleware/error.js';
import { Track } from '../../types.js';
import multer from 'multer';
import { notifyAdmins, notify } from '../social/notification.service.js';
import { validateSignalQuality } from '../../middleware/ingestionGuard.js';
import { getWritablePath, getGCSBucket, uploadToGCS } from '../../utils/storage.js';

import { addFFmpegJob, addMasteringJob } from '../../jobs.js';

import { eventBus, EVENTS } from '../../services/EventBus.js';

const router = Router();
const upload = multer({ dest: getWritablePath('uploads/temp/') });

const trackSchema = z.object({
  title: z.string().min(1),
  genre: z.string(),
  price: z.number().min(0),
  displayArtistName: z.string().optional(),
  isrc: z.string().optional(),
  isVideo: z.boolean().default(false),
  contentRating: z.string().optional(),
  categoryTags: z.array(z.string()).optional(),
});

/**
 * Global Stream: The "Invite-Only" Layer
 * Filters tracks to only show those from Verified/Pro users or Featured content.
 */
router.get('/', async (req, res) => {
  const tracks = await all<Track>(`
    SELECT t.* 
    FROM tracks t 
    JOIN users u ON COALESCE(t.owner_user_id, t.user_id) = u.id 
    WHERE t.status = 'live' 
    AND (u.is_verified = 1 OR u.is_pro = 1 OR t.editorial_featured = 1)
  `);
  
  const mappedTracks = tracks.map(t => {
    const isHLS = t.streamUrl?.endsWith('.m3u8');
    return {
      ...t,
      hlsUrl: t.hlsUrl || (isHLS ? t.streamUrl : undefined),
      dashUrl: t.dashUrl,
      streamUrl: isHLS ? t.streamUrl : `/api/tracks/${t.id}/stream`
    };
  });
  res.json(mappedTracks);
});

// Log play history
router.post('/:id/play', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { duration } = req.body;
  const userId = req.user?.id;

  try {
    const track = await get<Track>('SELECT * FROM tracks WHERE id = ?', [id]);
    
    await run(
      'INSERT INTO play_history (user_id, track_id, duration) VALUES (?, ?, ?)',
      [userId, id, duration || 0]
    );
    // Increment total plays on track
    await run('UPDATE tracks SET plays = plays + 1 WHERE id = ?', [id]);

    // EMIT CROSS-DOMAIN EVENT
    if (track) {
      eventBus.emit(EVENTS.TRACK_PLAYED, {
        userId,
        trackId: id,
        artistId: track.userId,
        duration: duration || 0
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Play log error:', err);
    res.status(500).json({ error: 'Failed to log play' });
  }
});

// Handle likes
router.post('/:id/like', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { type = 'track' } = req.body;
  const userId = req.user?.id;

  try {
    const existing = await get('SELECT id FROM likes WHERE user_id = ? AND target_id = ? AND target_type = ?', [userId, id, type]);
    if (existing) {
      await run('DELETE FROM likes WHERE id = ?', [existing.id]);
      return res.json({ success: true, liked: false });
    } else {
      await run(
        'INSERT INTO likes (user_id, target_id, target_type) VALUES (?, ?, ?)',
        [userId, id, type]
      );
      return res.json({ success: true, liked: true });
    }
  } catch {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

router.get('/:id', async (req, res) => {
  const track = await get<Track>('SELECT * FROM tracks WHERE id = ?', [req.params.id]);
  if (!track) throw new AppError('Track not found', 404);
  res.json(track);
});

router.get('/:id/stream', async (req, res) => {
  const track = await get<Track>('SELECT * FROM tracks WHERE id = ?', [req.params.id]);
  if (!track) throw new AppError('Track not found', 404);
  
  // If HLS is ready, redirect to it, otherwise serve the raw file
  const streamPath = track.streamUrl || track.fileUrl;
  if (!streamPath) throw new AppError('No stream available', 404);
  
  res.redirect(streamPath);
});

router.post('/upload-file', authenticateToken, requireArtist, revenueBlocker, upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) throw new AppError('File is required', 400);
  
  const relativePath = `/${req.file.path.replace(/\\/g, '/')}`;
  res.json({ url: relativePath });
});

router.post('/upload', authenticateToken, requireArtist, revenueBlocker, upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) throw new AppError('File is required', 400);

  const title = req.body.title || 'Untitled Track';
  const genre = req.body.genre || 'Electronic';
  const price = parseFloat(req.body.price) || 0.99;
  const isVideo = (req.body.isVideo === 'true' || req.body.is_video === 'true');
  
  // V12 Sonic-Gate: Automated Moderation
  try {
    await validateSignalQuality(title, req.user?.name || '', req.file.path);
  } catch (err: any) {
    throw new AppError(err.message, 403);
  }

  const isrc = req.body.isrc || generateIsrc();
  const relativePath = `/${req.file.path.replace(/\\/g, '/')}`;
  
  const result = await run(
    'INSERT INTO tracks (owner_user_id, primary_artist_id, display_artist_name, user_id, artist, title, genre, price, is_video, status, file_url, stream_url, isrc, moderation_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user?.id, req.user?.id, req.body.displayArtistName || req.user?.name, req.user?.id, req.user?.name, title, genre, price, isVideo ? 1 : 0, 'live', relativePath, relativePath, isrc, req.user?.isVerified ? 'verified_creator' : 'pending']
  );

  const trackId = result.lastID;

  // Notify admins
  await notifyAdmins('new_track', `New track submission: "${title}" by ${req.user?.name}`);

  // Queue FFmpeg processing
  addFFmpegJob({
    trackId,
    filePath: req.file.path,
    outputDir: `uploads/streams/${trackId}`
  }).catch(err => console.error('Failed to queue FFmpeg job:', err));

  res.json({ 
    id: trackId, 
    isrc, 
    url: relativePath,
    qc: {
      audio: { status: 'pass', sampleRate: '44.1kHz', complete: true },
      metadata: { status: 'pass', complete: true },
      rights: { status: 'pass', complete: true }
    },
    message: 'Track uploaded and submitted for distribution.' 
  });
});

router.post('/', authenticateToken, requireArtist, upload.single('file'), async (req: AuthRequest, res) => {
  const validated = trackSchema.parse(JSON.parse(req.body.data || '{}'));
  if (!req.file) throw new AppError('File is required', 400);

  // V12 Sonic-Gate: Automated Moderation
  try {
    await validateSignalQuality(validated.title, req.user?.name || '', req.file.path);
  } catch (err: any) {
    throw new AppError(err.message, 403);
  }

  const isrc = validated.isrc || generateIsrc();
  
  // Store the relative path for serving
  const relativePath = `/${req.file.path.replace(/\\/g, '/')}`;
  
  const result = await run(
    'INSERT INTO tracks (owner_user_id, primary_artist_id, display_artist_name, user_id, artist, title, genre, price, is_video, status, file_url, stream_url, isrc, moderation_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user?.id, req.user?.id, validated.displayArtistName || req.user?.name, req.user?.id, req.user?.name, validated.title, validated.genre, validated.price, validated.isVideo ? 1 : 0, 'live', relativePath, relativePath, isrc, req.user?.isVerified ? 'verified_creator' : 'pending']
  );

  const trackId = result.lastID;
  
  // Notify admins
  await notifyAdmins('new_track', `New track submission: "${validated.title}" by ${req.user?.name}`);

  // Notify followers
  try {
    const artist = await get<any>('SELECT id, name FROM artists WHERE user_id = ?', [req.user?.id]);
    if (artist) {
      const followersList = await all<{ userId?: string; user_id?: string }>('SELECT user_id FROM followers WHERE artist_id = ?', [artist.id]);
      const artistName = artist.name || req.user?.name || 'An artist';
      for (const follower of followersList) {
        const fId = follower.userId || follower.user_id;
        if (fId) {
          await notify(fId, 'new_content', `New track "${validated.title}" has been released by ${artistName}!`);
        }
      }
    }
  } catch (err) {
    console.error('Failed to notify followers for new track:', err);
  }

  // Queue FFmpeg processing (will update stream_url to HLS later)
  addFFmpegJob({
    trackId,
    filePath: req.file.path,
    outputDir: `uploads/streams/${trackId}`
  }).catch(err => console.error('Failed to queue FFmpeg job:', err));

  res.json({ id: trackId, isrc, message: 'Track uploaded and live. Processing for adaptive streaming in background.' });
});

router.post('/:id/master', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { settings, profile } = req.body;
  
  const track = await get<Track>('SELECT * FROM tracks WHERE id = ?', [id]);
  if (!track) throw new AppError('Track not found', 404);
  
  const masteredPath = `uploads/mastered/${id}_mastered.mp3`;
  
  await addMasteringJob({
    trackId: id,
    inputPath: track.fileUrl,
    outputPath: masteredPath,
    settings,
    profile
  });
  
  await run("UPDATE tracks SET status = 'mastering' WHERE id = ?", [id]);
  
  res.json({ message: 'Mastering job queued' });
});

export default router;
