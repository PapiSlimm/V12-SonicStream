import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  mediaElement?: HTMLMediaElement | null;
  audioFile?: File | null;
  className?: string;
  isActive?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ mediaElement: propMediaElement, audioFile, className, isActive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const internalAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !isActive) return;
    if (!propMediaElement && !audioFile) return;

    let mediaElement = propMediaElement;
    let objectUrl: string | null = null;

    if (!mediaElement && audioFile) {
      objectUrl = URL.createObjectURL(audioFile);
      const audio = new Audio(objectUrl);
      internalAudioRef.current = audio;
      mediaElement = audio;
      // For file preview, we might want to play it? 
      // The original code played it.
      audio.play().catch(() => {});
    }

    if (!mediaElement) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    let source: MediaElementAudioSourceNode;
    try {
      source = audioContext.createMediaElementSource(mediaElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (err) {
      console.warn('Audio source connection failed (likely already connected):', err);
      // If it's already connected, we might need a different approach, 
      // but for now let's just try to continue if we can find the existing source
      // or just fail gracefully.
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Create a cinematic radial fade background or just clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const barCount = bufferLength / 1.5;
      const barWidth = (canvas.width / barCount);
      
      // Symmetric Drawing
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i];
        const barHeight = (value / 255) * canvas.height * 0.8;
        
        // Gradient color based on frequency
        const hue = 160 + (i / barCount) * 60; // From Emerald to Blue
        const saturation = 80 + (value / 255) * 20;
        const lightness = 40 + (value / 255) * 30;
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`;
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`;
        
        // Draw Right
        ctx.fillRect(centerX + (i * barWidth), canvas.height - barHeight, barWidth - 1, barHeight);
        // Draw Left
        ctx.fillRect(centerX - (i * barWidth) - barWidth, canvas.height - barHeight, barWidth - 1, barHeight);

        // Add a "peak" dot
        ctx.fillStyle = `white`;
        ctx.shadowBlur = 5;
        ctx.fillRect(centerX + (i * barWidth), canvas.height - barHeight - 4, barWidth - 1, 2);
        ctx.fillRect(centerX - (i * barWidth) - barWidth, canvas.height - barHeight - 4, barWidth - 1, 2);
      }
      
      // Reset shadow for performance
      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (internalAudioRef.current) {
        internalAudioRef.current.pause();
        internalAudioRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [propMediaElement, audioFile, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      width={400}
      height={100}
    />
  );
};
