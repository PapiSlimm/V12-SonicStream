/**
 * V12 RADIO ENGINE — wired for SonicStream.
 *
 * Binds the deterministic core to the database, the Gemini host, the ledger,
 * and the ecosystem publisher (Sociofy / SonicWave / CEOS / peers hear what's
 * on air). All monetary math stays in the core (Art. III); all model output
 * is display copy only, never a decision (Art. I §1.4).
 */
import { all, get, run } from '../db.js';
import { config } from '../config.js';
import { LedgerService } from '../domains/finance/ledger.service.js';
import { publishToFeeds, feedPeers } from './EcosystemPublisher.js';
import {
  buildRotation, playhead, splitRoyaltyPool, ListenerRegistry,
  daypartForHour, hostScript,
  type RadioTrack, type NowPlaying, type Daypart,
} from './RadioEngine.core.js';
import fs from 'node:fs';
import path from 'node:path';
import { recordWithHeadlessFinancial } from './HeadlessFinancial.js';

export const listeners = new ListenerRegistry();

const nowSec = () => Math.floor(Date.now() / 1000);
const epochDay = () => Math.floor(nowSec() / 86400);

let tablesReady = false;
async function ensureTables(): Promise<void> {
  if (tablesReady) return;
  await run(`CREATE TABLE IF NOT EXISTS radio_votes (
    track_id TEXT NOT NULL, user_id TEXT NOT NULL, vote TEXT NOT NULL,
    at INTEGER NOT NULL, PRIMARY KEY (track_id, user_id)
  )`, []);
  await run(`CREATE TABLE IF NOT EXISTS radio_requests (
    track_id TEXT NOT NULL, user_id TEXT NOT NULL, station TEXT NOT NULL,
    at INTEGER NOT NULL
  )`, []);
  await run(`CREATE TABLE IF NOT EXISTS radio_airplay (
    day INTEGER NOT NULL, artist_user_id TEXT NOT NULL, seconds INTEGER NOT NULL,
    settled INTEGER NOT NULL DEFAULT 0
  )`, []);
  await run(`CREATE TABLE IF NOT EXISTS radio_listen_log (
    at INTEGER NOT NULL, station TEXT NOT NULL, sessions INTEGER NOT NULL
  )`, []);
  tablesReady = true;
}

// ── Station catalog ─────────────────────────────────────────────────────────

export async function stationTracks(station: string): Promise<RadioTrack[]> {
  const rows = await all<any>(`
    SELECT t.id, t.user_id, t.title, t.genre, t.file_url,
           COALESCE(t.duration, 180) as duration, t.created_at, u.name as artist_name
    FROM tracks t JOIN users u ON t.user_id = u.id
    WHERE t.status = 'live' AND (? = 'all' OR t.genre = ?)
    ORDER BY t.id ASC
  `, [station, station]);
  return rows.map((r) => ({
    id: String(r.id), userId: String(r.userId ?? r.user_id),
    title: String(r.title ?? 'Untitled'), artistName: r.artistName ?? r.artist_name,
    genre: r.genre, fileUrl: r.fileUrl ?? r.file_url,
    durationSeconds: Number(r.duration) || 180,
    createdAt: r.createdAt ?? r.created_at,
  }));
}

async function voteTallies(): Promise<{ trackId: string; loves: number; skips: number }[]> {
  await ensureTables();
  const rows = await all<any>(`
    SELECT track_id,
      SUM(CASE WHEN vote = 'love' THEN 1 ELSE 0 END) as loves,
      SUM(CASE WHEN vote = 'skip' THEN 1 ELSE 0 END) as skips
    FROM radio_votes GROUP BY track_id
  `, []);
  return rows.map((r) => ({ trackId: String(r.trackId ?? r.track_id), loves: Number(r.loves) || 0, skips: Number(r.skips) || 0 }));
}

async function requestCounts(station: string): Promise<{ trackId: string; count: number }[]> {
  await ensureTables();
  const rows = await all<any>(`
    SELECT track_id, COUNT(*) as count FROM radio_requests
    WHERE station = ? AND at > ? GROUP BY track_id ORDER BY count DESC LIMIT 8
  `, [station, nowSec() - 86400]);
  return rows.map((r) => ({ trackId: String(r.trackId ?? r.track_id), count: Number(r.count) || 0 }));
}

