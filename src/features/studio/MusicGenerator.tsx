import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Download, 
  Share2, 
  Wand2,
  Dna
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

interface Genre {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const GENRES: Genre[] = [
  { id: 'techno', name: 'Techno', icon: '🎹', color: 'from-blue-500 to-indigo-600' },
  { id: 'hiphop', name: 'Hip Hop', icon: '🎤', color: 'from-amber-500 to-orange-600' },
  { id: 'ambient', name: 'Ambient', icon: '🌊', color: 'from-emerald-400 to-teal-600' },
  { id: 'rock', name: 'Rock', icon: '🎸', color: 'from-red-500 to-rose-600' },
  { id: 'pop', name: 'Pop', icon: '✨', color: 'from-pink-400 to-purple-600' },
];

const MOODS = ['Dark', 'Ethereal', 'Aggressive', 'Uplifting', 'Melancholic', 'Cinematic'];

export const MusicGenerator: React.FC = () => {
  const [selectedGenre, setSelectedGenre] = useState<Genre>(GENRES[0]);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [tempo, setTempo] = useState(128);
  const [duration, setDuration] = useState(60);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedTrack, setGeneratedTrack] = useState<{ id: string; name: string; url: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const generateMusic = () => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedTrack(null);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setGeneratedTrack({
            id: Math.random().toString(36).substr(2, 9),
            name: `${selectedGenre.name} - ${selectedMood} (${tempo} BPM)`,
            url: '#'
          });
          toast.success('AI Music Generated!');
          return 100;
        }
        return prev + 1;
      });
    }, 50);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">AI Music Composer</h2>
          <p className="text-zinc-500 text-sm">Generate unique, royalty-free tracks in seconds.</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
            Neural Synth v3
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-8">
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">1. Select Genre</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {GENRES.map(genre => (
                  <button
                    key={genre.id}
                    onClick={() => setSelectedGenre(genre)}
                    className={cn(
                      "p-4 rounded-3xl transition-all border flex flex-col items-center gap-3 group",
                      selectedGenre.id === genre.id 
                        ? "bg-zinc-800 border-white/20 shadow-xl" 
                        : "bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl transition-transform group-hover:scale-110",
                      genre.color
                    )}>
                      {genre.icon}
                    </div>
                    <span className="text-xs font-bold text-white">{genre.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">2. Set Mood</h4>
              <div className="flex flex-wrap gap-3">
                {MOODS.map(mood => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-xs font-bold transition-all border",
                      selectedMood === mood 
                        ? "bg-white text-black border-white" 
                        : "bg-zinc-900/30 border-white/5 text-zinc-400 hover:text-white"
                    )}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">3. Tempo (BPM)</h4>
                  <span className="text-emerald-500 font-black text-lg">{tempo}</span>
                </div>
                <input 
                  type="range" 
                  min="60" 
                  max="200" 
                  value={tempo} 
                  onChange={(e) => setTempo(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">4. Duration</h4>
                  <span className="text-emerald-500 font-black text-lg">{duration}s</span>
                </div>
                <input 
                  type="range" 
                  min="15" 
                  max="300" 
                  step="15"
                  value={duration} 
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  <span>Short</span>
                  <span>Long</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 flex flex-col justify-center min-h-[400px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!isGenerating && !generatedTrack ? (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center space-y-8"
                >
                  <div className="w-24 h-24 bg-zinc-800 rounded-[32px] flex items-center justify-center mx-auto border border-white/5">
                    <Dna size={40} className="text-zinc-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Ready to Compose</h3>
                    <p className="text-zinc-500 text-sm">AI will generate a unique arrangement based on your settings.</p>
                  </div>
                  <button
                    onClick={generateMusic}
                    className="w-full py-6 bg-zinc-700 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3"
                  >
                    <Wand2 size={24} />
                    Generate Track
                  </button>
                </motion.div>
              ) : isGenerating ? (
                <motion.div 
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-8"
                >
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black">{progress}%</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold animate-pulse">Composing Arrangement...</h3>
                    <div className="flex justify-center gap-1 h-8 items-end">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 32, 4] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                          className="w-1 bg-emerald-500/40 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br", selectedGenre.color)}>
                      {selectedGenre.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white truncate max-w-[200px]">{generatedTrack?.name}</h3>
                      <p className="text-xs text-zinc-500">AI Generated • {duration}s</p>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-3xl p-6 space-y-6">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                      </button>
                      <div className="flex-1 h-12 flex items-center gap-1">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "flex-1 rounded-full transition-all bg-emerald-500/40",
                              isPlaying ? "animate-pulse" : ""
                            )}
                            style={{ height: `${Math.random() * 100}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-bold hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
                      <Download size={20} />
                      Download WAV
                    </button>
                    <button className="w-full py-4 bg-zinc-700 text-white rounded-2xl font-bold hover:bg-zinc-600 transition-all flex items-center justify-center gap-2">
                      <Share2 size={20} />
                      Share to Social
                    </button>
                    <button 
                      onClick={() => setGeneratedTrack(null)}
                      className="w-full py-4 bg-transparent text-zinc-500 rounded-2xl font-bold hover:text-white transition-all"
                    >
                      Generate New
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Advanced Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Complexity</span>
                <span className="text-xs font-black text-white">High</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Harmony</span>
                <span className="text-xs font-black text-white">Rich</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Rhythm</span>
                <span className="text-xs font-black text-white">Syncopated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
