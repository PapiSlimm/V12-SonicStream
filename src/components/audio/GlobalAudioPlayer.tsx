import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const GlobalAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    if (isPlaying) {
      audio.play().catch(e => console.log('Autoplay blocked or audio missing', e));
    } else {
      audio.pause();
    }
  }, [isPlaying, volume]);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-xl bg-black/70 border border-emerald-500/30 rounded-3xl p-4 shadow-2xl shadow-emerald-500/20 w-full max-w-2xl mx-4">
      <div className="flex items-center justify-between gap-4">
        {/* Soundboard Visualizer */}
        <div className="flex items-end gap-1 h-12 w-48 bg-zinc-900/50 rounded-2xl p-2 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 bg-gradient-to-t from-emerald-400 via-blue-400 to-purple-400 rounded-full ${isPlaying ? 'animate-soundbar' : 'h-2'}`}
              style={{
                height: isPlaying ? `${20 + Math.sin(Date.now() * 0.01 + i) * 15}%` : '4px',
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-1 justify-center">
          <div className="text-sm text-zinc-400 font-medium truncate">
            R&B/Hip-Hop Background (Premium)
          </div>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-2xl border border-white/20 transition-all group shrink-0"
          >
            {isPlaying ? (
              <Volume2 size={20} className="text-emerald-400 group-hover:scale-110" />
            ) : (
              <VolumeX size={20} className="text-zinc-400 group-hover:text-emerald-400" />
            )}
          </button>

          {/* Volume Slider */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-24 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 hidden sm:block"
          />
        </div>

        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest shrink-0 hidden md:block">
          Premium Feature
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" // Fallback URL since local asset might not exist
      />
    </div>
  );
};
