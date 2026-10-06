import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Download, RefreshCw, Music, Piano, Wand2, Volume2, Sliders, FileText } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { cn } from '../../utils/cn';
import { aiService } from '../../services/aiService';
import { apiFetch } from '../../api/apiFetch';

export const MelodyGenerator = () => {
  const [genre, setGenre] = useState('Lo-Fi');
  const [mood, setMood] = useState('Chilled');
  const [complexity, setComplexity] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMelody, setGeneratedMelody] = useState<string | null>(null);
  const [melodyConcept, setMelodyConcept] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const genres = ['Lo-Fi', 'Techno', 'Hip Hop', 'Ambient', 'Synthwave', 'Jazz'];
  const moods = ['Chilled', 'Energetic', 'Dark', 'Hopeful', 'Melancholic', 'Epic'];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedMelody(null);
    setMelodyConcept(null);
    setIsPlaying(false);

    try {
      // 1. Generate the concept/report
      const concept = await aiService.generateMelodyConcept(genre, mood, complexity);
      setMelodyConcept(concept);
      
      // 2. Generate actual audio using our secure server-side API proxy
      const data = await apiFetch<any>('/api/ai/generate-audio-lyria', {
        method: 'POST',
        body: JSON.stringify({
          genre,
          mood,
          complexity,
          description: concept.description
        })
      });

      if (data.audio) {
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        setGeneratedMelody(audioUrl);
        toast.success('New melody generated with Lyria AI!');
      } else if (data.fallbackUrl) {
        setGeneratedMelody(data.fallbackUrl);
        toast.success('Loaded high-quality sample track for your concept!');
      } else {
        throw new Error('No audio or fallback URL received');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate melody');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    const audio = document.getElementById('melody-audio') as HTMLAudioElement;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {generatedMelody && (
        <audio 
          id="melody-audio" 
          src={generatedMelody} 
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight">AI Melody Generator</h2>
          <p className="text-zinc-500">Generate unique, royalty-free melodies and chord progressions instantly.</p>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Genre</label>
              <div className="grid grid-cols-2 gap-2">
                {genres.map(g => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className={cn(
                      "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                      genre === g 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mood</label>
              <div className="grid grid-cols-2 gap-2">
                {moods.map(m => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={cn(
                      "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                      mood === m 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Complexity</label>
              <span className="text-xs font-bold text-emerald-400">{complexity}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={complexity}
              onChange={(e) => setComplexity(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-6 bg-zinc-700 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={24} className="animate-spin" />
                Composing...
              </>
            ) : (
              <>
                <Wand2 size={24} />
                Generate Melody
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="sticky top-8 bg-zinc-900/50 border border-white/5 rounded-[48px] p-10 space-y-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <Piano className="text-zinc-800" size={64} />
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight">Melody Preview</h3>
              <p className="text-sm text-zinc-500">Listen to your AI-generated composition.</p>
            </div>

            <div className="aspect-video bg-black/40 rounded-[32px] border border-white/5 flex flex-col items-center justify-center relative group overflow-hidden">
              <AnimatePresence mode="wait">
                {generatedMelody ? (
                  <motion.div 
                    key="player"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center space-y-6"
                  >
                    <button 
                      onClick={togglePlayback}
                      className="w-24 h-24 bg-zinc-700 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-black/20"
                    >
                      {isPlaying ? <Pause size={40} /> : <Play size={40} className="ml-2" />}
                    </button>
                    <div className="text-center">
                      <p className="font-bold text-white uppercase tracking-widest text-xs">{genre} - {mood}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Generated by SonicAI</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-4 opacity-20">
                    <Volume2 size={48} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Audio Generated</p>
                  </div>
                )}
              </AnimatePresence>

              {isGenerating && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex gap-1 items-end h-12">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [10, 40, 20, 48, 15] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                        className="w-1.5 bg-emerald-500 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                disabled={!generatedMelody}
                className="flex items-center justify-center gap-2 py-4 bg-zinc-800 text-white rounded-2xl font-bold text-xs hover:bg-zinc-700 transition-all disabled:opacity-50"
              >
                <Download size={16} />
                WAV
              </button>
              <button 
                disabled={!generatedMelody}
                className="flex items-center justify-center gap-2 py-4 bg-zinc-800 text-white rounded-2xl font-bold text-xs hover:bg-zinc-700 transition-all disabled:opacity-50"
              >
                <Music size={16} />
                MIDI
              </button>
            </div>

            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Sliders className="text-emerald-400" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">Royalty Free</p>
                <p className="text-[10px] text-zinc-500">All generated melodies are 100% royalty-free for commercial use.</p>
              </div>
            </div>

            {melodyConcept && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-zinc-900/80 border border-white/5 rounded-[32px] space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <FileText size={16} className="text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight">AI Composition Report</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Title</p>
                    <p className="text-sm font-bold text-white">{melodyConcept.title}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Key & BPM</p>
                    <p className="text-sm font-bold text-white">{melodyConcept.Key} @ {melodyConcept.BPM} BPM</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Musical Elements</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{melodyConcept.description}</p>
                  </div>
                  {melodyConcept.notation && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Notation Preview</p>
                      <pre className="mt-1 p-3 bg-black/40 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto">
                        {melodyConcept.notation}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
