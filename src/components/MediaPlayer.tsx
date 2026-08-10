import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Download, Share2, SkipBack, SkipForward, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface MediaPlayerProps {
  src: string;
  title?: string;
  subtitle?: string;
  poster?: string;
  type?: 'video' | 'audio';
  autoPlay?: boolean;
}

export function MediaPlayer({ src, title, subtitle, poster, type = 'video', autoPlay = false }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('1080p');
  const [isBuffering, setIsBuffering] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
      setProgress((media.currentTime / media.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('playing', handlePlaying);

    if (autoPlay) {
      media.play().catch(() => {
        // Autoplay might be blocked by browser
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('playing', handlePlaying);
    };
  }, [src, autoPlay]);

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseFloat(e.target.value) / 100) * duration;
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (mediaRef.current) {
      mediaRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative group bg-black overflow-hidden border-4 border-black shadow-2xl",
        type === 'video' ? "aspect-video" : "h-32"
      )}
    >
      {type === 'video' ? (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          poster={poster}
          className="w-full h-full object-cover"
          onClick={togglePlay}
          playsInline
        />
      ) : (
        <div className="w-full h-full bg-v12-gray-900 flex items-center px-8 relative overflow-hidden">
          <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={src} />
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="flex items-end gap-1 h-full w-full justify-around">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: isPlaying ? [10, 40, 20, 50, 10] : 10 }}
                  transition={{ repeat: Infinity, duration: 1 + Math.random(), ease: "easeInOut" }}
                  className="w-2 bg-v12-red"
                />
              ))}
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-6 w-full">
            <div className="w-16 h-16 bg-v12-red flex items-center justify-center border-2 border-black shadow-lg">
              <Volume2 className="text-white" size={32} />
            </div>
            <div className="flex-grow">
              <h4 className="text-sm font-black uppercase tracking-widest text-white">{title || 'Audio Stream'}</h4>
              <p className="text-[10px] text-v12-gray-400 uppercase tracking-widest">{subtitle || 'V12 SonicStream'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Buffering Overlay */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 z-20"
          >
            <Loader2 className="text-v12-red animate-spin" size={48} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-30 flex flex-col justify-end bg-gradient-to-t from-black/90 via-transparent to-transparent p-4"
          >
            {/* Top Bar */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <div className="bg-black/60 backdrop-blur-md p-2 border-l-4 border-v12-red">
                <h3 className="text-xs font-black uppercase tracking-widest text-white">{title}</h3>
                <p className="text-[8px] text-v12-gray-400 uppercase tracking-widest">{subtitle}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-black/60 text-white hover:text-v12-red transition-colors"><Share2 size={16} /></button>
                <button className="p-2 bg-black/60 text-white hover:text-v12-red transition-colors"><Download size={16} /></button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-1 bg-white/20 mb-4 group/progress cursor-pointer">
              <div 
                className="absolute top-0 left-0 h-full bg-v12-red z-10" 
                style={{ width: `${progress}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
              />
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => { if(mediaRef.current) mediaRef.current.currentTime -= 10 }} className="text-white hover:text-v12-red transition-colors"><SkipBack size={20} /></button>
                <button 
                  onClick={togglePlay}
                  className="w-10 h-10 bg-v12-red text-white flex items-center justify-center border-2 border-black hover:scale-110 transition-transform"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                </button>
                <button onClick={() => { if(mediaRef.current) mediaRef.current.currentTime += 10 }} className="text-white hover:text-v12-red transition-colors"><SkipForward size={20} /></button>
                
                <div className="flex items-center gap-2 group/volume ml-2">
                  <button onClick={toggleMute} className="text-white hover:text-v12-red transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/20 accent-v12-red cursor-pointer"
                  />
                </div>

                <span className="text-[10px] font-black text-white/60 tracking-widest">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 border border-white/10">
                  <span className="text-[8px] font-black text-v12-red uppercase tracking-widest">BITRATE: ADAPTIVE</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={cn("w-1 h-2", i <= 3 ? "bg-v12-red" : "bg-white/20")} />
                    ))}
                  </div>
                </div>
                
                <button className="text-white hover:text-v12-red transition-colors"><Settings size={20} /></button>
                <button onClick={toggleFullScreen} className="text-white hover:text-v12-red transition-colors">
                  {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
