/**
 * RadioLiveClient — drop-in live-sync client for RadioHub.
 *
 * Gives any component real radio behavior in ~10 lines:
 *
 *   const radio = createRadioLiveClient('lofi', {
 *     onNowPlaying: (np) => { audio.src = np.track.fileUrl; audio.currentTime = np.offsetSeconds; },
 *     onListeners: (n) => setListeners(n),
 *     onHostBreak: (script) => speak(script),   // optional
 *   });
 *   radio.start();  // …later: radio.stop()
 *
 * What it does:
 *  - Polls /now-playing with server-clock drift correction, so playback
 *    position matches every other listener (fires onNowPlaying on track
 *    change and when local playback drifts > 2.5s from broadcast).
 *  - Heartbeats every 30s → real listener counts + artist airplay royalties.
 *  - Fetches an AI host break between tracks (once per track transition)
 *    and can speak it with the browser's built-in TTS — zero-cost DJ voice.
 *  - vote()/request() for listener-shaped rotation.
 *  - crossfade(a, b) helper: equal-power fade between two HTMLAudioElements
 *    so transitions flow like FM, not like a playlist.
 */

export interface LiveNowPlaying {
  station: string;
  track: { id: string; userId: string; title: string; artistName?: string; fileUrl?: string; durationSeconds: number };
  offsetSeconds: number;
  endsAtEpochSec: number;
  next: { id: string; title: string } | null;
  listeners: number;
  daypart: string;
  serverEpochSec: number;
}

export interface RadioLiveOptions {
  onNowPlaying: (np: LiveNowPlaying) => void;
  onListeners?: (count: number) => void;
  onHostBreak?: (script: string) => void;
  /** Return current local playback position (sec) for drift correction. */
  getLocalPosition?: () => number;
  pollMs?: number;
  authToken?: () => string | null;
}

export function createRadioLiveClient(station: string, opts: RadioLiveOptions) {
  const sessionId = `rl_${Math.random().toString(36).slice(2, 11)}`;
  let currentTrackId: string | null = null;
  let clockSkewSec = 0;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let lastArtist: string | undefined;

  const headers = (): Record<string, string> => {
    const token = opts.authToken?.() ?? (typeof localStorage !== 'undefined'
      ? localStorage.getItem('token') ?? localStorage.getItem('authToken') : null);
    return {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    };
  };

  async function poll(): Promise<void> {
    try {
      const res = await fetch(`/api/radio/${encodeURIComponent(station)}/now-playing`, { headers: headers() });
      if (!res.ok) return;
      const np: LiveNowPlaying = await res.json();
      clockSkewSec = np.serverEpochSec - Math.floor(Date.now() / 1000);
      opts.onListeners?.(np.listeners);
      lastArtist = np.track.userId;

      const trackChanged = np.track.id !== currentTrackId;
      const localPos = opts.getLocalPosition?.();
      const broadcastPos = np.offsetSeconds;
      const drifted = localPos !== undefined && Math.abs(localPos - broadcastPos) > 2.5;

      if (trackChanged || drifted) {
        currentTrackId = np.track.id;
        opts.onNowPlaying(np);
        if (trackChanged && opts.onHostBreak) {
          try {
            const hb = await fetch(`/api/radio/${encodeURIComponent(station)}/host-break`, { headers: headers() });
            if (hb.ok) {
              const { script } = await hb.json();
              if (script) opts.onHostBreak(script);
            }
          } catch { /* host is optional */ }
        }
      }
    } catch { /* transient network — next poll recovers */ }
  }

  async function ping(): Promise<void> {
    try {
      await fetch('/api/radio/session/ping', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ sessionId, station, trackId: currentTrackId, artistUserId: lastArtist }),
      });
    } catch { /* next heartbeat recovers */ }
  }

  return {
    sessionId,
    start(): void {
      void poll(); void ping();
      pollTimer = setInterval(poll, opts.pollMs ?? 10_000);
      pingTimer = setInterval(ping, 30_000);
    },
    stop(): void {
      if (pollTimer) clearInterval(pollTimer);
      if (pingTimer) clearInterval(pingTimer);
      void fetch('/api/radio/session/stop', { method: 'POST', headers: headers(), body: JSON.stringify({ sessionId }) }).catch(() => {});
    },
    /** Corrected "broadcast now" — use when seeking: serverNow - startedAt. */
    serverNowSec(): number {
      return Math.floor(Date.now() / 1000) + clockSkewSec;
    },
    async vote(trackId: string, vote: 'love' | 'skip'): Promise<void> {
      await fetch(`/api/radio/track/${encodeURIComponent(trackId)}/vote`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ vote }),
      });
    },
    async request(trackId: string): Promise<void> {
      await fetch('/api/radio/request', {
        method: 'POST', headers: headers(), body: JSON.stringify({ station, trackId }),
      });
    },
  };
}

/** Speak a host break with the browser's built-in voice (no TTS bill). */
export function speakHostBreak(script: string, opts: { rate?: number; onDone?: () => void } = {}): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) { opts.onDone?.(); return; }
  const u = new SpeechSynthesisUtterance(script);
  u.rate = opts.rate ?? 1.02;
  u.pitch = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => /en[-_]/i.test(v.lang) && /male|david|daniel|guy/i.test(v.name)) ?? voices.find((v) => /en[-_]/i.test(v.lang));
  if (preferred) u.voice = preferred;
  if (opts.onDone) u.onend = opts.onDone;
  window.speechSynthesis.speak(u);
}

/**
 * Equal-power crossfade between two audio elements over `ms` milliseconds.
 * Call with the outgoing element and the (already-seeked, paused) incoming one.
 */
export function crossfade(outgoing: HTMLAudioElement, incoming: HTMLAudioElement, ms = 2400): Promise<void> {
  return new Promise((resolve) => {
    const steps = 24;
    const stepMs = ms / steps;
    let i = 0;
    incoming.volume = 0;
    void incoming.play();
    const timer = setInterval(() => {
      i++;
      const x = i / steps;
      outgoing.volume = Math.max(0, Math.cos((x * Math.PI) / 2));
      incoming.volume = Math.min(1, Math.sin((x * Math.PI) / 2));
      if (i >= steps) {
        clearInterval(timer);
        outgoing.pause();
        outgoing.volume = 1;
        resolve();
      }
    }, stepMs);
  });
}
