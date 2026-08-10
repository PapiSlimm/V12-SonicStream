import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { 
  Target, 
  Zap, 
  TrendingUp, 
  Globe, 
  BarChart3, 
  Megaphone,
  ChevronRight,
  ChevronLeft,
  FileText,
  Layout
} from 'lucide-react';
import { MarketingScript } from '../../types';
import toast from 'react-hot-toast';

export const MarketingStrategy = () => {
  const [scripts, setScripts] = useState<MarketingScript[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const res = await fetch('/api/marketing/scripts');
        if (res.ok) {
          const data = await res.json();
          setScripts(data);
        }
      } catch (error) {
        console.error('Failed to fetch scripts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchScripts();
  }, []);

  const capabilities = [
    {
      title: "CTA Integration",
      description: "Add direct Call-to-Action links to your posts to drive traffic to your waitlist or landing page.",
      icon: <Target className="text-emerald-500" size={24} />
    },
    {
      title: "Native Social Uploads",
      description: "Directly publish your Reels to Instagram and TikTok for maximum algorithmic reach.",
      icon: <Zap className="text-purple-500" size={24} />
    },
    {
      title: "Meta Ads Boosting",
      description: "Boost your content with targeted Meta Ads. Select your budget and reach specific demographics.",
      icon: <TrendingUp className="text-blue-500" size={24} />
    },
    {
      title: "Geographical Targeting",
      description: "Use Google Maps integration to pinpoint exactly where you want your marketing to focus.",
      icon: <Globe className="text-orange-500" size={24} />
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="relative h-[400px] rounded-[60px] overflow-hidden bg-zinc-900 border border-white/5">
        <img 
          src="https://picsum.photos/seed/marketing/1920/1080?blur=4" 
          alt="Marketing Background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/10 text-emerald-500 px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-emerald-500/20"
          >
            V12 SonicStream Marketing
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter max-w-4xl">
            Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Independent</span> Creators
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl font-medium">
            A comprehensive suite of marketing tools designed to help you launch, grow, and monetize your streaming presence.
          </p>
        </div>
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {capabilities.map((cap, i) => (
          <motion.div
            key={cap.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-4 hover:bg-zinc-800/50 transition-colors group"
          >
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              {cap.icon}
            </div>
            <h3 className="text-xl font-black text-white">{cap.title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">{cap.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Presentation Script Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">V12 Marketing Strategy</h2>
            <p className="text-sm text-zinc-500 font-medium mt-1">10-Slide Presentation Script for SonicStream Promotion</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
              disabled={currentSlide === 0}
              className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-white disabled:opacity-30 hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setCurrentSlide(prev => Math.min(scripts.length - 1, prev + 1))}
              disabled={currentSlide === scripts.length - 1}
              className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-white disabled:opacity-30 hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-[500px] flex items-center justify-center bg-zinc-900/50 border border-white/5 rounded-[60px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500" />
          </div>
        ) : scripts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visual Preview */}
            <motion.div 
              key={`visual-${currentSlide}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black rounded-[60px] border border-white/10 overflow-hidden aspect-video flex flex-col relative"
            >
              <div className="absolute top-8 left-8 z-10">
                <span className="bg-zinc-700 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Slide {scripts[currentSlide].order}
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center p-12 text-center">
                <div className="space-y-6">
                  <h4 className="text-4xl font-black text-white tracking-tighter">{scripts[currentSlide].title}</h4>
                  <div className="p-6 bg-zinc-900/50 rounded-3xl border border-white/5">
                    <p className="text-sm text-zinc-400 font-medium italic">"{scripts[currentSlide].visual}"</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Speaker Notes */}
            <motion.div 
              key={`notes-${currentSlide}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-900/50 border border-white/5 rounded-[60px] p-10 space-y-6 flex flex-col"
            >
              <div className="flex items-center gap-3 text-emerald-500">
                <Megaphone size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Speaker Notes</span>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <p className="text-lg text-zinc-300 leading-relaxed font-medium">
                  {scripts[currentSlide].speakerNotes}
                </p>
              </div>
              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex gap-1">
                  {scripts.map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-1 rounded-full transition-all",
                        i === currentSlide ? "w-8 bg-emerald-500" : "w-2 bg-zinc-800"
                      )} 
                    />
                  ))}
                </div>
                <button 
                  onClick={() => toast.success('Script copied to clipboard!')}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  <FileText size={16} />
                  Copy Script
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="h-[500px] flex items-center justify-center bg-zinc-900/50 border border-white/5 rounded-[60px]">
            <p className="text-zinc-500 font-bold">No scripts found.</p>
          </div>
        )}
      </div>

      {/* Marketing Structure Info */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-white/5 rounded-[60px] p-12 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-white tracking-tighter">Our Marketing Structure</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto font-medium">How we help you scale your streaming business from zero to global reach.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-zinc-700 rounded-2xl flex items-center justify-center text-white">
              <Layout size={24} />
            </div>
            <h4 className="text-xl font-black text-white">Phase 1: Foundation</h4>
            <p className="text-sm text-zinc-500 leading-relaxed">Setting up your white-label platform, custom branding, and initial content strategy to ensure a professional launch.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
              <Megaphone size={24} />
            </div>
            <h4 className="text-xl font-black text-white">Phase 2: Amplification</h4>
            <p className="text-sm text-zinc-500 leading-relaxed">Leveraging native uploads and organic social strategies to build awareness across Instagram and TikTok.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white">
              <BarChart3 size={24} />
            </div>
            <h4 className="text-xl font-black text-white">Phase 3: Scaling</h4>
            <p className="text-sm text-zinc-500 leading-relaxed">Implementing paid Meta Ads with precise targeting and geographical focus to drive consistent traffic and conversions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
