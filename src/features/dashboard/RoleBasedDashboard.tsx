import { useState } from 'react';
import { 
  ShoppingBag, 
  Briefcase, 
  ArrowRight, 
  Users, 
  Globe, 
  BarChart3,
  Zap,
  Layout,
  Megaphone,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { UnifiedAnalytics } from '../analytics/UnifiedAnalytics';
import { CreatorPassportHub } from './CreatorPassportHub';
import { Meta } from '../../components/SEO/Meta';

import { Link } from 'react-router-dom';

type DashboardMode = 'artist' | 'creator' | 'business' | 'passport';

export const RoleBasedDashboard = () => {
  const [mode, setMode] = useState<DashboardMode>('artist');

  const modes = [
    { id: 'artist', label: 'Creator OS', icon: Layout, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'creator', label: 'E-Commerce', icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'business', label: 'Marketing CRM', icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'passport', label: 'Creator Passport', icon: ShieldCheck, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  ];

  const guidedFlows = {
    artist: [
      { title: 'Launch custom website', description: 'Design your custom storefront and connect your custom domain.', icon: Layout, link: '/builder' },
      { title: 'Setup booking calendar', description: 'Configure availability slotting, bookings, and ticket programs.', icon: Calendar, link: '/bookings' },
      { title: 'Nurture your fan CRM', description: 'Interact with your segmented customers, mailing cohorts, and membership groups.', icon: Users, link: '/settings' },
    ],
    creator: [
      { title: 'Sell digital & print merch', description: 'Stock physical custom printed apparel or instant audio/visual files.', icon: ShoppingBag, link: '/marketplace' },
      { title: 'Build interactive ticketing', description: 'Publish event schedules, secure tickets, and digital memberships.', icon: Zap, link: '/bookings' },
      { title: 'Launch affiliate network', description: 'Design commission payouts for creators and fans promoting your brand.', icon: Users, link: '/affiliate' },
    ],
    business: [
      { title: 'Initiate AI marketing campaign', description: 'Auto-generate and post custom social ad creatives, schedules, and newsletters.', icon: Megaphone, link: '/growth' },
      { title: 'Track multi-channel commerce', description: 'Aggregate detailed sales, tickets, and bookings in a unified billing station.', icon: BarChart3, link: '/dashboard/revenue' },
      { title: 'Manage connected marketplaces', description: 'Sync store goods, physical printing queues, and inventory flows globally.', icon: ShoppingBag, link: '/marketplace' },
    ]
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Meta 
        title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} Dashboard | Manage Your Empire`}
        description={`Access your ${mode} tools, analytics, and growth features on SonicStream.`}
      />
      {/* Mode Switcher */}
      <div className="border-b border-white/5 bg-zinc-900/30 px-8 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center text-white">
            <Zap size={18} />
          </div>
          <span className="text-sm font-black uppercase tracking-widest">V12 Dashboard</span>
        </div>

        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as DashboardMode)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                mode === m.id ? `${m.bg} ${m.color} shadow-lg` : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <m.icon size={16} />
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Users size={20} /></button>
          <div className="w-8 h-8 bg-zinc-800 rounded-full border border-white/10" />
        </div>
      </div>

      <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-16">
        {mode === 'passport' ? (
          <motion.div
            key="passport-hub"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <CreatorPassportHub />
          </motion.div>
        ) : (
          <>
            {/* Welcome Section */}
            <div className="space-y-4">
              <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">
                Welcome back, <span className="text-emerald-400">Creator</span>
              </h1>
              <p className="text-zinc-500 text-xl max-w-2xl">Your creative empire is growing. Here's what's happening in <span className="text-white font-bold">{mode.charAt(0).toUpperCase() + mode.slice(1)} Mode</span> today.</p>
            </div>

            {/* Guided Flows */}
            <div className="space-y-8">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Guided Flows</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {guidedFlows[mode as 'artist' | 'creator' | 'business'].map((flow, i) => (
                  <Link to={flow.link} key={i}>
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] h-full space-y-6 group cursor-pointer hover:border-emerald-500/30 transition-all"
                    >
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 transition-colors">
                        <flow.icon size={28} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-tight">{flow.title}</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">{flow.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                        Start Flow <ArrowRight size={14} />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Mode Specific Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {mode === 'artist' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-10 space-y-8">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black uppercase tracking-tight">Active Channels</h2>
                        <Link to="/builder" className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300">View All</Link>
                      </div>
                      <div className="space-y-4">
                        {[1, 2].map(i => (
                          <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                                <Layout size={20} className="text-emerald-500" />
                              </div>
                              <div>
                                <div className="font-bold">{i === 1 ? 'Personal Website Builder' : 'Memberships Storefront'}</div>
                                <div className="text-xs text-zinc-500 uppercase font-black tracking-widest">Connected with Fan CRM</div>
                              </div>
                            </div>
                            <div className="text-emerald-400 text-xs font-black uppercase tracking-widest">Active</div>
                          </div>
                        ))}
                      </div>
                      <Link 
                        to="/builder"
                        className="block w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl text-center text-xs font-black uppercase tracking-widest transition-all"
                      >
                        Manage Websites & Storefronts
                      </Link>
                    </div>
                    <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-10 space-y-8">
                      <h2 className="text-2xl font-black uppercase tracking-tight">Fan Engagement</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-2">
                          <div className="text-3xl font-black">12.4K</div>
                          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Fans</div>
                        </div>
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-2">
                          <div className="text-3xl font-black">842</div>
                          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">New this week</div>
                        </div>
                      </div>
                      <button className="w-full bg-zinc-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-black/20">
                        Message Fans
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'creator' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-10 space-y-8">
                      <h2 className="text-2xl font-black uppercase tracking-tight">Your Sites</h2>
                      <div className="space-y-4">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                              <Globe size={24} />
                            </div>
                            <div>
                              <div className="font-bold">v12-collective.sonicstream.com</div>
                              <div className="text-xs text-zinc-500 uppercase font-black tracking-widest">Published 2 days ago</div>
                            </div>
                          </div>
                          <button className="p-2 text-zinc-500 hover:text-white transition-colors"><ArrowRight size={20} /></button>
                        </div>
                      </div>
                      <button className="w-full bg-zinc-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                        Open Site Builder
                      </button>
                    </div>
                    <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-10 space-y-8">
                      <h2 className="text-2xl font-black uppercase tracking-tight">Monetization</h2>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                          <span className="text-sm font-bold">Subscriptions</span>
                          <span className="text-emerald-400 font-black">$1,240.00</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                          <span className="text-sm font-bold">Merch Sales</span>
                          <span className="text-emerald-400 font-black">$842.50</span>
                        </div>
                      </div>
                      <button className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                        Manage Products
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'business' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-10 space-y-8">
                      <h2 className="text-2xl font-black uppercase tracking-tight">Active Bookings</h2>
                      <div className="space-y-4">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold">The Grand Arena</div>
                              <div className="text-xs text-zinc-500">July 15, 2026 • 19:00</div>
                            </div>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">Confirmed</span>
                          </div>
                        </div>
                      </div>
                      <button className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                        View Calendar
                      </button>
                    </div>
                    <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-10 space-y-8">
                      <h2 className="text-2xl font-black uppercase tracking-tight">Ad Performance</h2>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Reach</span>
                          <span className="text-sm font-bold">1.2M Impressions</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 w-[65%]" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">CTR</span>
                          <span className="text-sm font-bold text-emerald-400">4.2%</span>
                        </div>
                      </div>
                      <button className="w-full bg-purple-500 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-500/20">
                        Create Ad
                      </button>
                    </div>
                  </div>
                )}

                {/* Unified Analytics Integration */}
                <div className="pt-20 border-t border-white/5">
                  <UnifiedAnalytics />
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};
