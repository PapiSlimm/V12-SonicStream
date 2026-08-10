import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import * as dashjs from 'dashjs';
import 'videojs-contrib-hls';

interface StreamPlayerProps {
  src: string;
  type: 'hls' | 'dash';
  poster?: string;
  className?: string;
}

export const StreamPlayer: React.FC<StreamPlayerProps> = ({ src, type, poster, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    if (type === 'hls') {
      playerRef.current = videojs(videoRef.current, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        poster: poster,
        sources: [{
          src: src,
          type: 'application/x-mpegURL'
        }]
      });
    } else if (type === 'dash') {
      const player = dashjs.MediaPlayer().create();
      player.initialize(videoRef.current, src, true);
      playerRef.current = player;
    }

    return () => {
      if (playerRef.current) {
        if (type === 'hls') {
          playerRef.current.dispose();
        } else {
          playerRef.current.reset();
        }
      }
    };
  }, [src, type, poster]);

  return (
    <div data-vjs-player className={className}>
      <video ref={videoRef} className="video-js vjs-big-play-centered" />
    </div>
  );
};
