import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Volume2, 
  Activity, 
  Settings, 
  Sliders, 
  Zap,
  ChevronDown,
  ChevronUp,
  Cpu,
  Mic,
  Music,
  Waves,
  Clock,
  Repeat,
  Wind,
  Layers,
  Power
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Plugin {
  id: string;
  name: string;
  type: 'delay' | 'reverb' | 'eq' | 'compressor';
  isEnabled: boolean;
  params: { [key: string]: number };
}

interface MixerTrack {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'bus' | 'master';
  volume: number;
  pan: number;
  isMuted: boolean;
  isSolo: boolean;
  plugins: Plugin[];
  color: string;
}

export function Mixer() {
  const [tracks, setTracks] = useState<MixerTrack[]>([
    {
      id: '1',
      name: 'Vocal Main',
      type: 'audio',
      volume: 0.8,
      pan: 0,
      isMuted: false,
      isSolo: false,
      plugins: [
        { id: 'p1', name: 'V12 Delay', type: 'delay', isEnabled: true, params: { time: 0.25, feedback: 0.4, mix: 0.3 } },
        { id: 'p2', name: 'V12 EQ', type: 'eq', isEnabled: true, params: { low: 0, mid: 2, high: 1 } }
      ],
      color: '#ef4444'
    },
    {
      id: '2',
      name: 'Guitar L',
      type: 'audio',
      volume: 0.7,
      pan: -0.5,
      isMuted: false,
      isSolo: false,
      plugins: [],
      color: '#f97316'
    },
    {
      id: '3',
      name: 'Drums Bus',
      type: 'bus',
      volume: 0.9,
      pan: 0,
      isMuted: false,
      isSolo: false,
      plugins: [
        { id: 'p3', name: 'V12 Comp', type: 'compressor', isEnabled: true, params: { threshold: -18, ratio: 4, attack: 10, release: 100 } }
      ],
      color: '#eab308'
    },
    {
      id: 'master',
      name: 'Master',
      type: 'master',
      volume: 0.95,
      pan: 0,
      isMuted: false,
      isSolo: false,
      plugins: [
        { id: 'p4', name: 'V12 Limiter', type: 'compressor', isEnabled: true, params: { threshold: -0.1, ratio: 20, attack: 1, release: 50 } }
      ],
      color: '#ffffff'
    }
  ]);

  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [activePlugin, setActivePlugin] = useState<string | null>(null);

  const togglePlugin = (trackId: string, pluginId: string) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        return {
          ...t,
          plugins: t.plugins.map(p => p.id === pluginId ? { ...p, isEnabled: !p.isEnabled } : p)
        };
      }
      return t;
    }));
  };

  return (
    <div className="bg-v12-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full relative">
      {/* Header */}
      <div className="p-4 bg-v12-blue/40 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-v12-blue/20 rounded-lg">
            <Sliders className="text-v12-blue" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">V12 Mixer</h3>
            <p className="text-[10px] text-v12-gray-400 font-bold uppercase tracking-tighter">SonicStream Signal Chain</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <Layers size={14} className="text-v12-gray-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">8 Channels Active</span>
          </div>
          <button className="p-2 bg-v12-red text-white rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Mixer Grid */}
      <div className="flex-1 overflow-x-auto flex p-6 gap-4 custom-scrollbar bg-black/20">
        {tracks.map((track) => (
          <div 
            key={track.id} 
            onClick={() => setSelectedTrack(track.id)}
            className={cn(
              "w-48 flex flex-col gap-4 transition-all relative group",
              selectedTrack === track.id ? "bg-white/5 ring-1 ring-v12-red/30 rounded-xl p-3 -m-3" : "p-0"
            )}
          >
            {/* Plugins Rack */}
            <div className="flex-1 bg-black/40 rounded-xl border border-white/5 p-2 space-y-1 overflow-y-auto custom-scrollbar min-h-[200px]">
              <div className="text-[8px] font-black text-v12-gray-500 uppercase tracking-widest mb-2 px-1">Inserts</div>
              {track.plugins.map((plugin) => (
                <button
                  key={plugin.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePlugin(plugin.id);
                  }}
                  className={cn(
                    "w-full p-2 rounded-lg border text-left transition-all flex items-center justify-between group/plugin",
                    plugin.isEnabled 
                      ? "bg-v12-blue/10 border-v12-blue/30 text-v12-blue" 
                      : "bg-white/5 border-white/5 text-v12-gray-500"
                  )}
                >
                  <span className="text-[9px] font-black uppercase truncate">{plugin.name}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlugin(track.id, plugin.id);
                    }}
                    className={cn(
                      "p-1 rounded transition-all",
                      plugin.isEnabled ? "text-v12-blue hover:bg-v12-blue/20" : "text-v12-gray-500 hover:bg-white/10"
                    )}
                  >
                    <Power size={10} />
                  </button>
                </button>
              ))}
              <button className="w-full p-2 border border-dashed border-white/10 rounded-lg text-v12-gray-500 hover:text-white hover:border-white/20 transition-all flex items-center justify-center">
                <Plus size={12} />
              </button>
            </div>

            {/* Fader Area */}
            <div className="bg-v12-blue/10 rounded-xl border border-white/5 p-4 flex flex-col gap-4">
              {/* Pan */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[8px] font-black text-v12-gray-500 uppercase">
                  <span>L</span>
                  <span>Pan</span>
                  <span>R</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full relative">
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-v12-orange" 
                    style={{ left: `${(track.pan + 1) * 50}%` }} 
                  />
                </div>
              </div>

              {/* Mute/Solo */}
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 bg-white/5 border border-white/10 rounded text-[10px] font-black text-v12-gray-500 hover:text-white uppercase transition-all">M</button>
                <button className="flex-1 py-1.5 bg-white/5 border border-white/10 rounded text-[10px] font-black text-v12-gray-500 hover:text-white uppercase transition-all">S</button>
              </div>

              {/* Fader */}
              <div className="flex-1 flex flex-col items-center gap-4 py-4 relative h-48">
                <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-1 bg-black/40 rounded-full" />
                <div className="flex-1 flex flex-col justify-between text-[8px] font-black text-v12-gray-600 uppercase w-full">
                  <span>+6</span>
                  <span>0</span>
                  <span>-6</span>
                  <span>-12</span>
                  <span>-24</span>
                  <span>-inf</span>
                </div>
                <motion.div 
                  className="absolute left-1/2 -translate-x-1/2 w-8 h-12 bg-v12-gray-800 border-2 border-v12-red rounded-lg shadow-2xl cursor-ns-resize z-10 flex items-center justify-center"
                  style={{ bottom: `${track.volume * 100}%` }}
                >
                  <div className="w-4 h-0.5 bg-v12-red" />
                </motion.div>
              </div>

              {/* Track Name */}
              <div className="text-center">
                <div 
                  className="h-1 w-full rounded-full mb-2" 
                  style={{ backgroundColor: track.color }}
                />
                <h4 className="text-[10px] font-black uppercase tracking-widest truncate">{track.name}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plugin Inspector Overlay */}
      <AnimatePresence>
        {activePlugin && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          >
            <div className="w-full max-w-md bg-v12-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 bg-v12-blue/20 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-v12-blue/20 rounded-lg">
                    <Zap className="text-v12-blue" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter">V12 Delay Processor</h3>
                    <p className="text-[10px] text-v12-gray-400 font-bold uppercase tracking-widest">Analog-Modeled Echo Engine</p>
                  </div>
                </div>
                <button onClick={() => setActivePlugin(null)} className="text-v12-gray-400 hover:text-white">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-3 gap-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle cx="40" cy="40" r="36" fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray="226" strokeDashoffset="56" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-sm font-black text-white">1/4</span>
                        <span className="text-[8px] font-black text-v12-gray-500 uppercase">Time</span>
                      </div>
                    </div>
                    <Clock size={16} className="text-v12-blue" />
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle cx="40" cy="40" r="36" fill="none" stroke="#f97316" strokeWidth="8" strokeDasharray="226" strokeDashoffset="113" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-sm font-black text-white">40%</span>
                        <span className="text-[8px] font-black text-v12-gray-500 uppercase">F.Back</span>
                      </div>
                    </div>
                    <Repeat size={16} className="text-v12-orange" />
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle cx="40" cy="40" r="36" fill="none" stroke="#ef4444" strokeWidth="8" strokeDasharray="226" strokeDashoffset="158" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-sm font-black text-white">30%</span>
                        <span className="text-[8px] font-black text-v12-gray-500 uppercase">Mix</span>
                      </div>
                    </div>
                    <Wind size={16} className="text-v12-red" />
                  </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-v12-blue animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Sync to Project BPM</span>
                  </div>
                  <div className="w-10 h-5 bg-v12-blue rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-black/40 border-t border-white/10 flex gap-4">
                <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black uppercase tracking-widest text-xs transition-all">Reset</button>
                <button 
                  onClick={() => setActivePlugin(null)}
                  className="flex-1 py-3 bg-v12-blue text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="p-2 bg-black/60 border-t border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-v12-blue animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest text-v12-gray-500">Signal Flow: Optimized</span>
          </div>
          <span className="text-[8px] font-black text-v12-gray-500 uppercase">Latency: 2.4ms</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-black text-v12-gray-500 uppercase">Peak:</span>
            <span className="text-[8px] font-black text-v12-red uppercase">-0.3dB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
