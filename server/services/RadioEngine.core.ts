/**
 * V12 RADIO ENGINE — deterministic core.
 *
 * The defining property of radio: EVERYONE HEARS THE SAME THING AT THE SAME
 * MOMENT. This core makes that true with math instead of streaming infra:
 * the rotation for a station is a pure function of (station, epoch day,
 * votes, requests), and the playhead is a pure function of the clock. Any
 * two clients that ask "what's playing?" at the same second get the same
 * track at the same offset — no server state, no sync protocol.
 *
 * Also pure here: listener sessions (heartbeat-based, injected clock),
 * airplay accrual per artist, and the royalty split — integer cents that
 * sum EXACTLY to the pool (Constitution Art. III: money is deterministic,
 * floats are forbidden).
 */

export interface RadioTrack {
  id: string;
  userId: string;
  title: string;
  artistName?: string;
  genre?: string;
  fileUrl?: string;
  durationSeconds: number; // COALESCEd to a sane default upstream
  createdAt?: string;
}

export interface VoteTally {
  trackId: string;
  loves: number;
  skips: number;
}

// ── Deterministic PRNG (mulberry32) — same seed, same order, every client ──

export function hashSeed(...parts: (string | number)[]): number {
  let h = 0x9e3779b9;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 0x85ebca6b) >>> 0;
    }
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Dayparting ───────────────────────────────────────────────────────────────

export type Daypart = 'sunrise' | 'daytime' | 'peak' | 'late';

export function daypartForHour(hourUtc: number): Daypart {
  if (hourUtc >= 5 && hourUtc < 10) return 'sunrise';   // gentle wake-up
  if (hourUtc >= 10 && hourUtc < 17) return 'daytime';  // steady rotation
  if (hourUtc >= 17 && hourUtc < 23) return 'peak';     // high energy, fresh drops first
  return 'late';                                        // deep cuts, long tracks
}

/** Daypart bias — deterministic score adjustment, not a filter (small catalogs survive). */
function daypartBias(track: RadioTrack, part: Daypart): number {
  const dur = track.durationSeconds;
  const ageDays = track.createdAt ? Math.max(0, (Date.parse('2100-01-01') - Date.parse(track.createdAt)) / 86400000) : 999;
  switch (part) {
    case 'sunrise': return dur <= 240 ? 0.1 : -0.05;
    case 'peak': return (ageDays < 36500 - 30 ? 0.15 : 0) + (dur <= 300 ? 0.05 : -0.05); // fresh + tight
    case 'late': return dur >= 300 ? 0.15 : -0.05;      // long-form wins at night
    default: return 0;
  }
}

// ── Rotation ─────────────────────────────────────────────────────────────────

export interface RotationInput {
  station: string;
  epochDay: number;              // floor(now / 86400) — rotation reshuffles daily
  tracks: RadioTrack[];
  votes?: VoteTally[];
  /** trackIds requested by listeners; pinned into every 4th slot, most-requested first. */
  requests?: { trackId: string; count: number }[];
  daypart?: Daypart;
}

/**
 * Deterministic weighted rotation. Votes shift a track's standing
 * (love +8%, skip −12%, clamped ±60%); requests pin into every 4th slot.
 * Same inputs → identical order on every machine.
 */
export function buildRotation(input: RotationInput): RadioTrack[] {
  const { station, epochDay, tracks } = input;
  if (tracks.length === 0) return [];
  const votes = new Map((input.votes ?? []).map((v) => [v.trackId, v]));

  const scored = tracks.map((t) => {
    const rng = mulberry32(hashSeed(station, epochDay, t.id));
    const v = votes.get(t.id);
    const voteWeight = Math.max(0.4, Math.min(1.6, 1 + (v ? v.loves * 0.08 - v.skips * 0.12 : 0)));
    const bias = input.daypart ? daypartBias(t, input.daypart) : 0;
    return { track: t, score: rng() * voteWeight + bias };
  });
  scored.sort((a, b) => b.score - a.score || a.track.id.localeCompare(b.track.id));
  let rotation = scored.map((s) => s.track);

  // Pin requests: most-requested tracks take slots 3, 7, 11… (0-indexed).
  const requested = [...(input.requests ?? [])]
    .sort((a, b) => b.count - a.count || a.trackId.localeCompare(b.trackId))
    .map((r) => rotation.find((t) => t.id === r.trackId))
    .filter((t): t is RadioTrack => !!t);
  if (requested.length > 0) {
    const rest = rotation.filter((t) => !requested.some((r) => r.id === t.id));
    rotation = [];
    let slot = 0, reqIdx = 0, restIdx = 0;
    while (restIdx < rest.length || reqIdx < requested.length) {
      if (slot % 4 === 3 && reqIdx < requested.length) rotation.push(requested[reqIdx++]);
      else if (restIdx < rest.length) rotation.push(rest[restIdx++]);
      else rotation.push(requested[reqIdx++]);
      slot++;
    }
  }
  return rotation;
}

// ── The synchronized playhead ────────────────────────────────────────────────

export interface NowPlaying {
  track: RadioTrack;
  index: number;
  offsetSeconds: number;
  startedAtEpochSec: number;
  endsAtEpochSec: number;
  next: RadioTrack | null;
  loopSeconds: number;
}

/**
 * Where the station is RIGHT NOW. Pure function of the clock — every client
 * computing this at second N gets the identical answer.
 */
