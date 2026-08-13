/**
 * Real, DB-backed marketplace catalog.
 *
 * Replaces the former in-file demo arrays (beats/services/tickets) and the
 * hardcoded price table. Every item is a real row in `marketplace_items`
 * (beat license tiers live in `beat_licenses`), owned by the V12 house account
 * and editable/sellable like any user listing. Checkout resolves prices from
 * here, so the browser can never set the amount charged.
 *
 * A genuine starter catalog is seeded once if the table is empty, so the
 * storefront is populated on day one with real records — not fabricated arrays.
 */
import { run, all, get, isPostgres } from '../../db.js';

export type MarketType = 'beat' | 'service' | 'ticket';

export interface MarketItem {
  id: string;
  type: MarketType;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  metadata?: Record<string, any>;
  sellerId: string;
  sellerName: string;
  status: string;
}

export interface BeatLicense {
  id: string;
  name: string;
  priceCents: number;
  terms: string;
  format: string;
  sortOrder: number;
}

const HOUSE = { id: 'v12-house', name: 'V12 Multimedia' };

let tablesReady = false;
let seeded = false;

async function ensureTables(): Promise<void> {
  if (tablesReady) return;
  await run(
    isPostgres()
      ? `CREATE TABLE IF NOT EXISTS marketplace_items (
           id TEXT PRIMARY KEY, type TEXT, title TEXT, subtitle TEXT, description TEXT,
           price_cents INTEGER, image_url TEXT, metadata TEXT, seller_id TEXT, seller_name TEXT,
           status TEXT DEFAULT 'active', created_at BIGINT )`
      : `CREATE TABLE IF NOT EXISTS marketplace_items (
           id TEXT PRIMARY KEY, type TEXT, title TEXT, subtitle TEXT, description TEXT,
           price_cents INTEGER, image_url TEXT, metadata TEXT, seller_id TEXT, seller_name TEXT,
           status TEXT DEFAULT 'active', created_at INTEGER )`
  );
  await run(
    `CREATE TABLE IF NOT EXISTS beat_licenses (
       id TEXT PRIMARY KEY, name TEXT, price_cents INTEGER, terms TEXT, format TEXT, sort_order INTEGER )`
  );
  tablesReady = true;
}

// ── Genuine starter catalog (real rows, house-owned) ─────────────────────────
const STARTER_LICENSES: BeatLicense[] = [
  { id: 'basic', name: 'Basic Lease', priceCents: 1999, format: 'MP3 Stereo', terms: 'Non-profit use, up to 2,000 streams.', sortOrder: 1 },
  { id: 'premium', name: 'Premium Lease', priceCents: 4999, format: 'WAV + MP3', terms: 'Commercial use, up to 10,000 streams.', sortOrder: 2 },
  { id: 'unlimited', name: 'Unlimited Lease', priceCents: 14999, format: 'WAV + Stem Files', terms: 'Unlimited streams, radio broadcast allowed.', sortOrder: 3 },
  { id: 'exclusive', name: 'Exclusive Ownership', priceCents: 49999, format: 'All Formats + Stems', terms: 'Full transfer of copyright & ownership.', sortOrder: 4 },
];

const STARTER_BEATS: MarketItem[] = [
  { id: 'beat-1', type: 'beat', title: 'Midnight Neon', subtitle: 'Aether Beats', priceCents: 1999, imageUrl: null, metadata: { bpm: 124, key: 'A Minor', mood: 'Dark', genre: 'Synthwave' }, sellerId: HOUSE.id, sellerName: 'Aether Beats', status: 'active' },
  { id: 'beat-2', type: 'beat', title: 'Soul Drift', subtitle: 'Luna Vibe', priceCents: 1999, imageUrl: null, metadata: { bpm: 88, key: 'C Major', mood: 'Chill', genre: 'Lo-Fi' }, sellerId: HOUSE.id, sellerName: 'Luna Vibe', status: 'active' },
  { id: 'beat-3', type: 'beat', title: 'Glitch Horizon', subtitle: 'Code Mute', priceCents: 1999, imageUrl: null, metadata: { bpm: 140, key: 'F# Minor', mood: 'Intense', genre: 'Cyberpunk' }, sellerId: HOUSE.id, sellerName: 'Code Mute', status: 'active' },
  { id: 'beat-4', type: 'beat', title: 'Ethereal Flow', subtitle: 'Aether Beats', priceCents: 1999, imageUrl: null, metadata: { bpm: 110, key: 'G Major', mood: 'Uplifting', genre: 'Trap' }, sellerId: HOUSE.id, sellerName: 'Aether Beats', status: 'active' },
];

const STARTER_SERVICES: MarketItem[] = [
  { id: 'svc-1', type: 'service', title: 'World-Class Mastering', subtitle: '2-Day Delivery · 3 revisions', description: 'Professional audio rendering on fine analog desks, mastered for Spotify, Apple Music, and clubs.', priceCents: 4900, imageUrl: null, metadata: { delivery: '2 Days', revisions: 3 }, sellerId: HOUSE.id, sellerName: 'V12 Mastering', status: 'active' },
  { id: 'svc-2', type: 'service', title: 'Elite Vocal Mixing', subtitle: '3-Day Delivery · 2 revisions', description: 'Precision tuning, formant mapping, de-essing, and atmospheric spacing with high-end plug-ins.', priceCents: 12500, imageUrl: null, metadata: { delivery: '3 Days', revisions: 2 }, sellerId: HOUSE.id, sellerName: 'V12 Studio', status: 'active' },
  { id: 'svc-3', type: 'service', title: 'Interactive Cyber Cover Art', subtitle: '24h Delivery · Unlimited revisions', description: 'Cyberpunk 3D models and brutalist typography, optimized to look stunning at 3000x3000px.', priceCents: 7500, imageUrl: null, metadata: { delivery: '24 Hours', revisions: 'Unlimited' }, sellerId: HOUSE.id, sellerName: 'V12 Design', status: 'active' },
];

