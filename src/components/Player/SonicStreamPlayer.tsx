import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import * as dashjs from 'dashjs';

interface SonicStreamPlayerProps {
  src: string;
  poster?: string;
}

export const SonicStreamPlayer = ({ src, poster }: SonicStreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashRef = useRef<any>(null);
  const [protocol, setProtocol] = useState<'HLS' | 'DASH' | 'Native'>('Native');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isDASH = src.endsWith('.mpd');
    const isHLS = src.endsWith('.m3u8');

    if (isDASH) {
      const player = dashjs.MediaPlayer().create();
      player.initialize(video, src, true);
      dashRef.current = player;
      setProtocol('DASH');
    } else if (isHLS) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
        hlsRef.current = hls;
        setProtocol('HLS');
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        setProtocol('Native');
      }
    } else {
      video.src = src;
      setProtocol('Native');
    }

    return () => {
      hlsRef.current?.destroy();
      dashRef.current?.reset();
    };
  }, [src]);

  return (
    <div className="relative w-full aspect-video rounded-4xl overflow-hidden bg-black shadow-2xl">
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        controls
        playsInline
      />
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl px-4 py-2 rounded-2xl text-xs font-bold text-emerald-400 border border-emerald-500/30">
        {protocol} • V12 Engine
      </div>
    </div>
  );
};
