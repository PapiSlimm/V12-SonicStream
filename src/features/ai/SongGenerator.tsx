import { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Sparkles, Download, Loader2, Mic2 } from 'lucide-react';
import { apiFetch } from '../../api/apiFetch';
import { toast } from '../../components/ui/Toast';

interface SongResult {
  audioUrl: string;
  title?: string;
  savedToLibrary?: boolean;
  durationMs?: number;
}

export const SongGenerator = () => {
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  const [instrumental, setInstrumental] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SongResult | null>(null);

  const generate = async () => {
    if (!style.trim()) { toast.error('Describe the style of your song first'); return; }
    if (!instrumental && !lyrics.trim()) { toast.error('Add lyrics, or switch to Instrumental mode'); return; }
    setGenerating(true);
    setResult(null);
    try {
      const res = await apiFetch<SongResult>('/api/ai/generate-song', {
        method: 'POST',
        body: JSON.stringify({ lyrics, style, instrumental })
      });
      setResult(res);
      toast.success(res.savedToLibrary ? 'Your song is ready — saved to your library' : 'Your song is ready');
    } catch (e: any) {
      toast.error(e?.message || 'Song generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black flex items-center justify-center gap-3">
          <Music className="w-8 h-8 text-teal-400" /> AI Song Generator
        </h2>
        <p className="text-zinc-400">
          Full songs with vocals, up to 5 minutes — powered by MiniMax Music 3.0
        </p>
      </div>

      <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold text-zinc-300 mb-2">
            Style &amp; mood <span className="text-zinc-500 font-normal">(genre, vocals, instruments, BPM…)</span>
          </label>
          <textarea
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Warm acoustic pop, intimate female vocals, fingerpicked guitar, soft piano, gradual build into a wide final chorus"
            rows={3}
            maxLength={2000}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:border-teal-400/50 focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setInstrumental(!instrumental)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              instrumental ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-white/5 text-zinc-400 border border-white/10'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5 inline mr-1.5" />
            {instrumental ? 'Instrumental — no vocals' : 'With vocals'}
          </button>
        </div>

        {!instrumental && (
          <div>
            <label className="block text-sm font-bold text-zinc-300 mb-2">
              Lyrics <span className="text-zinc-500 font-normal">(use [Verse], [Chorus], [Bridge] tags)</span>
            </label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder={'[Verse]\nMorning light filtering through the pine\n[Chorus]\nSoftly the world begins to breathe'}
              rows={8}
              maxLength={5000}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono focus:border-teal-400/50 focus:outline-none resize-none"
            />
          </div>
        )}

        <button
          onClick={generate}
          disabled={generating}
          className="w-full py-4 rounded-xl font-black uppercase tracking-wider bg-gradient-to-r from-teal-500 to-cyan-500 text-black disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition"
        >
          {generating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Composing your song… this takes 1–3 minutes</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Generate Song</>
          )}
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/60 border border-teal-500/30 rounded-2xl p-6 space-y-4"
        >
          <h3 className="font-black text-lg flex items-center gap-2">
            <Music className="w-5 h-5 text-teal-400" /> Your Song
            {result.durationMs ? (
              <span className="text-xs text-zinc-500 font-normal">
                {Math.round(result.durationMs / 1000)}s
              </span>
            ) : null}
          </h3>
          <audio controls src={result.audioUrl} className="w-full" />
          <a
            href={result.audioUrl}
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition"
          >
            <Download className="w-4 h-4" /> Download MP3
          </a>
        </motion.div>
      )}
    </div>
  );
};
