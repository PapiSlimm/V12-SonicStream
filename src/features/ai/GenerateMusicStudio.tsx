import { useState } from 'react';
import { Radio, Sparkles, Loader2, Play, Music, Wand2, Disc3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '../../firebase';

/**
 * Generate Music — two modes:
 *  1. Instant Station: an AI DJ assembles a continuous mix from the live catalog
 *     (free, instant, no new audio).
 *  2. AI Audio: real text-to-music generation via MusicGen, stored and optionally
 *     published as a sellable track (premium).
 *
 * The generate call uses its own long-timeout fetch because MusicGen can take
 * up to ~60s — the shared apiFetch aborts at 10s.
 */
async function authedFetch(url: string, body: unknown, timeoutMs: number): Promise<any> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || `Request failed (${res.status})`);
    return text ? JSON.parse(text) : {};
  } finally {
    clearTimeout(timer);
  }
}

interface QueueItem { id: number; title: string; artist: string; genre: string; url: string | null; price: number; }

const GENRES = ['Hip-Hop', 'Electronic', 'R&B', 'Pop', 'Afrobeats', 'Lo-Fi', 'Trap', 'House', 'Jazz', 'Rock'];
const MOODS = ['Chill', 'Energetic', 'Dark', 'Uplifting', 'Romantic', 'Focus'];
const ENERGY = ['Low', 'Medium', 'High'];

export const GenerateMusicStudio = () => {
  const [mode, setMode] = useState<'station' | 'audio'>('station');

  // Instant station
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState('');
  const [station, setStation] = useState<{ name: string } | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loadingStation, setLoadingStation] = useState(false);

  // AI audio
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(15);
  const [publish, setPublish] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('1.99');
  const [result, setResult] = useState<{ url: string; trackId?: number; published?: boolean } | null>(null);
  const [generating, setGenerating] = useState(false);

  const buildStation = async () => {
    setLoadingStation(true);
    try {
      const d = await authedFetch('/api/ai/music/instant-station', { genre, mood, energy }, 15000);
      setStation(d.station ?? null);
      setQueue(d.queue ?? []);
      if (!d.queue?.length) toast('No live tracks yet — upload or approve tracks to fill the station.');
    } catch (e: any) {
      toast.error(e?.message || 'Could not build station');
    } finally {
      setLoadingStation(false);
    }
  };

  const generateAudio = async () => {
    if (prompt.trim().length < 3) { toast.error('Describe the music you want first.'); return; }
    setGenerating(true);
    setResult(null);
    const id = toast.loading('Composing your track… this can take up to a minute.');
    try {
      const d = await authedFetch('/api/ai/music/generate', { prompt, durationSec: duration, publish, title, price }, 120000);
      setResult({ url: d.url, trackId: d.trackId, published: d.published });
      toast.success(d.published ? 'Track generated and published to your catalog!' : 'Track generated!', { id });
    } catch (e: any) {
      toast.error(e?.message || 'Generation failed', { id });
    } finally {
      setGenerating(false);
    }
  };

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
        active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/5 text-zinc-400 border border-white/5 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-emerald-400">
          <Sparkles size={18} />
          <span className="text-xs font-black uppercase tracking-widest">V12 Radio · Generate</span>
        </div>
        <h2 className="text-3xl font-black text-white mt-1">Generate Music</h2>
        <p className="text-zinc-400 text-sm mt-1">Spin up an instant AI station from your catalog, or compose a brand-new track with AI.</p>
      </div>

      {/* Mode switch */}
      <div className="inline-flex bg-black/40 border border-white/10 rounded-2xl p-1">
        <button
          onClick={() => setMode('station')}
          className={`px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${mode === 'station' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          <Radio size={16} /> Instant Station
        </button>
        <button
          onClick={() => setMode('audio')}
          className={`px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${mode === 'audio' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          <Wand2 size={16} /> AI Audio <span className="text-[9px] uppercase tracking-widest text-emerald-300/80">Premium</span>
        </button>
      </div>

      {mode === 'station' ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Genre</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => <Chip key={g} label={g} active={genre === g} onClick={() => setGenre(genre === g ? '' : g)} />)}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Mood</p>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => <Chip key={m} label={m} active={mood === m} onClick={() => setMood(mood === m ? '' : m)} />)}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Energy</p>
              <div className="flex flex-wrap gap-2">
                {ENERGY.map((e) => <Chip key={e} label={e} active={energy === e} onClick={() => setEnergy(energy === e ? '' : e)} />)}
              </div>
            </div>
          </div>
          <button
            onClick={buildStation}
            disabled={loadingStation}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2"
          >
            {loadingStation ? <Loader2 size={16} className="animate-spin" /> : <Disc3 size={16} />}
            Build my station
          </button>

          {station && (
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-emerald-400" />
                <h3 className="font-black text-white">{station.name}</h3>
                <span className="text-xs text-zinc-500">· {queue.length} tracks</span>
              </div>
              <div className="divide-y divide-white/5">
                {queue.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3 py-2.5">
                    <span className="text-zinc-600 text-xs w-5">{i + 1}</span>
                    <Music size={14} className="text-emerald-400/70 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{t.title}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{t.artist} · {t.genre}</p>
                    </div>
                    {t.url && (
                      <audio controls preload="none" src={t.url} className="h-8 max-w-[220px]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Describe the music</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. warm lo-fi hip-hop with dusty vinyl crackle, mellow Rhodes chords, and a laid-back boom-bap groove at 82 BPM"
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-emerald-500/40"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Length</label>
            <input type="range" min={5} max={30} value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="flex-1 accent-emerald-500" />
            <span className="text-sm font-black text-white w-12 text-right">{duration}s</span>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
              <span className="text-sm font-bold text-white">Publish as a sellable track</span>
            </label>
            {publish && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Track title" className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none" />
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-3">
                  <span className="text-zinc-500 text-sm">$</span>
                  <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="w-full bg-transparent px-1 py-2 text-white text-sm outline-none" />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={generateAudio}
            disabled={generating}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {generating ? 'Composing…' : 'Generate track'}
          </button>

          {result && (
            <div className="bg-white/[0.03] border border-emerald-500/20 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Play size={16} /><span className="font-black text-sm">Your generated track</span>
              </div>
              <audio controls autoPlay src={result.url} className="w-full" />
              <div className="flex items-center gap-3 text-xs">
                <a href={result.url} download className="text-emerald-400 hover:underline font-bold">Download MP3</a>
                {result.published && result.trackId && (
                  <span className="text-zinc-500">· Published as track #{result.trackId} (pending moderation)</span>
                )}
              </div>
            </div>
          )}
          <p className="text-[11px] text-zinc-600">Premium feature. Each generation counts against your plan’s AI usage; settlement is handled by Headless Financial.</p>
        </div>
      )}
    </div>
  );
};

export default GenerateMusicStudio;
