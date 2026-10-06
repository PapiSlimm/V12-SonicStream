import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { 
  Newspaper, 
  ExternalLink, 
  Share2, 
  RefreshCw, 
  TrendingUp, 
  Video, 
  Music,
  Search,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

interface NewsWallProps {
  type?: 'news' | 'updates' | 'culture' | 'all';
  title?: string;
  description?: string;
}

export const NewsWall: React.FC<NewsWallProps> = ({ 
  type = 'all', 
  title = 'News Wall', 
  description = 'Automated global music industry feeds. Real-time releases, trending videos, and breaking company news.' 
}) => {
  const [feeds, setFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(type);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFeeds = async () => {
      setLoading(true);
      try {
        const data = await api.rss.getFeeds(filter === 'all' ? undefined : filter);
        setFeeds(data);
      } catch (error) {
        console.error('Error fetching RSS feeds:', error);
        toast.error('Failed to load news feeds');
      } finally {
        setLoading(false);
      }
    };

    fetchFeeds();
  }, [filter]);

  const handleShare = async (feedId: string) => {
    try {
      await api.rss.share(feedId);
      toast.success('Shared to social feed!');
    } catch (error) {
      console.error('Error sharing feed:', error);
      toast.error('Failed to share feed');
    }
  };

  const filteredFeeds = feeds.filter(feed => 
    feed.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feed.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="text-red-500" size={18} />;
      case 'release': return <Music className="text-emerald-500" size={18} />;
      case 'news': return <Newspaper className="text-blue-500" size={18} />;
      default: return <TrendingUp className="text-purple-500" size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header Section */}
      <header className="relative py-24 px-8 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 via-transparent to-black" />
          <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <RefreshCw size={14} className="animate-spin-slow" />
              Live Industry Intelligence
            </div>
            <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic leading-[0.85]">
              Sonic <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">{title}</span>
            </h1>
            <p className="text-zinc-400 text-xl max-w-2xl font-medium">
              {description}
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search global industry feeds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-[32px] py-5 pl-16 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-zinc-900 transition-all"
              />
            </div>
            <div className="flex bg-zinc-900/50 p-1.5 rounded-[32px] border border-white/5">
              {['all', 'news', 'release', 'video'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-8 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === t 
                    ? 'bg-zinc-700 text-white shadow-lg shadow-black/20' 
                    : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[400px] bg-zinc-900/50 rounded-[40px] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredFeeds.map((feed, i) => (
                <motion.article
                  key={feed.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-zinc-900/30 border border-white/5 rounded-[40px] overflow-hidden hover:border-emerald-500/30 transition-all flex flex-col"
                >
                  {/* Category Badge */}
                  <div className="absolute top-6 left-6 z-10">
                    <div className="px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3">
                      {getIcon(feed.type)}
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{feed.type}</span>
                    </div>
                  </div>

                  {/* Image/Preview */}
                  <div className="aspect-video relative overflow-hidden bg-zinc-800">
                    {feed.image_url ? (
                      <img 
                        src={feed.image_url} 
                        alt={feed.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20">
                        <Newspaper size={64} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  </div>

                  {/* Content */}
                  <div className="p-8 flex-1 flex flex-col space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      <span>{feed.source}</span>
                      <span>{formatDistanceToNow(new Date(feed.created_at))} ago</span>
                    </div>
                    
                    <h3 className="text-2xl font-black tracking-tight leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {feed.title}
                    </h3>
                    
                    <p className="text-zinc-500 text-sm line-clamp-3 leading-relaxed">
                      {feed.content}
                    </p>

                    <div className="pt-6 mt-auto flex items-center justify-between border-t border-white/5">
                      <a 
                        href={feed.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Read Full <ArrowRight size={14} />
                      </a>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleShare(feed.id)}
                          className="p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                          title="Share to Social Feed"
                        >
                          <Share2 size={18} />
                        </button>
                        <a 
                          href={feed.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <ExternalLink size={18} />
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredFeeds.length === 0 && (
          <div className="text-center py-32 space-y-6">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Newspaper className="text-zinc-700" size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">No news found</h3>
              <p className="text-zinc-500">Try adjusting your search or filters to see more industry updates.</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <section className="max-w-7xl mx-auto px-8">
        <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-white/5 rounded-[48px] p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5">
            <TrendingUp size={200} />
          </div>
          <div className="relative z-10 max-w-2xl space-y-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Stay Ahead of the Curve</h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Our automated RSS platform aggregates data from 50+ premium music industry sources. Get real-time alerts on new signings, chart movements, and tech breakthroughs.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-white text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-2xl">
                Configure Alerts
              </button>
              <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                Source Directory
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
