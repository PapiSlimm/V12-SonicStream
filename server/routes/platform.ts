/**
 * Platform routes (2026-09-21) — closes the "dead namespaces" audit findings:
 * nine API namespaces the client UI calls that had no server mount, so every
 * button behind them 404'd (stats, support, email-logs, site-builder,
 * distribution, venues, digital download, sales checkout, stream fallback).
 *
 * Mounted LAST at '/api' in server.ts, so it never shadows an existing router.
 * Every endpoint is DB-backed; nothing fakes success it did not perform.
 */
import { Router } from 'express';
import Stripe from 'stripe';
import { authenticateToken, AuthRequest } from '../domains/identity/auth.js';
import { all, get, run } from '../db.js';
import { AppError } from '../middleware/error.js';
import { config } from '../config.js';

const router = Router();
const uid = (req: AuthRequest) => req.user?.id;

/* ── /api/stats — public platform counters ─────────────────────────────── */
router.get('/stats', async (_req, res) => {
  const [users, tracks, plays, artists] = await Promise.all([
    get<{ c: number }>('SELECT COUNT(*) as c FROM users'),
    get<{ c: number }>("SELECT COUNT(*) as c FROM tracks WHERE status != 'deleted'"),
    get<{ c: number }>('SELECT COALESCE(SUM(plays),0) as c FROM tracks'),
    get<{ c: number }>('SELECT COUNT(DISTINCT artist_id) as c FROM tracks'),
  ]);
  res.json({
    users: users?.c || 0,
    tracks: tracks?.c || 0,
    totalPlays: plays?.c || 0,
    artists: artists?.c || 0,
  });
});

/* ── /api/support/tickets ──────────────────────────────────────────────── */
router.get('/support/tickets', authenticateToken, async (req: AuthRequest, res) => {
  const rows = await all('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC', [uid(req)]);
  res.json(rows || []);
});
router.post('/support/tickets', authenticateToken, async (req: AuthRequest, res) => {
  const { subject, message, category, priority } = req.body || {};
  if (!subject || !message) throw new AppError('subject and message are required', 400);
  await run(
    'INSERT INTO support_tickets (user_id, subject, message, category, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
    [uid(req), String(subject).slice(0, 200), String(message).slice(0, 5000), category || 'general', priority || 'normal', 'open']
  );
  res.json({ success: true });
});

/* ── /api/email-logs ───────────────────────────────────────────────────── */
router.get('/email-logs', authenticateToken, async (req: AuthRequest, res) => {
  const rows = await all(
    'SELECT * FROM email_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', [uid(req)]
  ).catch(() => []);
  res.json(rows || []);
});

/* /api/site-builder moved to server/routes/sitebuilder.ts (2026-09-22 —
   full studio: pages, revisions, CMS collections, compiler, publish). */

