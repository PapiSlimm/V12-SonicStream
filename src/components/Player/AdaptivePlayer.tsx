import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize2,
  Settings,
} from 'lucide-react';
import { Track } from '../../types';
import { SonicVisualizer } from './SonicVisualizer';
import { CanvasVisualizer } from './CanvasVisualizer';

interface AdaptivePlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onMediaElement?: (el: HTMLMediaElement | null) => void;
  volume?: number;
}

export interface AdaptivePlayerRef {
  player: any;
  mediaElement: HTMLMediaElement | null;
}

const AdaptivePlayer = forwardRef<AdaptivePlayerRef, AdaptivePlayerProps>(
  ({ track, isPlaying, onPlayPause, onNext, onPrevious, onTimeUpdate, onMediaElement, volume = 1 }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<any>(null);
    const [mediaElement, setMediaElement] = useState<HTMLMediaElement | null>(null);

    useImperativeHandle(ref, () => ({
      player: playerRef.current,
      mediaElement: videoRef.current,
    }));

    useEffect(() => {
      if (!videoRef.current || playerRef.current) return;

      const player = videojs(videoRef.current, {
        fluid: true,
        responsive: true,
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        liveui: false,
        html5: {
          vhs: {
            overrideNative: true,
            smoothQualityChange: true,
          },
        },
      });

      playerRef.current = player;
      setMediaElement(videoRef.current);
      if (onMediaElement) onMediaElement(videoRef.current);

      player.on('ended', onNext);
      
      player.on('timeupdate', () => {
        if (onTimeUpdate) {
          onTimeUpdate(player.currentTime() || 0, player.duration() || 0);
        }
      });

      player.on('loadedmetadata', () => {
        if (onTimeUpdate) {
          onTimeUpdate(player.currentTime() || 0, player.duration() || 0);
        }
      });

      return () => {
        if (player && !player.isDisposed()) {
          player.dispose();
          playerRef.current = null;
          if (onMediaElement) onMediaElement(null);
        }
      };
    }, [onNext, onMediaElement, onTimeUpdate]);

    useEffect(() => {
      if (!playerRef.current) return;
      playerRef.current.volume(volume);
    }, [volume]);

    useEffect(() => {
      if (!playerRef.current) return;

      const player = playerRef.current;
      
      player.src([
        {
          src: track.hlsUrl || track.streamUrl,
          type: track.hlsUrl ? 'application/x-mpegURL' : 'audio/mpeg',
        },
        ...(track.dashUrl ? [{
          src: track.dashUrl,
          type: 'application/dash+xml',
        }] : []),
      ]);

      if (isPlaying) {
        player.play().catch(() => {});
      } else {
        player.pause();
      }
    }, [track, isPlaying]);

    return (
      <div className="w-full bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl relative group/player">
        {/* Custom controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6 pointer-events-none opacity-0 group-hover/player:opacity-100 transition-opacity">
          <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl rounded-2xl p-4 pointer-events-auto">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={track.coverUrl || 'https://picsum.photos/seed/music/200/200'}
                  alt={track.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white text-xs md:text-sm truncate">
                  {track.title}
                </h3>
                <p className="text-[10px] md:text-xs text-zinc-400 truncate">{track.displayArtistName}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <button
                onClick={onPrevious}
                className="p-1.5 md:p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Previous"
              >
                <SkipBack size={18} className="text-white" />
              </button>
              
              <button
                onClick={onPlayPause}
                className="w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
              >
                {isPlaying ? (
                  <Pause size={20} className="text-white" />
                ) : (
                  <Play size={20} className="fill-white text-white" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-1.5 md:p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Next"
              >
                <SkipForward size={18} className="text-white" />
              </button>

              <div className="hidden sm:flex items-center gap-2 ml-2">
                <Volume2 size={18} className="text-zinc-400 hover:text-white cursor-pointer" />
                <Settings size={18} className="text-zinc-400 hover:text-white cursor-pointer" />
                <Maximize2 size={18} className="text-zinc-400 hover:text-white cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {/* Video.js container */}
        <div data-vjs-player className="aspect-video bg-black relative">
          <video
            ref={videoRef}
            id="global-audio-element"
            className="video-js vjs-big-play-centered w-full h-full"
            playsInline
            preload="metadata"
          />
          
          {/* Audio Visualizer Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <SonicVisualizer 
              mediaElement={mediaElement} 
              isActive={isPlaying}
            />
          </div>
          
          {/* 2D Canvas Visualizer at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none opacity-40">
            <CanvasVisualizer 
              mediaElement={mediaElement} 
              isActive={isPlaying}
              color="#c81e3a"
              barCount={128}
            />
          </div>
        </div>
      </div>
    );
  }
);

AdaptivePlayer.displayName = 'AdaptivePlayer';
export default AdaptivePlayer;
