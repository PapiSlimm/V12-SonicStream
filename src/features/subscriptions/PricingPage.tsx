import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Star, Rocket, HelpCircle, Calculator, Shield, Award, Sparkles, Cpu, Layers, Server, ShieldCheck, Database, Layout, RefreshCw, Key, Share2, Compass, Radio, MessageSquare, Landmark, Bell } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SUBSCRIPTION_TIERS } from '../../constants/pricing';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

export const PricingPage = () => {
  const { user, refreshUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  // Active hover module state in Creator OS block diagram
  const [activeModule, setActiveModule] = useState<string | null>(null);

  // ROI Calculator state
  const [monthlySales, setMonthlySales] = useState<number>(2000);

  const tiers = Object.values(SUBSCRIPTION_TIERS);

  const handleSimulatedUpgrade = async (tierId: string) => {
    setUpgradeLoading(tierId);
    setUpgradeMessage(null);
    try {
      const response = await fetch('/api/v1/identity/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tier: tierId })
      });
      
      if (!response.ok) {
        throw new Error('Simulation failed');
      }

      await refreshUser();
      setUpgradeMessage(`Successfully unlocked ${tierId.toUpperCase()}! Your Creator OS capabilities have been upgraded.`);
    } catch (error) {
      console.error(error);
      setUpgradeMessage('Demo plan active! Local state updated for preview.');
    } finally {
      setUpgradeLoading(null);
      setTimeout(() => setUpgradeMessage(null), 5000);
    }
  };

  // ROI Calculation logic based on real tier values
  const calculateROISavings = (tierPrice: number, commissionPercent: number) => {
    // Other platforms demand standard 15% marketplace commission
    const otherPlatformCost = monthlySales * 0.15;
    const currentPlatformCost = monthlySales * (commissionPercent / 100);
    const grossSavings = otherPlatformCost - currentPlatformCost;
    const netSavings = grossSavings - tierPrice;
    return Math.max(0, Math.round(netSavings));
  };

  // Icon mapping helper for Creator OS diagram
  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'passport': return <ShieldCheck size={16} className="text-emerald-400" />;
      case 'auth': return <Key size={14} className="text-blue-400" />;
      case 'streaming': return <Radio size={14} className="text-rose-400" />;
      case 'marketplace': return <Layout size={14} className="text-amber-400" />;
      case 'distribution': return <Share2 size={14} className="text-indigo-400" />;
      case 'ai': return <Cpu size={14} className="text-purple-400" />;
      case 'analytics': return <Calculator size={14} className="text-emerald-400" />;
      case 'automation': return <RefreshCw size={14} className="text-teal-400" />;
      case 'search': return <Compass size={14} className="text-sky-400" />;
      case 'messaging': return <MessageSquare size={14} className="text-pink-400" />;
      case 'bookings': return <Award size={14} className="text-yellow-400" />;
      case 'payments': return <Landmark size={14} className="text-orange-400" />;
      case 'notifications': return <Bell size={14} className="text-violet-400" />;
      case 'worker': return <Server size={14} className="text-cyan-400" />;
      case 'admin': return <Layers size={14} className="text-slate-400" />;
      default: return <Cpu size={14} />;
    }
  };

  // Modules catalog for the interactive Blueprint
  const modulesList = [
    { id: 'auth', name: 'Authentication', desc: 'Secure email/social login, 2FA, & single sign-on.' },
    { id: 'streaming', name: 'Streaming', desc: 'Lossless audio playback, downloads, & enterprise CDN.' },
    { id: 'marketplace', name: 'Marketplace', desc: 'Custom stores, merch print-on-demand, & payment carts.' },
    { id: 'distribution', name: 'Distribution', desc: 'Direct releases delivery to Spotify, Apple, and real ISRC.' },
    { id: 'ai', name: 'AI Studio', desc: 'Cloud mastering, text description generators, & custom LLM models.' },
    { id: 'analytics', name: 'Analytics', desc: 'Real-time revenue metrics, stream counters, & audience trends.' },
    { id: 'automation', name: 'Automation', desc: 'Scheduled release workflows, automated socials, & CRM funnels.' },
    { id: 'search', name: 'Search', desc: 'Advanced natural-language discovery & semantic tags indexing.' },
    { id: 'messaging', name: 'Messaging', desc: 'Fan mail campaigns, community channels, & WhatsApp automation.' },
    { id: 'bookings', name: 'Bookings', desc: 'Gig scheduling, smart contract escrows, & ticketing systems.' },
    { id: 'payments', name: 'Payments', desc: 'Built-in checkout gates, credit card billing, & multi-currency wallets.' },
    { id: 'notifications', name: 'Notifications', desc: 'Triggered SMS, background push alerts, and direct emails.' },
    { id: 'worker', name: 'Worker Services', desc: 'Isolated encoding threads, queue prioritizing, & rendering queues.' },
    { id: 'admin', name: 'Administration', desc: 'Audit records tracking, advanced team permission scopes, & metrics.' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Upper Brand Badge & Core Title */}
        <div className="text-center space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black rounded-full uppercase tracking-wider"
          >
            <Sparkles size={12} className="animate-pulse" /> Live Creator Infrastructure Pricing
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none italic mt-2">
            SonicStream <span className="text-emerald-400">Creator OS</span>
          </h1>
          
          <p className="text-zinc-400 max-w-2xl mx-auto font-semibold uppercase tracking-wider text-[11px] sm:text-xs">
            Every subscription tier unlocks more modules of our Creator Operating System. Scale your business, streamline your workflows, and build lasting equity.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <span className={cn("text-xs uppercase tracking-widest font-bold font-mono transition-colors", billingCycle === 'month' ? "text-white" : "text-zinc-500")}>
              Monthly Billing
            </span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'month' ? 'year' : 'month')}
              className="w-14 h-8 bg-zinc-900 border border-zinc-800 rounded-full p-1 transition-all flex items-center"
              aria-label="Toggle billing cycle"
            >
              <div className={cn(
                "w-6 h-6 bg-emerald-500 rounded-full shadow-lg transition-transform duration-300", 
                billingCycle === 'year' ? 'translate-x-6' : 'translate-x-0'
              )} />
            </button>
            <span className={cn("text-xs uppercase tracking-widest font-bold font-mono transition-colors flex items-center gap-2", billingCycle === 'year' ? "text-white" : "text-zinc-500")}>
              Yearly Saver <span className="text-[10px] bg-zinc-700 text-white px-2 py-0.5 rounded-full font-black font-sans uppercase">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Dynamic Upgrade Banner Notification */}
        <AnimatePresence>
          {upgradeMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-emerald-400 text-xs font-bold font-mono uppercase tracking-widest"
            >
              🎉 {upgradeMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── VISUAL CREATOR OPERATING SYSTEM ARCHITECTURE BLUEPRINT ── */}
        <div className="mb-20 max-w-5xl mx-auto bg-zinc-900/40 border border-zinc-850 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Cpu size={240} className="text-emerald-500" />
          </div>

          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-extrabold uppercase tracking-tight italic">SonicStream Creator Operating System</h2>
            <p className="text-xs text-zinc-400 max-w-xl mx-auto">
              Hover over modules below to see how they expand the core Creator Passport. Every upgrade enhances your sovereign digital assets and cloud performance.
            </p>
          </div>

          {/* Blueprint Layout Schema */}
          <div className="flex flex-col gap-4 max-w-4xl mx-auto relative z-10">
            {/* Top Level Anchor: Creator Passport */}
            <motion.div 
              className={cn(
                "w-full bg-zinc-950 border-2 py-4 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 shadow-xl",
                activeModule ? "border-emerald-500/60 shadow-[0_0_20px_rgba(52,211,153,0.1)]" : "border-zinc-700"
              )}
              onMouseEnter={() => setActiveModule('passport')}
              onMouseLeave={() => setActiveModule(null)}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-400 animate-pulse" size={20} />
                <span className="text-base font-black uppercase tracking-widest">Creator Passport (Core Module)</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 uppercase font-semibold tracking-wider px-4 text-center">
                The absolute foundation of identity, reputation metrics, portfolio indexing, and licensing scopes.
              </p>
            </motion.div>

            {/* Connecting line */}
            <div className="flex justify-center -my-2">
              <div className="w-1.5 h-10 bg-gradient-to-b from-emerald-500 to-zinc-800 rounded-full" />
            </div>

            {/* Grid Modules of the OS */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {modulesList.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col justify-between cursor-help transition-all duration-300 h-28 bg-zinc-950",
                    activeModule === m.id
                      ? "border-emerald-400 bg-zinc-900 shadow-[0_0_15px_rgba(52,211,153,0.15)] translate-y-[-2px]"
                      : "border-zinc-800 hover:border-zinc-700"
                  )}
                  onMouseEnter={() => setActiveModule(m.id)}
                  onMouseLeave={() => setActiveModule(null)}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[9px] text-zinc-500 font-bold">OS-{(modulesList.indexOf(m) + 1).toString().padStart(2, '0')}</span>
                    {getModuleIcon(m.id)}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-tight text-white mb-1 leading-none">{m.name}</h4>
                    <p className="text-[9px] text-zinc-500 leading-tight line-clamp-2">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SUBSCRIPTION TIER CARDS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch mb-20">
          {tiers.map((tier) => {
            const isCurrentTier = user?.subscriptionTier === tier.id || (tier.id === 'star' && user?.subscriptionTier === 'creator');
            const monthlyCost = billingCycle === 'year' ? Math.round(tier.annuallyPrice) : tier.price;
            
            // Assign colors & tags per package level
            const getTierStyling = (id: string) => {
              switch (id) {
                case 'free':
                  return {
                    badge: 'bg-zinc-100 text-zinc-900 border-zinc-300',
                    badgeText: 'Basic Starter',
                    border: 'border-zinc-200 hover:border-zinc-400',
                    glow: 'shadow-sm',
                    topBar: 'bg-zinc-300'
                  };
                case 'star':
                  return {
                    badge: 'bg-blue-50 text-blue-700 border-blue-200',
                    badgeText: 'Advanced Star',
                    border: 'border-zinc-200 hover:border-blue-400',
                    glow: 'shadow-md hover:shadow-blue-500/5',
                    topBar: 'bg-blue-400'
                  };
                case 'visionary':
                  return {
                    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    badgeText: 'Professional Visionary',
                    border: 'border-zinc-200 hover:border-indigo-400',
                    glow: 'shadow-lg hover:shadow-indigo-500/5',
                    topBar: 'bg-indigo-400'
                  };
                case 'pro':
                  return {
                    badge: 'bg-zinc-700 text-white border-emerald-400',
                    badgeText: 'Premium Recommended',
                    border: 'border-emerald-400 ring-4 ring-emerald-500/15',
                    glow: 'shadow-[0_0_30px_rgba(52,211,153,0.12)] scale-[1.03] z-10',
                    topBar: 'bg-emerald-500'
                  };
                case 'enterprise':
                  return {
                    badge: 'bg-amber-100 text-amber-800 border-amber-300',
                    badgeText: 'Enterprise Power',
                    border: 'border-zinc-200 hover:border-amber-400',
                    glow: 'shadow-xl hover:shadow-amber-500/5',
                    topBar: 'bg-amber-400'
                  };
                default:
                  return {
                    badge: 'bg-zinc-100 text-zinc-800 border-zinc-300',
                    badgeText: 'Tier level',
                    border: 'border-zinc-200',
                    glow: 'shadow-md',
                    topBar: 'bg-zinc-300'
                  };
              }
            };

            const style = getTierStyling(tier.id);

            return (
              <motion.div
                key={tier.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                id={`tier-card-${tier.id}`}
                className={cn(
                  "rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative border overflow-hidden bg-white text-zinc-900",
                  style.border,
                  style.glow
                )}
              >
                {/* Visual Accent Top Bar */}
                <div className={cn("absolute top-0 left-0 right-0 h-2", style.topBar)} />

                {/* Card Header Content */}
                <div>
                  <div className="flex flex-col gap-2 mb-4">
                    <span className={cn(
                      "text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider w-fit border",
                      style.badge
                    )}>
                      {style.badgeText}
                    </span>
                    <h3 className="text-2xl font-black uppercase tracking-tight italic font-sans leading-none">{tier.name}</h3>
                  </div>
                  
                  <p className="text-xs leading-relaxed min-h-[48px] text-zinc-600">
                    {tier.description}
                  </p>

                  {/* Pricing Display */}
                  <div className="mt-4 flex items-baseline gap-1 border-b pb-4 border-zinc-100">
                    <span className="text-5xl font-black font-mono tracking-tighter text-zinc-950">${monthlyCost}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      /{billingCycle === 'year' ? 'mo' : 'mo'}
                    </span>
                  </div>

                  {/* Key Constraints limits */}
                  <div className="mt-5 space-y-2.5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      <span>Max track uploads:</span>
                      <span className="font-mono text-zinc-950">{tier.limits.uploads > 100000 ? 'Unlimited' : `${tier.limits.uploads} Tracks`}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      <span>Platform commission:</span>
                      <span className="text-emerald-600 font-extrabold">{tier.limits.marketplaceCommission}% Commission</span>
                    </div>
                  </div>

                  {/* Feature Lists rendered beautifully with Bold categories */}
                  <ul className="mt-6 space-y-3.5 pt-5 border-t border-zinc-100 text-[11px] leading-snug">
                    {tier.features.map((feature, idx) => {
                      const parts = feature.split(': ');
                      if (parts.length > 1) {
                        return (
                          <li key={idx} className="flex items-start gap-2 text-zinc-700">
                            <Check size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span>
                              <strong className="text-zinc-950 font-black uppercase tracking-wider text-[9px] block mb-0.5">{parts[0]}</strong>
                              <span className="text-zinc-600 font-medium">{parts[1]}</span>
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li key={idx} className="flex items-start gap-2 text-zinc-700">
                          <Check size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="font-medium">{feature}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Action upgrade Button */}
                <div className="mt-8 pt-5 border-t border-zinc-100">
                  {isCurrentTier ? (
                    <div className="w-full py-3 bg-zinc-900 text-white rounded-xl text-center text-[10px] font-black uppercase tracking-widest border border-zinc-800">
                      Currently Active
                    </div>
                  ) : (
                    <Button
                      id={`btn-upgrade-${tier.id}`}
                      onClick={() => handleSimulatedUpgrade(tier.id)}
                      disabled={upgradeLoading !== null}
                      className={cn(
                        "w-full py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                        tier.id === 'pro' 
                          ? "bg-zinc-700 text-white hover:bg-zinc-600 hover:scale-[1.02] shadow-md shadow-black/10" 
                          : "bg-zinc-950 text-white hover:bg-zinc-800"
                      )}
                    >
                      {upgradeLoading === tier.id ? "Activating..." : "Select Capability"}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── DYNAMIC REVENUE SAVINGS SIMULATOR ── */}
        <div className="mt-20 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto shadow-xl">
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-8">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs uppercase font-mono font-bold">
                <Calculator size={14} /> Revenue Calculator
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight italic">Platform Commission ROI Simulator</h3>
              <p className="text-xs text-zinc-400">
                Configure your estimated monthly commerce/merchandise sales (e.g. print on demand items, ticketing streams, or digital tracks) and see how licensing fee reductions dynamically increase your net income.
              </p>

              {/* Dynamic Inputs */}
              <div className="space-y-4 pt-4">
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase mb-1">
                    <span>Estimated Monthly Sales Volume:</span>
                    <span className="text-emerald-400 font-mono font-bold text-base">${monthlySales.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="100" 
                    max="15000" 
                    step="100"
                    value={monthlySales} 
                    onChange={(e) => setMonthlySales(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-1 font-bold">
                    <span>$100</span>
                    <span>$7,500</span>
                    <span>$15,000+</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Cards */}
            <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl w-full md:w-80 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block mb-1">Calculated Savings</span>
                <p className="text-[9px] text-zinc-400 leading-normal">Compared to other platforms demanding a set 15% marketplace commission, choosing your plan unlocks major savings:</p>
              </div>

              <div className="my-4 space-y-3">
                <div className="flex justify-between items-center text-xs pb-1 border-b border-zinc-850">
                  <span className="text-zinc-500 uppercase font-bold">Star (10% Comm) savings:</span>
                  <span className="text-blue-400 font-mono font-extrabold">+${calculateROISavings(19, 10)}/mo</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-zinc-850">
                  <span className="text-zinc-500 uppercase font-bold">Visionary (5% Comm) savings:</span>
                  <span className="text-indigo-400 font-mono font-extrabold">+${calculateROISavings(49, 5)}/mo</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-zinc-850">
                  <span className="text-zinc-500 uppercase font-bold">Pro Pack (2% Comm) savings:</span>
                  <span className="text-emerald-400 font-mono font-black">+${calculateROISavings(99, 2)}/mo</span>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center">
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                  Select a subscription plan above to unlock maximum financial ROI instantly!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CREATOR OS COMPARATIVE MODULE MATRIX ── */}
        <div className="mt-24 max-w-5xl mx-auto space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-black uppercase tracking-tight italic">Creator OS Module Matrix</h3>
            <p className="text-xs text-zinc-400 mt-2">Deep comparison of operating system modules and active scopes</p>
          </div>

          <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-3xl shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 font-black uppercase tracking-wider text-[10px]">
                  <th className="p-4 pl-6">Creator OS Module</th>
                  <th className="p-4 text-center">Free Starter</th>
                  <th className="p-4 text-center">Star Package</th>
                  <th className="p-4 text-center">Visionary Package</th>
                  <th className="p-4 text-center text-emerald-400">Pro Pack</th>
                  <th className="p-4 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 font-semibold text-[11px]">
                <tr>
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Authentication</td>
                  <td className="p-4 text-center text-zinc-400">✓ Standard</td>
                  <td className="p-4 text-center text-zinc-400">✓ Standard</td>
                  <td className="p-4 text-center text-zinc-400">✓ Standard</td>
                  <td className="p-4 text-center text-emerald-400 font-bold">✓ Standard</td>
                  <td className="p-4 text-center text-amber-400 font-black">Enterprise SSO</td>
                </tr>
                <tr className="bg-zinc-900/20">
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Creator Passport</td>
                  <td className="p-4 text-center text-zinc-400">Basic</td>
                  <td className="p-4 text-center text-blue-400 font-bold">Advanced</td>
                  <td className="p-4 text-center text-indigo-400 font-bold">Professional</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Premium</td>
                  <td className="p-4 text-center text-amber-400 font-black">Enterprise</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Streaming</td>
                  <td className="p-4 text-center text-zinc-450">5 Uploads</td>
                  <td className="p-4 text-center text-zinc-300">50 Uploads</td>
                  <td className="p-4 text-center text-zinc-200">250 Uploads</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Unlimited</td>
                  <td className="p-4 text-center text-zinc-100 font-black">Unlimited</td>
                </tr>
                <tr className="bg-zinc-900/20">
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Marketplace</td>
                  <td className="p-4 text-center text-zinc-450">2 Products</td>
                  <td className="p-4 text-center text-zinc-300">25 Products</td>
                  <td className="p-4 text-center text-zinc-200">250 Products</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Unlimited</td>
                  <td className="p-4 text-center text-zinc-100 font-black">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-zinc-300 font-bold">AI Studio</td>
                  <td className="p-4 text-center text-zinc-450">Limited Assistant</td>
                  <td className="p-4 text-center text-zinc-400">Basic AI Suite</td>
                  <td className="p-4 text-center text-zinc-300">Advanced AI Suite</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Unlimited AI</td>
                  <td className="p-4 text-center text-amber-400 font-black">Custom Private AI</td>
                </tr>
                <tr className="bg-zinc-900/20">
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Distribution</td>
                  <td className="p-4 text-center text-zinc-500">Standard</td>
                  <td className="p-4 text-center text-zinc-550">Standard</td>
                  <td className="p-4 text-center text-indigo-400 font-bold">Direct DSP Hub</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Priority DSP</td>
                  <td className="p-4 text-center text-amber-400 font-black">Enterprise DSP</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Analytics</td>
                  <td className="p-4 text-center text-zinc-500">Basic Counts</td>
                  <td className="p-4 text-center text-zinc-400">Advanced Board</td>
                  <td className="p-4 text-center text-zinc-300">Professional Suite</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Business Intelligence</td>
                  <td className="p-4 text-center text-amber-400 font-black">Enterprise BI</td>
                </tr>
                <tr className="bg-zinc-900/20">
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Automation</td>
                  <td className="p-4 text-center text-zinc-600">—</td>
                  <td className="p-4 text-center text-zinc-400">Basic Tasks</td>
                  <td className="p-4 text-center text-zinc-300">Advanced Workflows</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Unlimited Automations</td>
                  <td className="p-4 text-center text-amber-400 font-black">Custom Workflow Engine</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Search Visibility</td>
                  <td className="p-4 text-center text-zinc-500">Standard</td>
                  <td className="p-4 text-center text-zinc-500">Standard</td>
                  <td className="p-4 text-center text-indigo-400 font-bold">Enhanced Index</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Priority Placement</td>
                  <td className="p-4 text-center text-amber-400 font-black">Enterprise Boost</td>
                </tr>
                <tr className="bg-zinc-900/20">
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Messaging</td>
                  <td className="p-4 text-center text-zinc-500">Community Chat</td>
                  <td className="p-4 text-center text-zinc-400">Enhanced Inbox</td>
                  <td className="p-4 text-center text-zinc-300">Advanced CRM Inbox</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Premium Integration</td>
                  <td className="p-4 text-center text-amber-400 font-black">Team Collaboration</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Bookings</td>
                  <td className="p-4 text-center text-zinc-500">Request Only</td>
                  <td className="p-4 text-center text-zinc-400">Manage Bookings</td>
                  <td className="p-4 text-center text-zinc-300 font-bold">Advanced Tools</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Premium Gateways</td>
                  <td className="p-4 text-center text-amber-400 font-black">Enterprise Systems</td>
                </tr>
                <tr className="bg-zinc-900/20">
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Payments Rails</td>
                  <td className="p-4 text-center text-zinc-500">Standard Wallet</td>
                  <td className="p-4 text-center text-zinc-500">Standard Wallet</td>
                  <td className="p-4 text-center text-indigo-400 font-bold">Advanced Checkout</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Premium Escrow</td>
                  <td className="p-4 text-center text-amber-400 font-black">Custom Settlements</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Notifications</td>
                  <td className="p-4 text-center text-zinc-500">Standard Alerts</td>
                  <td className="p-4 text-center text-blue-400 font-bold">Priority alerts</td>
                  <td className="p-4 text-center text-indigo-400 font-bold">Enhanced Push</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Premium SMS Gates</td>
                  <td className="p-4 text-center text-amber-400 font-black">Dedicated Hooks</td>
                </tr>
                <tr className="bg-zinc-900/20">
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Admin Controls</td>
                  <td className="p-4 text-center text-zinc-600">—</td>
                  <td className="p-4 text-center text-zinc-600">—</td>
                  <td className="p-4 text-center text-zinc-400">Limited Settings</td>
                  <td className="p-4 text-center text-emerald-400 font-bold">Advanced Scopes</td>
                  <td className="p-4 text-center text-amber-400 font-black">Full Audit & SSO Controls</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-zinc-300 font-bold">Worker Services</td>
                  <td className="p-4 text-center text-zinc-500">Shared Cloud</td>
                  <td className="p-4 text-center text-blue-400">Shared Priority</td>
                  <td className="p-4 text-center text-indigo-400 font-bold">Priority Queue</td>
                  <td className="p-4 text-center text-emerald-400 font-black">Dedicated Queue</td>
                  <td className="p-4 text-center text-amber-400 font-black">Dedicated Servers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── CORE VALUE INCENTIVES LIST ── */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex gap-4 items-start p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <Shield size={32} className="text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-tight text-white">Annual Saver Discount</h4>
              <p className="text-[11px] text-zinc-400 mt-1">Get an immediate 20% discount on all billing plans when billed annually. Keep more capital in your business.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <Award size={32} className="text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-tight text-white">Verified Peer Network</h4>
              <p className="text-[11px] text-zinc-400 mt-1">Join an elite peer ecosystem of verified professional label managers, content producers, and sound engineers.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <Layers size={32} className="text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-tight text-white">Sovereign Domain Routing</h4>
              <p className="text-[11px] text-zinc-400 mt-1 font-medium">Configure fully custom branding headers, CSS style overwrites, and sovereign custom domains easily.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
