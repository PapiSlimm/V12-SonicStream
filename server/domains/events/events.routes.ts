/**
 * Events routes — 2026-10-08 FULL REWRITE.
 * Previously every handler read/wrote Firestore (suspended GCP project), so
 * the whole events system was dead in production. Now backed by the platform's
 * own `events` table (shared DB — no external service in the path).
 */
import { Router } from 'express';
import { authenticateToken, AuthRequest, requireArtist } from '../identity/auth.js';
import { AppError } from '../../middleware/error.js';
import { notify, notifyAdmins } from '../social/notification.service.js';
import { all, get, run } from '../../db.js';

const router = Router();

/* ── GET /api/events — public listing ──────────────────────────────────── */
router.get('/', async (_req, res) => {
  const events = await all('SELECT * FROM events ORDER BY date ASC').catch(() => []);
  res.json(events || []);
});

/* ── GET /api/events/mine — the signed-in creator's events ─────────────── */
router.get('/mine', authenticateToken, async (req: AuthRequest, res) => {
  const events = await all(
    'SELECT * FROM events WHERE organizer_id = ? ORDER BY date ASC', [req.user?.id]
  ).catch(() => []);
  res.json(events || []);
});

/* ── POST /api/events — create ─────────────────────────────────────────── */
router.post('/', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const { title, description, date, venue, city, price, ticketsAvailable, artistName, imageUrl, genre } = req.body || {};
  if (!title) throw new AppError('title is required', 400);

  const r = await run(
    `INSERT INTO events (title, description, date, venue, city, price, tickets_available, image_url, genre, organizer_id, artist_name, status, is_live)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', 0)`,
    [String(title).slice(0, 200), description || null, date || null, venue || null, city || null,
     price ?? null, ticketsAvailable ?? null, imageUrl || null, genre || null,
     req.user?.id, artistName || null]
  );
  const event = await get('SELECT * FROM events WHERE id = ?', [r.lastID]);
  res.json(event);
});

/* ── PUT /api/events/:id — update own event ────────────────────────────── */
router.put('/:id', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const ev = await get<any>('SELECT * FROM events WHERE id = ?', [req.params.id]);
  if (!ev) throw new AppError('Event not found', 404);
  if (ev.organizerId !== req.user?.id) throw new AppError('Unauthorized', 403);

  const { title, description, date, venue, city, price, ticketsAvailable, imageUrl, genre, status } = req.body || {};
  await run(
    `UPDATE events SET title = ?, description = ?, date = ?, venue = ?, city = ?,
       price = ?, tickets_available = ?, image_url = ?, genre = ?, status = ?
     WHERE id = ?`,
    [title ?? ev.title, description ?? ev.description, date ?? ev.date, venue ?? ev.venue,
     city ?? ev.city, price ?? ev.price, ticketsAvailable ?? ev.ticketsAvailable,
     imageUrl ?? ev.imageUrl, genre ?? ev.genre, status ?? ev.status, req.params.id]
  );
  res.json(await get('SELECT * FROM events WHERE id = ?', [req.params.id]));
});

/* ── DELETE /api/events/:id — delete own event ─────────────────────────── */
router.delete('/:id', authenticateToken, requireArtist, async (req: AuthRequest, res) => {
  const ev = await get<any>('SELECT * FROM events WHERE id = ?', [req.params.id]);
  if (!ev) throw new AppError('Event not found', 404);
  if (ev.organizerId !== req.user?.id) throw new AppError('Unauthorized', 403);
  await run('DELETE FROM events WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

/* ── POST /api/events/:id/go-live — flip live + notify ─────────────────── */
router.post('/:id/go-live', authenticateToken, async (req: AuthRequest, res) => {
  const ev = await get<any>('SELECT * FROM events WHERE id = ?', [req.params.id]);
  if (!ev) throw new AppError('Event not found', 404);
  const eventTitle = ev.title || 'Live Music Showcase';

  await run("UPDATE events SET is_live = 1, status = 'live' WHERE id = ?", [req.params.id]);

  // Push notifications to all platform users (shared DB, no Firestore).
  try {
    const users = await all<{ id: string }>('SELECT id FROM users');
    for (const usr of users) {
      await notify(usr.id as any, 'event_go_live',
        `The event "${eventTitle}" is now LIVE! Engage with attendees in the real-time stream broadcast now!`);
    }
  } catch (err) {
    console.error('Error sending go-live notifications:', err);
  }

  try {
    await notifyAdmins('event_live_broadcast', `The event "${eventTitle}" (ID: ${req.params.id}) is now broadcasting live.`);
  } catch (err) {
    console.error('Error notifying admins about live event:', err);
  }

  const io = req.app.get('socketio');
  if (io) {
    io.to(String(req.params.id)).emit('event-went-live', { eventId: req.params.id, title: eventTitle });
    io.emit('global-notification', {
      type: 'event_go_live',
      message: `The event "${eventTitle}" is now LIVE! Broadcast stream is running.`,
      eventId: req.params.id
    });
  }

  res.json({ success: true, message: 'Event went live and attendees have been notified successfully.' });
});

export default router;
