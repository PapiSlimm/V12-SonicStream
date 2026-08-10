import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Activity, Eye, Zap } from 'lucide-react';

interface MusicStreamVisualizerProps {
  isPlaying: boolean;
  color?: string;
  mode?: 'bars' | 'wave' | 'circle';
}

export const MusicStreamVisualizer: React.FC<MusicStreamVisualizerProps> = ({
  isPlaying,
  color = '#c81e3a',
  mode: initialMode = 'bars'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [visMode, setVisMode] = useState<'bars' | 'wave' | 'circle'>(initialMode);
  
  // Keep references for Audio context to avoid garbage collection
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    let audioCtx: AudioContext | null = null;

    const setupAudio = async () => {
      // Find the global audio element
      const mediaElement = document.getElementById('global-audio-element') as HTMLMediaElement;
      if (!mediaElement) {
        // Try again in 500ms if not in DOM yet
        if (active) setTimeout(setupAudio, 500);
        return;
      }

      // We use a global registry on window to avoid "MediaElementAudioSourceNode already connected" error
      const win = window as any;
      if (!win.__sonicStreamAudioRegistry) {
        win.__sonicStreamAudioRegistry = new Map();
      }

      const registry = win.__sonicStreamAudioRegistry;
      
      try {
        if (registry.has(mediaElement)) {
          const registered = registry.get(mediaElement);
          analyserRef.current = registered.analyser;
          dataArrayRef.current = registered.dataArray;
        } else {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtx = new AudioContextClass();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.75;
          
          const source = audioCtx.createMediaElementSource(mediaElement);
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
          
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          const state = { audioCtx, analyser, source, dataArray };
          registry.set(mediaElement, state);
          
          analyserRef.current = analyser;
          dataArrayRef.current = dataArray;
          sourceRef.current = source;
        }
      } catch (err) {
        console.warn("[MusicStreamVisualizer] Web Audio connection caught/fallback active:", err);
      }
    };

    setupAudio();

    return () => {
      active = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth || 300;
    let height = canvas.height = canvas.offsetHeight || 300;

    // Handle container resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (canvas) {
          width = canvas.width = entry.contentRect.width || canvas.offsetWidth;
          height = canvas.height = entry.contentRect.height || canvas.offsetHeight;
        }
      }
    });
    
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // High performance drawing loop
    const renderFrame = () => {
      animationRef.current = requestAnimationFrame(renderFrame);

      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      
      const bufferLength = analyser ? analyser.frequencyBinCount : 64;
      const localDataArray = new Uint8Array(bufferLength);

      if (analyser && dataArray && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        localDataArray.set(dataArray);
      } else if (isPlaying) {
        // Fallback procedural wave when API key is loaded but cross-origin prevents Web Audio access
        const time = Date.now() * 0.003;
        for (let i = 0; i < bufferLength; i++) {
          localDataArray[i] = Math.max(
            0,
            Math.sin(i * 0.15 + time) * 80 + 
            Math.cos(i * 0.35 - time * 0.5) * 40 + 
            110 + 
            Math.random() * 15
          );
        }
      } else {
        // Flatline / Idle heartbeat
        const time = Date.now() * 0.001;
        for (let i = 0; i < bufferLength; i++) {
          localDataArray[i] = Math.max(0, Math.sin(i * 0.08 + time) * 8 + 12);
        }
      }

      ctx.clearRect(0, 0, width, height);

      if (visMode === 'bars') {
        // Standard Spectrum Bars
        const barWidth = (width / bufferLength) * 1.6;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (localDataArray[i] / 255) * height * 0.85;

          // Multi-color neon gradient
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)'); // emerald alpha
          gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.8)'); // emerald neon
          gradient.addColorStop(1, 'rgba(6, 182, 212, 1)');     // cyan peak

          ctx.fillStyle = gradient;
          
          // Draw rounded bars
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          x += barWidth;
        }
      } else if (visMode === 'wave') {
        // Neon Oscillating Sine Wave
        ctx.beginPath();
        ctx.lineWidth = 3;
        
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#c81e3a');
        gradient.addColorStop(0.5, '#06b6d4');
        gradient.addColorStop(1, '#8b5cf6');
        ctx.strokeStyle = gradient;

        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = localDataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        // Reset shadow for performance
        ctx.shadowBlur = 0;
      } else if (visMode === 'circle') {
        // Immersive Pulsing Center Ring
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Average the frequency data
        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += localDataArray[i];
        }
        const average = total / bufferLength;
        const pulseRatio = average / 255;

        const baseRadius = Math.min(width, height) * 0.32;
        const targetRadius = baseRadius + pulseRatio * 32;

        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';

        // Draw outer pulsing frequency spikes
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
        ctx.lineWidth = 2.5;

        for (let i = 0; i < bufferLength; i++) {
          const angle = (i / bufferLength) * Math.PI * 2;
          const spikeHeight = (localDataArray[i] / 255) * 45;
          const r = targetRadius + spikeHeight;
          const x1 = centerX + Math.cos(angle) * targetRadius;
          const y1 = centerY + Math.sin(angle) * targetRadius;
          const x2 = centerX + Math.cos(angle) * r;
          const y2 = centerY + Math.sin(angle) * r;
          
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();

        // Draw middle breathing glass ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, targetRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#c81e3a';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.shadowBlur = 0;
      }
    };

    renderFrame();

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [visMode, isPlaying]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Visualizer Canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block rounded-[40px] pointer-events-none transition-opacity duration-500"
      />

      {/* Floating Interactive Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 shadow-lg z-10">
        <button
          onClick={() => setVisMode('bars')}
          className={`p-1.5 rounded-full transition-all ${visMode === 'bars' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          title="Spectrum Bars"
        >
          <Activity size={12} />
        </button>
        <button
          onClick={() => setVisMode('wave')}
          className={`p-1.5 rounded-full transition-all ${visMode === 'wave' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          title="Oscillating Wave"
        >
          <Zap size={12} />
        </button>
        <button
          onClick={() => setVisMode('circle')}
          className={`p-1.5 rounded-full transition-all ${visMode === 'circle' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          title="Circular Pulse"
        >
          <Eye size={12} />
        </button>
      </div>

      {/* Mini Active/Streaming Indicator */}
      <div className="absolute bottom-4 left-6 flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-emerald-400 uppercase bg-black/50 border border-emerald-500/10 px-2 py-0.5 rounded-full">
        <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isPlaying ? 'animate-ping' : ''}`} />
        <span>{isPlaying ? 'Live Reactive Output' : 'Visualizer Idle'}</span>
      </div>
    </div>
  );
};
