import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Volume2, 
  Users, 
  Zap, 
  Sparkles,
  Heart,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { EXCLUSIVE_LOFI_STATIONS, LofiTrack } from '../radio/lofiData';
import toast from 'react-hot-toast';

interface Station {
  id: string;
  name: string;
  genre: string;
  listeners: number;
  cover: string;
  color: string;
  currentTrack: {
    title: string;
    artist: string;
  };
  tracks: LofiTrack[];
}

export const RadioHub = () => {
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const stations: Station[] = EXCLUSIVE_LOFI_STATIONS.map((s): Station => ({
    id: s.id,
    name: s.name,
    genre: s.genre,
    listeners: s.listeners,
    cover: s.image,
    color: s.color,
    currentTrack: {
      title: s.tracks[0]?.title || 'Exclusive Synthesis',
      artist: s.tracks[0]?.artist || 'SonicStream AI Core'
    },
    tracks: s.tracks
  }));

  const handlePlayStation = (station: Station) => {
    if (activeStation?.id === station.id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveStation(station);
      setActiveTrackIndex(0);
      setIsPlaying(true);
      toast.success(`Broadcasting Exclusive ${station.genre}`);
    }
  };

  const handleTrackSelect = (idx: number) => {
    setActiveTrackIndex(idx);
    setIsPlaying(true);
    if (activeStation) {
      toast.success(`Loaded exclusive instrumental: ${activeStation.tracks[idx].title}`);
    }
  };

  const handleNextTrack = () => {
    if (!activeStation) return;
    const nextIdx = (activeTrackIndex + 1) % activeStation.tracks.length;
    handleTrackSelect(nextIdx);
  };

  const handlePrevTrack = () => {
    if (!activeStation) return;
    const prevIdx = activeTrackIndex === 0 ? activeStation.tracks.length - 1 : activeTrackIndex - 1;
    handleTrackSelect(prevIdx);
  };

  const activeTrack = activeStation?.tracks?.[activeTrackIndex];

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-24">
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-emerald-400">
          <Radio size={24} className="animate-pulse" />
          <span className="text-sm font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/15">
            SonicStream Exclusives Mode
          </span>
        </div>
        <h1 className="text-6xl font-black text-white tracking-tighter uppercase">SonicStream Radio Hub</h1>
        <p className="text-zinc-400 text-lg max-w-2xl font-medium leading-relaxed">
          Unlock 66 high-fidelity, master-tier AI-generated lofi instrumentals exclusive to Sonicstream. Experience deep meditation, focus, and soulful trap vibes in real-time.
        </p>
      </header>

      {/* Grid of AI Exclusives */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stations.map((station) => {
          const isCurrent = activeStation?.id === station.id;
          return (
            <motion.div
              key={station.id}
              whileHover={{ y: -8 }}
              className={cn(
                "group cursor-pointer relative aspect-[3/4] rounded-[48px] overflow-hidden border transition-all duration-300 flex flex-col justify-between p-8 bg-zinc-900/10",
                isCurrent 
                  ? "border-emerald-500/40 ring-4 ring-emerald-500/10 shadow-2xl shadow-emerald-500/5 bg-zinc-900/30" 
                  : "border-white/5 hover:border-white/15"
              )}
            >
              {/* Cover Art Background */}
              <img 
                src={station.cover} 
                alt={station.name} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60" 
              />
              <div className={cn("absolute inset-0 bg-gradient-to-t via-black/40 to-transparent", `from-zinc-950`)} />
              
              {/* Content overlay */}
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-zinc-700 text-white px-4 py-1 rounded-full flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider shadow-lg">
                    <Sparkles size={10} className="animate-pulse" />
                    <span>Exclusive</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-300 font-bold bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs">
                    <Users size={12} />
                    <span>{station.listeners.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{station.genre}</span>
                    <h3 className="text-2xl font-black text-white tracking-tight leading-none mt-1 group-hover:text-emerald-400 transition-colors">{station.name}</h3>
                    <p className="text-[11px] text-zinc-400 mt-2 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                      {station.tracks.length} Studio Loops
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayStation(station);
                      }}
                      className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform"
                    >
                      {isCurrent && isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white truncate">
                        {isCurrent && activeTrack ? activeTrack.title : station.currentTrack.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-medium truncate">
                        {isCurrent && activeTrack ? activeTrack.artist : station.currentTrack.artist}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Studio Sheet / Drawer within page */}
      {activeStation && (
        <div className="bg-zinc-900/20 border border-white/5 p-8 rounded-[40px] grid grid-cols-1 lg:grid-cols-3 gap-8 relative overflow-hidden">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Selected Station Vault</span>
                <h3 className="text-3xl font-black text-white tracking-tight">{activeStation.name}</h3>
              </div>
              <span className="bg-emerald-500/15 border border-emerald-500/20 tracking-widest text-[10px] font-black uppercase text-emerald-400 py-1 px-4 rounded-full">
                {activeStation.tracks.length} Instrumentals
              </span>
            </div>

            {/* List scrollable box */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 no-scrollbar">
              {activeStation.tracks.map((track, idx) => {
                const isCur = activeTrackIndex === idx;
                return (
                  <div 
                    key={track.id}
                    onClick={() => handleTrackSelect(idx)}
                    className={cn(
                      "p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between group",
                      isCur 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-white" 
                        : "bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-zinc-900/60 text-zinc-400 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={cn(
                        "font-mono text-xs font-semibold w-6",
                        isCur ? "text-emerald-400" : "text-zinc-600"
                      )}>
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className={cn(
                          "font-bold text-sm",
                          isCur ? "text-emerald-400" : "text-zinc-200"
                        )}>{track.title}</p>
                        <p className="text-[10px] text-zinc-500 font-medium">{track.artist} • <span className="text-emerald-500/60">{track.vibes}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono">{track.duration}</span>
                      <span className="px-2 py-0.5 bg-zinc-900 border border-white/10 text-[8px] font-black uppercase rounded text-zinc-500 group-hover:text-emerald-400 group-hover:border-emerald-500/25">
                        {track.energy}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right sidebar details */}
          <div className="bg-zinc-900/40 p-6 rounded-[32px] border border-white/5 flex flex-col justify-between space-y-6">
            <div className="space-y-4 text-center">
              <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden border border-white/10 relative">
                <img src={activeStation.cover} alt={activeStation.name} className="w-full h-full object-cover" />
                {isPlaying && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 py-2 flex items-center justify-center gap-0.5">
                    <span className="w-1 h-3 bg-emerald-400 animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="w-1 h-4 bg-emerald-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1 h-3 bg-emerald-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                )}
              </div>
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">EXCLUSIVE ACTIVE</span>
                <h4 className="text-lg font-black text-white tracking-tight mt-1 truncate">
                  {activeTrack?.title || 'No active track'}
                </h4>
                <p className="text-xs text-zinc-500 font-medium truncate">{activeTrack?.artist}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-zinc-400 font-bold bg-zinc-950 p-4 rounded-xl space-y-2 border border-white/5">
                <p className="flex justify-between"><span>Vibe Accent:</span> <span className="text-white">{activeTrack?.vibes}</span></p>
                <p className="flex justify-between"><span>Engine Power:</span> <span className="text-emerald-400">{activeTrack?.energy}</span></p>
                <p className="flex justify-between"><span>Track Scope:</span> <span className="text-white">{activeTrack?.duration} Lossless</span></p>
              </div>

              <div className="flex justify-center gap-3">
                <button 
                  onClick={handlePrevTrack}
                  className="p-3 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <SkipBack size={16} />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 bg-white text-black hover:scale-105 transition-transform rounded-full flex items-center justify-center shadow-lg"
                >
                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                </button>
                <button 
                  onClick={handleNextTrack}
                  className="p-3 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <SkipForward size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global mini broadcast audio player for background tuning */}
      <AnimatePresence>
        {activeStation && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50 animate-fade-in"
          >
            <div className="bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 shadow-2xl flex items-center justify-between gap-8">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-white/5">
                  <img src={activeStation.cover} alt={activeStation.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Broadcast</span>
                    <span className="text-[10px] text-zinc-600">•</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">{activeStation.name}</span>
                  </div>
                  <h4 className="text-lg font-black text-white truncate my-0">
                    {activeTrack ? activeTrack.title : activeStation.currentTrack.title}
                  </h4>
                  <p className="text-xs text-zinc-400 font-medium truncate">
                    {activeTrack ? activeTrack.artist : activeStation.currentTrack.artist}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <button 
                  onClick={() => toast.success('Track favorited!')}
                  className="text-zinc-500 hover:text-emerald-400 transition-colors"
                >
                  <Heart size={18} />
                </button>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handlePrevTrack}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <SkipBack size={18} />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                  >
                    {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <button 
                    onClick={handleNextTrack}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <SkipForward size={18} />
                  </button>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl">
                  <Volume2 size={16} className="text-zinc-500" />
                  <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
                <button 
                  onClick={() => toast.success('Share code copied!')}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotion banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black uppercase tracking-tight">SonicStream AI Master Releases</h3>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Active Lab Streaming</span>
          </div>
          <div className="space-y-4">
            {[{ title: 'Jazz Deep House Exclusive', desc: '15 Ambient electronic master tracks', listeners: 3240 },
              { title: 'Trap Soul & Hip Hop Lo-Fi', desc: '14 Deep base soul master rhythms', listeners: 4850 },
              { title: 'Tribal Lounge Exclusive', desc: '10 Shamanic jungle master soundscapes', listeners: 2110 }].map((release, idx) => (
              <div key={idx} className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:bg-white/5 transition-all">
                <div className="flex items-center gap-6">
                  <span className="text-zinc-800 font-mono text-xl">{(idx + 1).toString().padStart(2, '0')}</span>
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <img src={EXCLUSIVE_LOFI_STATIONS[idx].image} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-white tracking-tight">{release.title}</p>
                    <p className="text-xs text-zinc-500">{release.desc} • Playing Live</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400 uppercase hidden sm:inline flex items-center gap-1">
                  ● {release.listeners.toLocaleString()} tuning in
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-700 rounded-[48px] p-8 text-white space-y-6 relative overflow-hidden flex flex-col justify-between border border-emerald-400/20">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="space-y-3 relative">
            <h3 className="text-3xl font-black leading-tight uppercase">SonicStream AI Studio</h3>
            <p className="text-black/75 font-semibold text-sm leading-relaxed">
              These 66 custom lofi instrumentals are handcrafted using leading audio generators and mastered lossless, only exclusive to Sonicstream. No copyright noise, no licenses, infinite harmony.
            </p>
          </div>
          <ul className="space-y-3 relative">
            {[
              '15 Velvet Jazz Deep House Cuts',
              '14 Sub-Heavy Trap Soul & Hip Hop Loops',
              '10 Immersive Shamanic Tribal Lounge Tracks',
              '27 Healing 432Hz Therapy Vibe Soul Masters'
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-xs font-extrabold uppercase">
                <Zap size={14} fill="currentColor" />
                {feature}
              </li>
            ))}
          </ul>
          <button 
            onClick={() => {
              const therapyStation = stations.find(s => s.id === 'lofi-therapy');
              if (therapyStation) handlePlayStation(therapyStation);
            }} 
            className="w-full py-4 bg-black text-white hover:bg-zinc-900 font-black rounded-2xl hover:scale-[1.03] transition-transform shadow-xl relative text-xs uppercase tracking-wider"
          >
            Launch 432Hz Therapy Wave
          </button>
        </div>
      </div>
    </div>
  );
};
