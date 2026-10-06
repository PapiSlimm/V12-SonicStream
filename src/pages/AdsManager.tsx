import { useState } from 'react';
import { 
  Plus, 
  BarChart3, 
  Target, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  Layout, 
  Filter,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../utils/cn';

interface Campaign {
  id: string;
  name: string;
  budget: number;
  status: 'active' | 'paused' | 'draft';
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
}

export const AdsManager = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'safety'>('dashboard');
  const [campaigns] = useState<Campaign[]>([
    { id: '1', name: 'Summer Vibes 2026', budget: 5000, status: 'active', impressions: 125000, clicks: 3200, ctr: 2.56, spend: 1250 },
    { id: '2', name: 'New Artist Spotlight', budget: 2000, status: 'paused', impressions: 45000, clicks: 850, ctr: 1.89, spend: 450 },
  ]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-end">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter">Ads Manager</h1>
            <p className="text-zinc-500">Monetize your reach and manage your campaigns.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('create')}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
            >
              <Plus size={20} />
              Create Campaign
            </button>
          </div>
        </header>

        <nav className="flex gap-8 border-b border-white/10">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'create', label: 'Campaign Builder', icon: Layout },
            { id: 'safety', label: 'Brand Safety', icon: ShieldCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 py-4 font-bold transition-all border-b-2",
                activeTab === tab.id ? "text-emerald-400 border-emerald-400" : "text-zinc-500 border-transparent hover:text-white"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="py-8">
          {activeTab === 'dashboard' && <Dashboard campaigns={campaigns} />}
          {activeTab === 'create' && <CampaignBuilder />}
          {activeTab === 'safety' && <BrandSafety />}
        </main>
      </div>
    </div>
  );
};

const Dashboard = ({ campaigns }: { campaigns: Campaign[] }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { label: 'Total Impressions', value: '170k', change: '+12%', icon: Target },
        { label: 'Total Clicks', value: '4,050', change: '+8%', icon: BarChart3 },
        { label: 'Avg. CTR', value: '2.38%', change: '+0.5%', icon: Filter },
        { label: 'Total Spend', value: '$1,700', change: '+15%', icon: DollarSign },
      ].map((stat, i) => (
        <div key={i} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-2">
          <div className="flex justify-between items-start">
            <stat.icon className="text-emerald-400" size={20} />
            <span className="text-xs font-bold text-emerald-500">{stat.change}</span>
          </div>
          <div className="text-2xl font-black">{stat.value}</div>
          <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{stat.label}</div>
        </div>
      ))}
    </div>

    <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-white/5 text-zinc-500 text-xs font-bold uppercase tracking-widest">
          <tr>
            <th className="px-6 py-4">Campaign Name</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Impressions</th>
            <th className="px-6 py-4">CTR</th>
            <th className="px-6 py-4">Spend</th>
            <th className="px-6 py-4">Budget</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {campaigns.map((c) => (
            <tr key={c.id} className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 font-bold">{c.name}</td>
              <td className="px-6 py-4">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  c.status === 'active' ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                )}>
                  {c.status}
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-sm">{c.impressions.toLocaleString()}</td>
              <td className="px-6 py-4 font-mono text-sm">{c.ctr}%</td>
              <td className="px-6 py-4 font-mono text-sm">${c.spend}</td>
              <td className="px-6 py-4 font-mono text-sm">${c.budget}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const CampaignBuilder = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 space-y-8">
      <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-4xl space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Layout size={20} className="text-emerald-400" />
          Campaign Details
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Campaign Name</label>
            <input 
              type="text" 
              placeholder="e.g. Summer Festival 2026"
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Daily Budget ($)</label>
              <input 
                type="number" 
                placeholder="50.00"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Budget ($)</label>
              <input 
                type="number" 
                placeholder="1000.00"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-4xl space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Target size={20} className="text-blue-400" />
          Targeting
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Age Range</label>
            <select className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all">
              <option>18-24</option>
              <option>25-34</option>
              <option>35-44</option>
              <option>45+</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Genre Interest</label>
            <select className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all">
              <option>Electronic</option>
              <option>Hip Hop</option>
              <option>Rock</option>
              <option>Jazz</option>
            </select>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-4xl space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Calendar size={20} className="text-purple-400" />
          Schedule
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Start Date</label>
            <input type="date" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">End Date</label>
            <input type="date" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all" />
          </div>
        </div>
      </section>
    </div>

    <div className="space-y-8">
      <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-4xl space-y-6 sticky top-8">
        <h3 className="text-xl font-bold">Ad Preview</h3>
        <div className="bg-black border border-white/10 rounded-3xl overflow-hidden aspect-[4/5] relative">
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1">
            <Target size={10} className="text-emerald-400" />
            Sponsored
          </div>
          <img 
            src="https://picsum.photos/seed/ad-preview/600/800" 
            alt="Ad Preview" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent space-y-2">
            <div className="font-black text-xl">Your Headline Here</div>
            <p className="text-xs text-zinc-400">Your call to action description will appear here.</p>
            <button className="w-full bg-white text-black py-3 rounded-xl font-bold mt-4">Learn More</button>
          </div>
        </div>
        <div className="space-y-4 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Estimated Reach</span>
            <span className="font-bold">45k - 120k</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Estimated Clicks</span>
            <span className="font-bold">1.2k - 3.5k</span>
          </div>
          <button className="w-full bg-zinc-700 text-white py-4 rounded-2xl font-black text-lg shadow-2xl shadow-black/20">
            Launch Campaign
          </button>
        </div>
      </div>
    </div>
  </div>
);

