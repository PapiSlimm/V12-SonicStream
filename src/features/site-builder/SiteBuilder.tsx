import React, { useState } from 'react';
import { 
  Zap, 
  ArrowRight, 
  Unlock, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { BuilderCanvas } from './BuilderCanvas';

const TEMPLATES = [
  {
    id: 'artist-portfolio',
    name: 'Artist Portfolio',
    description: 'Perfect for solo artists and musicians.',
    image: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=800&q=80',
    features: ['Music Player', 'Tour Dates', 'Gallery', 'Bio'],
    tier: 'pro'
  },
  {
    id: 'label-showcase',
    name: 'Label Showcase',
    description: 'Designed for record labels and agencies.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    features: ['Artist Roster', 'Releases', 'News', 'Contact'],
    tier: 'visionary'
  },
  {
    id: 'saas-landing',
    name: 'SaaS Landing',
    description: 'Modern landing page for tech products.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    features: ['Pricing Table', 'Features', 'Testimonials', 'FAQ'],
    tier: 'visionary'
  }
];

export const SiteBuilder: React.FC = () => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState<'template' | 'building' | 'preview'>('template');
  const [, setSelectedTemplate] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);

  const isVisionary = user?.subscriptionTier === 'visionary';

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template?.tier === 'visionary' && !isVisionary) {
      setIsUnlocking(true);
      return;
    }
    
    startBuilding();
  };

  const startBuilding = () => {
    setIsBuilding(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setBuildProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsBuilding(false);
        setActiveStep('building');
      }
    }, 50);
  };

  if (activeStep === 'building') {
    return <BuilderCanvas onExit={() => setActiveStep('template')} />;
  }

  return (
    <div className="space-y-16 pb-24 font-sans">
      {/* Header - Brutalist Style */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b-4 border-emerald-500 pb-16">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-700 text-white text-[12px] font-black uppercase tracking-widest">
            <Sparkles size={14} />
            Creative Engine v2.0
          </div>
          <h2 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85]">
            Site <span className="text-emerald-500 italic">Builder</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl text-xl font-medium leading-relaxed">
            Deploy production-ready digital experiences in minutes. No code. No limits. Just pure creative momentum.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 bg-zinc-900 border-2 border-white/10 p-4 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <Zap className="text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subscription Tier</p>
              <p className="text-lg font-black uppercase tracking-tight text-white">{user?.subscriptionTier || 'Free'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Build Progress Overlay */}
      <AnimatePresence>
        {isBuilding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8"
          >
            <div className="max-w-md w-full space-y-12 text-center">
              <div className="space-y-4">
                <h3 className="text-6xl font-black uppercase tracking-tighter italic text-emerald-500">Initializing</h3>
                <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Compiling assets and generating site structure...</p>
              </div>
              
              <div className="space-y-4">
                <div className="h-4 bg-zinc-900 border-2 border-white/10 rounded-full overflow-hidden p-1">
                  <motion.div 
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${buildProgress}%` }}
                  />
                </div>
                <div className="flex justify-between font-mono text-xs text-zinc-500 uppercase tracking-widest">
                  <span>Progress</span>
                  <span>{buildProgress}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={cn("p-4 border-2 transition-colors", buildProgress > 20 ? "border-emerald-500 text-emerald-400" : "border-white/5 text-zinc-800")}>
                  <p className="text-[10px] font-black uppercase tracking-widest">Core Engine</p>
                </div>
                <div className={cn("p-4 border-2 transition-colors", buildProgress > 40 ? "border-emerald-500 text-emerald-400" : "border-white/5 text-zinc-800")}>
                  <p className="text-[10px] font-black uppercase tracking-widest">Asset Pipeline</p>
                </div>
                <div className={cn("p-4 border-2 transition-colors", buildProgress > 60 ? "border-emerald-500 text-emerald-400" : "border-white/5 text-zinc-800")}>
                  <p className="text-[10px] font-black uppercase tracking-widest">SEO Optimization</p>
                </div>
                <div className={cn("p-4 border-2 transition-colors", buildProgress > 80 ? "border-emerald-500 text-emerald-400" : "border-white/5 text-zinc-800")}>
                  <p className="text-[10px] font-black uppercase tracking-widest">Final Polish</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Selection - Brutalist Grid */}
      <section className="space-y-12">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-4xl font-black uppercase tracking-tight">Select <span className="text-emerald-500">Blueprint</span></h3>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic font-serif">Choose a foundation for your digital presence</p>
          </div>
          <div className="flex gap-4">
            <button className="p-4 bg-zinc-900 border-2 border-white/10 rounded-2xl hover:border-emerald-500/50 transition-all">
              <Search size={20} className="text-zinc-500" />
            </button>
            <button className="p-4 bg-zinc-900 border-2 border-white/10 rounded-2xl hover:border-emerald-500/50 transition-all">
              <Filter size={20} className="text-zinc-500" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {TEMPLATES.map((template, i) => (
            <motion.div 
              key={template.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative"
            >
              {/* Big Number - Brutalist Style */}
              <div className="absolute -top-10 -left-6 text-9xl font-black text-white/[0.03] pointer-events-none select-none italic">
                0{i + 1}
              </div>

              <div className="relative bg-zinc-900/50 border-4 border-white/5 group-hover:border-emerald-500 transition-all rounded-[40px] overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img 
                    src={template.image} 
                    alt={template.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  
                  {template.tier === 'visionary' && !isVisionary && (
                    <div className="absolute top-6 right-6 px-4 py-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      <Unlock size={12} />
                      Visionary Only
                    </div>
                  )}
                </div>

                <div className="p-10 space-y-8">
                  <div className="space-y-2">
                    <h4 className="text-3xl font-black uppercase tracking-tight group-hover:text-emerald-500 transition-colors">{template.name}</h4>
                    <p className="text-zinc-400 text-sm font-medium leading-relaxed">{template.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {template.features.map(feature => (
                      <span key={feature} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        {feature}
                      </span>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleSelectTemplate(template.id)}
                    className={cn(
                      "w-full py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                      template.tier === 'visionary' && !isVisionary
                        ? "bg-zinc-800 text-zinc-500 border-2 border-white/5 hover:bg-zinc-700 hover:text-white"
                        : "bg-zinc-700 text-white hover:bg-zinc-600 shadow-xl shadow-black/20"
                    )}
                  >
                    {template.tier === 'visionary' && !isVisionary ? 'Unlock Template' : 'Start Building'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Unlock Modal */}
      <AnimatePresence>
        {isUnlocking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full bg-zinc-900 border-4 border-emerald-500 p-12 rounded-[48px] space-y-12 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <Unlock size={300} />
              </div>

              <div className="space-y-6 relative z-10">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border-2 border-emerald-500/20">
                  <Unlock className="text-emerald-400" size={40} />
                </div>
                <h3 className="text-6xl font-black uppercase tracking-tighter leading-none">
                  Unlock <span className="text-emerald-500 italic">Visionary</span> Access
                </h3>
                <p className="text-zinc-400 text-xl font-medium leading-relaxed">
                  This template is part of the Visionary suite. Upgrade your account to access premium blueprints, advanced customization, and white-label deployment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <button 
                  onClick={() => setIsUnlocking(false)}
                  className="py-6 border-4 border-white/10 rounded-3xl text-[12px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                >
                  Maybe Later
                </button>
                <button className="py-6 bg-zinc-700 text-white rounded-3xl text-[12px] font-black uppercase tracking-widest hover:bg-zinc-600 shadow-2xl shadow-black/30 transition-all flex items-center justify-center gap-3">
                  Upgrade Now
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
