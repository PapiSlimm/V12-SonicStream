import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, ChevronRight, Volume2, VolumeX, Music, Zap } from 'lucide-react';
import { analytics } from '../lib/analytics';
import { useNavigate } from 'react-router-dom';

const defaultServices = [
  "Audio Production",
  "Video Editing",
  "Graphic Design",
  "Marketing & Promotion",
  "Content Distribution",
  "Photography"
];

interface HeroProps {
  rotatingServices?: string[];
}

export function Hero({ rotatingServices = defaultServices }: HeroProps) {
  const [serviceIndex, setServiceIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { scrollY } = useScroll();
  const navigate = useNavigate();
  
  // 3D Parallax Effects
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const rotateX = useTransform(scrollY, [0, 500], [0, 15]);
  const skewX = useTransform(scrollY, [0, 500], [0, -5]);

  useEffect(() => {
    const interval = setInterval(() => {
      setServiceIndex((prev) => (prev + 1) % rotatingServices.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [rotatingServices]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      if (isMuted) audioRef.current.play().catch(() => {});
      setIsMuted(!isMuted);
      analytics.track('click', 'toggle_audio', { muted: !isMuted });
    }
  };

  const handleGetStarted = () => {
    analytics.track('click', 'get_started_hero');
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/login');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 grid-bg perspective-1000">
      {/* Luminous Veil Background Loop */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.15)_0%,transparent_70%)]"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-v12-gray-900 via-v12-gray-900/40 to-v12-gray-900 z-10" />
        
        {/* Documentary VFX Overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none opacity-20 mix-blend-overlay overflow-hidden">
          <div className="absolute top-10 left-10 flex items-center gap-2">
            <motion.div 
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-3 h-3 bg-v12-red rounded-full"
            />
            <span className="text-[10px] font-black text-white tracking-[0.3em]">REC</span>
          </div>
          <div className="absolute bottom-10 right-10 text-[10px] font-mono text-white/50">
            TC 00:12:45:08
          </div>
          {/* Film Grain/Noise Effect */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100" />
        </div>

        {/* Ambient Audio Element */}
        <audio ref={audioRef} loop muted src="https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3" />

        {/* Particles with 3D Depth */}
        <div className="absolute inset-0 z-5 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                z: Math.random() * -500,
                opacity: 0 
              }}
              animate={{ 
                y: [null, '-100%'],
                opacity: [0, 0.5, 0],
                z: [null, 500]
              }}
              transition={{ 
                duration: 10 + Math.random() * 10, 
                repeat: Infinity, 
                ease: "linear",
                delay: Math.random() * 10
              }}
              className="absolute w-1 h-1 bg-v12-red rounded-full blur-[1px]"
            />
          ))}
        </div>

        <motion.div 
          style={{ y: y1, rotateX, skewX }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-v12-red/5 rounded-full blur-[150px] animate-pulse" 
        />
        
        {/* Kinetic Lines with Perspective */}
        <div className="absolute inset-0 opacity-20 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: '-100%', rotateY: 45 }}
              animate={{ x: '100%' }}
              transition={{ 
                duration: 8 + i * 2, 
                repeat: Infinity, 
                ease: "linear",
                delay: i * 1.5
              }}
              className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-v12-red to-transparent"
              style={{ top: `${10 + i * 12}%`, transform: `translateZ(${i * 50}px)` }}
            />
          ))}
        </div>

        {/* Scrolling Background Text */}
        <div className="absolute top-1/2 left-0 w-full overflow-hidden opacity-[0.03] pointer-events-none -translate-y-1/2 z-0">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex whitespace-nowrap text-[20rem] font-black uppercase tracking-tighter text-white"
          >
            V12 MULTIMEDIA V12 MULTIMEDIA V12 MULTIMEDIA V12 MULTIMEDIA V12 MULTIMEDIA
          </motion.div>
        </div>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 text-center">
        <motion.div 
          style={{ rotateX, skewX }}
          className="flex flex-col items-center"
        >
          {/* Kinetic V12 MULTIMEDIA */}
          <div className="relative mb-8 group">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
              <motion.span
                animate={{ 
                  textShadow: [
                    "0 0 20px rgba(239, 68, 68, 0.2)",
                    "0 0 60px rgba(239, 68, 68, 0.9)",
                    "0 0 20px rgba(239, 68, 68, 0.2)"
                  ],
                  scale: [1, 1.05, 1],
                  rotateY: [0, 10, 0]
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-7xl md:text-[10rem] font-black tracking-tighter leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              >
                V12
              </motion.span>
              <motion.span
                initial={{ x: 200, opacity: 0, filter: 'blur(20px)', skewX: 20 }}
                animate={{ x: 0, opacity: 1, filter: 'blur(0px)', skewX: 0 }}
                transition={{ 
                  delay: 1, 
                  duration: 1.2,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="text-7xl md:text-[10rem] font-black tracking-tighter leading-none text-v12-red italic md:-ml-4 drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]"
              >
                MULTIMEDIA
              </motion.span>
            </div>
            
            {/* Kinetic Ghost Text */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.02, 0.1, 0.02],
                rotateZ: [0, 2, 0]
              }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute -inset-8 -z-10 blur-3xl pointer-events-none select-none"
            >
              <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter leading-none text-v12-red">V12 MULTIMEDIA</h1>
            </motion.div>
          </div>

          {/* New Headline */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6 text-white"
          >
            Launch your own <span className="text-v12-red">industry streaming platform.</span>
          </motion.h2>

          {/* New Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: 0.8 }}
            className="text-v12-gray-400 text-lg md:text-xl max-w-4xl mx-auto mb-12 leading-relaxed"
          >
            V12 Multimedia gives independent creators, artists, podcasters, and businesses a branded way to upload, distribute, and monetize media. Our service V12SonicStream includes all the tools for users to launch your own industry streaming platform.
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <button 
              onClick={handleGetStarted}
              className="btn btn-primary group px-12 py-5 flex items-center gap-3 relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)]"
            >
              <Zap size={20} className="animate-pulse" />
              <span className="relative z-10 font-black uppercase tracking-widest text-sm">Start Streaming</span>
              <ChevronRight size={20} className="relative z-10 group-hover:translate-x-2 transition-transform" />
              <motion.div
                className="absolute inset-0 bg-white/20 translate-x-[-100%]"
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
            </button>
            
            <button 
              onClick={toggleMute}
              className="btn btn-outline px-10 py-5 flex items-center gap-3 group border-2"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} className="animate-bounce" />}
              <span className="font-black uppercase tracking-widest text-sm">{isMuted ? 'Unmute Experience' : 'Mute Audio'}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Audio Visualizer Mockup */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-end gap-1 h-12 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              height: isMuted ? 4 : [4, Math.random() * 48 + 4, 4] 
            }}
            transition={{ 
              duration: 0.5 + Math.random(), 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-1 bg-v12-red"
          />
        ))}
      </div>

      {/* Tech Stats / Footer Hero */}
      <div className="absolute bottom-12 left-0 right-0 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-40">
          {['EST. 2024', 'URBAN VISIONS', '400+ BRANDS', 'GLOBAL REACH'].map((stat) => (
            <div key={stat} className="text-[10px] font-black tracking-[0.5em] uppercase text-v12-gray-400">
              {stat}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
