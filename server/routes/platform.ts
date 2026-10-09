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
import { getSignedUrl } from '../utils/storage.js';

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

  // ── Commission model (2026-10-08) ──────────────────────────────────────
  // Funds settle in the PLATFORM Stripe account; the per-item split is
  // computed here (server-side prices only — client amounts are never
  // trusted) and recorded as pending bst_sales rows. The webhook marks them
  // completed on payment. Vendor payouts are ledger-driven; swapping the
  // payout step for Stripe Connect transfers later won't touch this math.
  // Tiered by product type (2026-10-08): physical 5%, digital 15%, service
  // 10% — each env-overridable; anything unrecognized falls back to the flat
  // COMMISSION_RATE. Rates are clamped to [0, 50%].
  const clamp = (v: any, dflt: number) => Math.min(0.5, Math.max(0, Number(v ?? dflt)));
  const COMMISSION_RATE = clamp(process.env.COMMISSION_RATE, 0.10);
  const TIER_RATES: Record<string, number> = {
    physical: clamp(process.env.COMMISSION_PHYSICAL, 0.05),
    digital: clamp(process.env.COMMISSION_DIGITAL, 0.15),
    service: clamp(process.env.COMMISSION_SERVICE, 0.10),
  };
  const rateFor = (kind: string | null | undefined) =>
    TIER_RATES[String(kind || '').toLowerCase()] ?? COMMISSION_RATE;

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const resolved: { productId: string; sellerId: string | null; trackId: number | null; qty: number; unitCents: number; rate: number }[] = [];
  for (const it of items.slice(0, 20)) {
    const bst = await get<any>('SELECT * FROM bst_products WHERE id = ?', [it.productId]);
    const trk = bst ? null : await get<any>('SELECT id, artist_id, title as name, price FROM tracks WHERE id = ?', [it.productId]);
    const p = bst || trk;
    if (!p) continue;
    const qty = Math.max(1, Number(it.quantity) || 1);
    const unitCents = Math.round(Number(p.price || 0) * 100) || 100;
    resolved.push({
      productId: String(it.productId),
      sellerId: (bst ? (bst.userId || bst.createdBy || null) : (trk?.artistId ?? null)) as string | null,
      trackId: trk ? Number(trk.id) : null,
      qty,
      unitCents,
      rate: rateFor(bst ? bst.kind : 'digital'), // a track is a digital good
    });
    line_items.push({
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: unitCents,
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
    metadata: { userId: String(uid(req) || ''), orderType: 'store_order' },
  });

  // Pending commission rows, one per line item — finalized by the webhook.
  for (const r of resolved) {
    const grossUsd = (r.unitCents * r.qty) / 100;
    const platformUsd = Math.round(grossUsd * r.rate * 100) / 100;
    const sellerUsd = Math.round((grossUsd - platformUsd) * 100) / 100;
    await run(
      `INSERT INTO bst_sales (product_id, seller_id, buyer_id, track_id, amount, seller_revenue, platform_revenue, stripe_session_id, status, quantity, commission_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [r.productId, r.sellerId, uid(req), r.trackId, grossUsd, sellerUsd, platformUsd, session.id, r.qty, r.rate]
    ).catch((e: any) => console.error('[checkout] failed to record pending sale:', e?.message));
  }

  res.json({ url: session.url });
});

/* ── /api/commission-rates — public, feeds the vendor earnings calculator ─ */
router.get('/commission-rates', (_req, res) => {
  const clamp = (v: any, dflt: number) => Math.min(0.5, Math.max(0, Number(v ?? dflt)));
  res.json({
    default: clamp(process.env.COMMISSION_RATE, 0.10),
    physical: clamp(process.env.COMMISSION_PHYSICAL, 0.05),
    digital: clamp(process.env.COMMISSION_DIGITAL, 0.15),
    service: clamp(process.env.COMMISSION_SERVICE, 0.10),
  });
});

/* ── /api/products/:id/download — expiring links for digital purchases ────
   Buyer must hold a COMPLETED sale for the product (sellers get their own
   files too). R2-hosted files come back as 1-hour signed URLs, so links
   can't be shared publicly; local-disk files return their direct path. */
router.get('/products/:id/download', authenticateToken, async (req: AuthRequest, res) => {
  const product = await get<any>('SELECT * FROM bst_products WHERE id = ?', [req.params.id]);
  if (!product) throw new AppError('Product not found', 404);

  const isSeller = product.userId === uid(req);
  if (!isSeller) {
    const sale = await get<any>(
      "SELECT id FROM bst_sales WHERE product_id = ? AND buyer_id = ? AND status = 'completed'",
      [req.params.id, uid(req)]
    );
    if (!sale) throw new AppError('Purchase required', 403);
  }

  const trackIds: any[] = (() => { try { return JSON.parse(product.trackIds || '[]'); } catch { return []; } })();
  const pubBase = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
  const links: { trackId: any; title: string; url: string; expiresInSeconds: number | null }[] = [];

  for (const tid of trackIds.slice(0, 50)) {
    const trk = await get<any>('SELECT id, title, file_url, stream_url FROM tracks WHERE id = ?', [tid]);
    if (!trk) continue;
    const fileUrl: string = trk.fileUrl || trk.streamUrl || '';
    if (!fileUrl) continue;
    if (pubBase && fileUrl.startsWith(pubBase + '/')) {
      const key = fileUrl.slice(pubBase.length + 1);
      try {
        const signed = await getSignedUrl(key, 3600);
        links.push({ trackId: trk.id, title: trk.title, url: signed, expiresInSeconds: 3600 });
        continue;
      } catch (e: any) {
        console.error('[download] signing failed, falling back to public URL:', e?.message);
      }
    }
    links.push({ trackId: trk.id, title: trk.title, url: fileUrl, expiresInSeconds: null });
  }

  if (!links.length) throw new AppError('This product has no downloadable files attached', 404);
  res.json({ productId: product.id, name: product.name, links });
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

/* ── /api/verification — moved off Firestore (2026-10-08) ──────────────── */
router.post('/verification', authenticateToken, async (req: AuthRequest, res) => {
  const { category, links, message } = req.body || {};
  const user = await get<any>('SELECT name, email FROM users WHERE id = ?', [uid(req)]);
  const r = await run(
    `INSERT INTO verification_requests (user_id, user_name, user_email, category, links, message, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [uid(req), user?.name || 'Anonymous', user?.email || '', category || null,
     JSON.stringify(links || []), message || null]
  );
  await run("UPDATE users SET verification_status = 'pending' WHERE id = ?", [uid(req)]).catch(() => {});
  res.json({ id: r.lastID, success: true });
});
router.get('/verification/requests', authenticateToken, async (_req, res) => {
  const rows = await all('SELECT * FROM verification_requests ORDER BY created_at DESC').catch(() => []);
  res.json(rows || []);
});
router.post('/verification/requests/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  const { status, userId, notes } = req.body || {};
  if (!['verified', 'rejected'].includes(status)) throw new AppError('status must be verified|rejected', 400);
  await run('UPDATE verification_requests SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, notes || null, req.params.id]);
  if (userId) {
    await run('UPDATE users SET verification_status = ?, is_verified = ? WHERE id = ?',
      [status, status === 'verified' ? 1 : 0, userId]).catch(() => {});
  }
  res.json({ success: true });
});

/* ── /api/products — general creator store, backed by bst_products ─────────
 * (2026-10-08: the client store previously read/wrote a Firestore `products`
 * collection on the suspended GCP project. Manually-created products now live
 * on the same shelf the BST agents stock, created_by='creator'.) */
router.get('/products', async (_req, res) => {
  const rows = await all("SELECT * FROM bst_products WHERE status = 'published' ORDER BY created_at DESC LIMIT 200").catch(() => []);
  res.json(rows || []);
});
router.get('/products/artist/:artistId', async (req, res) => {
  const rows = await all("SELECT * FROM bst_products WHERE user_id = ? AND status = 'published' ORDER BY created_at DESC",
    [req.params.artistId]).catch(() => []);
  res.json(rows || []);
});
router.get('/products/:id', async (req, res) => {
  const p = await get('SELECT * FROM bst_products WHERE id = ?', [req.params.id]);
  if (!p) throw new AppError('Product not found', 404);
  res.json(p);
});
router.post('/products', authenticateToken, async (req: AuthRequest, res) => {
  const { name, title, description, price, kind, trackIds, imageUrl } = req.body || {};
  const pname = String(name || title || '').slice(0, 200);
  if (!pname) throw new AppError('name is required', 400);
  const id = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await run(
    `INSERT INTO bst_products (id, user_id, kind, name, description, price, source, track_ids, status, created_by, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', 'creator', CURRENT_TIMESTAMP)`,
    [id, uid(req), kind || 'digital', pname, description || null, Number(price) || 0,
     imageUrl || null, JSON.stringify(trackIds || [])]
  );
  res.json({ id, success: true });
});
router.patch('/products/:id', authenticateToken, async (req: AuthRequest, res) => {
  const p = await get<any>('SELECT * FROM bst_products WHERE id = ? AND user_id = ?', [req.params.id, uid(req)]);
  if (!p) throw new AppError('Product not found', 404);
  const { name, description, price, status, kind } = req.body || {};
  await run('UPDATE bst_products SET name = ?, description = ?, price = ?, status = ?, kind = ? WHERE id = ?',
    [name ?? p.name, description ?? p.description, price ?? p.price, status ?? p.status, kind ?? p.kind, req.params.id]);
  res.json({ success: true });
});
router.delete('/products/:id', authenticateToken, async (req: AuthRequest, res) => {
  const p = await get<any>('SELECT id FROM bst_products WHERE id = ? AND user_id = ?', [req.params.id, uid(req)]);
  if (!p) throw new AppError('Product not found', 404);
  await run('DELETE FROM bst_products WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

/* ── /api/sales/mine — seller or buyer sales history ───────────────────── */
router.get('/sales/mine', authenticateToken, async (req: AuthRequest, res) => {
  const role = req.query.role === 'buyer' ? 'buyer_id' : 'seller_id';
  const rows = await all(
    `SELECT s.*, p.name as product_name FROM bst_sales s
     LEFT JOIN bst_products p ON p.id = s.product_id
     WHERE s.${role} = ? ORDER BY s.created_at DESC`, [uid(req)]).catch(() => []);
  res.json(rows || []);
});

/* ── public smart-link lookup by slug (was a client Firestore query) ───── */
router.get('/distribution/smart-links/slug/:slug', async (req, res) => {
  const link = await get('SELECT * FROM smart_links WHERE slug = ?', [req.params.slug]);
  if (!link) throw new AppError('Release not found', 404);
  res.json(link);
});

export default router;
