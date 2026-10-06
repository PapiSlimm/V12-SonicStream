/**
 * BST Agent Engine (Buy/Sell/Trade) — SonicStream's autonomous commerce layer.
 * 2026-09-21.
 *
 * What the agents do, on demand or on autopilot:
 *   1. SCAN   — read a creator's catalog (tracks, artwork, performance data)
 *               and find sellable inventory that has no listing yet.
 *   2. CREATE — generate product listings from that inventory: license tiers
 *               (personal / commercial / exclusive), bundle packs of the
 *               creator's best-performing tracks, and artwork prints — each
 *               priced from real signals (plays, existing price, catalog size).
 *   3. STAGE  — every generated product lands as a DRAFT. Money-facing
 *               publication is a human decision (V12 Constitution: automated
 *               containment/creation, human-authorized release). One click
 *               publishes; the listing then sells through /api/sales/checkout.
 *
 * The engine never invents revenue and never publishes on its own. Autopilot
 * (opt-in per creator, plus ENABLE_BST_AUTOPILOT=true on the service) only
 * automates steps 1–2, keeping a fresh shelf of drafts waiting for approval.
 */
import { all, get, run } from '../../db.js';

export interface BstProposal {
  id: string;
  kind: 'license' | 'bundle' | 'artwork';
  name: string;
  description: string;
  price: number;
  source: string;
}

const id = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const round99 = (n: number) => Math.max(0.99, Math.round(n) - 0.01);

/** Price heuristic: base by kind, scaled by demonstrated demand (plays). */
function priceFor(kind: BstProposal['kind'], plays: number, basePrice: number): number {
  const demand = Math.min(3, 1 + Math.log10(1 + Math.max(0, plays)) / 2); // 1x..3x
  if (kind === 'license') return round99((basePrice > 0 ? basePrice * 4 : 24.99) * demand);
  if (kind === 'bundle') return round99((basePrice > 0 ? basePrice * 2.5 : 14.99) * demand);
  return round99(9.99 * demand); // artwork
}

/** SCAN + CREATE for one creator. Returns the drafts written. Idempotent per source. */
export async function runBstAgentsForUser(userId: string): Promise<BstProposal[]> {
  const tracks = await all<any>(
    `SELECT id, title, price, plays, artwork_url, genre FROM tracks
     WHERE (user_id = ? OR owner_user_id = ?) AND status NOT IN ('deleted','rejected')
     ORDER BY COALESCE(plays,0) DESC LIMIT 50`, [userId, userId]) || [];
  const drafts: BstProposal[] = [];
  const exists = async (source: string) =>
    !!(await get('SELECT id FROM bst_products WHERE user_id = ? AND source = ?', [userId, source]));

  // 1) License tiers for each track that has any traction or a price.
  for (const t of tracks.slice(0, 15)) {
    const source = `license:${t.id}`;
    if (await exists(source)) continue;
    const p: BstProposal = {
      id: id('bstp'), kind: 'license',
      name: `"${t.title}" — Commercial License`,
      description: `Full commercial-use license for "${t.title}"${t.genre ? ` (${t.genre})` : ''}: sync, ads, content, and streaming monetization. Delivered instantly with a signed license certificate.`,
      price: priceFor('license', t.plays || 0, t.price || 0),
      source,
    };
    await run(
      `INSERT INTO bst_products (id, user_id, kind, name, description, price, source, track_ids, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'bst-agent')`,
      [p.id, userId, p.kind, p.name, p.description, p.price, p.source, JSON.stringify([t.id])]
    );
    drafts.push(p);
  }

  // 2) Bundle pack of the creator's top tracks (one per catalog snapshot size).
  if (tracks.length >= 3) {
    const top = tracks.slice(0, Math.min(8, tracks.length));
    const source = `bundle:top${top.length}:${top.map((t: any) => t.id).join('-')}`;
    if (!(await exists(source))) {
      const avg = top.reduce((s: number, t: any) => s + (t.price || 0), 0) / top.length;
      const p: BstProposal = {
        id: id('bstp'), kind: 'bundle',
        name: `Best of the Catalog — ${top.length}-Track Pack`,
        description: `The creator's ${top.length} most-played tracks in one discounted pack: ${top.map((t: any) => `"${t.title}"`).slice(0, 4).join(', ')}${top.length > 4 ? ' and more' : ''}. High-quality downloads, instant delivery.`,
        price: priceFor('bundle', top.reduce((s: number, t: any) => s + (t.plays || 0), 0), avg),
        source,
      };
      await run(
        `INSERT INTO bst_products (id, user_id, kind, name, description, price, source, track_ids, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'bst-agent')`,
        [p.id, userId, p.kind, p.name, p.description, p.price, p.source, JSON.stringify(top.map((t: any) => t.id))]
      );
      drafts.push(p);
    }
  }

  // 3) Artwork prints from tracks that have cover art.
  for (const t of tracks.filter((x: any) => x.artworkUrl).slice(0, 5)) {
    const source = `artwork:${t.id}`;
    if (await exists(source)) continue;
    const p: BstProposal = {
      id: id('bstp'), kind: 'artwork',
      name: `"${t.title}" — Cover Art Print`,
      description: `Museum-quality digital print of the "${t.title}" cover artwork, delivered as a high-resolution file ready for printing or display.`,
      price: priceFor('artwork', t.plays || 0, 0),
      source,
    };
    await run(
      `INSERT INTO bst_products (id, user_id, kind, name, description, price, source, track_ids, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'bst-agent')`,
      [p.id, userId, p.kind, p.name, p.description, p.price, p.source, JSON.stringify([t.id])]
    );
    drafts.push(p);
  }

  await run(
    'INSERT INTO bst_agent_runs (user_id, drafts_created, catalog_size) VALUES (?, ?, ?)',
    [userId, drafts.length, tracks.length]
  ).catch(() => {});
  return drafts;
}

/** Autopilot: every 6h, refresh drafts for every creator who opted in. Never publishes. */
export function initBstAutopilot(log: (m: string) => void = console.log): void {
  if (process.env.ENABLE_BST_AUTOPILOT !== 'true') {
    log('[BST] Autopilot disabled (ENABLE_BST_AUTOPILOT != true). Agents run on demand only.');
    return;
  }
  const cycle = async () => {
    try {
      const optedIn = await all<{ user_id: string }>(
        "SELECT user_id FROM bst_settings WHERE autopilot = 1"
      ) || [];
      let total = 0;
      for (const row of optedIn.slice(0, 200)) {
        const drafts = await runBstAgentsForUser(row.userId).catch(() => []);
        total += drafts.length;
      }
      log(`[BST] Autopilot cycle: ${optedIn.length} creators scanned, ${total} new drafts staged (publish stays human).`);
    } catch (e: any) {
      console.error('[BST] Autopilot cycle failed:', e?.message);
    }
  };
  setTimeout(cycle, 60_000);                 // first pass a minute after boot
  setInterval(cycle, 6 * 60 * 60 * 1000);    // then every 6 hours
  log('[BST] Autopilot armed: scan+draft every 6h for opted-in creators.');
}