export async function stationNow(station: string): Promise<(NowPlaying & { station: string; daypart: Daypart; listeners: number }) | null> {
  const [tracks, votes, requests] = await Promise.all([
    stationTracks(station), voteTallies(), requestCounts(station),
  ]);
  const part = daypartForHour(new Date().getUTCHours());
  const rotation = buildRotation({ station, epochDay: epochDay(), tracks, votes, requests, daypart: part });
  const now = playhead(rotation, nowSec(), epochDay());
  if (!now) return null;
  maybeSyndicate(station, now); // fire-and-forget, throttled
  return { ...now, station, daypart: part, listeners: listeners.activeListeners(station, nowSec()) };
}

// ── Votes / requests ────────────────────────────────────────────────────────

export async function castVote(userId: string, trackId: string, vote: 'love' | 'skip'): Promise<void> {
  await ensureTables();
  await run(`INSERT INTO radio_votes (track_id, user_id, vote, at) VALUES (?, ?, ?, ?)
             ON CONFLICT(track_id, user_id) DO UPDATE SET vote = excluded.vote, at = excluded.at`,
    [trackId, userId, vote, nowSec()]);
}

export async function requestTrack(userId: string, station: string, trackId: string): Promise<void> {
  await ensureTables();
  await run(`INSERT INTO radio_requests (track_id, user_id, station, at) VALUES (?, ?, ?, ?)`,
    [trackId, userId, station, nowSec()]);
}

// ── Airplay persistence + analytics ────────────────────────────────────────

export async function flushAirplay(): Promise<void> {
  await ensureTables();
  const drained = listeners.drainAirplay();
  const day = epochDay();
  for (const [artist, seconds] of drained) {
    await run(`INSERT INTO radio_airplay (day, artist_user_id, seconds) VALUES (?, ?, ?)`,
      [day, artist, Math.round(seconds)]);
  }
}

export async function realAnalytics(): Promise<any> {
  await ensureTables();
  const now = nowSec();
  const byArtist = await all<any>(`
    SELECT artist_user_id, SUM(seconds) as seconds FROM radio_airplay
    GROUP BY artist_user_id ORDER BY seconds DESC LIMIT 20
  `, []);
  const unsettled = await get<any>(`SELECT SUM(seconds) as s FROM radio_airplay WHERE settled = 0`, []);
  return {
    real_time_listeners: listeners.totalActive(now),
    listening_hours_this_boot: listeners.listeningHours(),
    top_airplay_artists: byArtist.map((r) => ({ artist: r.artistUserId ?? r.artist_user_id, seconds: Number(r.seconds) })),
    unsettled_airplay_seconds: Number(unsettled?.s) || 0,
    royalty_pool_cents: Number(process.env.RADIO_ROYALTY_POOL_CENTS ?? 0),
    peers_syndicating: feedPeers().map((p) => p.id),
  };
}

// ── Royalty settlement (Art. III + IV: deterministic, balanced, human-run) ──

export async function settleRoyalties(adminUserId: string): Promise<any> {
  await ensureTables();
  await flushAirplay();
  const poolCents = Number(process.env.RADIO_ROYALTY_POOL_CENTS ?? 0);
  if (!Number.isInteger(poolCents) || poolCents <= 0) {
    return { settled: false, reason: 'RADIO_ROYALTY_POOL_CENTS is not configured (integer cents, > 0).' };
  }
  const rows = await all<any>(`
    SELECT artist_user_id, SUM(seconds) as seconds FROM radio_airplay WHERE settled = 0 GROUP BY artist_user_id
  `, []);
  const secondsByArtist = new Map<string, number>(
    rows.map((r) => [String(r.artistUserId ?? r.artist_user_id), Number(r.seconds) || 0]),
  );
  const shares = splitRoyaltyPool(poolCents, secondsByArtist);
  if (shares.length === 0) return { settled: false, reason: 'No unsettled airplay.' };

  // One balanced double-entry transaction: platform debits the pool, each
  // artist credits their exact share. Sums to zero by construction.
  const txId = await LedgerService.createBalancedTransaction({
    tenantId: 'v12-radio',
    type: 'radio_royalty' as any,
    description: `V12 Radio airplay royalty settlement (${shares.length} artists, pool ${poolCents}¢)`,
    entries: [
      { accountType: 'PLATFORM', amount: -shares.reduce((s, x) => s + x.cents, 0) / 100 },
      ...shares.map((sh) => ({ accountType: 'USER' as const, userId: sh.artistUserId, amount: sh.cents / 100 })),
    ],
    metadata: { settledBy: adminUserId, shares },
    reference: `radio-royalty-${epochDay()}`,
  });
  await run(`UPDATE radio_airplay SET settled = 1 WHERE settled = 0`, []);

  // Headless Financial — the accounting system of record hears every settlement.
  await recordWithHeadlessFinancial({
    kind: 'royalty_settlement',
    reference: String(txId),
    description: `V12 Radio airplay royalty settlement (${shares.length} artists)`,
    amountCents: poolCents,
    parties: [
      { role: 'platform', amountCents: -shares.reduce((s, x) => s + x.cents, 0) },
      ...shares.map((sh) => ({ role: 'artist' as const, userId: sh.artistUserId, amountCents: sh.cents })),
    ],
    metadata: { settledBy: adminUserId, day: epochDay() },
  });

  return { settled: true, transactionId: txId, poolCents, shares };
}

