import { useParams, Link } from 'react-router-dom';
import { Meta } from '../../components/SEO/Meta';
import { motion } from 'framer-motion';
import { TrendingUp, Music, Trophy, Play, Star } from 'lucide-react';

export const PublicCharts = () => {
  const { type = 'trending' } = useParams();

  const chartTypes = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'top-artists', label: 'Top Artists', icon: Trophy },
    { id: 'viral', label: 'Viral 50', icon: Star },
    { id: 'new-arrivals', label: 'New Arrivals', icon: Music }
  ];

  // Mock data for charts
  const tracks = [
    { id: 1, title: 'Neon Pulse', artist: 'Cypher', streams: '1.2M', growth: '+45%', slug: 'neon-pulse' },
    { id: 2, title: 'Midnight City', artist: 'Afterglow', streams: '890K', growth: '+12%', slug: 'midnight-city' },
    { id: 3, title: 'Synthetica', artist: 'Digital Ghost', streams: '750K', growth: '+67%', slug: 'synthetica' },
    { id: 4, title: 'Lost in Translation', artist: 'Vortex', streams: '600K', growth: '-5%', slug: 'lost-in-translation' },
    { id: 5, title: 'Stellar Wind', artist: 'Lumina', streams: '540K', growth: '+23%', slug: 'stellar-wind' }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-20 px-12">
      <Meta 
        title={`SonicStream Charts: ${chartTypes.find(t => t.id === type)?.label || 'Top Music'}`}
        description="Discover the most popular artists and tracks on SonicStream. Real-time data, community-driven rankings."
      />

      <div className="max-w-7xl mx-auto space-y-16">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <Trophy size={24} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Industry Pulse</span>
          </div>
          <h1 className="text-7xl font-black tracking-tighter uppercase leading-none">Global Charts</h1>
          <p className="text-zinc-500 text-xl max-w-2xl">The heartbeat of independent music. High-velocity growth tracking and community validation.</p>
        </div>

        {/* Chart Nav */}
        <div className="flex flex-wrap gap-4 border-b border-white/5 pb-8">
          {chartTypes.map(chart => (
            <Link 
              key={chart.id}
              to={`/charts/${chart.id}`}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                type === chart.id 
                ? 'bg-zinc-700 text-white' 
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <chart.icon size={16} />
              {chart.label}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main Chart Table */}
          <div className="lg:col-span-2 space-y-6">
            {tracks.map((track, i) => (
              <motion.div 
                key={track.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[32px] hover:bg-white/10 hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-8">
                  <span className="text-4xl font-black text-zinc-800 italic w-12 group-hover:text-emerald-500/20 transition-colors">#{i + 1}</span>
                  <div className="w-16 h-16 bg-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                    <img src={`https://picsum.photos/seed/${track.slug}/200/200`} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <Link to={`/track/${track.slug}`} className="text-2xl font-black uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{track.title}</Link>
                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
                      <Link to={`/artists/${track.artist.toLowerCase()}`} className="hover:text-zinc-300">{track.artist}</Link>
                      <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                      <span>{track.streams} Streams</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className={`text-sm font-black italic ${track.growth.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {track.growth}
                  </div>
                  <button className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                    <Play size={20} fill="currentColor" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sidebar Stats */}
          <aside className="space-y-8">
            <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight">Fastest Growing</h3>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl overflow-hidden">
                      <img src={`https://picsum.photos/seed/fast-${i}/200/200`} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase text-white">Artist {i}</div>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">+240% Growth</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-white/5 border border-white/5 rounded-[40px] space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight">Discovery Links</h3>
              <div className="flex flex-wrap gap-2">
                {['Hip-Hop', 'Electronic', 'Indie', 'Los Angeles', 'New York'].map(tag => (
                  <Link 
                    key={tag}
                    to={tag.includes(' ') ? `/discovery/${tag.toLowerCase().replace(' ', '-')}` : `/discovery/genre/${tag.toLowerCase()}`}
                    className="px-4 py-2 bg-black/40 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
