/**
 * ECOSYSTEM PUBLISHER — SonicStream's outbound feed syndication.
 *
 * One action inside SonicStream (track approved, post created, sale completed)
 * fans out as signed contract envelopes to every CONFIGURED peer feed:
 * Sociofy, CEOS, Orion Prime, Apex Atlas — and any future app.
 *
 * Configuration (all on SonicStream's side):
 *   V12_FEED_PEERS   "sociofy=https://...,ceos=https://...,orion-prime=https://...,apexatlas=https://..."
 *   V12_<PEER>_WEBHOOK_SECRET   per-pair signing key (min 32 chars), or
 *   V12_WEBHOOK_SECRET / ECOSYSTEM_SECRET as the shared fallback.
 *   V12_<PEER>_FEED_PATH        endpoint override; default /api/ecosystem/feed/events
 *                               (Sociofy's native receiver is /api/ecosystem/events —
 *                                preconfigured below.)
 *
 * Constitution alignment:
 *   - A destination is only ever reached because a human configured it
 *     (V12_FEED_PEERS) — per-destination clearance, §13.12 in spirit.
 *   - Publishing halts with the ecosystem (Art. X): while halted, dispatch
 *     is refused before any network call.
 *   - Every dispatch logs a plain-language rationale line (Art. V).
 *
 * Envelope + signature follow the published ecosystem contract
 * (Sociofy src/ecosystem/contract.ts, CONTRACT_VERSION 1.0).
 */
import { randomUUID } from 'node:crypto';
import { buildSignedWebhook } from '../../ecosystem/v12-webhook.js';
import { eventBus, EVENTS } from './EventBus.js';
import { constitutionEngine } from '../constitution/engine.js';

export const SELF_ID = 'sonicstream';
export const CONTRACT_VERSION = '1.0';

/** Event types SonicStream is an owner of, per the ecosystem contract. */
export const PUBLISHABLE_TYPES = [
  'content.track.available',
  'content.media.published',
  'identity.user.linked',
  'telemetry.activity',
] as const;
export type PublishableType = (typeof PUBLISHABLE_TYPES)[number];

const DEFAULT_FEED_PATH = '/api/ecosystem/feed/events';
/** Apps whose native receiver predates the uniform path. */
const NATIVE_PATHS: Record<string, string> = {
  sociofy: '/api/ecosystem/events',
  ceos: '/api/ecosystem/webhooks/sonicstream',
  rmpm: '/api/v1/ecosystem/feed/events',
};

function envKey(id: string): string {
  return id.toUpperCase().replace(/-/g, '_');
}

export interface FeedPeer {
  id: string;
  url: string;
  path: string;
  hasSecret: boolean;
}

function secretFor(peerId: string): string | undefined {
  const candidates = [
    process.env[`V12_${envKey(peerId)}_WEBHOOK_SECRET`],
    process.env.V12_WEBHOOK_SECRET,
    process.env.ECOSYSTEM_SECRET,
  ];
  return candidates.find((s) => typeof s === 'string' && s.length >= 32);
}

export function feedPeers(): FeedPeer[] {
  const peers: FeedPeer[] = [];
  for (const pair of (process.env.V12_FEED_PEERS ?? '').split(',')) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const id = trimmed.slice(0, eq).trim().toLowerCase();
    const url = trimmed.slice(eq + 1).trim().replace(/\/$/, '');
    if (!id || !/^https?:\/\//.test(url)) continue;
    const path = process.env[`V12_${envKey(id)}_FEED_PATH`] ?? NATIVE_PATHS[id] ?? DEFAULT_FEED_PATH;
    peers.push({ id, url, path, hasSecret: !!secretFor(id) });
  }
  return peers;
}

