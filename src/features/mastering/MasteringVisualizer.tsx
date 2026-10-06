import React, { useEffect, useRef } from 'react';

interface MasteringVisualizerProps {
  isAnalyzing: boolean;
  isProcessing: boolean;
}

export const MasteringVisualizer: React.FC<MasteringVisualizerProps> = ({ isAnalyzing, isProcessing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bars = 60;
    const barWidth = canvas.width / bars;
    const heights = new Array(bars).fill(0).map(() => Math.random() * 50 + 20);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < bars; i++) {
        const x = i * barWidth;
        
        // Target height based on state
        let targetHeight = 10;
        if (isAnalyzing) {
          targetHeight = Math.random() * 60 + 20;
        } else if (isProcessing) {
          targetHeight = Math.random() * 80 + 40;
        }

        // Smooth transition
        heights[i] += (targetHeight - heights[i]) * 0.1;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        if (isAnalyzing) {
          gradient.addColorStop(0, '#c81e3a'); // emerald-500
          gradient.addColorStop(1, '#e2536a'); // emerald-400
        } else if (isProcessing) {
          gradient.addColorStop(0, '#8b5cf6'); // violet-500
          gradient.addColorStop(1, '#a78bfa'); // violet-400
        } else {
          gradient.addColorStop(0, '#3f3f46'); // zinc-700
          gradient.addColorStop(1, '#52525b'); // zinc-600
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, canvas.height - heights[i], barWidth - 2, heights[i]);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isAnalyzing, isProcessing]);

  return (
    <div className="w-full h-32 bg-black/40 rounded-[2rem] border border-white/5 overflow-hidden relative">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={128} 
        className="w-full h-full opacity-50"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        {isAnalyzing && (
          <div className="px-4 py-2 bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-bounce">
            Analyzing Spectrum
          </div>
        )}
        {isProcessing && (
          <div className="px-4 py-2 bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse">
            Applying AI Processing
          </div>
        )}
      </div>
    </div>
  );
};