export function playhead(rotation: RadioTrack[], nowEpochSec: number, epochDay: number): NowPlaying | null {
  if (rotation.length === 0) return null;
  const loop = rotation.reduce((sum, t) => sum + Math.max(30, t.durationSeconds), 0);
  const dayStart = epochDay * 86400;
  const into = ((nowEpochSec - dayStart) % loop + loop) % loop;

  let acc = 0;
  for (let i = 0; i < rotation.length; i++) {
    const dur = Math.max(30, rotation[i].durationSeconds);
    if (into < acc + dur) {
      const offset = Math.floor(into - acc);
      return {
        track: rotation[i],
        index: i,
        offsetSeconds: offset,
        startedAtEpochSec: nowEpochSec - offset,
        endsAtEpochSec: nowEpochSec - offset + dur,
        next: rotation[(i + 1) % rotation.length],
        loopSeconds: loop,
      };
    }
    acc += dur;
  }
  return null; // unreachable
}

// ── Listener sessions & airplay accrual (injected clock) ───────────────────

export interface SessionPing {
  sessionId: string;
  station: string;
  userId?: string;
  trackId?: string;
  artistUserId?: string;
  at: number; // epoch sec
}

export class ListenerRegistry {
  private lastPing = new Map<string, SessionPing>();
  /** artistUserId -> accrued seconds of audience-weighted airplay */
  private airplay = new Map<string, number>();
  private hours = 0;

  constructor(private staleAfterSec = 75) {}

  ping(p: SessionPing): void {
    const prev = this.lastPing.get(p.sessionId);
    this.lastPing.set(p.sessionId, p);
    if (prev && p.at > prev.at && p.at - prev.at <= this.staleAfterSec) {
      const seconds = p.at - prev.at;
      this.hours += seconds / 3600;
      if (prev.artistUserId) {
        this.airplay.set(prev.artistUserId, (this.airplay.get(prev.artistUserId) ?? 0) + seconds);
      }
    }
  }

  stop(sessionId: string): void {
    this.lastPing.delete(sessionId);
  }

  activeListeners(station: string, nowSec: number): number {
    let n = 0;
    for (const p of this.lastPing.values()) {
      if (p.station === station && nowSec - p.at <= this.staleAfterSec) n++;
    }
    return n;
  }

  totalActive(nowSec: number): number {
    let n = 0;
    for (const p of this.lastPing.values()) if (nowSec - p.at <= this.staleAfterSec) n++;
    return n;
  }

  listeningHours(): number {
    return Math.round(this.hours * 100) / 100;
  }

  /** Audience-weighted airplay seconds per artist since last drain. */
  drainAirplay(): Map<string, number> {
    const out = this.airplay;
    this.airplay = new Map();
    return out;
  }

  snapshotAirplay(): Map<string, number> {
    return new Map(this.airplay);
  }
}

// ── Royalties (Constitution Art. III — integer cents, exact sums) ──────────

export interface RoyaltyShare {
  artistUserId: string;
  seconds: number;
  cents: number;
}

/**
 * Split a pool of integer cents pro-rata by airplay seconds. Largest-remainder
 * method: shares sum to EXACTLY poolCents, no float drift, deterministic
 * ordering. Empty airplay → everything stays with the platform (cents: []).
 */
export function splitRoyaltyPool(poolCents: number, secondsByArtist: Map<string, number>): RoyaltyShare[] {
  if (!Number.isInteger(poolCents) || poolCents <= 0) return [];
  const entries = [...secondsByArtist.entries()].filter(([, s]) => s > 0).sort((a, b) => a[0].localeCompare(b[0]));
  const total = entries.reduce((sum, [, s]) => sum + s, 0);
  if (total <= 0) return [];

  const raw = entries.map(([artist, seconds]) => {
    const exact = (poolCents * seconds) / total;
    return { artist, seconds, floor: Math.floor(exact), frac: exact - Math.floor(exact) };
  });
  let assigned = raw.reduce((sum, r) => sum + r.floor, 0);
  // Distribute the remainder to largest fractional parts (ties: artist id order).
  const byFrac = [...raw].sort((a, b) => b.frac - a.frac || a.artist.localeCompare(b.artist));
  for (let i = 0; assigned < poolCents; i = (i + 1) % byFrac.length) {
    byFrac[i].floor += 1;
    assigned += 1;
  }
  return raw.map((r) => ({ artistUserId: r.artist, seconds: r.seconds, cents: r.floor }));
}

// ── DJ host script (deterministic fallback; Gemini upgrades it upstream) ───

export function hostScript(args: {
  station: string;
  current: RadioTrack | null;
  next: RadioTrack | null;
  listeners: number;
  daypart: Daypart;
  ecosystemHeadlines: string[];
}): string {
  const lines: string[] = [];
  const partLine: Record<Daypart, string> = {
    sunrise: 'Good morning — you are up with the sun on V12 Radio.',
    daytime: 'This is V12 Radio, keeping the day moving.',
    peak: 'Prime time on V12 Radio — the whole ecosystem is tuned in.',
    late: 'Late shift on V12 Radio. Lights low, volume up.',
  };
  lines.push(partLine[args.daypart]);
  if (args.current) {
    lines.push(`That was "${args.current.title}"${args.current.artistName ? ` by ${args.current.artistName}` : ''}.`);
  }
  if (args.listeners > 1) {
    lines.push(`${args.listeners} of you are locked in with us right now.`);
  }
  for (const h of args.ecosystemHeadlines.slice(0, 2)) {
    lines.push(`From the V12 wire: ${h}`);
  }
  if (args.next) {
    lines.push(`Up next — "${args.next.title}"${args.next.artistName ? ` from ${args.next.artistName}` : ''}. Stay with us.`);
  }
  return lines.join(' ');
}
