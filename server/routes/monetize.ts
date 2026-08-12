/**
 * V12 MONETIZATION SURFACE — for-profit, proudly and transparently.
 *
 *   GET  /api/monetize/terms                — the published terms of processing
 *   GET  /api/monetize/why-v12              — the pitch (promote the advantages)
 *   GET  /api/monetize/opportunities        — personalized earning avenues
 *   POST /api/monetize/price-breakdown      — seller price → all-in buyer price
 *   POST /api/monetize/share-links          — top-20 social platforms, price included
 *   GET  /api/monetize/sponsorships/rates   — rate card from real listener data
 *   POST /api/monetize/sponsorships/book    — book + pay (Stripe Checkout)
 *   GET  /api/monetize/sponsorships         — your bookings
 *   POST /api/monetize/sponsorships/:id/activate — admin: confirm paid → on air
 *   GET  /api/monetize/hf/status            — Headless Financial link + outbox
 *   POST /api/monetize/hf/flush             — admin: retry queued HF records
 *
 * Every monetary movement here posts to the balanced local ledger AND is
 * recorded with Headless Financial, the accounting system of record.
 */
import { Router } from 'express';
import { authenticateToken, authenticateAdmin, AuthRequest } from '../domains/identity/auth.js';
import { get } from '../db.js';
import { config } from '../config.js';
import {
  TRANSACTION_TERMS, WHY_V12, priceBreakdown, buildShareLinks,
  monetizationAvenues, type SellerTier,
} from '../services/Monetization.core.js';
import { rateCard, bookSponsorship, activateSponsorship, listSponsorships } from '../services/Sponsorship.js';
import { flushHFOutbox, hfStatus } from '../services/HeadlessFinancial.js';
import { listeners } from '../services/RadioEngine.js';

const router = Router();
router.use(authenticateToken);

async function tierOf(userId: string): Promise<SellerTier> {
  const u = await get<any>(`SELECT subscription_tier FROM users WHERE id = ?`, [userId]);
  const t = String(u?.subscriptionTier ?? u?.subscription_tier ?? 'free').toLowerCase();
  return (t === 'pro' || t === 'visionary') ? (t as SellerTier) : 'free';
}

// ── Terms + pitch ───────────────────────────────────────────────────────────

router.get('/terms', (_req, res) => {
  res.json({ terms: TRANSACTION_TERMS });
});

router.get('/why-v12', (_req, res) => {
  res.json({ advantages: WHY_V12 });
});

router.get('/opportunities', async (req: AuthRequest, res) => {
  try {
    const tier = await tierOf(req.user!.id);
    const airplay = await get<any>(
      `SELECT SUM(seconds) as s FROM radio_airplay WHERE artist_user_id = ? AND settled = 0`, [req.user!.id],
    ).catch(() => null);
    res.json({
      tier,
      avenues: monetizationAvenues({
        tier,
        airplaySeconds: Number(airplay?.s) || 0,
        avgListeners: listeners.totalActive(Math.floor(Date.now() / 1000)),
      }),
      advantages: WHY_V12,
      accounting: 'All balances, settlements and statements live in Headless Financial.',
    });
  } catch {
    res.status(500).json({ error: 'Could not build opportunities' });
  }
});

// ── Pricing (sellers set the price; buyers see all-in everywhere) ──────────

router.post('/price-breakdown', async (req: AuthRequest, res) => {
  const { sellerSetCents } = req.body ?? {};
  try {
    const tier = await tierOf(req.user!.id);
    res.json({ breakdown: priceBreakdown(Number(sellerSetCents), tier) });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid price' });
  }
});

// ── Sharing (top-20 platforms, price of services included) ─────────────────

router.post('/share-links', async (req: AuthRequest, res) => {
  const { title, link, sellerSetCents, kind } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'title is required' });
  const appUrl = (config.PUBLIC_BASE_URL || config.APP_URL).replace(/\/$/, '');
  const shareLink = typeof link === 'string' && /^https?:\/\//.test(link) ? link : appUrl;
  try {
    const tier = await tierOf(req.user!.id);
    const links = buildShareLinks({
      title: title.slice(0, 120),
      link: shareLink,
      sellerSetCents: Number.isInteger(sellerSetCents) ? sellerSetCents : undefined,
      tier,
      kind: ['track', 'product', 'station', 'profile'].includes(kind) ? kind : 'track',
    });
    res.json({ count: links.length, links });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Could not build share links' });
  }
});

// ── Sponsorships ────────────────────────────────────────────────────────────

router.get('/sponsorships/rates', (_req, res) => {
  res.json({
    pricing: 'Base floor + measured-listener multiplier; rates move with real audience.',
    rates: rateCard(),
  });
});

router.post('/sponsorships/book', async (req: AuthRequest, res) => {
  const { station, sponsorName, message, slotType, days } = req.body ?? {};
  if (typeof station !== 'string' || typeof sponsorName !== 'string' || typeof message !== 'string') {
    return res.status(400).json({ error: 'station, sponsorName and message are required' });
  }
  if (slotType !== 'daily' && slotType !== 'hourly') {
    return res.status(400).json({ error: 'slotType must be "daily" or "hourly"' });
  }
  try {
    const booking = await bookSponsorship({
      userId: req.user!.id, station, sponsorName, message, slotType, days: Number(days) || 1,
    });
    res.json({
      ...booking,
      next: 'Complete payment at checkoutUrl. The slot goes on air when payment clears; the AI host reads your message every break.',
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Booking failed' });
  }
});

router.get('/sponsorships', async (req: AuthRequest, res) => {
  res.json({ sponsorships: await listSponsorships(req.user!.id) });
});

router.post('/sponsorships/:id/activate', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    res.json(await activateSponsorship(String(req.params.id), req.user!.id));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Activation failed' });
  }
});

// ── Headless Financial (the accounting system of record) ───────────────────

router.get('/hf/status', (_req, res) => {
  res.json(hfStatus());
});

router.post('/hf/flush', authenticateAdmin, async (_req, res) => {
  res.json(await flushHFOutbox());
});

export default router;
