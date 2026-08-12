import express from 'express';
import { get, all } from '../db.js';
import { authenticateToken, authenticateAdmin, AuthRequest } from '../domains/identity/auth.js';
import {
  stationNow, stationTracks, castVote, requestTrack,
  realAnalytics, settleRoyalties, hostBreak, listeners,
} from '../services/RadioEngine.js';
import { TOP_20_GENRES } from '../services/Monetization.core.js';

const router = express.Router();

/**
 * V12 RADIO — synchronized broadcast.
 *
 * /now-playing is a pure function of the clock: every listener asking at the
 * same second gets the same track at the same offset. Votes and requests
 * reshape tomorrow's (and today's) rotation deterministically; heartbeats
 * drive real analytics and per-artist airplay royalties; the AI host reads
 * the ecosystem wire between tracks; the hourly now-playing syndicates to
 * Sociofy, SonicWave and every configured peer.
 */

// ── Live broadcast ──────────────────────────────────────────────────────────

router.get('/stations', authenticateToken, async (_req, res) => {
  try {
    // The top 20 genres are ALWAYS on the dial; catalog genres beyond them append.
    const genres = await all<any>(`SELECT DISTINCT genre, COUNT(*) as n FROM tracks WHERE status = 'live' AND genre IS NOT NULL GROUP BY genre`, []);
    const catalog = new Map(genres.map((g: any) => [String(g.genre).toLowerCase(), Number(g.n) || 0]));
    const extra = [...catalog.keys()].filter((g) => !(TOP_20_GENRES as readonly string[]).includes(g));
    const now = Math.floor(Date.now() / 1000);
    const stations = ['all', ...TOP_20_GENRES, ...extra];
    res.json({
      stations: stations.map((s) => ({
        id: s,
        name: s === 'all' ? 'V12 Radio One' : `V12 ${s.replace(/\b\w/g, (c) => c.toUpperCase())}`,
        listeners: listeners.activeListeners(s, now),
        tracksLive: s === 'all' ? [...catalog.values()].reduce((a, b) => a + b, 0) : (catalog.get(s) ?? 0),
        onAir: s === 'all' ? catalog.size > 0 : (catalog.get(s) ?? 0) > 0,
      })),
    });
  } catch {
    res.status(500).json({ error: 'Failed to list stations' });
  }
});

router.get('/:station/now-playing', authenticateToken, async (req, res) => {
  try {
    const now = await stationNow(String(req.params.station));
    if (!now) return res.status(404).json({ error: 'No live tracks on this station yet.' });
    res.json({
      station: now.station,
      live: true,
      daypart: now.daypart,
      listeners: now.listeners,
      track: now.track,
      offsetSeconds: now.offsetSeconds,
      endsAtEpochSec: now.endsAtEpochSec,
      next: now.next,
      serverEpochSec: Math.floor(Date.now() / 1000), // client drift correction
    });
  } catch (err) {
    console.error('[radio] now-playing failed:', err);
    res.status(500).json({ error: 'Now-playing unavailable' });
  }
});

// ── Listener sessions (real analytics + airplay accrual) ───────────────────

router.post('/session/ping', authenticateToken, async (req: AuthRequest, res) => {
  const { sessionId, station, trackId, artistUserId } = req.body ?? {};
  if (typeof sessionId !== 'string' || typeof station !== 'string') {
    return res.status(400).json({ error: 'sessionId and station are required' });
  }
  listeners.ping({
    sessionId, station,
    userId: req.user?.id,
    trackId: typeof trackId === 'string' ? trackId : undefined,
    artistUserId: typeof artistUserId === 'string' ? artistUserId : undefined,
    at: Math.floor(Date.now() / 1000),
  });
  res.json({ ok: true, listeners: listeners.activeListeners(station, Math.floor(Date.now() / 1000)) });
});

router.post('/session/stop', authenticateToken, (req, res) => {
  const { sessionId } = req.body ?? {};
  if (typeof sessionId === 'string') listeners.stop(sessionId);
  res.json({ ok: true });
});

// ── Listener influence ──────────────────────────────────────────────────────

router.post('/track/:trackId/vote', authenticateToken, async (req: AuthRequest, res) => {
  const vote = req.body?.vote;
  if (vote !== 'love' && vote !== 'skip') return res.status(400).json({ error: 'vote must be "love" or "skip"' });
  try {
    await castVote(req.user!.id, String(req.params.trackId), vote);
    res.json({ ok: true, effect: vote === 'love' ? 'This track rises in rotation.' : 'This track sinks in rotation.' });
  } catch {
    res.status(500).json({ error: 'Vote failed' });
  }
});

router.post('/request', authenticateToken, async (req: AuthRequest, res) => {
  const { station, trackId } = req.body ?? {};
  if (typeof station !== 'string' || typeof trackId !== 'string') {
    return res.status(400).json({ error: 'station and trackId are required' });
  }
  try {
    await requestTrack(req.user!.id, station, trackId);
    res.json({ ok: true, effect: 'Requested — top requests take every 4th rotation slot for 24h.' });
  } catch {
    res.status(500).json({ error: 'Request failed' });
  }
});

// ── AI host ─────────────────────────────────────────────────────────────────

router.get('/:station/host-break', authenticateToken, async (req, res) => {
  try {
    res.json(await hostBreak(String(req.params.station)));
  } catch {
    res.status(500).json({ error: 'Host is off-mic' });
  }
});

// ── Admin: real analytics + royalty settlement ─────────────────────────────

router.get('/admin/analytics', authenticateAdmin, async (_req, res) => {
  try {
    res.json(await realAnalytics());
  } catch {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.post('/admin/royalties/settle', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    res.json(await settleRoyalties(req.user!.id));
  } catch (err) {
    console.error('[radio] settlement failed:', err);
    res.status(500).json({ error: 'Settlement failed — nothing was posted (ledger transactions are atomic).' });
  }
});

// ── Legacy endpoints (kept for existing clients) ────────────────────────────

router.get('/similar/:artistId', authenticateToken, async (req, res) => {
  const { artistId } = req.params;
  try {
    const artist = await get<any>('SELECT genre, popularity FROM artists WHERE id = ?', [artistId]);
    if (!artist) return res.status(404).json({ error: 'Artist not found' });
    const similarArtists = await all<any>(
      'SELECT * FROM artists WHERE genre = ? AND id != ? ORDER BY popularity DESC, RANDOM() LIMIT 10',
      [artist.genre, artistId],
    );
    res.json(similarArtists);
  } catch (error) {
    console.error('Failed to fetch similar artists', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/genre/:genre', authenticateToken, async (req, res) => {
  try {
    res.json(await stationTracks(String(req.params.genre)));
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/v12/auto-dj', authenticateToken, async (_req, res) => {
  // Legacy shape, now backed by the synchronized engine.
  try {
    const now = await stationNow('all');
    if (!now) return res.json({ station: 'V12 Radio', status: 'Off Air', playlist: [] });
    res.json({
      station: 'V12 Radio',
      status: `Live (synchronized) — ${now.listeners} listening`,
      playlist: [now.track, ...(now.next ? [now.next] : [])],
    });
  } catch {
    res.status(500).json({ error: 'Failed to start Auto-DJ' });
  }
});

export default router;
