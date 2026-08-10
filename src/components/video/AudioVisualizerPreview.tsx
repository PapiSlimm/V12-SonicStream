import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { toast } from '../ui/Toast';

interface AudioVisualizerPreviewProps {
  file: File;
  onRefined?: (videoUrl: string) => void;
}

export const AudioVisualizerPreview: React.FC<AudioVisualizerPreviewProps> = ({ file, onRefined }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const initAudio = () => {
    if (analyserRef.current || !audioRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audioRef.current);
    const analyser = audioContext.createAnalyser();
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
  };

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const bufferLength = analyser.frequencyBinCount;

    analyser.getByteFrequencyData(dataArray);

    const width = canvas.width;
    const height = canvas.height;

    // Clear with slight fade for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);

    const barWidth = (width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * height * 0.8;

      // Emerald to Purple gradient based on frequency
      const r = 16 + (i / bufferLength) * 147; // 16 -> 163
      const g = 185 - (i / bufferLength) * 100; // 185 -> 85
      const b = 129 + (i / bufferLength) * 100; // 129 -> 229
      
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      
      // Draw mirrored bars
      ctx.fillRect(x, height / 2 - barHeight / 2, barWidth, barHeight);
      
      // Add some "glow"
      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(${r},${g},${b}, 0.5)`;

      x += barWidth + 1;
    }

    // Draw some particles/circles for "discovery" feel
    const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
    if (avg > 100) {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, avg * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    animationRef.current = requestAnimationFrame(draw);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      initAudio();
      audioRef.current.play();
      draw();
    }
    setIsPlaying(!isPlaying);
  };

  const handleRefine = async () => {
    if (!canvasRef.current) return;
    
    setIsRefining(true);
    try {
      // Capture current frame as base64
      const frame = canvasRef.current.toDataURL('image/jpeg', 0.8);
      
      const response = await fetch('/api/ai/refine-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          frame,
          prompt: "Cinematic music video, abstract rhythmic flow, emerald and purple neon lights, high quality, 4k",
          audio_context: "Electronic music rhythmic pulse"
        })
      });

      if (!response.ok) throw new Error('AI Refinement failed');
      
      const data = await response.json();
      toast.success('AI Refinement complete!');
      if (onRefined && data.videoUrl) {
        onRefined(data.videoUrl);
      }
    } catch (err) {
      console.error(err);
      toast.error('AI Refinement failed. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 group">
        <canvas 
          ref={canvasRef} 
          width={1280} 
          height={720} 
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
          <div className="flex items-center gap-4 w-full">
            <button 
              onClick={togglePlay}
              className="w-12 h-12 bg-zinc-700 text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Real-time Preview</p>
              <p className="text-[10px] text-zinc-400">Audio-reactive Canvas Engine</p>
            </div>

            <button 
              onClick={handleRefine}
              disabled={isRefining}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-500/20"
            >
              {isRefining ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Refine with AI
                </>
              )}
            </button>
          </div>
        </div>

        {!isPlaying && !isRefining && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                <Wand2 size={32} className="text-emerald-400" />
              </div>
              <p className="text-sm font-medium">Click play to see reactive visuals</p>
            </div>
          </div>
        )}
      </div>

      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
      
      <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-start gap-3">
        <Sparkles size={16} className="text-purple-400 mt-1 shrink-0" />
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          <span className="text-zinc-300 font-bold">AI Refinement:</span> This uses Replicate's Stable Video Diffusion or RunwayML to transform your real-time canvas preview into a professional music video. Refinement takes 30-60 seconds.
        </p>
      </div>
    </div>
  );
};
