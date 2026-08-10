import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Meta } from '../../components/SEO/Meta';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowRight, Zap, Target, Star, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const MarketingGuides = () => {
  const { topic } = useParams();
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const topics = [
    { id: 'how-to-release-music', title: 'How to Release Music Independently', icon: Zap },
    { id: 'get-booked-as-artist', title: 'How to Get Booked for Live Events', icon: Target },
    { id: 'music-distribution-guide', title: 'The Ultimate Music Distribution Guide', icon: Star },
    { id: 'grow-fanbase-2026', title: 'Grow Your Fanbase in 2026', icon: BookOpen }
  ];

  const currentTopic = topics.find(t => t.id === topic) || topics[0];

  useEffect(() => {
    const fetchGuide = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/ai/seo-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'marketing_guide',
            name: currentTopic.title
          })
        });
        const data = await response.json();
        setContent(data.content);
      } catch (err) {
        console.error(err);
        setContent('## Content currently unavailable. Please check back later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuide();
  }, [topic, currentTopic.title]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Meta 
        title={`${currentTopic.title} | SonicStream Artist Academy`}
        description={`Learn ${currentTopic.title.toLowerCase()} with SonicStream's expert artist growth guides.`}
      />

      {/* Hero Header */}
      <div className="pt-32 pb-20 px-12 border-b border-white/5 bg-gradient-to-b from-emerald-500/10 to-transparent">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link to="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-400 transition-all group">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Artist Academy
          </Link>
          <div className="flex items-center gap-4 text-emerald-400">
            <currentTopic.icon size={32} />
            <span className="text-xs font-black uppercase tracking-[0.4em]">Expert Series</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">{currentTopic.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-12 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
                <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse" />
                <div className="h-4 bg-white/5 rounded-full w-5/6 animate-pulse" />
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-invert prose-emerald max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight"
              >
                <ReactMarkdown>{content}</ReactMarkdown>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lead Capture */}
          <div className="p-12 bg-white/5 rounded-[40px] border border-white/5 space-y-8 mt-24">
            <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase tracking-tight italic">Ready to Scale?</h3>
              <p className="text-zinc-500 text-lg">Join 50,000+ artists scaling their career on SonicStream.</p>
            </div>
            <div className="flex gap-4">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-emerald-500/50"
              />
              <button className="bg-zinc-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-600 transition-all flex items-center gap-2">
                Join Now <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-12">
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 font-black">More Guides</h4>
            <div className="space-y-4">
              {topics.filter(t => t.id !== topic).map(t => (
                <Link 
                  key={t.id}
                  to={`/guides/${t.id}`}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 transition-colors">
                    <t.icon size={20} />
                  </div>
                  <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{t.title}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 font-black">Hire Artists</h4>
            <p className="text-xs text-zinc-500 font-bold leading-relaxed">Need professional talent for your next project? Browse our curated marketplace of top-tier artists.</p>
            <Link 
              to="/marketplace"
              className="block w-full bg-zinc-700 text-white py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all"
            >
              Browse Marketplace
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};