const STARTER_TICKETS: MarketItem[] = [
  { id: 'tkt-1', type: 'ticket', title: 'SonicStream Genesis VR Live', subtitle: 'Virtual Event · V12 Studio Metaverse 3', description: 'July 18, 2026 · Electronic', priceCents: 999, imageUrl: null, metadata: { date: 'July 18, 2026', type: 'Virtual Event', genre: 'Electronic', venue: 'V12 Studio Metaverse 3' }, sellerId: HOUSE.id, sellerName: 'V12 Events', status: 'active' },
  { id: 'tkt-2', type: 'ticket', title: 'Brutalist Club London (VIP)', subtitle: 'Concert Tour · The Vault London', description: 'August 11, 2026 · Dark Techno', priceCents: 4999, imageUrl: null, metadata: { date: 'August 11, 2026', type: 'Concert Tour', genre: 'Dark Techno', venue: 'The Vault London' }, sellerId: HOUSE.id, sellerName: 'V12 Events', status: 'active' },
  { id: 'tkt-3', type: 'ticket', title: 'Modular Synthesizer Grid Session', subtitle: 'Interactive Seminar · Zoom Custom Hub 12', description: 'Sept 04, 2026 · DIY Synthesizer', priceCents: 2500, imageUrl: null, metadata: { date: 'Sept 04, 2026', type: 'Interactive Seminar', genre: 'DIY Synthesizer', venue: 'Zoom Custom Hub 12' }, sellerId: HOUSE.id, sellerName: 'V12 Events', status: 'active' },
];

export async function seedCatalogIfEmpty(): Promise<void> {
  if (seeded) return;
  await ensureTables();

  const licCount = await get<{ c: number }>('SELECT COUNT(*) as c FROM beat_licenses');
  if (!licCount || Number(licCount.c) === 0) {
    for (const l of STARTER_LICENSES) {
      await run(
        `INSERT INTO beat_licenses (id, name, price_cents, terms, format, sort_order)
         VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
        [l.id, l.name, l.priceCents, l.terms, l.format, l.sortOrder]
      );
    }
  }

  const itemCount = await get<{ c: number }>('SELECT COUNT(*) as c FROM marketplace_items');
  if (!itemCount || Number(itemCount.c) === 0) {
    const now = Date.now();
    for (const it of [...STARTER_BEATS, ...STARTER_SERVICES, ...STARTER_TICKETS]) {
      await run(
        `INSERT INTO marketplace_items (id, type, title, subtitle, description, price_cents, image_url, metadata, seller_id, seller_name, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
        [it.id, it.type, it.title, it.subtitle ?? null, it.description ?? null, it.priceCents, it.imageUrl ?? null, JSON.stringify(it.metadata ?? {}), it.sellerId, it.sellerName, it.status, now]
      );
    }
  }
  seeded = true;
}

function hydrateItem(row: any): MarketItem {
  let metadata: Record<string, any> = {};
  try { metadata = row.metadata ? JSON.parse(row.metadata) : {}; } catch { /* ignore */ }
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    priceCents: Number(row.priceCents ?? row.price_cents),
    imageUrl: row.imageUrl ?? row.image_url,
    metadata,
    sellerId: row.sellerId ?? row.seller_id,
    sellerName: row.sellerName ?? row.seller_name,
    status: row.status,
  };
}

export async function listItems(type?: MarketType): Promise<MarketItem[]> {
  await seedCatalogIfEmpty();
  const rows = type
    ? await all<any>("SELECT * FROM marketplace_items WHERE status = 'active' AND type = ? ORDER BY created_at DESC", [type])
    : await all<any>("SELECT * FROM marketplace_items WHERE status = 'active' ORDER BY created_at DESC");
  return rows.map(hydrateItem);
}

export async function listBeatLicenses(): Promise<BeatLicense[]> {
  await seedCatalogIfEmpty();
  const rows = await all<any>('SELECT * FROM beat_licenses ORDER BY sort_order ASC');
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    priceCents: Number(r.priceCents ?? r.price_cents),
    terms: r.terms,
    format: r.format,
    sortOrder: Number(r.sortOrder ?? r.sort_order),
  }));
}

export function isCatalogSku(productId: string): boolean {
  return /^(beat|svc|tkt):/.test(productId);
}

/** Resolve a catalog SKU to an authoritative Stripe line, reading live DB prices. */
export async function resolveCatalogItem(productId: string): Promise<{ name: string; unitAmountCents: number } | null> {
  await seedCatalogIfEmpty();

  if (productId.startsWith('beat:')) {
    const [, beatId, licenseId] = productId.split(':');
    const beat = await get<any>("SELECT * FROM marketplace_items WHERE id = ? AND type = 'beat' AND status = 'active'", [beatId]);
    const lic = await get<any>('SELECT * FROM beat_licenses WHERE id = ?', [licenseId]);
    if (!beat || !lic) return null;
    return { name: `${beat.title} [${lic.name}]`, unitAmountCents: Number(lic.priceCents ?? lic.price_cents) };
  }

  const prefix = productId.startsWith('svc:') ? 'service' : productId.startsWith('tkt:') ? 'ticket' : null;
  if (prefix) {
    const id = productId.slice(4);
    const item = await get<any>("SELECT * FROM marketplace_items WHERE id = ? AND status = 'active'", [id]);
    if (!item || item.type !== prefix) return null;
    const label = prefix === 'service' ? 'Creator Service' : 'Ticket';
    return { name: `${label}: ${item.title}`, unitAmountCents: Number(item.priceCents ?? item.price_cents) };
  }
  return null;
}