const BrandSafety = () => (
  <div className="max-w-4xl space-y-8">
    <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-4xl space-y-8">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck size={24} className="text-emerald-400" />
          Brand Safety Controls
        </h3>
        <p className="text-zinc-500">Ensure your ads appear next to content that aligns with your brand values.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-bold text-white">Inventory Filter</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'expanded', label: 'Expanded', desc: 'Maximum reach, includes sensitive content.', icon: AlertCircle },
              { id: 'standard', label: 'Standard', desc: 'Balanced reach and safety (Recommended).', icon: CheckCircle2, active: true },
              { id: 'limited', label: 'Limited', desc: 'Maximum safety, excludes all sensitive content.', icon: ShieldCheck },
            ].map((filter) => (
              <button 
                key={filter.id}
                className={cn(
                  "p-6 rounded-3xl border text-left space-y-3 transition-all",
                  filter.active ? "bg-emerald-500/10 border-emerald-500/50" : "bg-black border-white/5 hover:border-white/20"
                )}
              >
                <filter.icon className={filter.active ? "text-emerald-400" : "text-zinc-500"} size={24} />
                <div className="space-y-1">
                  <div className={cn("font-bold", filter.active ? "text-white" : "text-zinc-400")}>{filter.label}</div>
                  <p className="text-[10px] text-zinc-500 leading-tight">{filter.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-white">Excluded Categories</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              'Sensitive Social Issues',
              'Tragedy and Conflict',
              'Profanity and Rough Language',
              'Sexually Suggestive Content',
              'Sensational and Shocking',
              'Gambling Content'
            ].map((cat) => (
              <label key={cat} className="flex items-center gap-3 p-4 bg-black border border-white/5 rounded-2xl cursor-pointer hover:bg-white/5 transition-all">
                <input type="checkbox" className="w-5 h-5 rounded-lg bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500" />
                <span className="text-sm font-medium">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-white">Genre Filters</h4>
          <p className="text-xs text-zinc-500">Exclude your ads from specific musical genres.</p>
          <div className="flex flex-wrap gap-2">
            {['Metal', 'Hardcore Punk', 'Experimental', 'Political Podcast', 'Explicit Rap'].map(genre => (
              <button key={genre} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs font-bold transition-all">
                + {genre}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  </div>
);