// ── AI host (Gemini upgrade over the deterministic script) ─────────────────

function ecosystemHeadlines(): string[] {
  try {
    const inboxPath = path.join(process.cwd(), 'ecosystem-inbox.jsonl');
    if (!fs.existsSync(inboxPath)) return [];
    const lines = fs.readFileSync(inboxPath, 'utf8').trim().split('\n').slice(-12);
    const headlines: string[] = [];
    for (const line of lines.reverse()) {
      try {
        const env = JSON.parse(line);
        const p = env.payload ?? {};
        if (env.type === 'marketing.suggestion.created' && p.aboutTitle) {
          headlines.push(`R.M.P.M just reviewed "${p.aboutTitle}" — marketing score ${p.score} out of 100.`);
        } else if (env.type === 'marketing.campaign.launched' && p.name) {
          headlines.push(`Campaign on the wire: ${p.name}.`);
        } else if (env.type === 'content.track.available' && p.title) {
          headlines.push(`Fresh on SonicStream: "${p.title}" is live now.`);
        }
        if (headlines.length >= 3) break;
      } catch { /* skip bad line */ }
    }
    return headlines;
  } catch {
    return [];
  }
}

export async function hostBreak(station: string): Promise<{ script: string; source: string }> {
  const now = await stationNow(station);
  const part = daypartForHour(new Date().getUTCHours());
  // Paid sponsor line (measured-reach advertising) leads the break when booked.
  let sponsorLine: string | null = null;
  try {
    const { activeSponsorLine } = await import('./Sponsorship.js');
    sponsorLine = await activeSponsorLine(station);
  } catch { /* sponsorship module optional in isolated tests */ }
  const fallback = hostScript({
    station,
    current: now?.track ?? null,
    next: now?.next ?? null,
    listeners: now?.listeners ?? 0,
    daypart: part,
    ecosystemHeadlines: ecosystemHeadlines(),
  });
  const scriptBase = sponsorLine ? `${sponsorLine} ${fallback}` : fallback;

  const key = config.GEMINI_API_KEY;
  if (!key) return { script: scriptBase, source: 'deterministic' };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text:
            `You are the on-air host of V12 Radio (station: ${station}, daypart: ${part}). ` +
            `Rewrite this DJ break to sound warm, confident and human — 3 sentences max, no emoji, keep every fact (especially any sponsor message): "${scriptBase}"` } ] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 160 },
        }),
      },
    );
    if (res.ok) {
      const data: any = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === 'string' && text.trim()) return { script: text.trim(), source: 'gemini' };
    }
  } catch { /* deterministic fallback stands */ }
  return { script: scriptBase, source: 'deterministic' };
}

// ── Ecosystem syndication (Sociofy, SonicWave, CEOS, …) ────────────────────

const lastSyndicated = new Map<string, number>(); // station -> epoch sec

function maybeSyndicate(station: string, now: NowPlaying): void {
  const at = nowSec();
  const last = lastSyndicated.get(station) ?? 0;
  if (at - last < 3600 || feedPeers().length === 0) return; // hourly per station
  lastSyndicated.set(station, at);
  void publishToFeeds('content.track.available', {
    trackId: now.track.id,
    artistEcosystemUserId: now.track.userId,
    title: now.track.title,
    durationSeconds: now.track.durationSeconds,
    streamUrl: now.track.fileUrl && /^https?:\/\//.test(now.track.fileUrl)
      ? now.track.fileUrl
      : `${config.PUBLIC_BASE_URL || config.APP_URL}/radio/${station}`,
    licensable: false,
  }, {
    subjectUserId: now.track.userId,
    rationale: `V12 Radio "${station}" is on air with "${now.track.title}" — syndicating the hourly now-playing to Sociofy, SonicWave and peer feeds`,
  }).catch((err) => console.warn('[radio] syndication skipped:', err?.message ?? err));
}

// Periodic airplay flush so restarts lose at most a few minutes of accrual.
setInterval(() => { void flushAirplay().catch(() => {}); }, 5 * 60_000).unref?.();
