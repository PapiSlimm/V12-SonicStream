import { useState } from 'react';
import { 
  Music, 
  UserPlus, 
  FileText, 
  DollarSign, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  Plus,
  ShieldCheck,
  Download
} from 'lucide-react';

import { DownloadButton } from '../../components/music/DownloadButton';

export const CreatorMarketplace = () => {
  const [activeTab, setActiveTab] = useState<'beats' | 'services' | 'ads'>('beats');

  const beats = [
    { id: '1', title: 'Midnight Soul', producer: 'V12 Beats', price: 29.99, genre: 'Lo-Fi', bpm: 88 },
    { id: '2', title: 'Cyberpunk Drill', producer: 'Neon Ghost', price: 49.99, genre: 'Drill', bpm: 142 },
    { id: '3', title: 'Summer Breeze', producer: 'Sunny Side', price: 19.99, genre: 'Pop', bpm: 105 },
  ];

  const services = [
    { id: '1', title: 'Professional Mixing', provider: 'Audio Wizard', price: 150, rating: 4.9 },
    { id: '2', title: 'Custom Beat Production', provider: 'V12 Beats', price: 500, rating: 5.0 },
    { id: '3', title: 'Vocal Tuning', provider: 'Pitch Perfect', price: 75, rating: 4.8 },
  ];

  const campaigns = [
    { id: '1', name: 'New Single Boost', type: 'Music', budget: 500, spent: 342, status: 'Active' },
    { id: '2', name: 'Merch Drop Promo', type: 'Product', budget: 200, spent: 200, status: 'Completed' },
  ];

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase">Creator Hub</h1>
          <p className="text-zinc-500 text-lg">Monetize your talent and grow your presence on SonicStream.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <Plus size={16} />
            Create Listing
          </button>
          <button className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-black/20">
            <TrendingUp size={16} />
            New Campaign
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/5 pb-4">
        {[
          { id: 'beats', label: 'Beats & Loops', icon: Music },
          { id: 'services', label: 'Hire Producers', icon: UserPlus },
          { id: 'ads', label: 'Ads & Promotion', icon: Zap },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-zinc-700 text-white' 
                : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'beats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {beats.map((beat) => (
                <div key={beat.id} className="bg-zinc-900/50 border border-white/5 rounded-[32px] p-6 space-y-6 group hover:border-emerald-500/30 transition-all">
                  <div className="aspect-square bg-zinc-800 rounded-2xl overflow-hidden relative">
                    <img src={`https://picsum.photos/seed/${beat.id}/400/400`} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt="" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-4 bg-zinc-700 text-white rounded-full shadow-2xl">
                        <Download size={24} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">{beat.title}</h3>
                        <p className="text-zinc-500 text-sm font-bold">{beat.producer}</p>
                      </div>
                      <div className="text-emerald-400 font-black text-xl">${beat.price}</div>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-zinc-400">{beat.genre}</span>
                      <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-zinc-400">{beat.bpm} BPM</span>
                    </div>
                    <div className="flex gap-4">
                      <DownloadButton 
                        trackId={beat.id} 
                        trackTitle={beat.title} 
                        artistName={beat.producer} 
                        price={beat.price}
                      />
                      <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Standard License
                      </button>
                    </div>
                    <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest text-center">V12 SonicStream charges a 10% processing fee on all digital downloads</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                      <UserPlus size={24} className="text-zinc-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{service.title}</h3>
                      <p className="text-zinc-500 text-xs">by {service.provider} • ★ {service.rating}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Starting at</p>
                      <p className="text-xl font-black text-white">${service.price}</p>
                    </div>
                    <button className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                      Hire
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ads' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 space-y-4">
                  <BarChart3 className="text-emerald-500" size={32} />
                  <h3 className="text-xl font-black uppercase tracking-tight">Boost Your Music</h3>
                  <p className="text-zinc-400 text-sm">Get your tracks in front of the right listeners with AI-targeted campaigns.</p>
                  <button className="w-full py-4 bg-zinc-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest">Start Campaign</button>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-8 space-y-4">
                  <Zap className="text-blue-500" size={32} />
                  <h3 className="text-xl font-black uppercase tracking-tight">Product Ads</h3>
                  <p className="text-zinc-400 text-sm">Promote your merch and physical products across the V12 marketplace.</p>
                  <button className="w-full py-4 bg-blue-500 text-black rounded-2xl text-xs font-black uppercase tracking-widest">Boost Store</button>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/5">
                  <h4 className="text-xs font-black uppercase tracking-widest">Active Campaigns</h4>
                </div>
                <div className="divide-y divide-white/5">
                  {campaigns.map((camp) => (
                    <div key={camp.id} className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${camp.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
                        <div>
                          <p className="font-bold">{camp.name}</p>
                          <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">{camp.type} • ${camp.budget} Budget</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">${camp.spent} Spent</p>
                        <div className="w-32 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${(camp.spent / camp.budget) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Contracts & Stats */}
        <div className="space-y-8">
          <div className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 space-y-6">
            <div className="flex items-center gap-3">
              <FileText className="text-emerald-500" size={24} />
              <h3 className="text-lg font-black uppercase tracking-tight">Legal & Contracts</h3>
            </div>
            <p className="text-zinc-500 text-sm">All marketplace transactions are protected by V12 industry-standard contracts.</p>
            <div className="space-y-3">
              {[
                'Beat Licensing Agreement',
                'Work-for-Hire Contract',
                'Royalty Split Agreement',
                'Service Level Agreement'
              ].map((doc) => (
                <button key={doc} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group">
                  {doc}
                  <Download size={14} className="text-zinc-500 group-hover:text-white" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-700 rounded-[40px] p-8 text-white space-y-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3">
              <DollarSign size={24} />
              <h3 className="text-lg font-black uppercase tracking-tight">Earnings</h3>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Revenue</p>
              <p className="text-5xl font-black tracking-tighter">$12,450.00</p>
            </div>
            <div className="pt-6 border-t border-black/10 space-y-4">
              <div className="flex justify-between text-xs font-bold">
                <span>Marketplace Sales</span>
                <span>$8,200</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span>Service Fees</span>
                <span>$4,250</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
