import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface GenerativeVisualizerProps {
  coverUrl?: string;
  isActive?: boolean;
}

export const GenerativeVisualizer: React.FC<GenerativeVisualizerProps> = ({ coverUrl, isActive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.color = `hsla(${160 + Math.random() * 60}, 70%, 50%, 0.3)`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[40px] bg-black border border-white/10">
      {coverUrl && (
        <motion.img 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          src={coverUrl}
          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125"
          alt=""
        />
      )}
      <canvas 
        ref={canvasRef}
        width={800}
        height={450}
        className="absolute inset-0 w-full h-full mix-blend-screen opacity-60"
      />
      {coverUrl && (
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-64 h-64 rounded-[48px] overflow-hidden shadow-2xl shadow-emerald-500/20 border border-white/20"
          >
            <img src={coverUrl} className="w-full h-full object-cover" alt="Cover" />
          </motion.div>
        </div>
      )}
    </div>
  );
};