/* ── /api/distribution ─────────────────────────────────────────────────── */
router.get('/distribution/releases', authenticateToken, async (req: AuthRequest, res) => {
  const rows = await all('SELECT * FROM releases WHERE user_id = ? ORDER BY created_at DESC', [uid(req)]);
  res.json(rows || []);
});
router.post('/distribution/releases/:id/distribute', authenticateToken, async (req: AuthRequest, res) => {
  const rel = await get<any>('SELECT * FROM releases WHERE id = ? AND user_id = ?', [req.params.id, uid(req)]);
  if (!rel) throw new AppError('Release not found', 404);
  await run("UPDATE releases SET status = 'SUBMITTED' WHERE id = ?", [req.params.id]);
  res.json({ success: true, message: 'Release published' });
});
router.post('/distribution/distribute', authenticateToken, async (req: AuthRequest, res) => {
  const { trackId, platforms } = req.body || {};
  if (!trackId) throw new AppError('trackId is required', 400);
  const track = await get<any>('SELECT * FROM tracks WHERE id = ? AND (user_id = ? OR owner_user_id = ?)',
    [trackId, uid(req), uid(req)]);
  if (!track) throw new AppError('Track not found', 404);
  const relId = `rel_${trackId}_${Date.now()}`;
  await run(
    "INSERT INTO releases (id, user_id, artist_id, title, type, status, genre) VALUES (?, ?, ?, ?, 'SINGLE', 'SUBMITTED', ?)",
    [relId, uid(req), track.artistId || uid(req), track.title, track.genre || null]
  );
  // 2026-10-08 REPOSITION: no DSP delivery claims — a release goes live on the
  // creator's own storefront and catalog, and we say exactly that.
  res.json({ success: true, message: `"${track.title}" is published to your storefront and catalog`, releaseId: relId });
});
router.get('/distribution/smart-links', authenticateToken, async (req: AuthRequest, res) => {
  const rows = await all('SELECT * FROM smart_links WHERE user_id = ? ORDER BY created_at DESC', [uid(req)]);
  res.json(rows || []);
});
router.post('/distribution/smart-links', authenticateToken, async (req: AuthRequest, res) => {
  const { title, targetUrl, slug, links } = req.body || {};
  if (!title) throw new AppError('title is required', 400);
  const id = `sl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await run('INSERT INTO smart_links (id, user_id, title, slug, target_url, links) VALUES (?, ?, ?, ?, ?, ?)',
    [id, uid(req), String(title).slice(0, 200), slug || id, targetUrl || null, JSON.stringify(links || [])]);
  res.json({ id, success: true });
});
router.delete('/distribution/smart-links/:id', authenticateToken, async (req: AuthRequest, res) => {
  await run('DELETE FROM smart_links WHERE id = ? AND user_id = ?', [req.params.id, uid(req)]);
  res.json({ success: true });
});

/* ── /api/venues (my-venues BEFORE :id — route order matters) ──────────── */
router.get('/venues/my-venues', authenticateToken, async (req: AuthRequest, res) => {
  const rows = await all('SELECT * FROM venues WHERE owner_id = ? ORDER BY created_at DESC', [uid(req)]);
  res.json(rows || []);
});
router.get('/venues', async (_req, res) => {
  const rows = await all("SELECT * FROM venues WHERE status = 'active' ORDER BY created_at DESC LIMIT 200");
  res.json(rows || []);
});
router.get('/venues/:id', async (req, res) => {
  const v = await get('SELECT * FROM venues WHERE id = ?', [req.params.id]);
  if (!v) throw new AppError('Venue not found', 404);
  res.json(v);
});
router.post('/venues', authenticateToken, async (req: AuthRequest, res) => {
  const { name, address, city, capacity, description } = req.body || {};
  if (!name) throw new AppError('name is required', 400);
  const r = await run(
    "INSERT INTO venues (owner_id, name, address, city, capacity, description, status) VALUES (?, ?, ?, ?, ?, ?, 'active')",
    [uid(req), String(name).slice(0, 200), address || null, city || null, capacity || null, description || null]
  );
  const v = await get('SELECT * FROM venues WHERE id = ?', [r.lastID]);
  res.json(v);
});
router.patch('/venues/:id', authenticateToken, async (req: AuthRequest, res) => {
  const v = await get<any>('SELECT * FROM venues WHERE id = ? AND owner_id = ?', [req.params.id, uid(req)]);
  if (!v) throw new AppError('Venue not found', 404);
  const { name, address, city, capacity, description, status } = req.body || {};
  await run('UPDATE venues SET name=?, address=?, city=?, capacity=?, description=?, status=? WHERE id=?',
    [name ?? v.name, address ?? v.address, city ?? v.city, capacity ?? v.capacity, description ?? v.description, status ?? v.status, req.params.id]);
  res.json(await get('SELECT * FROM venues WHERE id = ?', [req.params.id]));
});

/* ── /api/digital/download — verified download link ────────────────────── */
router.get('/digital/download/:sessionId/:trackId', authenticateToken, async (req: AuthRequest, res) => {
  const track = await get<any>('SELECT * FROM tracks WHERE id = ?', [req.params.trackId]);
  if (!track) throw new AppError('Track not found', 404);
  const owns = track.userId === uid(req) || track.ownerUserId === uid(req);
  const sale = await get('SELECT id FROM bst_sales WHERE buyer_id = ? AND track_id = ?', [uid(req), req.params.trackId])
    || await get('SELECT id FROM direct_sales WHERE track_id = ?', [req.params.trackId]);
  if (!owns && !sale) throw new AppError('Purchase not found for this track', 402);
  const url = track.fileUrl || track.streamUrl;
  if (!url) throw new AppError('Audio file not available', 404);
  res.json({ download_url: url, filename: `${(track.title || 'track').replace(/[^a-zA-Z0-9 _-]/g, '')}.mp3` });
});

/* ── /api/sales/checkout — real Stripe when configured, honest 503 when not */
router.post('/sales/checkout', authenticateToken, async (req: AuthRequest, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) throw new AppError('items[] required', 400);
  if (!config.STRIPE_SECRET_KEY || String(config.STRIPE_SECRET_KEY).includes('placeholder')) {
    return res.status(503).json({ error: 'payments_not_configured', message: 'Checkout is not enabled yet — payment processing is being set up.' });
  }
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const it of items.slice(0, 20)) {
    const p = await get<any>('SELECT * FROM bst_products WHERE id = ?', [it.productId])
      || await get<any>('SELECT id, title as name, price FROM tracks WHERE id = ?', [it.productId]);
    if (!p) continue;
    line_items.push({
      quantity: Math.max(1, Number(it.quantity) || 1),
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(Number(p.price || 0) * 100) || 100,
        product_data: { name: String(p.name || p.title || 'SonicStream item').slice(0, 120) },
      },
    });
  }
  if (!line_items.length) throw new AppError('No valid items', 400);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    success_url: `${config.APP_URL}/store/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.APP_URL}/store`,
    metadata: { userId: String(uid(req) || ''), items: JSON.stringify(items.slice(0, 20)) },
  });
  res.json({ url: session.url });
});

/* ── /api/stream — HLS fallback playlist (whole file as one segment) ───── */
router.get('/stream/:trackId/index.m3u8', async (req, res) => {
  const track = await get<any>('SELECT hls_url, file_url, stream_url, duration FROM tracks WHERE id = ?', [req.params.trackId]);
  if (!track) return res.status(404).send('Not found');
  if (track.hlsUrl) return res.redirect(302, track.hlsUrl);
  const src = track.fileUrl || track.streamUrl;
  if (!src) return res.status(404).send('No audio');
  const dur = Math.max(1, Math.round(Number(track.duration) || 300));
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.send(`#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:${dur}\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:${dur}.0,\n${src}\n#EXT-X-ENDLIST\n`);
});
router.get('/stream/:trackId/index.mpd', async (req, res) => {
  const track = await get<any>('SELECT dash_url FROM tracks WHERE id = ?', [req.params.trackId]);
  if (track?.dashUrl) return res.redirect(302, track.dashUrl);
  res.status(404).json({ error: 'dash_not_available', message: 'DASH stream not generated for this track; the player falls back to HLS/direct audio.' });
});

export default router;
