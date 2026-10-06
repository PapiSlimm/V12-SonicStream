import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Plus, 
  ArrowRight, 
  Clock, 
  Globe, 
  ChevronDown,
  LayoutDashboard,
  Layout,
  BarChart3,
  Search
} from 'lucide-react';
import { Release, ReleaseStatus } from '../../types';
import { ReleaseWizard } from './ReleaseWizard';

export const ReleaseDashboard = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    fetchReleases();
    const interval = setInterval(fetchReleases, 5000); // Poll for status updates
    return () => clearInterval(interval);
  }, []);

  const fetchReleases = async () => {
    try {
      const response = await fetch('/api/distribution/releases');
      const data = await response.json();
      setReleases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors: Record<ReleaseStatus, string> = {
    [ReleaseStatus.DRAFT]: 'text-zinc-500 bg-zinc-500/10',
    [ReleaseStatus.VALIDATING]: 'text-blue-400 bg-blue-400/10',
    [ReleaseStatus.PACKAGED]: 'text-purple-400 bg-purple-400/10',
    [ReleaseStatus.SUBMITTED]: 'text-orange-400 bg-orange-400/10',
    [ReleaseStatus.DISTRIBUTED]: 'text-emerald-400 bg-emerald-400/10 underline underline-offset-4',
    [ReleaseStatus.LIVE]: 'text-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    [ReleaseStatus.FAILED]: 'text-red-400 bg-red-400/10',
    [ReleaseStatus.TAKEDOWN]: 'text-red-600 bg-red-600/10'
  };

  const stats = [
    { label: 'Total Launches', value: releases.length, icon: LayoutDashboard },
    { label: 'Ready to Publish', value: releases.filter(r => r.status === ReleaseStatus.PACKAGED).length, icon: Zap },
    { label: 'Active Live Channels', value: releases.filter(r => r.status === ReleaseStatus.LIVE).length, icon: Globe },
    { label: 'Total Shop Sales', value: '$0.00', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Rail */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-emerald-400">
              <Zap size={24} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Creator Campaign Pipeline</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Campaign Launch Control</h1>
          </div>
          <button 
            onClick={() => setShowWizard(true)}
            className="group flex items-center gap-3 bg-zinc-700 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-zinc-600 transition-all hover:scale-105 active:scale-95"
          >
            New Launch Campaign <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map(stat => (
            <div key={stat.label} className="bg-zinc-900/40 border border-white/5 rounded-[32px] p-8 space-y-4 hover:border-emerald-500/20 transition-all group">
              <div className="flex items-center gap-3 text-zinc-500 group-hover:text-emerald-400 transition-colors">
                <stat.icon size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className="text-4xl font-black italic tracking-tighter">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Dynamic Filters/Search */}
        <div className="flex items-center gap-6 p-4 bg-zinc-900/20 border border-white/5 rounded-3xl">
          <div className="flex-1 flex items-center gap-4 px-6 border-r border-white/5 text-zinc-500">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="SEARCH OPERATIONS, IDS, OR CAMPAIGNS..." 
              className="bg-transparent border-none focus:outline-none text-xs font-black uppercase tracking-widest w-full placeholder:text-zinc-800"
            />
          </div>
          <div className="flex gap-4 pr-4">
            <button className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
              Filter <ChevronDown size={12} />
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
              Platform Status
            </button>
          </div>
        </div>

        {/* Release Table (Specialist Data Grid Recipe) */}
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-[80px_1.5fr_1fr_1fr_1fr_100px] gap-8 px-12 text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">
            <span>CAMPAIGN ID</span>
            <span>Storefront / Campaign</span>
            <span>Launch Type</span>
            <span>Status</span>
            <span>Sync Channels</span>
            <span>Actions</span>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {releases.map((release, i) => (
                <motion.div 
                  key={release.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-[80px_1.5fr_1fr_1fr_1fr_100px] gap-8 items-center px-12 py-8 bg-zinc-900/40 border border-white/5 rounded-[40px] hover:border-emerald-500/20 hover:bg-zinc-900/60 transition-all group"
                >
                  <span className="font-mono text-[10px] text-zinc-600 tracking-tight group-hover:text-emerald-400 transition-colors">
                    #{release.id.slice(0, 5).toUpperCase()}
                  </span>
                  
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center text-zinc-700 shadow-xl group-hover:scale-105 transition-transform animate-pulse">
                      {release.artworkUrl ? (
                        <img src={release.artworkUrl} className="w-full h-full object-cover" />
                      ) : (
                        <Layout size={24} className="text-emerald-400" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xl font-black uppercase tracking-tight italic group-hover:text-white transition-colors">{release.title}</div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{release.label || 'Creator OS Store'}</div>
                    </div>
                  </div>

                  <div className="text-xs font-black uppercase tracking-widest text-zinc-400 italic">
                    {release.type === 'SINGLE' ? 'Website Builder' : release.type === 'EP' ? 'Merch Drop' : 'Ticketing & Events'}
                  </div>

                  <div>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${statusColors[release.status]}`}>
                      {release.status === ReleaseStatus.LIVE && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                      {release.status === ReleaseStatus.VALIDATING && <Clock size={10} className="animate-spin" />}
                      {release.status === 'LIVE' ? 'ACTIVE & ONLINE' : release.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(j => (
                        <div key={j} className="w-6 h-6 bg-zinc-800 rounded-full border-2 border-[#16171a] flex items-center justify-center grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100">
                          <Globe size={12} className="text-emerald-400" />
                        </div>
                      ))}
                    </div>
                    {release.status === ReleaseStatus.LIVE && (
                      <span className="text-[9px] font-black uppercase text-emerald-400 italic">+4 Channels</span>
                    )}
                  </div>

                  <div className="flex justify-end pr-4">
                    <button className="p-3 bg-white/5 rounded-2xl hover:bg-zinc-700 hover:text-white transition-all group-content">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}

              {releases.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-40">
                  <Globe size={64} className="text-zinc-800" />
                  <div className="text-center space-y-2">
                    <div className="text-xl font-black uppercase tracking-tighter">No Active Launch Campaigns</div>
                    <p className="text-xs font-bold uppercase tracking-widest italic">Ignite your creator business empire today</p>
                  </div>
                  <button onClick={() => setShowWizard(true)} className="bg-white/5 border border-white/5 px-8 py-3 rounded-2xl text-[10px] font-black uppercase italic hover:bg-white/10 transition-all">
                    Launch New Campaign
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showWizard && (
          <ReleaseWizard 
            onClose={() => setShowWizard(false)} 
            onComplete={() => {
              setShowWizard(false);
              fetchReleases();
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
