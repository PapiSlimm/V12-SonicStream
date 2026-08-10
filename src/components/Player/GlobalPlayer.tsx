import { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, ListMusic, X, Share2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTrack } from '../../context/TrackContext';
import AdaptivePlayer, { AdaptivePlayerRef } from './AdaptivePlayer';
import { announceToScreenReader, unlockAudioContext } from '../../utils/production';
import { api } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CanvasVisualizer } from './CanvasVisualizer';

const SortableTrackItem = ({ track, currentTrackId, onRemove }: { track: any, currentTrackId: string, onRemove: (id: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-2 rounded-xl group transition-colors",
        currentTrackId === track.id ? "bg-white/10" : "hover:bg-white/5",
        isDragging && "bg-zinc-800 shadow-xl"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400">
        <div className="grid grid-cols-2 gap-0.5">
          <div className="w-1 h-1 bg-current rounded-full" />
          <div className="w-1 h-1 bg-current rounded-full" />
          <div className="w-1 h-1 bg-current rounded-full" />
          <div className="w-1 h-1 bg-current rounded-full" />
          <div className="w-1 h-1 bg-current rounded-full" />
          <div className="w-1 h-1 bg-current rounded-full" />
        </div>
      </div>
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
        <img 
          src={track.coverUrl || `https://picsum.photos/seed/${track.id}/100/100`} 
          alt={track.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          currentTrackId === track.id ? "text-emerald-400" : "text-white"
        )}>
          {track.title}
        </p>
        <p className="text-xs text-zinc-400 truncate">{track.displayArtistName}</p>
      </div>
      <button 
        onClick={() => onRemove(track.id)}
        className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const GlobalPlayer = () => {
  const { 
    currentTrack, 
    nextTrack, 
    previousTrack, 
    isPlaying, 
    setIsPlaying, 
    pause,
    queue,
    removeFromQueue,
    reorderQueue,
    clearQueue
  } = useTrack();
  const [isFullPlayer, setIsFullPlayer] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [mediaElement, setMediaElement] = useState<HTMLMediaElement | null>(null);
  const playerRef = useRef<AdaptivePlayerRef>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((t) => t.id === active.id);
      const newIndex = queue.findIndex((t) => t.id === over.id);
      reorderQueue(oldIndex, newIndex);
    }
  };

  useEffect(() => {
    // Mobile audio context unlock
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    unlockAudioContext(audioContext);
  }, []);

  useEffect(() => {
    if (isPlaying && currentTrack) {
      api.tracks.incrementPlays(currentTrack.id);
    }
  }, [isPlaying, currentTrack]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
      announceToScreenReader(`Paused ${currentTrack?.title}`);
    } else {
      setIsPlaying(true);
      announceToScreenReader(`Playing ${currentTrack?.title}`);
    }
  };

  const handleShare = async () => {
    if (!currentTrack) return;
    
    const shareData = {
      title: currentTrack.title,
      text: `Check out ${currentTrack.title} by ${currentTrack.displayArtistName} on SonicStream!`,
      url: window.location.origin + `?track=${currentTrack.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Could not share track');
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 z-50 transition-all duration-300",
      currentTrack ? 'translate-y-0' : 'translate-y-full',
      isFullPlayer ? 'h-screen' : 'h-24'
    )}>
      {/* Progress Bar (Minimized) */}
      {!isFullPlayer && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 cursor-pointer group/progress">
          <div 
            className="absolute inset-y-0 left-0 bg-emerald-500 group-hover/progress:bg-emerald-400 transition-colors"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
          <input 
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              if (playerRef.current?.player) {
                playerRef.current.player.currentTime(time);
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      )}
      {/* Queue Sidebar Overlay */}
      <AnimatePresence>
        {showQueue && !isFullPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 right-4 w-80 max-h-[70vh] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-800/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ListMusic size={18} />
                Queue ({queue.length})
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={clearQueue}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Clear
                </button>
                <button 
                  onClick={() => setShowQueue(false)}
                  className="p-1 hover:bg-white/10 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={queue.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {queue.map((track) => (
                    <SortableTrackItem 
                      key={track.id}
                      track={track}
                      currentTrackId={currentTrack.id}
                      onRemove={removeFromQueue}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {queue.length === 0 && (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  Queue is empty
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden AdaptivePlayer for background playback when minimized */}
      <div className={cn("absolute inset-0 pointer-events-none opacity-0", isFullPlayer && "relative opacity-100 pointer-events-auto h-full")}>
        <div className={isFullPlayer ? "h-full flex flex-col p-8 max-w-4xl mx-auto" : "hidden"}>
          <button 
            onClick={() => setIsFullPlayer(false)}
            className="self-end p-4 text-zinc-400 hover:text-white flex items-center gap-2"
          >
            <X size={24} />
            Close
          </button>
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="w-full max-w-md aspect-square rounded-[40px] overflow-hidden shadow-2xl">
              <img 
                src={currentTrack.coverUrl || `https://picsum.photos/seed/${currentTrack.id}/800/800`} 
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tighter text-white">{currentTrack.title}</h2>
              <p className="text-xl text-zinc-400">{currentTrack.displayArtistName}</p>
            </div>
            
            {/* Volume Control in Full Player */}
            <div className="flex items-center gap-4 w-full max-w-xs">
              <button onClick={() => setVolume(v => v === 0 ? 0.8 : 0)} className="text-zinc-400 hover:text-white">
                {volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full relative group cursor-pointer overflow-hidden">
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div 
                  className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-100" 
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-8">
              <button 
                onClick={handleShare}
                className="p-4 bg-zinc-800 text-zinc-400 rounded-2xl hover:text-white transition-all"
                title="Share Track"
              >
                <Share2 size={24} />
              </button>
              <AdaptivePlayer
                ref={playerRef}
                track={currentTrack}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onNext={nextTrack}
                onPrevious={previousTrack}
                onTimeUpdate={(time, dur) => {
                  setCurrentTime(time);
                  setDuration(dur);
                }}
                onMediaElement={setMediaElement}
                volume={volume}
              />
            </div>
          </div>
        </div>
        {!isFullPlayer && (
          <AdaptivePlayer
            ref={playerRef}
            track={currentTrack}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNext={nextTrack}
            onPrevious={previousTrack}
            onTimeUpdate={(time, dur) => {
              setCurrentTime(time);
              setDuration(dur);
            }}
            onMediaElement={setMediaElement}
            volume={volume}
          />
        )}
      </div>

      {!isFullPlayer && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-4 relative">
          {/* Background Visualizer */}
          <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
            <CanvasVisualizer 
              mediaElement={mediaElement} 
              isActive={isPlaying}
              color="#c81e3a"
              barCount={128}
            />
          </div>
          
          <div className="flex items-center gap-4 flex-1 min-w-0 relative z-10">
            <div 
              className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 bg-zinc-800 cursor-pointer group relative"
              onClick={() => setIsFullPlayer(true)}
            >
              <img 
                src={currentTrack.coverUrl || `https://picsum.photos/seed/${currentTrack.id}/200/200`} 
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={20} />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white truncate text-sm md:text-base">{currentTrack.title}</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs md:text-sm text-zinc-400 truncate">{currentTrack.displayArtistName}</p>
                <span className="text-[10px] text-zinc-600 font-mono hidden sm:inline">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6 relative z-10">
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
              title="Share Track"
            >
              <Share2 size={20} />
            </button>

            <button 
              onClick={previousTrack} 
              className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <SkipBack size={20} />
            </button>
            
            <button 
              onClick={handlePlayPause}
              className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
            </button>

            <button 
              onClick={nextTrack} 
              className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-1 justify-end relative z-10">
            <button 
              onClick={() => setShowQueue(!showQueue)}
              className={cn(
                "p-2 rounded-full transition-colors",
                showQueue ? "bg-emerald-500 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10"
              )}
            >
              <ListMusic size={20} />
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setVolume(v => v === 0 ? 0.8 : 0)}>
                {volume === 0 ? <VolumeX size={20} className="text-zinc-400" /> : <Volume2 size={20} className="text-zinc-400" />}
              </button>
              <div className="w-24 h-1 bg-zinc-800 rounded-full relative group cursor-pointer overflow-hidden">
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div 
                  className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-100" 
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>
            <button 
              onClick={() => setIsFullPlayer(true)}
              className="p-2 text-zinc-400 hover:text-white"
            >
              <Maximize2 size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
