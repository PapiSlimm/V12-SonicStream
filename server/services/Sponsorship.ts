/**
 * V12 RADIO SPONSORSHIP — measured-reach advertising, accounted properly.
 *
 * Sponsors book daily banners or hourly host-read spots on any of the top-20
 * genre stations. Rates come from REAL listener analytics (sponsorRateFor),
 * payment runs through Stripe Checkout, revenue posts to the local balanced
 * ledger, and the movement is recorded with Headless Financial — the
 * accounting system of record.
 */
import { all, get, run } from '../db.js';
import { LedgerService } from '../domains/finance/ledger.service.js';
import { StripeService } from '../domains/finance/stripe.service.js';
import { recordWithHeadlessFinancial } from './HeadlessFinancial.js';
import { sponsorRateFor, TOP_20_GENRES } from './Monetization.core.js';
import { listeners } from './RadioEngine.js';
import { config } from '../config.js';

const nowSec = () => Math.floor(Date.now() / 1000);

let ready = false;
async function ensureTables(): Promise<void> {
  if (ready) return;
  await run(`CREATE TABLE IF NOT EXISTS radio_sponsorships (
    id TEXT PRIMARY KEY,
    station TEXT NOT NULL,
    sponsor_user_id TEXT NOT NULL,
    sponsor_name TEXT NOT NULL,
    message TEXT NOT NULL,
    slot_type TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    starts_at INTEGER NOT NULL,
    ends_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_payment',
    stripe_session_id TEXT,
    created_at INTEGER NOT NULL
  )`, []);
  ready = true;
}

export function rateCard(): ReturnType<typeof sponsorRateFor>[] {
  const now = nowSec();
  return ['all', ...TOP_20_GENRES].map((station) =>
    sponsorRateFor(station, listeners.activeListeners(station, now)),
  );
}

export async function bookSponsorship(args: {
  userId: string;
  station: string;
  sponsorName: string;
  message: string;
  slotType: 'daily' | 'hourly';
  days: number;
}): Promise<{ id: string; priceCents: number; checkoutUrl: string }> {
  await ensureTables();
  const station = String(args.station).toLowerCase();
  if (station !== 'all' && !(TOP_20_GENRES as readonly string[]).includes(station)) {
    throw new Error(`Unknown station "${station}" — sponsorships run on the top-20 genre stations or "all".`);
  }
  const days = Math.max(1, Math.min(30, Math.floor(args.days)));
  const rate = sponsorRateFor(station, listeners.activeListeners(station, nowSec()));
  const priceCents = args.slotType === 'daily' ? rate.dailyFlatCents * days : rate.hourlySpotCents * 24 * days;

  const id = `spon_${Math.random().toString(36).slice(2, 11)}`;
  const startsAt = nowSec();
  const endsAt = startsAt + days * 86400;

  const appUrl = config.PUBLIC_BASE_URL || config.APP_URL;
  const session = await StripeService.createCheckoutSession({
    amount: priceCents,
    metadata: {
      type: 'radio_sponsorship', sponsorshipId: id, station,
      trackTitle: `V12 Radio sponsorship — ${station} (${args.slotType}, ${days}d)`,
    },
    successUrl: `${appUrl}/radio?sponsorship=${id}&paid=1`,
    cancelUrl: `${appUrl}/radio?sponsorship=${id}&cancelled=1`,
  });

  await run(`INSERT INTO radio_sponsorships
    (id, station, sponsor_user_id, sponsor_name, message, slot_type, price_cents, starts_at, ends_at, status, stripe_session_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?, ?)`,
    [id, station, args.userId, args.sponsorName.slice(0, 80), args.message.slice(0, 240),
      args.slotType, priceCents, startsAt, endsAt, session.id, nowSec()]);

  return { id, priceCents, checkoutUrl: session.url ?? '' };
}

/**
 * Activate after payment (called by the Stripe webhook on
 * checkout.session.completed with metadata.type === 'radio_sponsorship',
 * or by an admin verifying the session manually).
 */
export async function activateSponsorship(id: string, activatedBy: string): Promise<any> {
  await ensureTables();
  const s = await get<any>(`SELECT * FROM radio_sponsorships WHERE id = ?`, [id]);
  if (!s) throw new Error('Sponsorship not found');
  if (s.status === 'active') return { id, status: 'active', already: true };

  await run(`UPDATE radio_sponsorships SET status = 'active' WHERE id = ?`, [id]);

  const priceCents = Number(s.priceCents ?? s.price_cents);
  // Local balanced ledger: sponsor pays in, platform earns.
  const txId = await LedgerService.createBalancedTransaction({
    tenantId: 'v12-radio',
    type: 'sponsorship' as any,
    description: `Radio sponsorship ${id} (${s.station}) — ${s.sponsorName ?? s.sponsor_name}`,
    entries: [
      { accountType: 'PROCESSOR', amount: -(priceCents / 100) },
      { accountType: 'PLATFORM', amount: priceCents / 100 },
    ],
    metadata: { sponsorshipId: id, activatedBy },
    stripeSessionId: s.stripeSessionId ?? s.stripe_session_id,
    reference: id,
  });

  // Headless Financial: the system of record hears about every dollar.
  await recordWithHeadlessFinancial({
    kind: 'sponsorship',
    reference: txId,
    description: `V12 Radio sponsorship ${id} on "${s.station}"`,
    amountCents: priceCents,
    parties: [
      { role: 'sponsor', userId: String(s.sponsorUserId ?? s.sponsor_user_id), amountCents: -priceCents },
      { role: 'platform', amountCents: priceCents },
    ],
    metadata: { station: s.station, slotType: s.slotType ?? s.slot_type },
  });

  return { id, status: 'active', ledgerTransactionId: txId };
}

/** The line the AI host reads on air — only for paid, in-window sponsors. */
export async function activeSponsorLine(station: string): Promise<string | null> {
  await ensureTables();
  const now = nowSec();
  const s = await get<any>(`
    SELECT sponsor_name, message FROM radio_sponsorships
    WHERE status = 'active' AND starts_at <= ? AND ends_at > ? AND (station = ? OR station = 'all')
    ORDER BY price_cents DESC LIMIT 1
  `, [now, now, station]);
  if (!s) return null;
  const name = s.sponsorName ?? s.sponsor_name;
  const message = s.message;
  return `This hour of V12 Radio is brought to you by ${name}. ${message}`;
}

export async function listSponsorships(userId?: string): Promise<any[]> {
  await ensureTables();
  return userId
    ? all<any>(`SELECT * FROM radio_sponsorships WHERE sponsor_user_id = ? ORDER BY created_at DESC LIMIT 50`, [userId])
    : all<any>(`SELECT * FROM radio_sponsorships ORDER BY created_at DESC LIMIT 100`, []);
}
