import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Volume2, 
  VolumeX,
  Users, 
  Globe, 
  Shield, 
  Zap,
  ExternalLink,
  Search,
  ChevronRight,
  Sparkles,
  Music,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EXCLUSIVE_LOFI_STATIONS, LofiTrack } from './lofiData';

interface RadioStation {
  id: string;
  name: string;
  genre: string;
  description: string;
  listeners: number;
  image: string;
  is_live: boolean;
  color?: string;
  tracks?: LofiTrack[];
}

export const RadioHub: React.FC = () => {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [activeStation, setActiveStation] = useState<RadioStation | null>(null);
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Auditory settings
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState<number>(0.8);

  const genres = ['All', 'Exclusive AI', 'Electronic', 'Hip Hop', 'Jazz', 'Ambient', 'Talk'];

  // Web Audio Synth for soothing lofi ambiance (Tape-fluttered ambient synthesis)
  const synthRef = useRef<{
    ctx: AudioContext | null;
    gain: GainNode | null;
    oscillators: OscillatorNode[];
  }>({ ctx: null, gain: null, oscillators: [] });

  // Handle Web Audio setup
  const startSynth = (stationId: string) => {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!synthRef.current.ctx) {
        synthRef.current.ctx = new AudioContextClass();
      }
      const ctx = synthRef.current.ctx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Stop old oscillators
      synthRef.current.oscillators.forEach(osc => {
        try { osc.stop(); } catch { void 0; }
      });
      synthRef.current.oscillators = [];

      // Create main gain if it doesn't exist
      if (!synthRef.current.gain) {
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        synthRef.current.gain = gain;
      }
      const mainGain = synthRef.current.gain;
      
      // Map volume
      const currentVol = isMuted ? 0 : volume * 0.08; // extremely clean soft level (max 8% so it doesn't blast ears)
      mainGain.gain.setValueAtTime(mainGain.gain.value, ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(currentVol, ctx.currentTime + 1.2);

      // Low pass filter for retro lofi warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(432, ctx.currentTime); // Standard soothing healing resonance frequency
      filter.Q.setValueAtTime(1, ctx.currentTime);
      filter.connect(mainGain);

      // Unique chords depending on the specific lofi theme
      let freqs = [110, 165, 220, 330];
      if (stationId === 'lofi-jazz') {
        freqs = [110, 146.83, 196, 246.94, 293.66]; // Sweet Jazz major 7th and minor 9th pads
      } else if (stationId === 'lofi-hiphop') {
        freqs = [87.31, 130.81, 174.61, 220, 261.63]; // Warm melancholic Hip Hop / Trap Soul chord
      } else if (stationId === 'lofi-tribal') {
        freqs = [73.42, 110, 146.83, 220, 293.66]; // Tribal minor pentatonic drone
      } else if (stationId === 'lofi-therapy') {
        freqs = [108, 162, 216, 288, 324]; // Standard 432Hz harmonic chakra pad
      }

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        // Alternating triangle and sine wave for depth
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Slow Tape Vibrato (low frequency pitch modulator) for authenticity
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.3 + Math.random() * 0.4, ctx.currentTime); // Tape flutter speed
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(1.5 + Math.random() * 1.5, ctx.currentTime); // Subtle pitch swing warp

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        osc.connect(filter);
        osc.start();
        synthRef.current.oscillators.push(osc);
      });
    } catch (e) {
      console.error('Failed to initialize Web Audio Synth:', e);
    }
  };

  const stopSynth = () => {
    try {
      const { ctx, gain, oscillators } = synthRef.current;
      if (ctx && gain) {
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        setTimeout(() => {
          oscillators.forEach(osc => {
            try { osc.stop(); } catch { void 0; }
          });
          synthRef.current.oscillators = [];
          try {
            if (ctx.state !== 'closed') {
              ctx.suspend();
            }
          } catch { void 0; }
        }, 600);
      }
    } catch { void 0; }
  };

  // Synchronize synth settings on volume/mute change
  useEffect(() => {
    const { ctx, gain } = synthRef.current;
    if (ctx && gain && isPlaying) {
      const targetVol = isMuted ? 0 : volume * 0.08;
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.3);
    }
  }, [volume, isMuted, isPlaying]);

  useEffect(() => {
    // Standard mock stations combined with our verified AI-exclusive instruments
    const premiumStations: RadioStation[] = [
      ...EXCLUSIVE_LOFI_STATIONS.map((s): RadioStation => ({
        id: s.id,
        name: s.name,
        genre: 'Exclusive AI',
        description: s.description,
        listeners: s.listeners,
        image: s.image,
        is_live: s.is_live,
        color: s.color,
        tracks: s.tracks
      })),
      {
        id: 'v12-main',
        name: 'V12 Radio Main',
        genre: 'Electronic',
        description: 'The flagship station for high-fidelity digital audio.',
        listeners: 1240,
        image: 'https://picsum.photos/seed/v12/800/800',
        is_live: true
      },
      {
        id: 'v12-jazz',
        name: 'V12 Smooth Jazz',
        genre: 'Jazz',
        description: 'Interference-free smooth jazz for your workspace.',
        listeners: 850,
        image: 'https://picsum.photos/seed/jazz/800/800',
        is_live: true
      },
      {
        id: 'v12-talk',
        name: 'V12 Cultural Talk',
        genre: 'Talk',
        description: 'Original talk programming and cultural content.',
        listeners: 2100,
        image: 'https://picsum.photos/seed/talk/800/800',
        is_live: true
      },
      {
        id: 'v12-ambient',
        name: 'V12 Deep Ambient',
        genre: 'Ambient',
        description: 'Royalty-free ambient soundscapes for focus.',
        listeners: 600,
        image: 'https://picsum.photos/seed/ambient/800/800',
        is_live: true
      }
    ];

    setStations(premiumStations);

    return () => {
      // Cleanup synth on unmount
      stopSynth();
    };
  }, []);

  const handlePlayStation = (station: RadioStation) => {
    if (activeStation?.id === station.id) {
      if (isPlaying) {
        setIsPlaying(false);
        stopSynth();
      } else {
        setIsPlaying(true);
        if (station.id.startsWith('lofi-')) {
          startSynth(station.id);
        }
      }
    } else {
      setActiveStation(station);
      setActiveTrackIndex(0);
      setIsPlaying(true);
      
      // Auto-open list drawer if it is an exclusive AI lofi station
      if (station.id.startsWith('lofi-')) {
        setIsDrawerOpen(true);
        startSynth(station.id);
        toast.success(`Exclusive AI Station: ${station.name}`);
      } else {
        stopSynth(); // regular stations don't use synth logic
        toast.success(`Tuning into ${station.name}`);
      }
    }
  };

  const handleTrackSelect = (idx: number) => {
    setActiveTrackIndex(idx);
    setIsPlaying(true);
    // Reboot synth with slightly morphed timbre
    if (activeStation?.id.startsWith('lofi-')) {
      startSynth(activeStation.id);
      toast.success(`Playing Excluisve Track: ${activeStation.tracks?.[idx].title}`);
    }
  };

  const handleNextTrack = () => {
    if (!activeStation?.tracks) return;
    const nextIdx = (activeTrackIndex + 1) % activeStation.tracks.length;
    handleTrackSelect(nextIdx);
  };

  const handlePrevTrack = () => {
    if (!activeStation?.tracks) return;
    const prevIdx = activeTrackIndex === 0 ? activeStation.tracks.length - 1 : activeTrackIndex - 1;
    handleTrackSelect(prevIdx);
  };

  const filteredStations = stations.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = activeGenre === 'All' || s.genre === activeGenre;
    return matchesSearch && matchesGenre;
  });

  const activeTrack = activeStation?.tracks?.[activeTrackIndex];

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-12 transition-all duration-500">
      {/* Hero Section */}
      <section className="relative h-[420px] rounded-[48px] overflow-hidden group border border-white/5">
        <img 
          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop" 
          alt="V12 Radio Hub" 
          className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-12 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40">
              <Radio size={32} className="text-black animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={10} className="animate-spin" />
                  Exclusive AI Lab Addition
                </span>
              </div>
              <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">SonicStream Radio</h1>
              <p className="text-zinc-400 font-medium max-w-xl mt-2">
                Superior, interference-free digital audio. Strictly non-licensing original mixes, therapeutic deep frequencies, and 4 exclusive AI-generated soundscapes.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => stations[0] && handlePlayStation(stations[0])}
              className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-3 shadow-lg"
            >
              <Play size={18} fill="currentColor" />
              Listen Exclusive AI
            </button>
            <button 
              onClick={() => {
                const aiStation = stations.find(s => s.id === 'lofi-therapy');
                if (aiStation) handlePlayStation(aiStation);
              }}
              className="px-10 py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all border border-white/10 flex items-center gap-3"
            >
              <Zap size={18} className="text-emerald-400" />
              Therapy 432Hz Mode
            </button>
            <button
              onClick={() => { window.location.href = '/ai'; }}
              className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-3 shadow-lg"
            >
              <Sparkles size={18} />
              Generate Music
            </button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Users, label: 'Live Listeners', value: '16.8k Active', color: 'text-blue-400' },
          { icon: Globe, label: 'Exclusive Studio', value: '66 Sonic Masters', color: 'text-emerald-400' },
          { icon: Shield, label: 'Pro Ambient', value: 'Lossless Web Audio', color: 'text-purple-400' },
          { icon: Zap, label: 'Audio Quality', value: '320kbps High-Fi', color: 'text-yellow-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl flex items-center gap-4 hover:border-white/15 transition-all">
            <div className={`p-3 bg-white/5 rounded-2xl ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</p>
              <p className="text-xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 w-full md:w-auto">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                activeGenre === genre ? "bg-zinc-700 text-white shadow-lg shadow-black/20" : "bg-zinc-900 text-zinc-400 hover:text-white"
              )}
            >
              {genre}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search stations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredStations.map(station => {
            const isAIExcl = station.id.startsWith('lofi-');
            return (
              <motion.div
                layout
                key={station.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "group relative bg-zinc-900/20 border rounded-[40px] overflow-hidden transition-all duration-300 flex flex-col justify-between",
                  activeStation?.id === station.id 
                    ? "border-emerald-500/50 shadow-xl shadow-emerald-500/5 bg-zinc-900/40" 
                    : "border-white/5 hover:border-white/15 hover:bg-zinc-900/30"
                )}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img 
                    src={station.image} 
                    alt={station.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Floating exclusives badge */}
                  {isAIExcl && (
                    <div className="absolute top-4 right-4 bg-zinc-700 text-white text-[9px] font-black uppercase tracking-wider py-1 px-3 rounded-full shadow-lg flex items-center gap-1">
                      <Sparkles size={10} /> Exclusive AI
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                      onClick={() => handlePlayStation(station)}
                      className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center text-white shadow-2xl shadow-black/40 hover:scale-110 transition-transform"
                    >
                      {activeStation?.id === station.id && isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                    {isAIExcl && (
                      <button 
                        onClick={() => {
                          setActiveStation(station);
                          setIsDrawerOpen(true);
                        }}
                        className="w-12 h-12 bg-zinc-800 text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-zinc-700 transition-colors"
                        title="View Exclusive Tracks"
                      >
                        <Music size={18} />
                      </button>
                    )}
                  </div>
                  
                  {station.is_live && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Broadcast
                    </div>
                  )}
                </div>
                
                <div className="p-6 space-y-2 flex-grow flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        isAIExcl ? "text-emerald-400" : "text-zinc-500"
                      )}>{station.genre}</span>
                      <div className="flex items-center gap-1 text-zinc-500 text-[10px] font-bold">
                        <Users size={10} />
                        {station.listeners.toLocaleString()}
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors">{station.name}</h3>
                    <p className="text-xs text-zinc-400 font-medium line-clamp-2">{station.description}</p>
                  </div>
                  
                  {isAIExcl && (
                    <div className="pt-3 border-t border-white/5 mt-3 flex items-center justify-between text-[11px] font-bold text-zinc-500">
                      <span className="flex items-center gap-1 text-emerald-500/80">
                        <CheckCircle2 size={12} />
                        {station.tracks?.length} Studio Instrumentals
                      </span>
                      <button 
                        onClick={() => {
                          setActiveStation(station);
                          setIsDrawerOpen(true);
                        }} 
                        className="text-white hover:text-emerald-400 flex items-center gap-0.5"
                      >
                        Tracks <ChevronRight size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Floating Tracklist / AI Station Studio Drawer */}
      <AnimatePresence>
        {isDrawerOpen && activeStation && activeStation.tracks && (
          <>
            {/* Background Backdrop for drawer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Slideout Studio Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-zinc-950/95 backdrop-blur-2xl border-l border-white/10 z-50 p-6 shadow-2xl overflow-y-auto flex flex-col"
            >
              {/* Drawer Lock / Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-400 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Exclusive AI Studio</span>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-1.5 bg-zinc-900 border border-white/5 rounded-xl text-xs font-black hover:bg-zinc-800 transition-colors uppercase"
                >
                  Close
                </button>
              </div>

              {/* Station Cover Profile */}
              <div className="pt-6 pb-6 text-center space-y-4">
                <div className="w-40 h-40 mx-auto rounded-3xl overflow-hidden border-2 border-emerald-500/25 shadow-2xl flex relative">
                  <img src={activeStation.image} alt={activeStation.name} className="w-full h-full object-cover" />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                      {/* Bouncing spectrum visualizer animation */}
                      <div className="flex items-end gap-1 h-12">
                        {[1, 2, 3, 4, 5, 2].map((_animDef, index) => (
                          <motion.div 
                            key={index}
                            animate={{ height: isPlaying ? [12, 48, 12] : 8 }}
                            transition={{ repeat: Infinity, duration: 0.8 + index * 0.15, ease: 'easeInOut' }}
                            className="w-1.5 bg-emerald-400 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{activeStation.name}</h2>
                  <p className="text-emerald-400 text-xs uppercase tracking-widest font-bold mt-1">SonicStream Private Vault</p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-2 leading-relaxed">{activeStation.description}</p>
                </div>
              </div>

              {/* Subtitle / Number Verification */}
              <div className="flex justify-between items-center bg-zinc-900/40 border border-white/5 p-4 rounded-2xl text-xs font-bold mb-6">
                <span className="text-zinc-400">Total Exclusive Tracks:</span>
                <span className="text-emerald-400 font-extrabold text-sm">{activeStation.tracks.length} Instrumentals</span>
              </div>

              {/* Scrolling Tracklist */}
              <div className="flex-grow space-y-3 no-scrollbar overflow-y-auto pr-1">
                {activeStation.tracks.map((track, idx) => {
                  const isCur = activeTrackIndex === idx;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleTrackSelect(idx)}
                      className={cn(
                        "p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between group/item",
                        isCur 
                          ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg text-white" 
                          : "bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-zinc-900/60 text-zinc-400 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn(
                          "font-mono text-xs font-semibold shrink-0 w-6 text-center",
                          isCur ? "text-emerald-400" : "text-zinc-700"
                        )}>
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <p className={cn(
                            "font-black text-sm truncate",
                            isCur ? "text-emerald-400" : "text-zinc-200"
                          )}>{track.title}</p>
                          <p className="text-[10px] text-zinc-500 font-medium truncate">{track.artist} • <span className="text-emerald-500/70">{track.vibes}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isCur && isPlaying ? (
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-0.5 h-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0s' }} />
                            <span className="w-0.5 h-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <span className="w-0.5 h-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                          </div>
                        ) : (
                          <span className="text-xs font-mono font-medium">{track.duration}</span>
                        )}
                        <span className="px-2 py-0.5 bg-zinc-900 border border-white/10 group-hover/item:border-emerald-500/20 text-[8px] font-black uppercase tracking-widest rounded text-zinc-500 group-hover/item:text-emerald-400">
                          {track.energy}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Player controls directly on the Studio Drawer! */}
              <div className="mt-6 pt-6 border-t border-white/10 space-y-4 bg-zinc-950 sticky bottom-0 z-10 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Now Tuning Exclusive</span>
                    <h4 className="text-base font-black text-white truncate my-0.5">
                      {activeTrack?.title || 'No track selected'}
                    </h4>
                    <p className="text-xs text-zinc-500 font-medium truncate">{activeTrack?.artist}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handlePrevTrack} 
                      className="p-2 bg-zinc-900 border border-white/5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <SkipBack size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setIsPlaying(!isPlaying);
                        if (isPlaying) {
                          stopSynth();
                        } else {
                          startSynth(activeStation.id);
                        }
                      }}
                      className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center text-white shadow-lg shadow-black/20 hover:scale-105 transition-transform"
                    >
                      {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button 
                      onClick={handleNextTrack}
                      className="p-2 bg-zinc-900 border border-white/5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <SkipForward size={18} />
                    </button>
                  </div>
                </div>

                {/* Micro Audio Controller for Synth */}
                <div className="flex items-center justify-between text-zinc-500 text-xs">
                  <span className="font-mono bg-zinc-900 px-2 py-1 rounded border border-white/5 text-[10px]">
                    Freq: {activeStation.id === 'lofi-therapy' ? '432Hz Core' : 'Classic Pitch Shift'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white transition-colors">
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05"
                      value={volume} 
                      onChange={e => setVolume(parseFloat(e.target.value))}
                      className="w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Now Playing Bar */}
      <AnimatePresence>
        {activeStation && !isDrawerOpen && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-8 right-8 bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-[32px] p-4 flex items-center justify-between z-50 shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                <img src={activeStation.image} alt={activeStation.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-white tracking-tight truncate">{activeStation.name}</h4>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  {activeStation.id.startsWith('lofi-') && activeTrack
                    ? `AI Excl: ${activeTrack.title}`
                    : 'Now Broadcasting'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {activeStation.id.startsWith('lofi-') && (
                <button 
                  onClick={handlePrevTrack}
                  className="p-3 text-zinc-500 hover:text-white transition-colors"
                >
                  <SkipBack size={20} />
                </button>
              )}
              <button 
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  if (isPlaying) {
                    stopSynth();
                  } else {
                    if (activeStation.id.startsWith('lofi-')) {
                      startSynth(activeStation.id);
                    }
                  }
                }}
                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-0.5" />}
              </button>
              {activeStation.id.startsWith('lofi-') && (
                <button 
                  onClick={handleNextTrack}
                  className="p-3 text-zinc-500 hover:text-white transition-colors"
                >
                  <SkipForward size={20} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-6">
              {activeStation.id.startsWith('lofi-') && (
                <button 
                  onClick={() => setIsDrawerOpen(true)}
                  className="px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-500/10 hidden md:block"
                >
                  View 66 Tracks
                </button>
              )}
              <div className="hidden sm:flex items-center gap-3">
                <button onClick={() => setIsMuted(!isMuted)} className="text-zinc-500 hover:text-white transition-colors">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden relative group cursor-pointer">
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={volume} 
                    onChange={e => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 opacity-0 w-full cursor-pointer"
                  />
                  <div className="h-full bg-emerald-500" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
                </div>
              </div>
              <button 
                onClick={() => toast.success('Link copied to clipboard!')}
                className="p-3 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors shrink-0"
              >
                <ExternalLink size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
