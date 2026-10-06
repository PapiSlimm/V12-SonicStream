import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Play, 
  TrendingUp, 
  User, 
  History, 
  MoreHorizontal,
  Heart,
  Share2,
  Music2
} from 'lucide-react';
import { Track } from '../../types';
import { api } from '../../api';
import { cn } from '../../utils/cn';

export const SmartFeed = () => {
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'for-you' | 'trending' | 'mixes'>('for-you');

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        // In a real app, this would call our new recommendation-service
        const data = await api.tracks.getAll(); // Mock for now
        setRecommendations(data.slice(0, 12));
      } catch (err) {
        console.error('Failed to fetch smart feed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [activeCategory]);

  return (
    <div className="space-y-12 py-8">
      {/* Header & Categories */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles size={20} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">V12 Intelligence</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">Your Smart Feed</h1>
          <p className="text-zinc-500 font-medium">Personalized music discovery powered by our MVP scoring algorithm.</p>
        </div>

        <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5">
          {[
            { id: 'for-you', label: 'For You', icon: User },
            { id: 'trending', label: 'Trending', icon: TrendingUp },
            { id: 'mixes', label: 'Daily Mixes', icon: Music2 },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeCategory === cat.id ? "bg-zinc-700 text-white shadow-lg shadow-black/20" : "text-zinc-500 hover:text-white"
              )}
            >
              <cat.icon size={14} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Feed Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-zinc-900/50 rounded-[32px] animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {recommendations.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-zinc-900/40 border border-white/5 rounded-[32px] overflow-hidden hover:bg-zinc-900 transition-all hover:shadow-2xl hover:shadow-emerald-500/5"
              >
                {/* Score Badge */}
                <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    {Math.round((0.8 + Math.random() * 0.2) * 100)}% Match
                  </span>
                </div>

                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={track.coverUrl || `https://picsum.photos/seed/${track.id}/800/800`} 
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="w-16 h-16 bg-zinc-700 text-white rounded-full flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                      <Play size={28} fill="currentColor" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{track.title}</h3>
                      <p className="text-sm text-zinc-500 font-medium truncate">{track.displayArtistName}</p>
                    </div>
                    <button className="text-zinc-600 hover:text-white transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1.5 text-zinc-500 hover:text-emerald-400 transition-colors">
                        <Heart size={16} />
                        <span className="text-[10px] font-bold">2.4k</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-400 transition-colors">
                        <Share2 size={16} />
                        <span className="text-[10px] font-bold">Share</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                      <History size={12} />
                      Recently Played
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Recommendation Explanation Section */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-12 flex flex-col md:flex-row items-center gap-12">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 shrink-0">
          <Sparkles size={48} />
        </div>
        <div className="space-y-4 text-center md:text-left">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">How it works</h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
            Our V12 Recommendation Engine uses a weighted scoring algorithm to curate your feed. 
            We analyze <span className="text-emerald-400 font-bold">play counts (40%)</span>, 
            <span className="text-blue-400 font-bold">similar user behavior (30%)</span>, 
            <span className="text-purple-400 font-bold">global trends (20%)</span>, and 
            <span className="text-orange-400 font-bold">recent activity (10%)</span> to ensure you never miss a beat.
          </p>
        </div>
        <button className="md:ml-auto px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all">
          Refine My Taste
        </button>
      </div>
    </div>
  );
};
