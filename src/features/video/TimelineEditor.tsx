import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Scissors, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface VideoSegment {
  id: string;
  url: string;
  startTime: number;
  endTime: number;
  duration: number;
  name: string;
}

interface TimelineEditorProps {
  segments: VideoSegment[];
  onUpdateSegments: (segments: VideoSegment[]) => void;
  onPreviewSegment: (url: string) => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({ 
  segments, 
  onUpdateSegments,
  onPreviewSegment
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [isTrimming, setIsTrimming] = useState<{ id: string, side: 'start' | 'end' } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const totalDuration = segments.reduce((acc, seg) => acc + (seg.endTime - seg.startTime), 0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => (prev >= totalDuration ? 0 : prev + 0.1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  const handleTrim = useCallback((id: string, side: 'start' | 'end', delta: number) => {
    const newSegments = segments.map(seg => {
      if (seg.id === id) {
        const newSeg = { ...seg };
        // Scale delta based on timeline width (roughly 1px = 0.1s for this demo)
        const timeDelta = delta * 0.1; 
        if (side === 'start') {
          newSeg.startTime = Math.max(0, Math.min(seg.endTime - 0.5, seg.startTime + timeDelta));
        } else {
          newSeg.endTime = Math.min(seg.duration, Math.max(seg.startTime + 0.5, seg.endTime + timeDelta));
        }
        return newSeg;
      }
      return seg;
    });
    onUpdateSegments(newSegments);
  }, [segments, onUpdateSegments]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isTrimming) {
        handleTrim(isTrimming.id, isTrimming.side, e.movementX);
      }
    };

    const handleMouseUp = () => {
      setIsTrimming(null);
    };

    if (isTrimming) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isTrimming, handleTrim]);

  const removeSegment = (id: string) => {
    onUpdateSegments(segments.filter(s => s.id !== id));
    if (selectedSegmentId === id) setSelectedSegmentId(null);
  };

  const moveSegment = (id: string, direction: 'left' | 'right') => {
    const index = segments.findIndex(s => s.id === id);
    if (index === -1) return;
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === segments.length - 1) return;

    const newSegments = [...segments];
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    [newSegments[index], newSegments[newIndex]] = [newSegments[newIndex], newSegments[index]];
    onUpdateSegments(newSegments);
  };

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
            <Layers size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">Timeline Editor</h3>
            <p className="text-xs text-zinc-500 font-black uppercase tracking-widest">
              {segments.length} Segments • {totalDuration.toFixed(1)}s Total
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 bg-white text-white rounded-xl hover:bg-zinc-600 transition-all"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button className="p-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all">
            <Scissors size={18} />
          </button>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="relative h-48 bg-black/40 border border-white/10 rounded-3xl overflow-hidden group">
        {/* Time Markers */}
        <div className="absolute top-0 left-0 right-0 h-6 border-b border-white/5 flex items-center px-4 gap-20">
          {[...Array(20)].map((_, i) => (
            <span key={i} className="text-[8px] font-black text-zinc-600 uppercase tracking-widest w-8">
              {i * 5}s
            </span>
          ))}
        </div>

        <div 
          ref={timelineRef}
          className="absolute top-6 left-0 right-0 bottom-0 flex items-center px-4 gap-1 overflow-x-auto custom-scrollbar"
        >
          <AnimatePresence mode="popLayout">
            {segments.map((seg) => (
              <motion.div
                key={seg.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => {
                  setSelectedSegmentId(seg.id);
                  onPreviewSegment(seg.url);
                }}
                className={cn(
                  "relative h-32 shrink-0 rounded-2xl border-2 transition-all cursor-pointer group/seg overflow-hidden",
                  selectedSegmentId === seg.id 
                    ? "border-purple-500 bg-purple-500/10 w-64" 
                    : "border-white/5 bg-white/5 w-40 hover:border-white/20"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/seg:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); moveSegment(seg.id, 'left'); }}
                    className="p-1.5 bg-black/60 rounded-lg hover:bg-white/20"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); moveSegment(seg.id, 'right'); }}
                    className="p-1.5 bg-black/60 rounded-lg hover:bg-white/20"
                  >
                    <ChevronRight size={12} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeSegment(seg.id); }}
                    className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-[10px] font-black uppercase tracking-widest truncate">{seg.name}</p>
                  <div className="flex justify-between text-[8px] font-bold text-zinc-500 mt-1">
                    <span>{seg.startTime.toFixed(1)}s</span>
                    <span>{(seg.endTime - seg.startTime).toFixed(1)}s</span>
                    <span>{seg.endTime.toFixed(1)}s</span>
                  </div>
                </div>

                {/* Trim Handles */}
                {selectedSegmentId === seg.id && (
                  <>
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-3 bg-purple-500 cursor-ew-resize hover:bg-purple-400 transition-all z-20 flex items-center justify-center group/handle"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsTrimming({ id: seg.id, side: 'start' });
                      }}
                    >
                      <div className="w-0.5 h-6 bg-white/40 rounded-full group-hover/handle:bg-white" />
                    </div>
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-3 bg-purple-500 cursor-ew-resize hover:bg-purple-400 transition-all z-20 flex items-center justify-center group/handle"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsTrimming({ id: seg.id, side: 'end' });
                      }}
                    >
                      <div className="w-0.5 h-6 bg-white/40 rounded-full group-hover/handle:bg-white" />
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {segments.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-2">
              <Plus size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest">Add segments to start editing</p>
            </div>
          )}
        </div>

        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-30 pointer-events-none"
          style={{ left: `${currentTime * 20 + 16}px` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-500 rotate-45" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
            <Clock size={14} className="text-zinc-500" />
            <span className="text-xs font-mono text-zinc-300">
              {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(2).padStart(5, '0')}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">AI Effects Ready</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2">
            <Plus size={14} />
            Add Transition
          </button>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-xl shadow-purple-500/20 flex items-center gap-2">
            <Layers size={14} />
            Merge & Export
          </button>
        </div>
      </div>
    </div>
  );
};
