import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Video, Palette, Megaphone, Globe, Sliders, Sparkles, LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  tag: string;
  type: 'video' | 'image';
  src: string;
  icon: LucideIcon;
  span: string;
}

// =========================
// Mock CMS Hook
// =========================
function useShowcaseData(): ShowcaseItem[] {
  return [
    {
      id: 'v12-sonicstream',
      title: 'V12 SonicStream',
      description: 'High-end cyberpunk production for brands that demand attention.',
      tag: 'PRODUCTION',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1545143333-6403a742b778?auto=format&fit=crop&q=80&w=800',
      icon: Video,
      span: 'md:col-span-2 md:row-span-2'
    },
    {
      id: 'signal-flow',
      title: 'Signal Flow Mastery',
      description: 'Advanced pro-audio visualization systems.',
      tag: 'VISUALS',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      icon: Sliders,
      span: 'md:col-span-1 md:row-span-1'
    },
    {
      id: 'brand-identity',
      title: 'Brand Identity',
      description: 'Brutalist identity systems for startups.',
      tag: 'DESIGN',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1541888946425-d81bb1930060?auto=format&fit=crop&q=80&w=400',
      icon: Palette,
      span: 'md:col-span-1 md:row-span-1'
    },
    {
      id: 'global-distribution',
      title: 'Global Ecosystem',
      description: 'Unified digital media distribution across 180+ countries with advanced asset management.',
      tag: 'NETWORK',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
      icon: Globe,
      span: 'md:col-span-1 md:row-span-2'
    },
    {
      id: 'ai-marketing',
      title: 'AI Marketing',
      description: 'Data-driven growth strategies.',
      tag: 'STRATEGY',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
      icon: Megaphone,
      span: 'md:col-span-2 md:row-span-1'
    }
  ];
}

// =========================
// 3D Hover & Spotlight Hook
// =========================
function use3DHover() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spotlight position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for tilt
  const springConfig = { damping: 20, stiffness: 150 };
  const rotateX = useSpring(useTransform(y, [-100, 100], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(x, [-100, 100], [-15, 15]), springConfig);

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // For Tilt
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    x.set(px - rect.width / 2);
    y.set(py - rect.height / 2);

    // For Spotlight
    mouseX.set(px);
    mouseY.set(py);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return { ref, rotateX, rotateY, mouseX, mouseY, handleMouseMove, handleMouseLeave };
}

// =========================
// Media Component (Intersection Optimized)
// =========================
function ShowcaseMedia({ item, isHovered }: { item: ShowcaseItem, isHovered: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.1 });

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isHovered && isVisible) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isHovered, isVisible]);

  if (item.type === 'video') {
    return (
      <video
        ref={videoRef}
        src={item.src}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
      />
    );
  }

  return (
    <img
      src={item.src}
      alt={`${item.title} preview`}
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
      referrerPolicy="no-referrer"
    />
  );
}

// =========================
// Card Component
// =========================
function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  const [hovered, setHovered] = useState(false);
  const { ref, rotateX, rotateY, mouseX, mouseY, handleMouseMove, handleMouseLeave } = use3DHover();
  const [isMobile, setIsMobile] = useState(false);
  const Icon = item.icon;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const spotlightBackground = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(239, 68, 68, 0.15), transparent 80%)`
  );

  const baseClasses = "group relative overflow-hidden bg-zinc-950 border-2 border-black/50 hover:border-v12-red selection:bg-v12-red cursor-pointer transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-v12-red";

  return (
    <motion.div
      ref={ref}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${item.title}`}
      style={{ 
        rotateX: isMobile ? 0 : rotateX, 
        rotateY: isMobile ? 0 : rotateY, 
        transformPerspective: 1000,
        transformStyle: 'preserve-3d'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        handleMouseLeave();
        setHovered(false);
      }}
      onMouseEnter={() => setHovered(true)}
      whileHover={isMobile ? { scale: 0.98 } : {}}
      className={cn(baseClasses, item.span)}
    >
      {/* Dynamic Spotlight Glow */}
      <motion.div 
        className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: spotlightBackground }}
      />

      <ShowcaseMedia item={item} isHovered={hovered} />

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-0" />

      {/* Layered Content with Parallax (translateZ) */}
      <div className="absolute top-4 left-4 z-20" style={{ transform: 'translateZ(30px)' }}>
        <div className="bg-black/80 backdrop-blur-md px-3 py-1 border-l-2 border-v12-red shadow-2xl">
          <span className="text-[8px] tracking-[0.3em] font-black text-white">{item.tag}</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-20" style={{ transform: 'translateZ(50px)' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-v12-red text-white border border-black shadow-xl">
            <Icon size={20} />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tighter text-white drop-shadow-lg">{item.title}</h3>
        </div>
        <AnimatePresence>
          {hovered && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="text-[10px] font-bold text-v12-gray-400 uppercase tracking-widest leading-relaxed"
            >
              {item.description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Scanline Effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none z-30"
        animate={{ y: ['0%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        <div className="h-px w-full bg-v12-red shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
      </motion.div>
    </motion.div>
  );
}

// =========================
// Grid Component
// =========================
function ShowcaseGrid({ items }: { items: ShowcaseItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[220px]">
      {items.map(item => (
        <ShowcaseCard key={item.id} item={item} />
      ))}
    </div>
  );
}

// =========================
// Main Section
// =========================
export function VisualShowcase() {
  const items = useShowcaseData();

  return (
    <section id="portfolio" className="py-32 bg-v12-gray-900 text-white relative overflow-hidden selection:bg-v12-red/30">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-v12-red/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between mb-20 gap-8 items-end">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles size={20} className="text-v12-red animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.6em] text-v12-red uppercase">Multimedia Showcase</span>
            </div>
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8]">
              Industry <br /> <span className="text-v12-red italic">Excellence</span>
            </h2>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-v12-gray-400 max-w-sm text-[11px] uppercase tracking-[0.2em] font-black leading-relaxed text-right md:text-left"
          >
            Explore high-impact visual production and strategic marketing assets powered by real-time V12 Engine architecture.
          </motion.p>
        </div>

        <ShowcaseGrid items={items} />
      </div>

      {/* Background Decor */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-v12-red/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-v12-red/5 rounded-full blur-[120px] pointer-events-none" />
    </section>
  );
}
