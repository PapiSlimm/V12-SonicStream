import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { ContentRatingsAdmin } from './ContentRatingsAdmin';
import { CategoryTagsAdmin } from './CategoryTagsAdmin';

export const MetadataManager = () => {
  const [activeTab, setActiveTab] = useState<'ratings' | 'categories'>('ratings');
  const [stats, setStats] = useState({ ratings: 0, categories: 0, videos_using_tags: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/metadata/stats');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch metadata stats', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
          <Shield size={32} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
            Metadata Management
          </h1>
          <p className="text-zinc-400 mt-2">Manage content ratings and category tags for all uploads</p>
        </div>
        <div className="md:ml-auto flex gap-3">
          <StatsCard title="Ratings" value={stats.ratings} />
          <StatsCard title="Categories" value={stats.categories} />
          <StatsCard title="Videos Tagged" value={stats.videos_using_tags} color="emerald" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <TabButton 
          active={activeTab === 'ratings'}
          onClick={() => setActiveTab('ratings')}
          label="Content Ratings" 
          count={stats.ratings}
          icon="📋"
        />
        <TabButton 
          active={activeTab === 'categories'}
          onClick={() => setActiveTab('categories')}
          label="Categories & Tags" 
          count={stats.categories}
          icon="🏷️"
        />
      </div>

      {activeTab === 'ratings' && <ContentRatingsAdmin />}
      {activeTab === 'categories' && <CategoryTagsAdmin />}
    </div>
  );
};

const StatsCard = ({ title, value, color = 'zinc' }: { title: string, value: number, color?: string }) => (
  <div className={`bg-zinc-900/50 border border-white/10 rounded-2xl p-4 min-w-[120px] text-center`}>
    <div className="text-xs text-zinc-500 uppercase font-bold mb-1">{title}</div>
    <div className={`text-2xl font-black ${color === 'emerald' ? 'text-emerald-400' : 'text-white'}`}>{value}</div>
  </div>
);

const TabButton = ({ active, onClick, label, count, icon }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all ${
      active 
        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20' 
        : 'border-white/5 bg-zinc-900/50 hover:border-white/20'
    }`}
  >
    <div className="text-3xl">{icon}</div>
    <div className="text-left">
      <div className={`font-black text-xl ${active ? 'text-white' : 'text-zinc-400'}`}>{label}</div>
      <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{count} items configured</div>
    </div>
  </button>
);
