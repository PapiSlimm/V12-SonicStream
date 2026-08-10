import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Scissors, 
  Type, 
  Move, 
  Eye, 
  Settings, 
  Trash2, 
  Music, 
  Sliders, 
  Zap,
  ChevronDown,
  ChevronUp,
  Cpu,
  Bookmark,
  Search,
  Volume2,
  Activity,
  Maximize2,
  Minimize2,
  Mic
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Marker {
  id: string;
  time: number;
  label: string;
  color: string;
}

interface AudioClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  color: string;
  trackId: string;
  isAIAnalyzed?: boolean;
  aiInsights?: string;
  eqRefinement?: string;
}

interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi';
  isMuted: boolean;
  isSolo: boolean;
  volume: number;
  pan: number;
  automation: {
    pan: { time: number, value: number }[];
  };
  showAutomation: boolean;
}

export function Timeline() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: '1',
      name: 'Vocal Main',
      type: 'audio',
      isMuted: false,
      isSolo: false,
      volume: 0.8,
      pan: 0,
      automation: { pan: [{ time: 0, value: 0 }, { time: 10, value: 0.5 }] },
      showAutomation: false
    },
    {
      id: '2',
      name: 'Guitar L',
      type: 'audio',
      isMuted: false,
      isSolo: false,
      volume: 0.7,
      pan: -0.5,
      automation: { pan: [] },
      showAutomation: false
    },
    {
      id: '3',
      name: 'Drums Bus',
      type: 'audio',
      isMuted: false,
      isSolo: false,
      volume: 0.9,
      pan: 0,
      automation: { pan: [] },
      showAutomation: false
    }
  ]);

  const [clips, setClips] = useState<AudioClip[]>([
    { id: 'c1', name: 'Verse 1 Vocal', startTime: 2, duration: 8, color: '#ef4444', trackId: '1' },
    { id: 'c2', name: 'Chorus Vocal', startTime: 12, duration: 6, color: '#ef4444', trackId: '1' },
    { id: 'c3', name: 'Guitar Riff', startTime: 0, duration: 16, color: '#f97316', trackId: '2' },
    { id: 'c4', name: 'Drum Loop', startTime: 0, duration: 20, color: '#eab308', trackId: '3' }
  ]);

  const [markers, setMarkers] = useState<Marker[]>([
    { id: 'm1', time: 0, label: 'Intro', color: '#ef4444' },
    { id: 'm2', time: 10, label: 'Verse', color: '#f97316' },
    { id: 'm3', time: 20, label: 'Chorus', color: '#eab308' }
  ]);

  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ insights: string, eq: string } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => prev + 0.1);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const addMarker = () => {
    const newMarker: Marker = {
      id: Math.random().toString(36).substr(2, 9),
      time: currentTime,
      label: `Marker ${markers.length + 1}`,
      color: '#8b5cf6'
    };
    setMarkers([...markers, newMarker]);
  };

  const toggleAutomation = (trackId: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, showAutomation: !t.showAutomation } : t));
  };

  const analyzeClip = (clipId: string) => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      const insights = "Vocal range is consistent. Slight sibilance detected at 4kHz. Dynamics are well-controlled.";
      const eq = "Boost 2.5kHz by 2dB for clarity. High-pass filter at 80Hz recommended.";
      
      setClips(prev => prev.map(c => c.id === clipId ? { ...c, isAIAnalyzed: true, aiInsights: insights, eqRefinement: eq } : c));
      setAnalysisResult({ insights, eq });
      setIsAnalyzing(false);
    }, 2000);
  };

  const pixelsPerSecond = 50 * zoom;

  return (
    <div className="bg-v12-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full relative">
      {/* Toolbar */}
      <div className="p-4 bg-v12-blue/40 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-v12-orange/20 rounded-lg">
              <Activity className="text-v12-orange" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">V12 Timeline</h3>
              <p className="text-[10px] text-v12-gray-400 font-bold uppercase tracking-tighter">Advanced Multi-Track Editor</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
            <button className="p-1.5 text-v12-gray-400 hover:text-white rounded transition-all"><Move size={14} /></button>
            <button className="p-1.5 bg-v12-red text-white rounded shadow-[0_0_10px_rgba(239,68,68,0.3)]"><Scissors size={14} /></button>
            <button className="p-1.5 text-v12-gray-400 hover:text-white rounded transition-all"><Type size={14} /></button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xl font-black text-v12-red block leading-none tabular-nums">
                {currentTime.toFixed(1)}s
              </span>
              <span className="text-[8px] font-black text-v12-gray-500 uppercase tracking-widest">Playback Time</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={cn(
                  "p-2.5 rounded-full transition-all",
                  isPlaying ? "bg-v12-red text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-white/10 text-v12-gray-400 hover:bg-white/20"
                )}
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              <button 
                onClick={() => setCurrentTime(0)}
                className="p-2.5 bg-white/10 text-v12-gray-400 rounded-full hover:bg-white/20 transition-all"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <button 
              onClick={addMarker}
              className="flex items-center gap-2 px-3 py-1.5 bg-v12-orange/10 hover:bg-v12-orange/20 border border-v12-orange/20 rounded-lg text-[10px] font-black text-v12-orange uppercase tracking-widest transition-all"
            >
              <Bookmark size={14} />
              Add Marker
            </button>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
              <span className="text-[10px] font-black text-v12-gray-400 uppercase">Zoom</span>
              <input 
                type="range" 
                min="0.5" 
                max="3" 
                step="0.1" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-20 accent-v12-red"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Ruler / Markers */}
        <div className="h-10 bg-black/40 border-b border-white/10 flex relative ml-48">
          <div className="absolute inset-0 flex">
            {Array.from({ length: 100 }).map((_, i) => (
              <div 
                key={i} 
                className="border-l border-white/5 h-full flex flex-col justify-between"
                style={{ width: pixelsPerSecond }}
              >
                <span className="text-[8px] font-black text-v12-gray-500 pl-1">{i}s</span>
                <div className="h-1 w-px bg-white/20" />
              </div>
            ))}
          </div>
          {markers.map((marker) => (
            <div 
              key={marker.id}
              className="absolute top-0 bottom-0 w-px z-20 group cursor-pointer"
              style={{ left: marker.time * pixelsPerSecond }}
            >
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase whitespace-nowrap shadow-lg"
                style={{ backgroundColor: marker.color }}
              >
                {marker.label}
              </div>
              <div className="h-full w-px" style={{ backgroundColor: marker.color }} />
            </div>
          ))}
        </div>

        {/* Tracks Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative" ref={timelineRef}>
          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-v12-red z-30 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            style={{ left: (currentTime * pixelsPerSecond) + 192 }} // 192 is track header width
          >
            <div className="w-3 h-3 bg-v12-red rounded-full -ml-1.5 -mt-1.5 border-2 border-white" />
          </div>

          {tracks.map((track) => (
            <div key={track.id} className="flex flex-col border-b border-white/5">
              <div className="flex h-24">
                {/* Track Header */}
                <div className="w-48 bg-v12-blue/20 border-r border-white/10 p-3 flex flex-col justify-between sticky left-0 z-40 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 bg-white/5 rounded">
                        {track.type === 'audio' ? <Mic size={12} className="text-v12-red" /> : <Music size={12} className="text-v12-orange" />}
                      </div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest truncate">{track.name}</h4>
                    </div>
                    <button 
                      onClick={() => toggleAutomation(track.id)}
                      className={cn(
                        "p-1 rounded transition-all",
                        track.showAutomation ? "bg-v12-red/20 text-v12-red" : "text-v12-gray-500 hover:text-white"
                      )}
                    >
                      <Sliders size={12} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Volume2 size={10} className="text-v12-gray-500" />
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-v12-red" style={{ width: `${track.volume * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <button className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-[8px] font-black text-v12-gray-500 hover:text-white uppercase transition-all">M</button>
                        <button className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-[8px] font-black text-v12-gray-500 hover:text-white uppercase transition-all">S</button>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-black text-v12-gray-500 uppercase">Pan</span>
                        <div className="w-12 h-1 bg-white/10 rounded-full relative">
                          <div className="absolute top-0 bottom-0 w-1 bg-v12-orange" style={{ left: `${(track.pan + 1) * 50}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Track Lane */}
                <div className="flex-1 bg-black/20 relative overflow-hidden">
                  {clips.filter(c => c.trackId === track.id).map((clip) => (
                    <motion.div
                      key={clip.id}
                      onClick={() => setSelectedClip(clip.id)}
                      className={cn(
                        "absolute top-2 bottom-2 rounded-lg border-2 cursor-pointer group transition-all",
                        selectedClip === clip.id ? "border-white ring-2 ring-v12-red/50 shadow-2xl" : "border-white/10 hover:border-white/30"
                      )}
                      style={{ 
                        left: clip.startTime * pixelsPerSecond, 
                        width: clip.duration * pixelsPerSecond,
                        backgroundColor: `${clip.color}33`
                      }}
                    >
                      <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <Activity className="w-full h-full" />
                      </div>
                      <div className="p-2 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase tracking-widest text-white truncate">{clip.name}</span>
                          {clip.isAIAnalyzed && <Zap size={10} className="text-v12-orange" />}
                        </div>
                      </div>
                      
                      {/* Resize Handles */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/50" />
                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/50" />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Automation Lane */}
              <AnimatePresence>
                {track.showAutomation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 60, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex bg-black/40 overflow-hidden border-t border-white/5"
                  >
                    <div className="w-48 border-r border-white/10 p-2 flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-widest text-v12-orange">Pan Automation</span>
                      <button className="text-[8px] font-black text-v12-gray-500 hover:text-white uppercase">Reset</button>
                    </div>
                    <div className="flex-1 relative">
                      {/* Automation Line */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <polyline
                          points={track.automation.pan.map(p => `${p.time * pixelsPerSecond},${(1 - (p.value + 1) / 2) * 60}`).join(' ')}
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                        />
                      </svg>
                      {track.automation.pan.map((point, idx) => (
                        <div 
                          key={idx}
                          className="absolute w-2 h-2 bg-v12-orange rounded-full -ml-1 -mt-1 cursor-pointer hover:scale-150 transition-transform shadow-lg"
                          style={{ left: point.time * pixelsPerSecond, top: (1 - (point.value + 1) / 2) * 60 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Inspector / Analysis Panel */}
      <AnimatePresence>
        {selectedClip && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute top-0 right-0 bottom-0 w-80 bg-v12-gray-900 border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest">Clip Inspector</h3>
              <button onClick={() => setSelectedClip(null)} className="text-v12-gray-400 hover:text-white">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-[10px] font-black text-v12-gray-400 uppercase mb-2">Clip Name</h4>
                  <input 
                    type="text" 
                    value={clips.find(c => c.id === selectedClip)?.name || ''} 
                    className="w-full bg-transparent font-black text-white uppercase outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="text-[10px] font-black text-v12-gray-400 uppercase mb-1">Start</h4>
                    <span className="text-sm font-black text-white">{clips.find(c => c.id === selectedClip)?.startTime.toFixed(2)}s</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="text-[10px] font-black text-v12-gray-400 uppercase mb-1">Duration</h4>
                    <span className="text-sm font-black text-white">{clips.find(c => c.id === selectedClip)?.duration.toFixed(2)}s</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-v12-gray-400 uppercase">AI Audio Intelligence</h4>
                  <div className="px-2 py-0.5 bg-v12-red/20 rounded text-[8px] font-black text-v12-red uppercase">Beta</div>
                </div>

                <button 
                  onClick={() => analyzeClip(selectedClip)}
                  disabled={isAnalyzing}
                  className="w-full py-4 bg-v12-red text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <Activity size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Zap size={18} />
                      AI Analyze Clip
                    </>
                  )}
                </button>

                {clips.find(c => c.id === selectedClip)?.isAIAnalyzed && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-v12-orange/10 border border-v12-orange/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye size={14} className="text-v12-orange" />
                        <span className="text-[10px] font-black text-v12-orange uppercase">AI Insights</span>
                      </div>
                      <p className="text-[10px] font-bold text-v12-gray-300 leading-relaxed uppercase">
                        {clips.find(c => c.id === selectedClip)?.aiInsights}
                      </p>
                    </div>

                    <div className="p-4 bg-v12-blue/10 border border-v12-blue/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Sliders size={14} className="text-v12-blue" />
                        <span className="text-[10px] font-black text-v12-blue uppercase">EQ Refinement</span>
                      </div>
                      <p className="text-[10px] font-bold text-v12-gray-300 leading-relaxed uppercase">
                        {clips.find(c => c.id === selectedClip)?.eqRefinement}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="p-6 bg-black/40 border-t border-white/10">
              <button className="w-full py-3 bg-white/5 hover:bg-v12-red/10 border border-white/10 hover:border-v12-red/50 text-v12-gray-400 hover:text-v12-red rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all">
                <Trash2 size={14} />
                Delete Clip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="p-2 bg-black/60 border-t border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-v12-orange animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest text-v12-gray-500">Timeline Sync: Active</span>
          </div>
          <span className="text-[8px] font-black text-v12-gray-500 uppercase">Sample Rate: 48kHz / 24-bit</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[8px] font-black text-v12-gray-500 uppercase">Project: Urban Visions - Master</span>
        </div>
      </div>
    </div>
  );
}
