import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  type?: string; // 'application/x-mpegURL' for HLS, 'application/dash+xml' for DASH
  poster?: string;
  autoplay?: boolean;
  controls?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  type = 'application/x-mpegURL',
  poster,
  autoplay = false,
  controls = true,
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current?.appendChild(videoElement);

      playerRef.current = videojs(videoElement, {
        autoplay,
        controls,
        responsive: true,
        fluid: true,
        poster,
        sources: [{ src, type }]
      }, () => {
        videojs.log('player is ready');
      });
    } else {
      const player = playerRef.current;
      player.autoplay(autoplay);
      player.src({ src, type });
    }
  }, [src, type, autoplay, controls, poster]);

  // Dispose the player on unmount
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player className="w-full rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black">
      <div ref={videoRef} />
    </div>
  );
};
