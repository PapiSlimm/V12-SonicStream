import React, { useState } from 'react';
import { TrendingUp, Users, Target, Share2, Heart, ArrowUpRight, Zap, Lock, Music, ShoppingBag, BarChart3, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { MarketingStrategy } from './MarketingStrategy';
import { useAuth } from '../../context/AuthContext';
import { AIMarketingSuite } from './AIMarketingSuite';

export const EntertainmentMarketing: React.FC<{ onUpgrade?: () => void }> = ({ onUpgrade }) => {
  const { isPaid } = useAuth();
  const [activeTab, setActiveTab] = useState<'metrics' | 'album' | 'product' | 'ai_suite' | 'strategy'>('metrics');

  const metrics = [
    { label: 'New Creators', value: '1,240', change: '+12%', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Fan Signups', value: '8,420', change: '+24%', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'Watch Time', value: '42.5k hrs', change: '+8%', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Social Share', value: '18.2%', change: '+5%', icon: Share2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  const pillars = [
    { title: 'Acquisition', items: ['New creators usage per month', 'New fan signups per campaign'] },
    { title: 'Engagement', items: ['Session length and watch time', 'Repeat sessions per week', 'Saves, shares, and playlist additions'] },
    { title: 'Monetization', items: ['Creator earnings distribution', 'Conversion rates to subscriptions', 'Print order volume'] },
    { title: 'Brand', items: ['Social share of voice', 'NPS / satisfaction', 'Qualitative community sentiment'] },
  ];

  if (!isPaid) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="w-24 h-24 bg-zinc-900 rounded-[32px] flex items-center justify-center mx-auto border border-white/5">
          <Lock size={48} className="text-zinc-600" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white">Marketing Hub Restricted</h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            Advanced marketing tools and promotion features are exclusive to SonicStar, SonicVisionary, and SonicPro members.
          </p>
        </div>
        <button 
          onClick={onUpgrade}
          className="px-8 py-4 bg-zinc-700 text-white font-black rounded-2xl hover:bg-zinc-600 transition-all"
        >
          View Pricing Plans
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Marketing Hub</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2">Scale your brand and reach new audiences</p>
        </div>
        
        <nav className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5">
          {[
            { id: 'metrics', label: 'Metrics', icon: BarChart3 },
            { id: 'ai_suite', label: 'Gemini Marketing', icon: Sparkles },
            { id: 'album', label: 'Album Promotion', icon: Music },
            { id: 'product', label: 'Product Promotion', icon: ShoppingBag },
            { id: 'strategy', label: 'V12 Strategy', icon: Target },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all",
                activeTab === tab.id 
                  ? "bg-zinc-700 text-white shadow-lg shadow-black/20" 
                  : "text-zinc-500 hover:text-white"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'metrics' && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((m, i) => (
                <div 
                  key={i}
                  className="p-8 bg-zinc-900/50 border border-white/5 rounded-[32px] space-y-4 hover:border-white/10 transition-all"
                >
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", m.bg)}>
                    <m.icon className={m.color} size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500">{m.label}</p>
                    <div className="flex items-end gap-3 mt-1">
                      <h3 className="text-3xl font-black">{m.value}</h3>
                      <span className="text-emerald-500 text-xs font-bold mb-1">{m.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Strategy Pillars */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="p-10 bg-zinc-900/50 border border-white/5 rounded-[48px] space-y-8">
                <div className="flex items-center gap-4">
                  <Target className="text-emerald-500" size={32} />
                  <h3 className="text-2xl font-black uppercase tracking-tight">Marketing Pillars</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-8">
                  {pillars.map((p, i) => (
                    <div key={i} className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500">{p.title}</h4>
                      <ul className="space-y-2">
                        {p.items.map((item, j) => (
                          <li key={j} className="text-sm text-zinc-400 flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-[48px] text-white space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <TrendingUp size={200} />
                </div>
                <div className="relative z-10 space-y-6">
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Quarterly Refinement Script</h3>
                  <p className="font-bold text-black/70 leading-relaxed">
                    Our data-driven approach focuses on high-intent user activities. Every quarter, we use these metrics to refine our strategy:
                  </p>
                  <div className="space-y-4">
                    {[
                      'Double-down on high-performing content pillars',
                      'Prioritize formats and platforms with best engagement',
                      'Identify and scale creator segments with highest conversion'
                    ].map((text, i) => (
                      <div key={i} className="flex items-center gap-4 bg-black/10 p-4 rounded-2xl border border-black/5">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {i + 1}
                        </div>
                        <p className="font-bold text-sm">{text}</p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-900 transition-all flex items-center justify-center gap-2">
                    Execute Refinement Script
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'album' && <AlbumPromotion />}
        {activeTab === 'product' && <ProductPromotion />}
        {activeTab === 'ai_suite' && (
          <motion.div
            key="ai_suite"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AIMarketingSuite />
          </motion.div>
        )}
        {activeTab === 'strategy' && (
          <motion.div
            key="strategy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <MarketingStrategy />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AlbumPromotion = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
  >
    <div className="lg:col-span-2 space-y-8">
      <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[48px] space-y-6">
        <h3 className="text-2xl font-black uppercase tracking-tight">Campaign Builder</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Select Release</label>
            <select className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500">
              <option>Midnight Echoes (LP)</option>
              <option>Neon Nights (Single)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Budget ($)</label>
              <input type="number" placeholder="500.00" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Target Audience</label>
              <select className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500">
                <option>Electronic Fans</option>
                <option>Global Reach</option>
              </select>
            </div>
          </div>
          <button className="w-full py-4 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20">
            Launch Album Campaign
          </button>
        </div>
      </div>
    </div>
    
    <div className="space-y-6">
      <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Active Campaigns</h4>
        <div className="space-y-4">
          <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
            <p className="font-bold text-white">Summer Tour 2026</p>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Reach: 45.2k</span>
              <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const ProductPromotion = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
  >
    <div className="lg:col-span-2 space-y-8">
      <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[48px] space-y-6">
        <h3 className="text-2xl font-black uppercase tracking-tight">Merch & Product Ads</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Select Product</label>
            <select className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500">
              <option>Limited Edition Vinyl</option>
              <option>SonicStream Hoodie</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Promotion Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-bold text-sm">Social Feed Ad</button>
              <button className="p-4 bg-zinc-800 border border-white/5 rounded-2xl text-zinc-400 font-bold text-sm">Sidebar Banner</button>
            </div>
          </div>
          <button className="w-full py-4 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20">
            Promote Product
          </button>
        </div>
      </div>
    </div>

    <div className="space-y-6">
      <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Conversion Stats</h4>
        <div className="space-y-4">
          <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Total Sales from Ads</p>
            <p className="text-2xl font-black text-white">$12,450.00</p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);
