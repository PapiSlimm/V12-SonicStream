import { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  CreditCard, 
  ArrowUpRight, 
  Bot, 
  TrendingUp, 
  Sparkles, 
  Users, 
  ShoppingBag, 
  Share2, 
  CheckCircle, 
  Play, 
  Cpu, 
  GitBranch, 
  Plus, 
  Lock,
  ArrowRight,
  Compass,
  DollarSign,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  Calendar,
  Globe,
  Megaphone,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import toast from 'react-hot-toast';

// -- Interfaces --
interface Product {
  id: string;
  name: string;
  price: number;
  type: 'product' | 'service' | 'ticket' | 'membership';
  cta: string;
  autoManaged?: boolean;
}

interface Fan {
  id: string;
  name: string;
  email: string;
  tier: 'VIP' | 'Regular';
  valueSpent: number;
  lastActive: string;
}

interface SystemLog {
  id: string;
  timestamp: string;
  component: 'Websites' | 'Marketing' | 'Affiliates' | 'CRM' | 'Bookings';
  message: string;
  status: 'success' | 'info' | 'active';
}

export const CreatorPassportHub = () => {
  // Configured precisely around the six requested pillars
  const [activeTab, setActiveTab] = useState<'os' | 'commerce' | 'crm' | 'ai' | 'wallet' | 'graph'>('os');

  // Score Reputation Variable
  const [score, setScore] = useState(785);

  // --- PILLAR 1: SONICSTREAM OS STATE & AUTONOMOUS CONTROLS ---
  const [autoWebsites, setAutoWebsites] = useState(true);
  const [autoMarketing, setAutoMarketing] = useState(true);
  const [autoAffiliates, setAutoAffiliates] = useState(false);
  const [autoCRM, setAutoCRM] = useState(true);
  const [autoBookings, setAutoBookings] = useState(false);

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([
    { id: '1', timestamp: '16:04:12', component: 'CRM', message: 'Analyzed 12 new premium membership subscription leads.', status: 'success' },
    { id: '2', timestamp: '15:42:01', component: 'Websites', message: 'Refreshed V12-collective.sonicstream.com domain certificates & responsive CSS.', status: 'success' },
    { id: '3', timestamp: '14:15:30', component: 'Marketing', message: 'Completed weekly automated email campaign block to 842 tier-1 fans.', status: 'success' },
    { id: '4', timestamp: '12:00:15', component: 'CRM', message: 'Pruned inactive subscribers & synced contact lists with decentralized database.', status: 'info' },
  ]);

  const [passportMetadata, setPassportMetadata] = useState({
    serial: "SS-CP-98124-V12",
    holder: "V12 Collective",
    verifiedAt: "2026-06-17",
    issuer: "SonicStream Autonomous Reputation Core",
    metrics: {
      followers: 51240,
      conversionRate: "4.8%",
      completedEvents: 126,
      trustRating: "AAA+",
    },
    integrityHash: "sha256-bd82937fa0ab929cf0"
  });

  const [passportViewMode, setPassportViewMode] = useState<'card' | 'json'>('card');

  // Log automated responses when toggle changes
  const handleToggle = (component: 'Websites' | 'Marketing' | 'Affiliates' | 'CRM' | 'Bookings', currentVal: boolean, setter: (val: boolean) => void) => {
    const nextVal = !currentVal;
    setter(nextVal);
    
    // Add real-time visual system log
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog: SystemLog = {
      id: String(Date.now()),
      timestamp: timeStr,
      component,
      message: nextVal 
        ? `Autonomous Autopilot for ${component} initiated. System took control.`
        : `Deactivated Autopilot for ${component}. Resumed to manual routing.`,
      status: nextVal ? 'active' : 'info'
    };

    setSystemLogs(prev => [newLog, ...prev]);
    toast.success(`${component} Autopilot is now ${nextVal ? 'ENABLED (Platform Managed)' : 'DISABLED (Manual)'}`);
  };

  // --- PILLAR 2: SONIC COMMERCE STATE & ACTIONS ---
  const [products, setProducts] = useState<Product[]>([
    { id: 'prod_1', name: 'Heavyweight Bio-Cotton Hoodie (V12 Edition)', price: 75.00, type: 'product', cta: 'Secure Merch Drop 🎉', autoManaged: true },
    { id: 'prod_2', name: 'Sync/Master Use License "Neon Horizon"', price: 350.00, type: 'service', cta: 'Purchase Sync Contract 💿', autoManaged: true },
    { id: 'prod_3', name: 'Early Bird Ticket: Warehouse Session Live', price: 35.00, type: 'ticket', cta: 'Reserve Seat 🎟️', autoManaged: true },
    { id: 'prod_4', name: 'V12 Backstage Club Membership', price: 15.00, type: 'membership', cta: 'Join Backstage Club 💎', autoManaged: true }
  ]);

  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductType, setNewProductType] = useState<'product' | 'service' | 'ticket' | 'membership'>('product');

  const addCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice) {
      toast.error('Please specify valid product name and list price');
      return;
    }
    const priceNum = parseFloat(newProductPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please provide a positive price value');
      return;
    }

    const newProd: Product = {
      id: `prod_${Date.now()}`,
      name: newProductName,
      price: priceNum,
      type: newProductType,
      cta: 'Buy Now ⚡',
      autoManaged: true
    };

    setProducts(prev => [...prev, newProd]);
    setNewProductName('');
    setNewProductPrice('');
    toast.success(`Successfully added "${newProductName}" to Sonic Commerce! Self-deploying product landing pages...`);

    // Log the automatic deployment
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setSystemLogs(prev => [{
      id: String(Date.now() + 1),
      timestamp: timeStr,
      component: 'Websites',
      message: `Deployed auto-managed buy landing-page for new asset "${newProductName}" ($${priceNum.toFixed(2)}).`,
      status: 'success'
    }, ...prev]);
  };

  // --- PILLAR 3: SONIC CRM AUDIENCE LIST & BROADCASTS ---
  const [fans, setFans] = useState<Fan[]>([
    { id: 'fan_1', name: 'Marcella Thorne', email: 'marcella.t@gmail.com', tier: 'VIP', valueSpent: 420.00, lastActive: '12 mins ago' },
    { id: 'fan_2', name: 'Devon Keats', email: 'devon@keats.design', tier: 'VIP', valueSpent: 350.00, lastActive: '1 hour ago' },
    { id: 'fan_3', name: 'Sora Tanaka', email: 'sora_modular@yahoo.co.jp', tier: 'Regular', valueSpent: 110.00, lastActive: '2 hours ago' },
    { id: 'fan_4', name: 'Elena Rostova', email: 'elena.rost@outlook.com', tier: 'VIP', valueSpent: 512.00, lastActive: 'Yesterday' },
    { id: 'fan_5', name: 'Jared Vance', email: 'vancej@comcast.net', tier: 'Regular', valueSpent: 35.00, lastActive: '3 days ago' },
  ]);

  const [fanFilter, setFanFilter] = useState<'All' | 'VIP' | 'Regular'>('All');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastHistory, setBroadcastHistory] = useState([
    { id: 'b1', date: '2026-06-15', recipients: 'VIP (3 fans)', title: 'Early Merch Access Announcement', text: 'Exclusive hoodies are live! Use private VIP pass code...' }
  ]);

  const filteredFans = useMemo(() => {
    if (fanFilter === 'All') return fans;
    return fans.filter(f => f.tier === fanFilter);
  }, [fans, fanFilter]);

  const sendCrmBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) {
      toast.error('Broadcast message body cannot be empty');
      return;
    }

    const targetGroup = fanFilter === 'All' ? `All Users (${fans.length} fans)` : `${fanFilter} Tier (${filteredFans.length} fans)`;
    const newBroadcast = {
      id: `b_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      recipients: targetGroup,
      title: 'Autonomous CRM Push',
      text: broadcastText
    };

    setBroadcastHistory(prev => [newBroadcast, ...prev]);
    setBroadcastText('');
    toast.success(`Autonomous Broadcast successfully queued! Dispatched to ${targetGroup}.`);

    // Log the automatic deployment
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setSystemLogs(prev => [{
      id: String(Date.now() + 2),
      timestamp: timeStr,
      component: 'Marketing',
      message: `CRM trigger: Broadcasted optimized outreach campaign to ${targetGroup}.`,
      status: 'success'
    }, ...prev]);
  };

  // --- PILLAR 4: SONIC AI CHAT & SETTINGS ---
  const [aiTone, setAiTone] = useState<'Professional' | 'Rebel' | 'Enthusiastic'>('Professional');
  const [aiAutonomy, setAiAutonomy] = useState(85);
  const [aiMessages, setAiMessages] = useState([
    { sender: 'assistant', text: "Hello! I am your Autonomous V12 Digital Twin Agent. I am managing your storefront, optimizing affiliate links, and replying to venue booking requests while you construct music." }
  ]);
  const [chatInput, setChatInput] = useState('');

  const sendAiChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setAiMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      let reply = "Processing command against your connected reputation parameters...";
      const msgLower = userMsg.toLowerCase();
      
      if (msgLower.includes('website') || msgLower.includes('site')) {
        reply = `Understood. My website sub-agent has completed analyzing V12 Collective's link-tree. Performance score is 98. I will automatically tweak layout styles to maximize conversion of incoming short-term viewers.`;
      } else if (msgLower.includes('event') || msgLower.includes('book') || msgLower.includes('gig')) {
        reply = `The Autonomous Booking core recently parsed a gig proposal for Chicago Warehouse Party. I automatically verified your schedule calendar, approved the deposit rate of $4,500, and completed contract signing autonomously.`;
      } else if (msgLower.includes('affiliate') || msgLower.includes('commission')) {
        reply = `Affiliation engine is fully loaded. I resolved 12 conversion referrals to SonicStream synth plugins, racking up $450.00 in backend commission. I am constantly routing traffic through modular nodes to maximize payout yields.`;
      } else if (msgLower.includes('status') || msgLower.includes('how are we')) {
        reply = `Global system report: Autopilot controls are currently active on Websites, Marketing, and CRM. In the past 24 hours we registered +140 new fans, completed 1 transactional ticket event, and generated $14,050.00 in ledger sales.`;
      } else {
        reply = `I am continuously learning your voice using tone parameters: [${aiTone} Mode]. I am actively managing your portfolio, updating storefront files, and executing marketing funnels autonomously so you don't have to look at code.`;
      }

      setAiMessages(prev => [...prev, { sender: 'assistant', text: reply }]);
    }, 700);
  };

  // --- PILLAR 5: SONIC WALLET FINANCIALS ---
  const initialTransactions = [
    { id: 'tx_101', date: '2026-06-16', source: 'Spotify Royalties', desc: 'Sync Master Payout - Midnight Rain', amount: 12450.00, status: 'Settled to Ledger', type: 'spotify' },
    { id: 'tx_102', date: '2026-06-15', source: 'Direct Merch', desc: 'Custom Sonic Hoodie (32 Sales)', amount: 1600.00, status: 'Settled to Ledger', type: 'merch' },
    { id: 'tx_103', date: '2026-06-14', source: 'Booking Engine', desc: 'Headline Match - Chicago Lounge', amount: 4500.00, status: 'Settled to Ledger', type: 'booking' },
    { id: 'tx_104', date: '2026-06-12', source: 'Patreon Tier VIP', desc: 'Monthly Recurrent Fan Subscriptions', amount: 9800.00, status: 'Settled to Ledger', type: 'patreon' },
  ];

  const [ledgerTransactions, setLedgerTransactions] = useState(initialTransactions);
  const [payoutTarget, setPayoutTarget] = useState('0x6C3c9780...f822');
  const [payoutAmount, setPayoutAmount] = useState('');
  
  const totalBalance = useMemo(() => {
    return ledgerTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [ledgerTransactions]);

  const walletHistory = [
    { month: 'Jan', Spotify: 12000, Patreon: 8500, Merch: 15400, Bookings: 18000 },
    { month: 'Feb', Spotify: 15000, Patreon: 9200, Merch: 14200, Bookings: 22000 },
    { month: 'Mar', Spotify: 14500, Patreon: 10400, Merch: 18900, Bookings: 21000 },
    { month: 'Apr', Spotify: 18000, Patreon: 11100, Merch: 21000, Bookings: 25000 },
    { month: 'May', Spotify: 21000, Patreon: 12500, Merch: 24500, Bookings: 28000 },
    { month: 'Jun', Spotify: 24000, Patreon: 14000, Merch: 22000, Bookings: 32000 },
  ];

  const walletPieData = [
    { name: 'Spotify Master Royalties', value: 24000, color: '#1db954' },
    { name: 'Patreon Subscriptions', value: 14000, color: '#f96854' },
    { name: 'Direct-to-Fan Merch', value: 22000, color: '#c81e3a' },
    { name: 'Booking & Visual Events', value: 32000, color: '#8b5cf6' },
  ];

  const handleManualPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payout settlement amount');
      return;
    }
    if (amount > totalBalance) {
      toast.error('Insufficient ledger funds available for payout');
      return;
    }

    const newTx = {
      id: `tx_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      source: 'Unified Ledger Payout',
      desc: `Settlement transfer to: ${payoutTarget}`,
      amount: -amount,
      status: 'Settled to Bank/Crypto',
      type: 'payout'
    };

    setLedgerTransactions([newTx, ...ledgerTransactions]);
    setPayoutAmount('');
    toast.success(`Ledger settlement of $${amount.toFixed(2)} dispatched to your wallet!`);
  };

  // --- PILLAR 6: SONIC GRAPH SYSTEM INTELLIGENCE ---
  const [nodes, setNodes] = useState([
    { id: '1', name: 'CyberSynth Records', type: 'Collaborator', connectionWidth: 80, health: 'Excellent' },
    { id: '2', name: 'Chicago Underground Modular', type: 'Booking Venue', connectionWidth: 95, health: 'Excellent' },
    { id: '3', name: 'SoundCloud Direct Syndication', type: 'Affiliate Pool', connectionWidth: 60, health: 'Optimal' },
    { id: '4', name: 'Brooklyn Synth Corp', type: 'Merch Partner', connectionWidth: 85, health: 'Excellent' },
  ]);

  const [graphRecs, setGraphRecs] = useState([
    { id: 'rec1', action: 'Cross-promote with @cyber_synth', desc: 'Analyze joint short loop interactions to gain modular conversion metrics.', metric: '+12.4% Audience Overlay', applied: false, lift: 25 },
    { id: 'rec2', action: 'Deploy direct affiliate deal with Brooklyn Synth Corp', desc: 'Publish micro bundle links for sonic custom synthesizers.', metric: '+$1,200 Commission Estimate', applied: false, lift: 15 },
    { id: 'rec3', action: 'Adopt flexible pricing model for Event Gigs', desc: 'Optimize booking margins relative to localized venue traction trends.', metric: '+$2,400 per Gig Booking', applied: false, lift: 30 },
  ]);

  const applyRecommendation = (id: string, lift: number) => {
    setGraphRecs(prev => prev.map(r => r.id === id ? { ...r, applied: true } : r));
    setScore(prev => Math.min(1000, prev + lift));
    toast.success('Strategy option executed autonomously! reputation weight improved.');
  };

  return (
    <div className="bg-black text-white min-h-screen relative overflow-hidden font-sans pb-16">
      
      {/* Background Matrix/Core Aesthetics */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-zinc-950/40 to-black pointer-events-none z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12 relative z-10">
        
        {/* Core Passport Header Area */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-8 bg-zinc-900/40 border border-white/5 rounded-[40px] gap-6 backdrop-blur-xl">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse">
                Autonomous Infrastructure Active
              </span>
              <span className="text-[11px] text-zinc-500 font-mono font-bold">
                ID: {passportMetadata.serial}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-none">
              Creator Passport <span className="text-teal-400">Hub</span>
            </h1>
            <p className="text-zinc-500 text-sm max-w-xl leading-relaxed">
              Welcome to the Sovereign Creator Hub, backed by your decentralized reputation. Let the platform manage your entire infrastructure autonomously.
            </p>
          </div>

          <div className="flex items-center gap-5 bg-black/40 p-4 border border-white/5 rounded-3xl self-stretch lg:self-auto justify-between lg:justify-start">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" className="stroke-zinc-800" strokeWidth="5" fill="transparent" />
                <circle cx="32" cy="32" r="28" className="stroke-teal-400" strokeWidth="5" fill="transparent"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - score / 1000)} />
              </svg>
              <div className="absolute text-center">
                <p className="text-lg font-black text-white tracking-tighter">{score}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-teal-400">Sovereign Rep Index</p>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">Ranked Global Elite Tier</p>
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4, 5].map((s) => <div key={s} className="w-1.5 h-1.5 rounded-full bg-teal-400" />)}
              </div>
            </div>
          </div>
        </header>

        {/* The Six Core Pillars Modular Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'os', name: 'SonicStream OS', icon: ShieldCheck, color: 'hover:text-teal-400', desc: 'Core Operator' },
            { id: 'commerce', name: 'Sonic Commerce', icon: ShoppingBag, color: 'hover:text-blue-400', desc: 'Direct Sale Drops' },
            { id: 'crm', name: 'Sonic CRM', icon: Users, color: 'hover:text-rose-400', desc: 'Audience Ownership' },
            { id: 'ai', name: 'Sonic AI', icon: Bot, color: 'hover:text-amber-400', desc: 'Digital Twin Twin' },
            { id: 'wallet', name: 'Sonic Wallet', icon: CreditCard, color: 'hover:text-purple-400', desc: 'Ledger Earnings' },
            { id: 'graph', name: 'Sonic Graph', icon: GitBranch, color: 'hover:text-cyan-400', desc: 'Intelligence Web' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-start p-5 rounded-[28px] border transition-all duration-300 relative overflow-hidden group ${
                activeTab === item.id 
                  ? 'bg-zinc-900 border-teal-500/50 text-teal-400 shadow-xl shadow-teal-500/5' 
                  : 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-white/10 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex justify-between items-center w-full mb-3">
                <item.icon size={20} className={`transition-all duration-300 group-hover:scale-110 ${item.color}`} />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400/30 group-hover:bg-teal-450 opacity-50" />
              </div>
              <span className="text-xs font-black uppercase tracking-tight leading-none text-white block mb-0.5">{item.name}</span>
              <span className="text-[9px] text-zinc-500 font-medium">{item.desc}</span>
            </button>
          ))}
        </div>

        {/* Primary Content Screen */}
        <div className="bg-zinc-900/20 border border-white/5 rounded-[48px] p-8 lg:p-12 min-h-[640px] shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="space-y-10"
            >

              {/* PILLAR 1: SONICSTREAM OS - CORE CREATOR OPERATING SYSTEM */}
              {activeTab === 'os' && (
                <div className="space-y-10">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        <h2 className="text-2xl font-black uppercase tracking-tight">SonicStream OS</h2>
                      </div>
                      <p className="text-zinc-500 text-sm max-w-xl">
                        Your core operating system. Active Autonomous Infrastructure eliminates daily administrative friction.
                      </p>
                    </div>
                    
                    <div className="flex bg-black/60 p-1 rounded-xl border border-white/5 self-start">
                      <button 
                        onClick={() => setPassportViewMode('card')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${passportViewMode === 'card' ? 'bg-white/5 text-teal-450' : 'text-zinc-500'}`}
                      >
                        Reputation Passport Card
                      </button>
                      <button 
                        onClick={() => setPassportViewMode('json')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${passportViewMode === 'json' ? 'bg-white/5 text-teal-400' : 'text-zinc-500'}`}
                      >
                        Decentralized metadata JSON
                      </button>
                    </div>
                  </div>

                  {passportViewMode === 'card' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left: Interactive Passport Visual */}
                      <div className="lg:col-span-5 flex flex-col justify-between p-8 rounded-[40px] bg-gradient-to-b from-zinc-950 to-black border border-white/10 relative overflow-hidden min-h-[365px] shadow-2xl">
                        <div className="absolute top-0 right-0 w-44 h-44 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest block uppercase">Reputation Profile Issued</span>
                            <span className="text-xs font-extrabold uppercase text-white font-mono tracking-widest">{passportMetadata.holder}</span>
                          </div>
                          <ShieldCheck size={28} className="text-teal-400" />
                        </div>

                        {/* Mid Passport chip visual */}
                        <div className="my-6">
                          <div className="w-12 h-9 bg-gradient-to-tr from-teal-400/20 to-teal-400/40 rounded-lg border border-teal-500/30 flex items-center justify-center">
                            <Cpu size={18} className="text-teal-300 animate-pulse" />
                          </div>
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">{passportMetadata.serial}</p>
                        </div>

                        {/* Footer Metrics */}
                        <div className="pt-6 border-t border-white/5 grid grid-cols-3 gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-wide block">Audience size</span>
                            <span className="text-sm font-black font-mono text-teal-400">{passportMetadata.metrics.followers.toLocaleString()}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-wide block">CONVERSION</span>
                            <span className="text-sm font-black font-mono text-white">{passportMetadata.metrics.conversionRate}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-wide block">REPUTATION</span>
                            <span className="text-sm font-black font-mono text-emerald-400">{passportMetadata.metrics.trustRating}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: AUTONOMOUS INFRASTRUCTURE DIRECT CONTROL PANEL */}
                      <div className="lg:col-span-7 bg-zinc-950/65 border border-white/5 rounded-[40px] p-8 space-y-6">
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <Cpu className="text-teal-400 shrink-0" size={18} />
                            Autonomous Autopilot Console
                          </h3>
                          <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                            Enable the platform to manage the core aspects of your brand automatically. These autonomous agents run 24/7.
                          </p>
                        </div>

                        {/* Switches Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { name: 'Autopilot Websites', desc: 'Auto-deploy link trees & landing store pages', state: autoWebsites, setter: setAutoWebsites, comp: 'Websites' as const, icon: Globe },
                            { name: 'Autopilot Marketing', desc: 'Auto-generate weekly social newsletter copy', state: autoMarketing, setter: setAutoMarketing, comp: 'Marketing' as const, icon: Megaphone },
                            { name: 'Autopilot Affiliates', desc: 'Auto-broker micro licensing deals', state: autoAffiliates, setter: setAutoAffiliates, comp: 'Affiliates' as const, icon: Sparkles },
                            { name: 'Autopilot CRM Lists', desc: 'Auto-segment active listeners & sync mail routing', state: autoCRM, setter: setAutoCRM, comp: 'CRM' as const, icon: UserCheck },
                            { name: 'Autopilot Bookings', desc: 'Auto-sign gig contracts & check calendar slots', state: autoBookings, setter: setAutoBookings, comp: 'Bookings' as const, icon: Calendar }
                          ].map((ctl) => (
                            <div 
                              key={ctl.name}
                              onClick={() => handleToggle(ctl.comp, ctl.state, ctl.setter)}
                              className={`p-4 rounded-3xl border transition-all cursor-pointer flex gap-3 h-full items-start ${
                                ctl.state 
                                  ? 'bg-teal-500/5 border-teal-500/20 hover:bg-teal-500/10' 
                                  : 'bg-black/40 border-white/5 hover:border-white/10 hover:bg-white/5'
                              }`}
                            >
                              <div className={`p-2 rounded-xl border ${ctl.state ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>
                                <ctl.icon size={16} />
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between items-center w-full">
                                  <span className="text-xs font-black text-white">{ctl.name}</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${ctl.state ? 'bg-teal-400 animate-pulse' : 'bg-zinc-600'}`} />
                                </div>
                                <p className="text-[10px] text-zinc-500 leading-tight">{ctl.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/60 border border-white/5 rounded-3xl p-6 font-mono text-xs text-zinc-400 max-h-[420px] overflow-y-auto">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                        <span className="text-teal-400 font-bold">Holder Metadata Credential Signature</span>
                        <button 
                          onClick={downloadPassportCred}
                          className="px-3 py-1 bg-teal-400 hover:bg-teal-300 text-black text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5"
                        >
                          <Clock size={12} /> Download Raw JSON
                        </button>
                      </div>
                      <pre className="leading-relaxed text-zinc-350">{JSON.stringify(passportMetadata, null, 2)}</pre>
                    </div>
                  )}

                  {/* Real-time System Action Logging Output (Task System Console) */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 font-mono">Autonomous Platform System Logs</h4>
                      <span className="text-[9px] font-mono text-zinc-600">Secure Decentralized Auditing Buffer</span>
                    </div>

                    <div className="bg-black border border-white/5 rounded-3xl overflow-hidden font-mono text-[11px] divide-y divide-white/5">
                      {systemLogs.map((log) => (
                        <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-zinc-600">[{log.timestamp}]</span>
                            <span className="bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-zinc-400 font-black">{log.component}</span>
                            <span className="text-zinc-300">{log.message}</span>
                          </div>
                          <span className={`flex items-center gap-1 text-[10px] uppercase font-bold shrink-0 ${
                            log.status === 'active' ? 'text-teal-400' : 'text-zinc-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'active' ? 'bg-teal-400 animate-pulse' : 'bg-emerald-400'}`} />
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PILLAR 2: SONIC COMMERCE - MARKETPLACE, PRODUCTS & SERVICES OPERATIONS */}
              {activeTab === 'commerce' && (
                <div className="space-y-10">
                  <div className="border-b border-white/5 pb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Sonic Commerce Portal</h2>
                    <p className="text-zinc-500 text-sm mt-1">
                      Sell directly to fans safely. Products, tickets, and release licenses automatically mapped & compiled to decentralized checkout routes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left: Product Drop creation form */}
                    <form onSubmit={addCustomProduct} className="lg:col-span-5 bg-zinc-950/60 border border-white/5 p-8 rounded-[40px] space-y-6">
                      <div className="space-y-1.5">
                        <h3 className="text-base font-black uppercase tracking-wider text-teal-400">Launch New Commerce Drop</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Enter asset definitions. SonicCommerce compiles payment infrastructure, links metadata parameters, and creates static landing directories automatically.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Drop Asset Title</label>
                          <input 
                            type="text" 
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-teal-500/30 font-medium"
                            placeholder="e.g., Heavyweight Bio Hoodie / Mastering Session"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">List USD Price</label>
                            <input 
                              type="number" 
                              className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-teal-500/30 font-mono font-bold"
                              placeholder="0.00"
                              value={newProductPrice}
                              onChange={(e) => setNewProductPrice(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Product Category</label>
                            <select 
                              className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-teal-500/30 font-semibold"
                              value={newProductType}
                              onChange={(e) => setNewProductType(e.target.value as any)}
                            >
                              <option value="product">Physical Merch</option>
                              <option value="service">Digital Asset</option>
                              <option value="ticket">Event Ticket</option>
                              <option value="membership">Fan Tier Access</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-teal-400 hover:bg-teal-350 text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-teal-500/5"
                      >
                        Publish & Deploy Landing Page
                      </button>
                    </form>

                    {/* Right: Active catalog listings display */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-zinc-500 uppercase tracking-widest font-mono">Current Catalog Pool ({products.length})</span>
                        <span className="text-[9px] font-mono text-zinc-600 bg-white/5 px-2 py-0.5 rounded">All Auto-Managed</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {products.map((p) => (
                          <div key={p.id} className="p-5 rounded-[28px] bg-zinc-900/30 border border-white/5 flex flex-col justify-between hover:border-teal-500/30 transition-all group h-48">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <span className={`text-[8px] font-black px-2 py-0.5 bg-white/5 border border-white/10 rounded-full uppercase tracking-widest text-zinc-400`}>
                                  {p.type}
                                </span>
                                <span className="text-teal-400 font-black font-mono text-sm">${p.price.toFixed(2)}</span>
                              </div>
                              <h4 className="text-sm font-black uppercase text-white truncate-2-lines tracking-tight leading-snug group-hover:text-teal-400 transition-colors">
                                {p.name}
                              </h4>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                              <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wide">Status: Ready</span>
                              <button 
                                type="button"
                                onClick={() => toast.success(`Landing view for "${p.name}" opened in demo layer!`)}
                                className="text-[10px] font-black uppercase tracking-widest text-teal-400 hover:text-teal-300 flex items-center gap-1 font-mono"
                              >
                                {p.cta} <ArrowRight size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PILLAR 3: SONIC CRM - AUDIENCE OWNERSHIP CONSOLE */}
              {activeTab === 'crm' && (
                <div className="space-y-10">
                  <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1.5">
                      <h2 className="text-2xl font-black uppercase tracking-tight">Sonic CRM Network</h2>
                      <p className="text-zinc-500 text-sm">
                        True audience ownership. Maintain clean communication pathways with your subscribers completely unblocked by third-party algorithms.
                      </p>
                    </div>

                    {/* Filter selector */}
                    <div className="flex bg-black p-1 rounded-xl border border-white/5 text-xs">
                      {['All', 'VIP', 'Regular'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setFanFilter(f as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${fanFilter === f ? 'bg-white/5 text-rose-400' : 'text-zinc-500'}`}
                        >
                          {f} Segment
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left: Audience Segment List */}
                    <div className="lg:col-span-7 bg-zinc-950/60 border border-white/5 rounded-[40px] p-8 space-y-6">
                      <div className="flex justify-between items-center text-xs font-mono tracking-widest text-zinc-500 uppercase border-b border-white/5 pb-3">
                        <span>Holder Profile Parameter</span>
                        <span>Total Contributed</span>
                      </div>

                      <div className="divide-y divide-white/5">
                        {filteredFans.map((f) => (
                          <div key={f.id} className="py-4 flex items-center justify-between hover:bg-white/5 px-2 rounded-2xl transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-rose-400 text-xs shadow-md">
                                {f.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm text-zinc-200">{f.name}</span>
                                  {f.tier === 'VIP' && (
                                    <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-[8px] font-black uppercase tracking-widest text-rose-400 rounded-full">
                                      VIP Club
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500">{f.email}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-black font-mono text-white">${f.valueSpent.toFixed(2)}</div>
                              <div className="text-[9px] text-zinc-500">Active {f.lastActive}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Broadcast & Broadcast history */}
                    <div className="lg:col-span-5 space-y-6">
                      <form onSubmit={sendCrmBroadcast} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[40px] space-y-4">
                        <div className="space-y-1.5">
                          <h3 className="text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                            <Megaphone size={16} /> Broadcast Outreach
                          </h3>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Draft a broadcast update. High-performance newsletter filters optimize CTR conversion algorithms automatically.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <textarea 
                            className="w-full h-32 bg-zinc-950 border border-white/5 rounded-2xl p-4 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-rose-500/30 leading-relaxed font-mono"
                            placeholder="Type premium announcement or audio links details here..."
                            value={broadcastText}
                            onChange={(e) => setBroadcastText(e.target.value)}
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-4 bg-rose-500 hover:bg-rose-400 text-black text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
                        >
                          Dispatch Broadcast Launch
                        </button>
                      </form>

                      {/* Broadcast past logs list */}
                      <div className="bg-zinc-950 border border-white/5 rounded-[40px] p-6 space-y-3">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">Broadcast logs</span>
                        <div className="space-y-3">
                          {broadcastHistory.map((bh) => (
                            <div key={bh.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1">
                              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono font-bold uppercase">
                                <span>Sent to {bh.recipients}</span>
                                <span>{bh.date}</span>
                              </div>
                              <h5 className="font-bold text-xs text-rose-400">{bh.title}</h5>
                              <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{bh.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PILLAR 4: SONIC AI - AUTOMATED AGENT CHAT AND COGNITIVE PANEL */}
              {activeTab === 'ai' && (
                <div className="space-y-10">
                  <div className="border-b border-white/5 pb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Sonic AI Node</h2>
                    <p className="text-zinc-500 text-sm mt-1">
                      Converse with your Digital Twin AI Agent. It handles booking requests, runs affiliate conversions, and monitors CRM metrics in your custom communication voice.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Settings & Telemetry */}
                    <div className="lg:col-span-4 bg-zinc-950/60 border border-white/5 p-8 rounded-[40px] space-y-8">
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Cognitive State telemetry</span>
                        <h3 className="text-base font-black text-amber-400 uppercase tracking-wider">AI Agent Configurator</h3>
                      </div>

                      {/* Tone Category */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Agent Vocal Personality</label>
                        <div className="grid grid-cols-3 gap-2 p-1 bg-black rounded-2xl border border-white/5 text-xs">
                          {['Professional', 'Rebel', 'Enthusiastic'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setAiTone(t as any);
                                toast.success(`Cognitive vector revised. Personality adjusted to ${t}.`);
                              }}
                              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${aiTone === t ? 'bg-white/5 text-amber-400' : 'text-zinc-500'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Autonomy Dial Slider */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          <span>Autonomous Control Depth</span>
                          <span className="font-mono text-amber-400 text-sm font-black">{aiAutonomy}%</span>
                        </div>
                        <input 
                          type="range"
                          min="10"
                          max="100"
                          value={aiAutonomy}
                          onChange={(e) => setAiAutonomy(parseInt(e.target.value))}
                          className="w-full accent-amber-400 h-1 bg-zinc-800 rounded-full outline-none"
                        />
                        <p className="text-[9px] text-zinc-500 leading-relaxed font-semibold italic">
                          *Current setting: The AI will autonomously decide 85% of bookings catalog listings with smart routing without requiring explicit approval locks.
                        </p>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3">
                        <AlertCircle className="text-amber-400 shrink-0 select-none" size={16} />
                        <span className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                          Autopilot mode fully synchronizes metadata to the Sovereign Decentralized ledger registry upon completion of contracts.
                        </span>
                      </div>
                    </div>

                    {/* Right Sandbox Chat Console */}
                    <div className="lg:col-span-8 bg-zinc-950/65 border border-white/5 rounded-[40px] p-6 flex flex-col justify-between h-[560px]">
                      
                      {/* Active Chat Logs */}
                      <div className="space-y-4 overflow-y-auto flex-1 pr-2 max-h-[420px]">
                        {aiMessages.map((msg, i) => (
                          <div 
                            key={i} 
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] rounded-[24px] p-4 text-xs leading-relaxed font-medium ${
                              msg.sender === 'user' 
                                ? 'bg-white/5 text-zinc-100 border border-white/10 rounded-tr-none'
                                : 'bg-amber-400/10 text-amber-300 border border-amber-500/20 rounded-tl-none font-mono'
                            }`}>
                              <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">
                                {msg.sender === 'user' ? 'V12 OS COMMANDER' : 'V12 DIGITAL TWIN AGENT'}
                              </span>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Chat Input form */}
                      <form onSubmit={sendAiChat} className="flex gap-3 border-t border-white/5 pt-4 mt-4">
                        <input 
                          type="text"
                          className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500/40 text-white placeholder-zinc-600 font-mono"
                          placeholder="Command agent... (e.g. status, website performance, booking events)"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button 
                          type="submit"
                          className="bg-amber-400 hover:bg-amber-300 text-black px-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                          Execute Key
                        </button>
                      </form>

                    </div>
                  </div>
                </div>
              )}

              {/* PILLAR 5: SONIC WALLET - REVENUE AND Unified LEDGER TRANSITIONS */}
              {activeTab === 'wallet' && (
                <div className="space-y-10">
                  <div className="border-b border-white/5 pb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Sonic Wallet Portal</h2>
                    <p className="text-zinc-500 text-sm mt-1">
                      Multi-platform revenue aggregation pool. All income streams compile instantly onto your sovereign ledger core. Use 1-click withdrawals to collect payouts.
                    </p>
                  </div>

                  {/* Earnings dashboard widgets */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[28px] space-y-1">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Unified Balance</span>
                      <h4 className="text-3xl font-mono font-black text-teal-450">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                      <p className="text-[9px] text-zinc-500 font-semibold uppercase">Pending: $0.00 Settled</p>
                    </div>
                    <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[28px] space-y-1">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Spotify master fee</span>
                      <h4 className="text-3xl font-mono font-black text-white">$24,000.00</h4>
                      <p className="text-[9px] text-emerald-400 font-semibold uppercase">Latest payout 2 days ago</p>
                    </div>
                    <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[28px] space-y-1">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Patreon recurrent</span>
                      <h4 className="text-3xl font-mono font-black text-white">$14,000.00</h4>
                      <p className="text-[9px] text-zinc-500 font-semibold uppercase">Payouts recurring monthly</p>
                    </div>
                    <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[28px] space-y-1">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Merch drops margin</span>
                      <h4 className="text-3xl font-mono font-black text-white">$22,000.00</h4>
                      <p className="text-[9px] text-zinc-500 font-semibold uppercase">100% processed automatically</p>
                    </div>
                  </div>

                  {/* Financial graphs visualizers */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Graph area of income history */}
                    <div className="lg:col-span-8 bg-zinc-950/60 border border-white/5 p-8 rounded-[40px] space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-black uppercase tracking-wider text-teal-400">Past 6 Months Income Breakdown</h4>
                        <span className="text-[9px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded">USD Currency</span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={walletHistory}>
                            <XAxis dataKey="month" stroke="#52525b" style={{ fontSize: '10px', fontFamily: 'JetBrains Mono' }} />
                            <YAxis stroke="#52525b" style={{ fontSize: '10px', fontFamily: 'JetBrains Mono' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px' }} />
                            <Area type="monotone" dataKey="Spotify" stackId="1" stroke="#1db954" fill="#1db954" fillOpacity={0.15} />
                            <Area type="monotone" dataKey="Merch" stackId="1" stroke="#c81e3a" fill="#c81e3a" fillOpacity={0.15} />
                            <Area type="monotone" dataKey="Bookings" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Withdrawal interface & channels pie chart */}
                    <div className="lg:col-span-4 bg-zinc-950/60 border border-white/5 p-8 rounded-[40px] flex flex-col justify-between min-h-[340px]">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-black text-purple-400 uppercase tracking-widest">Disburse Direct Payout</h4>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Disburse your unified ledger balance directly to your mapped crypto wallet address or traditional wire target of choice.
                          </p>
                        </div>

                        <form onSubmit={handleManualPayout} className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Withdrawal target address</label>
                            <input 
                              type="text" 
                              className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono select-none"
                              value={payoutTarget}
                              onChange={(e) => setPayoutTarget(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Withdrawal Amount (USD)</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-extrabold text-xs">$</span>
                              <input 
                                type="number" 
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-500/40"
                                placeholder="0.00"
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                              />
                            </div>
                          </div>

                          <button 
                            type="submit"
                            className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-purple-500/10"
                          >
                            Initiate Settlement Instantly
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* Transactions table ledger */}
                  <div className="space-y-4">
                    <span className="text-xs font-black tracking-widest text-zinc-500 font-mono uppercase">Unified Ledger Registry ({ledgerTransactions.length})</span>
                    <div className="bg-black border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5 font-mono text-[11px]">
                      {ledgerTransactions.map((tx) => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-zinc-600">[{tx.date}]</span>
                            <span className="bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-zinc-400 font-black">{tx.source}</span>
                            <span className="text-zinc-300">{tx.desc}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs font-black ${tx.amount >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                              {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                            </span>
                            <span className="text-[8px] text-zinc-600 block">{tx.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PILLAR 6: SONIC GRAPH - CREATOR Rep MUTUAL INTELLIGENCE NETWORK */}
              {activeTab === 'graph' && (
                <div className="space-y-10">
                  <div className="border-b border-white/5 pb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Sonic Graph Explorer</h2>
                    <p className="text-zinc-500 text-sm mt-1">
                      Explore your modular creator intelligence metrics. Network factors automatically determine credit standing limits, brand overlaps, and direct yield routes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Connection Core list */}
                    <div className="lg:col-span-4 bg-zinc-950/60 border border-white/5 p-8 rounded-[40px] space-y-6">
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Connected Node Matrices</span>
                        <h3 className="text-base font-black text-cyan-400 uppercase tracking-wider">Correlation Nodes</h3>
                      </div>

                      <div className="space-y-4">
                        {nodes.map((n) => (
                          <div key={n.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-extrabold text-xs text-zinc-200">{n.name}</h4>
                              <span className="text-[8px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full font-black uppercase font-mono">
                                {n.type}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-zinc-500 font-bold uppercase font-mono">
                                <span>Overlap Power</span>
                                <span>{n.connectionWidth}%</span>
                              </div>
                              <div className="h-1.5 bg-black rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${n.connectionWidth}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right recommendations action cards */}
                    <div className="lg:col-span-8 space-y-6">
                      <div className="flex justify-between items-center text-xs font-mono tracking-widest text-zinc-500 uppercase">
                        <span>Automation Brain Recommendations Option</span>
                        <span>Credit score influence</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {graphRecs.map((rec) => (
                          <div key={rec.id} className="bg-zinc-900/30 border border-white/5 p-6 rounded-[28px] flex flex-col justify-between hover:border-cyan-500/30 transition-all h-64">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-cyan-400 font-mono">+{rec.lift} Rep score</span>
                                <span className={`w-2 h-2 rounded-full ${rec.applied ? 'bg-emerald-400' : 'bg-zinc-600 animate-pulse'}`} />
                              </div>
                              <h5 className="font-black text-sm uppercase text-zinc-200 leading-snug tracking-tight truncate-2-lines">{rec.action}</h5>
                              <p className="text-[10px] text-zinc-500 leading-relaxed leading-snug font-medium">{rec.desc}</p>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                              <span className="text-[9px] font-bold text-teal-400 tracking-wider font-mono bg-teal-500/5 py-1 px-2 rounded-lg text-center">
                                Est. {rec.metric}
                              </span>

                              {rec.applied ? (
                                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black tracking-widest uppercase justify-center font-mono">
                                  <CheckCircle size={12} /> Executed Active
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => applyRecommendation(rec.id, rec.lift)}
                                  className="w-full py-2 bg-cyan-400 hover:bg-cyan-300 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                  Execute Strategy
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
};
