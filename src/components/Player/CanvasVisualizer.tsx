import React, { useRef, useEffect } from 'react';

interface CanvasVisualizerProps {
  mediaElement?: HTMLMediaElement | null;
  isActive?: boolean;
  color?: string;
  barCount?: number;
}

export const CanvasVisualizer: React.FC<CanvasVisualizerProps> = ({ 
  mediaElement, 
  isActive = true,
  color = '#c81e3a',
  barCount = 64
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!mediaElement || !isActive) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    try {
      const source = audioContext.createMediaElementSource(mediaElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (err) {
      console.warn('Audio source connection failed:', err);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / barCount) * 0.8;
      const gutter = (width / barCount) * 0.2;
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        const index = Math.floor((i / barCount) * bufferLength);
        const barHeight = (dataArray[index] / 255) * height;

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, `${color}33`);

        ctx.fillStyle = gradient;
        
        // Rounded bars
        const radius = barWidth / 2;
        const y = height - barHeight;
        
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
        ctx.fill();

        // Glow effect
        if (dataArray[index] > 200) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = color;
        } else {
          ctx.shadowBlur = 0;
        }

        x += barWidth + gutter;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [mediaElement, isActive, color, barCount]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      width={800}
      height={200}
    />
  );
};