export interface DispatchResult {
  peer: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export interface PublishOutcome {
  envelopeId: string;
  type: string;
  dispatched: DispatchResult[];
}

/**
 * Sign and deliver one event to every configured peer. Skips (with a logged
 * reason) any peer lacking a signing secret — unsigned traffic is never sent.
 */
export async function publishToFeeds(
  type: PublishableType,
  payload: Record<string, unknown>,
  opts: { subjectUserId?: string; correlationId?: string; rationale?: string; fetchImpl?: typeof fetch } = {},
): Promise<PublishOutcome> {
  if (!PUBLISHABLE_TYPES.includes(type)) {
    throw new Error(`SonicStream is not an owner of event type "${type}" — refusing to publish.`);
  }

  // Art. X: publication is an action; it does not happen while halted.
  constitutionEngine().assertMayAct('ecosystem-publisher');

  const envelope = {
    id: `evt_${randomUUID()}`,
    type,
    version: CONTRACT_VERSION,
    source: SELF_ID,
    occurredAt: new Date().toISOString(),
    ...(opts.correlationId ? { correlationId: opts.correlationId } : {}),
    ...(opts.subjectUserId ? { subjectUserId: opts.subjectUserId } : {}),
    payload,
  };

  // Art. V: rationale recorded before the action clears.
  console.log(
    `[ecosystem-publisher] ${envelope.id} ${type}: ${opts.rationale ?? 'syndicating a SonicStream event to configured ecosystem feeds'}`,
  );

  const f = opts.fetchImpl ?? fetch;
  const peers = feedPeers();
  const dispatched: DispatchResult[] = [];

  await Promise.all(peers.map(async (peer) => {
    const secret = secretFor(peer.id);
    if (!secret) {
      dispatched.push({ peer: peer.id, ok: false, error: 'no signing secret configured — refused to send unsigned' });
      return;
    }
    const { headers, body } = buildSignedWebhook(secret, envelope);
    const target = `${peer.url}${peer.path}`;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await f(target, {
          method: 'POST',
          headers: { ...headers, 'X-V12-Service': SELF_ID },
          body,
        });
        if (res.status >= 200 && res.status < 300) {
          dispatched.push({ peer: peer.id, ok: true, status: res.status });
          return;
        }
        if (attempt === 2) dispatched.push({ peer: peer.id, ok: false, status: res.status, error: `HTTP ${res.status}` });
      } catch (err) {
        if (attempt === 2) dispatched.push({ peer: peer.id, ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }));

  const okCount = dispatched.filter((d) => d.ok).length;
  console.log(`[ecosystem-publisher] ${envelope.id} delivered to ${okCount}/${peers.length} peers`);
  return { envelopeId: envelope.id, type, dispatched };
}

// ── Automatic hooks ─────────────────────────────────────────────────────────

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/**
 * Subscribe the publisher to SonicStream's internal event bus so syndication
 * is automatic: approve a track / create a post / complete a sale in
 * SonicStream, and every configured peer feed hears about it.
 */
export function initEcosystemPublisher(): void {
  const peers = feedPeers();
  if (peers.length === 0) {
    console.log('[ecosystem-publisher] no V12_FEED_PEERS configured — feed syndication idle');
    return;
  }
  console.log(`[ecosystem-publisher] syndicating to: ${peers.map((p) => `${p.id}${p.hasSecret ? '' : ' (NO SECRET)'}`).join(', ')}`);

  eventBus.subscribe(EVENTS.TRACK_APPROVED, 'ecosystem-publisher', (p: any) => {
    const streamUrl = str(p?.streamUrl) || str(p?.url) || str(p?.audioUrl);
    if (!streamUrl || !/^https?:\/\//.test(streamUrl)) {
      console.warn('[ecosystem-publisher] track.approved lacked a public stream URL — not syndicated');
      return;
    }
    void publishToFeeds('content.track.available', {
      trackId: str(p?.trackId) || str(p?.id) || `trk_${Date.now()}`,
      artistEcosystemUserId: str(p?.artistId) || str(p?.userId) || 'unknown',
      title: str(p?.title, 'Untitled'),
      durationSeconds: num(p?.durationSeconds ?? p?.duration),
      streamUrl,
      licensable: !!p?.licensable,
      ...(typeof p?.priceCents === 'number' ? { licensePriceCents: p.priceCents } : {}),
    }, {
      subjectUserId: str(p?.artistId) || str(p?.userId) || undefined,
      rationale: `track "${str(p?.title, 'Untitled')}" approved and live on SonicStream; syndicating availability to peer feeds and marketplaces`,
    }).catch((err) => console.error('[ecosystem-publisher] track syndication failed:', err));
  });

  eventBus.subscribe(EVENTS.POST_CREATED, 'ecosystem-publisher', (p: any) => {
    const url = str(p?.mediaUrl) || str(p?.url);
    if (!url || !/^https?:\/\//.test(url)) return; // text-only posts stay local for now
    void publishToFeeds('content.media.published', {
      assetId: str(p?.postId) || str(p?.id) || `post_${Date.now()}`,
      ownerEcosystemUserId: str(p?.userId) || 'unknown',
      kind: str(p?.kind, 'image') as 'audio' | 'video' | 'image' | 'document',
      url,
      mimeType: str(p?.mimeType, 'application/octet-stream'),
      sizeBytes: num(p?.sizeBytes),
      ...(str(p?.title) ? { title: str(p?.title) } : {}),
      originService: SELF_ID,
    }, {
      subjectUserId: str(p?.userId) || undefined,
      rationale: 'a SonicStream post with public media was created; syndicating to peer feeds',
    }).catch((err) => console.error('[ecosystem-publisher] post syndication failed:', err));
  });

  eventBus.subscribe(EVENTS.SALE_COMPLETED, 'ecosystem-publisher', (p: any) => {
    void publishToFeeds('telemetry.activity', {
      ...(str(p?.userId) ? { ecosystemUserId: str(p?.userId) } : {}),
      action: 'sale.completed',
      service: SELF_ID,
    }, {
      rationale: 'a SonicStream sale completed; recording activity telemetry with peers',
    }).catch((err) => console.error('[ecosystem-publisher] sale telemetry failed:', err));
  });
}
