import React, { useState } from 'react';
import { 
  Sparkles, DollarSign, ShieldAlert, Tv, FileText, 
  CheckCircle2, Disc, Volume2, Search, 
  Lock, Settings, SlidersHorizontal, ArrowDownToLine, 
  Check, Activity, TrendingUp, Percent, AlertTriangle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- STYLES & CONFIGS ---
const LICENSES = [
  { id: 'basic', name: 'Basic Lease', price: 19.99, format: 'MP3 Stereo', terms: 'Non-profit use, max 2,000 streams.' },
  { id: 'premium', name: 'Premium Lease', price: 49.99, format: 'WAV + MP3', terms: 'Commercial use, max 10,000 streams.' },
  { id: 'unlimited', name: 'Unlimited Lease', price: 149.99, format: 'WAV + Stem Files', terms: 'Unlimited streams, radio broadcasting allowed.' },
  { id: 'exclusive', name: 'Exclusive Ownership', price: 499.99, format: 'All Formats + Complete Stems', terms: 'Full transfer of copyrights & ownership forever.' },
];

export interface CreatorMarketplaceViewsProps {
  onAddToCart: (item: any) => void;
  currentUser: any;
}

// -------------------------------------------------------------
// 1. BEATS LAB VIEW
// -------------------------------------------------------------
export const BeatLab: React.FC<CreatorMarketplaceViewsProps> = ({ onAddToCart }) => {
  const [bpm, setBpm] = useState<number>(120);
  const [key, setKey] = useState<string>('All Keys');
  const [mood, setMood] = useState<string>('All Moods');
  const [search, setSearch] = useState<string>('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<string>('basic');
  const [purchasedBeat, setPurchasedBeat] = useState<any | null>(null);

  const mockBeats = [
    { id: 'beat-1', title: 'Midnight Neon', producer: 'Aether Beats', bpm: 124, key: 'A Minor', mood: 'Dark', genre: 'Synthwave', downloads: 1420 },
    { id: 'beat-2', title: 'Soul Drift', producer: 'Luna Vibe', bpm: 88, key: 'C Major', mood: 'Chill', genre: 'Lo-Fi', downloads: 932 },
    { id: 'beat-3', title: 'Glitch Horizon', producer: 'Code Mute', bpm: 140, key: 'F# Minor', mood: 'Intense', genre: 'Cyberpunk', downloads: 2045 },
    { id: 'beat-4', title: 'Ethereal Flow', producer: 'Aether Beats', bpm: 110, key: 'G Major', mood: 'Uplifting', genre: 'Trap', downloads: 812 },
  ];

  const filteredBeats = mockBeats.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.producer.toLowerCase().includes(search.toLowerCase());
    const matchesKey = key === 'All Keys' || b.key === key;
    const matchesMood = mood === 'All Moods' || b.mood === mood;
    const matchesBpm = b.bpm >= bpm - 20 && b.bpm <= bpm + 20;
    return matchesSearch && matchesKey && matchesMood && matchesBpm;
  });

  const handleSimulatePurchase = (beat: any) => {
    const license = LICENSES.find(l => l.id === selectedLicense);
    const mockOrder = {
      id: `ord-${Math.floor(Math.random() * 90000) + 10000}`,
      beatTitle: beat.title,
      producer: beat.producer,
      licenseName: license?.name,
      price: license?.price || 19.99,
      timestamp: new Date().toLocaleTimeString(),
      files: [
        { name: `${beat.title.toLowerCase().replace(' ', '_')}_raw_render.wav`, size: '42.4 MB' },
        { name: `${beat.title.toLowerCase().replace(' ', '_')}_demo.mp3`, size: '8.1 MB' },
        { name: `${beat.title.toLowerCase().replace(' ', '_')}_stems_archive.zip`, size: '210.8 MB', stemOnly: true },
        { name: `license_agreement_pdf_standard.pdf`, size: '1.4 MB' }
      ]
    };

    // Add to global shopping cart
    onAddToCart({
      id: beat.id,
      sellerId: 'aether-beats-1',
      name: `${beat.title} [${license?.name || 'Basic License'}]`,
      description: `Premium music beat key: ${beat.key}, speed: ${beat.bpm} BPM. Complete studio WAV raw stems and commercial licensing.`,
      price: license?.price || 19.99,
      type: 'digital_download',
      imageUrl: 'https://picsum.photos/seed/beats/400/400',
      stock: 999,
      status: 'active'
    });

    setPurchasedBeat(mockOrder);
    toast.success(`Licensing tier added to Cart & direct stems download prepared!`);
  };

  return (
    <div className="space-y-8">
      {/* Search and Advanced Filters */}
      <div className="bg-zinc-900/60 p-6 rounded-3xl border border-white/5 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="text-emerald-400" size={20} />
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Interactive Beat Finder</h3>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input 
              type="text" 
              placeholder="Filter by beat keyword..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
          {/* BPM Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
              <span>BPM Range</span>
              <span className="text-emerald-400 font-mono">{bpm - 20} - {bpm + 20} BPM</span>
            </div>
            <input 
              type="range" 
              min="70" 
              max="160" 
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Key selector */}
          <div className="space-y-2">
            <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">Key Signature</label>
            <select 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
            >
              <option value="All Keys">All Keys</option>
              <option value="A Minor">A Minor</option>
              <option value="C Major">C Major</option>
              <option value="F# Minor">F# Minor</option>
              <option value="G Major">G Major</option>
            </select>
          </div>

          {/* Mood Selector */}
          <div className="space-y-2">
            <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">Vibe & Mood</label>
            <select 
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
            >
              <option value="All Moods">All Moods</option>
              <option value="Dark">Dark</option>
              <option value="Chill">Chill</option>
              <option value="Intense">Intense</option>
              <option value="Uplifting">Uplifting</option>
            </select>
          </div>

          {/* License Configuration Selector */}
          <div className="space-y-2">
            <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">Licensing Tier</label>
            <select 
              value={selectedLicense}
              onChange={(e) => setSelectedLicense(e.target.value)}
              className="w-full bg-zinc-700 text-white rounded-xl p-2.5 text-xs font-bold focus:outline-none"
            >
              <option value="basic">Basic ($19.99)</option>
              <option value="premium">Premium ($49.99)</option>
              <option value="unlimited">Unlimited ($149.99)</option>
              <option value="exclusive">Exclusive ($499.99)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Beats Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Disc className="text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} size={16} />
            Live Marketplace Tracks ({filteredBeats.length})
          </h4>

          <div className="space-y-3">
            {filteredBeats.map(b => (
              <div 
                key={b.id} 
                className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 hover:border-emerald-500/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setPlayingId(playingId === b.id ? null : b.id)}
                    className="w-10 h-10 rounded-full bg-zinc-700/10 text-emerald-400 hover:bg-zinc-700 hover:text-white flex items-center justify-center transition-all shrink-0"
                  >
                    {playingId === b.id ? (
                      <span className="flex gap-0.5 items-end justify-center h-4 w-4">
                        <span className="w-0.5 bg-current animate-[bounce_1s_infinite_100ms] h-full" />
                        <span className="w-0.5 bg-current animate-[bounce_1s_infinite_300ms] h-2/3" />
                        <span className="w-0.5 bg-current animate-[bounce_1s_infinite_500ms] h-full" />
                      </span>
                    ) : (
                      <Volume2 size={16} />
                    )}
                  </button>
                  <div className="min-w-0">
                    <h5 className="text-sm font-black text-white truncate">{b.title}</h5>
                    <p className="text-xs text-zinc-500 font-medium">by {b.producer} • <span className="text-[10px] uppercase font-bold text-zinc-400">{b.genre}</span></p>
                  </div>
                </div>

                {/* Waveform graphic simulator */}
                <div className="flex-1 max-w-[150px] md:max-w-[200px] h-6 flex items-end gap-0.5 opacity-40 group-hover:opacity-75 transition-opacity px-2">
                  {Array.from({ length: 24 }).map((_, idx) => {
                    const h = playingId === b.id ? Math.floor(Math.random() * 20) + 4 : (idx % 4) * 3 + 2;
                    return (
                      <span 
                        key={idx} 
                        style={{ height: `${h}px` }} 
                        className={`w-1 rounded-full transition-all ${playingId === b.id ? 'bg-emerald-400' : 'bg-zinc-700'}`} 
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-zinc-400 rounded-lg px-2 py-0.5">{b.bpm} BPM</span>
                    <span className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-zinc-400 rounded-lg px-2 py-0.5">{b.key}</span>
                    <span className="text-[9px] font-mono font-bold bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-lg px-2 py-0.5">{b.mood}</span>
                  </div>
                  <button 
                    onClick={() => handleSimulatePurchase(b)}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Buy License
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Licensing Tier Information */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-[32px] space-y-6">
            <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest">Active License Specs</h4>
            <div className="space-y-4">
              {LICENSES.map(l => (
                <div 
                  key={l.id} 
                  onClick={() => setSelectedLicense(l.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedLicense === l.id 
                      ? 'bg-emerald-500/10 border-emerald-500' 
                      : 'bg-black/20 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black text-white">{l.name}</span>
                    <span className="text-xs font-black text-emerald-400">${l.price}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium mb-1">Delivered: <strong className="text-zinc-300">{l.format}</strong></p>
                  <p className="text-[10px] text-zinc-400 font-medium italic">{l.terms}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Instant Delivery Simulator */}
      {purchasedBeat && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[32px] space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Order Fulfilled - Phase 3 Instant Delivery active</span>
              <h4 className="text-lg font-black text-white">License Folder Generated • {purchasedBeat.beatTitle}</h4>
              <p className="text-xs text-zinc-500 font-medium">Agreement assigned under Escrow ID: <span className="font-mono text-zinc-400 font-black">{purchasedBeat.id}</span> at {purchasedBeat.timestamp}</p>
            </div>
            <button 
              onClick={() => setPurchasedBeat(null)}
              className="text-[10px] font-black uppercase tracking-widest hover:text-white text-zinc-500 cursor-pointer"
            >
              Dismiss File Cabinet
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-4 pt-2">
            {purchasedBeat.files.map((file: any, index: number) => {
              const isStem = file.stemOnly;
              const belongsToThisTier = !isStem || selectedLicense === 'unlimited' || selectedLicense === 'exclusive';
              return (
                <div 
                  key={index}
                  className={`p-4 rounded-2xl border flex flex-col justify-between h-32 relative ${
                    belongsToThisTier 
                      ? 'bg-black/40 border-white/5' 
                      : 'bg-black/80 border-dashed border-white/5 opacity-40'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <FileText size={20} className={belongsToThisTier ? "text-emerald-400 animate-pulse" : "text-zinc-600"} />
                    <span className="text-[11px] font-bold text-white block truncate">{file.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono block">{file.size}</span>
                  </div>
                  {belongsToThisTier ? (
                    <button 
                      onClick={() => toast.success(`Simulating Direct Download of ${file.name} (HLS dynamic chunk bypass)`)}
                      className="w-full mt-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowDownToLine size={10} />
                      Download Files
                    </button>
                  ) : (
                    <div className="text-[8px] uppercase text-zinc-500 font-black flex items-center gap-1 pt-1 border-t border-white/5">
                      <Lock size={8} /> Needs Unlimited Lease
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 2. CREATOR SERVICE MARKETPLACE (ESCROW WORKSPACE)
// -------------------------------------------------------------
export const ServicesHub: React.FC<CreatorMarketplaceViewsProps> = () => {
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { sender: 'creator', text: 'Hey and welcome! Please drop your audio stems and reference mixes of your track here to initiate mixing/mastering.' }
  ]);

  const SERVICES = [
    { id: 'svc-1', title: 'World-Class Mastering', price: 49.00, delivery: '2 Days', revisions: 3, desc: 'Professional audio rendering across fine analog desks. Mastered explicitly for Spotify, Apple Music, and clubs.' },
    { id: 'svc-2', title: 'Elite Vocal Mixing', price: 125.00, delivery: '3 Days', revisions: 2, desc: 'Precision autotune curation, formant mapping, de-essing, and atmospheric spacing using high-end plug-ins.' },
    { id: 'svc-3', title: 'Interactive Cyber Cover Art', price: 75.00, delivery: '24 Hours', revisions: 'Unlimited', desc: 'Sleek cyberpunk 3D models and brutalist custom layout typography optimized to look stunning at 3000x3000px.' },
  ];

  const handleHireCreator = (srv: any) => {
    setActiveOrder({
      id: `ord-svc-${Math.floor(Math.random() * 8000) + 1000}`,
      service: srv.title,
      price: srv.price,
      deliveryTime: srv.delivery,
      status: 'funds_held', // funds_held -> delivered -> approved -> completed
      milestones: [
        { label: 'Stripe Escrow Deposits Locked', completed: true, desc: 'Funds successfully deposited into SonicStream Reserve' },
        { label: 'Artist Submitted Stems', completed: false, desc: 'Waiting for folder files or vocal reference links' },
        { label: 'Mix & Master Active Render', completed: false, desc: 'Creator compiling track layouts' },
        { label: 'File Delivery & Escrow Release', completed: false, desc: 'Release escrow payment to Creator' }
      ]
    });
    setMessages([
      { sender: 'system', text: `🛡️ Security Ledger active via Stripe Connect escrow. Buyer deposited $${srv.price.toFixed(2)}. Creator cannot withdraw until files are delivered and approved.` },
      { sender: 'creator', text: 'Thank you for your order! I am excited to work on your music. What bpm and scale is your track in?' }
    ]);
    toast.success(`Hired! Funds are held safely in Escrow.`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText) return;
    setMessages(prev => [...prev, { sender: 'buyer', text: messageText }]);
    setMessageText('');

    // Simulate creator automated response if order milestones update
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: 'creator', 
        text: 'Awesome, files received! I am initiating mastering specs via our analog rack. Expect the first revision soon!' 
      }]);
      // Update stems submitted milestone
      if (activeOrder) {
        setActiveOrder((prev: any) => {
          if (!prev) return prev;
          const nextMiles = [...prev.milestones];
          nextMiles[1].completed = true;
          return { ...prev, milestones: nextMiles };
        });
      }
    }, 1200);
  };

  const handleSimulateDelivery = () => {
    if (!activeOrder) return;
    setActiveOrder((prev: any) => {
      const nextMiles = [...prev.milestones];
      nextMiles[2].completed = true;
      return { ...prev, status: 'delivered', milestones: nextMiles };
    });
    setMessages(prev => [...prev, {
      sender: 'creator',
      text: '🚨 REVISION DELIVERED! I completed the final master. Check out the rendered audio file here: master_v1_main_stereo_320kbps.wav (Size: 45MB).'
    }]);
    toast.success("Design / Mix deliverable uploaded! Order is waiting for escrow approval.");
  };

  const handleReleaseEscrow = () => {
    if (!activeOrder) return;
    setActiveOrder((prev: any) => {
      const nextMiles = [...prev.milestones];
      nextMiles[3].completed = true;
      return { ...prev, status: 'completed', milestones: nextMiles };
    });
    setMessages(prev => [...prev, {
      sender: 'system',
      text: '✅ ESCROW FUNDS RELEASED! $ ' + activeOrder.price.toFixed(2) + ' was successfully credited to Creator Account balance via Stripe Instant payout.'
    }]);
    toast.success("Escrow payments fully approved & released! Order completed.");
  };

  return (
    <div className="space-y-8">
      {/* Services Listings */}
      {!activeOrder ? (
        <div className="grid md:grid-cols-3 gap-8">
          {SERVICES.map(srv => (
            <div key={srv.id} className="bg-zinc-900 border border-white/5 p-6 rounded-[32px] flex flex-col justify-between space-y-6 hover:border-emerald-500/20 transition-all">
              <div className="space-y-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#FFF] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2.5 py-1 rounded-lg">Featured Creator Service</span>
                <h4 className="text-xl font-black text-white">{srv.title}</h4>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">{srv.desc}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-mono text-zinc-400">
                  <div className="bg-black/40 p-2 rounded-xl">DELIVERY: <span className="text-white font-bold">{srv.delivery}</span></div>
                  <div className="bg-black/40 p-2 rounded-xl">REVISIONS: <span className="text-white font-bold">{srv.revisions}</span></div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="text-xl font-black text-emerald-400">${srv.price.toFixed(2)}</div>
                <button 
                  onClick={() => handleHireCreator(srv)}
                  className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-[10px] uppercase font-black tracking-widest transition-all cursor-pointer"
                >
                  Order Service
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Project Workspace Integration (Phase 2 & 7) */
        <div className="bg-zinc-900 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-black p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-700 text-white rounded-2xl animate-pulse">
                <Activity size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Phase 2 Escrow Contract Room</h4>
                <h3 className="text-lg font-black text-white">{activeOrder.service}</h3>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono text-zinc-400">ORDER ROOM: #{activeOrder.id}</span>
              <button 
                onClick={() => setActiveOrder(null)} 
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[10px] text-zinc-400 font-bold uppercase rounded-xl"
              >
                Launch List
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
            {/* Step-by-Step Project Management & Milestones */}
            <div className="p-8 space-y-6">
              <h4 className="text-xs font-black text-[#FFF] uppercase tracking-widest flex items-center gap-1.5 border-b border-white/10 pb-2">
                <Settings size={13} className="text-emerald-400" /> Complete Workspace Milestones
              </h4>
              <div className="space-y-4">
                {activeOrder.milestones.map((m: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${
                        m.completed || (activeOrder.status === 'completed')
                          ? 'bg-zinc-700 border-emerald-500 text-white' 
                          : 'bg-black/40 border-white/10 text-zinc-600'
                      }`}>
                        {m.completed || (activeOrder.status === 'completed') ? <Check size={10} /> : idx + 1}
                      </div>
                      {idx < activeOrder.milestones.length - 1 && (
                        <div className={`w-0.5 h-12 ${
                          m.completed ? 'bg-emerald-500' : 'bg-zinc-800'
                        }`} />
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white uppercase">{m.label}</h5>
                      <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Chat Component */}
            <div className="p-8 flex flex-col justify-between h-[450px]">
              <div className="space-y-4 overflow-y-auto max-h-[340px] pr-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-rose-400 block mb-2">Secure encrypted thread</span>
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === 'buyer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed border ${
                      m.sender === 'buyer' 
                        ? 'bg-zinc-700 text-white border-emerald-500' 
                        : m.sender === 'system'
                          ? 'bg-[#1e293b]/80 text-[#38bdf8] border-[#38bdf8]/20 font-mono text-[10px]'
                          : 'bg-black/40 text-zinc-300 border-white/5'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-white/5 pt-4">
                <input 
                  type="text" 
                  placeholder="Ask for revisions or drop download links..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button type="submit" className="px-5 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-xs uppercase cursor-pointer">
                  Send
                </button>
              </form>
            </div>

            {/* Escrow Releases / Action Center */}
            <div className="p-8 space-y-6 bg-black/20">
              <h4 className="text-xs font-black text-[#FFF] uppercase tracking-widest flex items-center gap-1.5 border-b border-white/10 pb-2">
                <Percent size={13} className="text-emerald-400" /> Milestone Audit Controls
              </h4>

              <div className="space-y-4">
                <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-zinc-500 text-[10px] space-y-1 font-mono">
                  <div className="flex justify-between"><span>Escrow Account Deposit:</span><span className="text-white">${activeOrder.price.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Platform Broker Fee (15%):</span><span className="text-white">${(activeOrder.price * 0.15).toFixed(2)}</span></div>
                  <div className="flex justify-between pt-1 border-t border-white/10"><span>Creator Net Payout:</span><span className="text-white">${(activeOrder.price * 0.85).toFixed(2)}</span></div>
                </div>

                {activeOrder.status === 'funds_held' && (
                  <div className="space-y-3">
                    <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                      To simulate creator making a project milestone deliverable upload, click the action below:
                    </p>
                    <button 
                      onClick={handleSimulateDelivery}
                      className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-white/10 text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      🚀 Deliver Mix / Render Files
                    </button>
                  </div>
                )}

                {activeOrder.status === 'delivered' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-emerald-400 shrink-0" size={16} />
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Escrow Approval Ready</h4>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                      Please double-check the delivered files inside chat. Clicking approval will instantly disperse funds from custody.
                    </p>
                    <button
                      onClick={handleReleaseEscrow}
                      className="w-full py-3.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      💎 Approve & Disburse Funds
                    </button>
                  </div>
                )}

                {activeOrder.status === 'completed' && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="text-emerald-400 mx-auto" size={24} />
                    <h5 className="text-[11px] font-black uppercase text-emerald-400">Order Locked & Released</h5>
                    <p className="text-[9px] text-zinc-400 leading-relaxed">Financial reconciliation complete. Thank you for utilizing secure SonicStream Escrow.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 3. TICKET EXPERIENCES (PHASE 5 QR CHECK-IN)
// -------------------------------------------------------------
export const TicketsCenter: React.FC<CreatorMarketplaceViewsProps> = () => {
  const [activeTicket, setActiveTicket] = useState<any | null>(null);

  const CONCERTS = [
    { id: 'tkt-1', title: 'SonicStream Genesis VR Live', date: 'July 18, 2026', type: 'Virtual Event', price: 9.99, genre: 'Electronic', venue: 'V12 Studio Metaverse 3' },
    { id: 'tkt-2', title: 'Brutalist Club London (VIP)', date: 'August 11, 2026', type: 'Concert Tour', price: 49.99, genre: 'Dark Techno', venue: 'The Vault London' },
    { id: 'tkt-3', title: 'Modular Synthesizer Grid Session', date: 'Sept 04, 2026', type: 'Interactive Seminar', price: 25.00, genre: 'Diy Synthesizer', venue: 'Zoom Custom Hub 12' }
  ];

  const handleBuyPass = (concert: any) => {
    setActiveTicket({
      ...concert,
      qrToken: `TKTVER-${Math.floor(Math.random() * 90000) + 10000}-SONIC-2026`,
      paxCount: 1,
      checkedIn: false
    });
    toast.success(`Ticket bought successfully! QR Pass generated.`);
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-8">
        {CONCERTS.map(c => (
          <div key={c.id} className="bg-zinc-900 border border-white/5 p-6 rounded-[32px] flex flex-col justify-between space-y-6 hover:border-emerald-500/20 transition-all">
            <div className="space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#FFF] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2.5 py-1 rounded-lg">{c.type}</span>
              <h4 className="text-xl font-black text-white">{c.title}</h4>
              <p className="text-xs text-zinc-500 font-medium">Date: <span className="text-white font-bold">{c.date}</span></p>
              <p className="text-xs text-emerald-400 font-mono font-bold uppercase">{c.venue}</p>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <div className="text-xl font-black text-emerald-400">${c.price.toFixed(2)}</div>
              <button 
                onClick={() => handleBuyPass(c)}
                className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-[10px] uppercase font-black tracking-widest transition-all cursor-pointer"
              >
                Access Tickets
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeTicket && (
        <div className="bg-zinc-900 border border-[#22c55e]/30 p-8 rounded-[40px] max-w-lg mx-auto space-y-6 text-center text-white relative overflow-hidden backdrop-blur-3xl shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
          
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Electronic Ticket Pass • Phase 5 check-in active</span>
            <h4 className="text-2xl font-black text-white uppercase tracking-tight">{activeTicket.title}</h4>
            <p className="text-xs text-zinc-400 font-mono italic">{activeTicket.venue}</p>
          </div>

          {/* Simulated QR Code using design blocks */}
          <div className="w-44 h-44 bg-white border border-emerald-500 p-3 mx-auto rounded-3xl flex flex-col justify-between items-center relative gap-1 select-all hover:scale-105 transition-transform">
            <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2 bg-zinc-950 rounded-xl overflow-hidden">
              {Array.from({ length: 25 }).map((_, idx) => {
                const filled = (idx * 3 + 7) % 5 === 0 || idx % 2 === 0 || idx === 0 || idx === 4 || idx === 20 || idx === 24;
                return (
                  <div key={idx} className={`w-full h-full rounded-sm ${filled ? 'bg-emerald-400' : 'bg-transparent'}`} />
                );
              })}
            </div>
            <span className="absolute bottom-2 text-[8px] font-mono font-bold text-white uppercase tracking-widest bg-emerald-500 px-2 py-0.5 rounded-full">QR CODE VALID</span>
          </div>

          <div className="space-y-2 text-xs font-mono max-w-xs mx-auto border-t border-white/10 pt-4 text-zinc-400">
            <div className="flex justify-between"><span>TICKET TOKEN:</span><span className="text-white">{activeTicket.qrToken}</span></div>
            <div className="flex justify-between"><span>DATE:</span><span className="text-cyan-400">{activeTicket.date}</span></div>
            <div className="flex justify-between"><span>STATUS:</span><span className={activeTicket.checkedIn ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{activeTicket.checkedIn ? "CHECKED IN" : "TICKETS UNLOCKED"}</span></div>
          </div>

          {!activeTicket.checkedIn ? (
            <button
              onClick={() => {
                setActiveTicket((prev: any) => ({ ...prev, checkedIn: true }));
                toast.success("Gate check-in completed successfully! Welcome to the showreel.");
              }}
              className="w-full py-4 bg-zinc-700 hover:bg-zinc-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all cursor-pointer"
            >
              Simulate Door Attendant Gate Check-In
            </button>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> Attendant Scan Validated • Attendee Admitted
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 4. CREATOR AFFILIATE PORTAL (PHASE 8 REFERRAL PATHS)
// -------------------------------------------------------------
export const AffiliateCenter: React.FC<CreatorMarketplaceViewsProps> = () => {
  const [selectedProduct, setSelectedProduct] = useState('beat-Midnight Neon');
  const [customCommission, setCustomCommission] = useState(10);
  const [generatedLink, setGeneratedLink] = useState('');

  const PRODUCTS = [
    { id: 'beat-1', name: 'Midnight Neon Beat License', originalPrice: 49.99, reward: 15 },
    { id: 'merch-1', name: 'V12 Organic Studio Hoodie', originalPrice: 65.00, reward: 10 },
    { id: 'course-1', name: 'Ambient Synthesis Masterclass', originalPrice: 150.00, reward: 20 },
  ];

  const handleGenerateLink = () => {
    const prod = PRODUCTS.find(p => p.id === selectedProduct) || PRODUCTS[0];
    const link = `${window.location.origin}/marketplace?ref=papislimm&prod=${encodeURIComponent(prod.id)}&comm=${customCommission}`;
    setGeneratedLink(link);
    toast.success("Unique affiliate commission link hashed!");
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Referral Form */}
        <div className="lg:col-span-2 bg-zinc-900 border border-white/5 p-8 rounded-[40px] space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-black bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-emerald-400 rounded-lg">Phase 8 Affiliate Curation</span>
            <h4 className="text-xl font-black text-white">Referral Link Generator</h4>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">Turn your listeners and peers into active sales affiliates. Set custom commission rewards for referrals.</p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select Product to Promote</label>
              <select 
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {PRODUCTS.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (${p.originalPrice.toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Affiliate Commission Reward: <span className="text-emerald-400 font-mono">{customCommission}%</span></label>
              <input 
                type="range" 
                min="5" 
                max="50" 
                value={customCommission}
                step="5"
                onChange={(e) => setCustomCommission(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <button 
              onClick={handleGenerateLink}
              className="w-full py-4 bg-zinc-700 hover:bg-zinc-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all cursor-pointer"
            >
              Generate Referral Commission Path
            </button>
          </div>

          {generatedLink && (
            <div className="bg-black/60 p-4 rounded-2xl border border-white/10 space-y-3 font-mono text-xs text-zinc-400 select-all">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-emerald-400">Unique referral path URL</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    toast.success("Affiliate path copied successfully!");
                  }}
                  className="px-2.5 py-1 bg-white/5 text-zinc-300 rounded-lg hover:text-white"
                >
                  Copy URL
                </button>
              </div>
              <p className="truncate text-white bg-black/80 p-3 rounded-lg border border-white/5 font-semibold text-[11px]">{generatedLink}</p>
            </div>
          )}
        </div>

        {/* Affiliate Statistics Overview */}
        <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] space-y-6">
          <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/10 pb-2">
            <Percent size={13} className="text-emerald-400" /> Affiliate Ledger Dashboard
          </h4>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[9px] text-zinc-500 font-bold block uppercase">Tracking Clicks</span>
                <span className="text-xl font-black text-white font-mono">1,424</span>
              </div>
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[9px] text-zinc-500 font-bold block uppercase">Conversions</span>
                <span className="text-xl font-black text-emerald-400 font-mono">12.2%</span>
              </div>
            </div>

            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400 font-semibold">
                <span>Total Commissions Cleared</span>
                <span className="text-white font-mono">$342.50</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                <span>Pending Clearance Holds</span>
                <span className="text-white font-mono">$85.00</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-[10px] text-zinc-400 leading-relaxed font-semibold">
              📣 <strong className="text-white">Fulfillment Hint:</strong> Payouts route automatically into your Connect Ledger after standard 14-day safety escrow clearance checks.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. AI CREATOR SUITE (PHASE 9 OPTIMIZER)
// -------------------------------------------------------------
export const AiCreatorSuite: React.FC<CreatorMarketplaceViewsProps> = () => {
  const [productType, setProductType] = useState('beats');
  const [rawTitle, setRawTitle] = useState('');
  const [vibe, setVibe] = useState('Cyberpunk');
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateCopy = () => {
    if (!rawTitle) {
      toast.error("Please insert a seed product idea");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAiResult({
        title: `🔥 [Official ${vibe}] - ${rawTitle} • Sonic Mastered Edition`,
        desc: `Unlock the absolute sonic peak of independent artistry. Engineered specifically under the high-vibration ${vibe} aesthetic, this premium render is fully formatted for dynamic club playback and spatial headphone audio loops. Complete with licensed HLS bypass streaming options.`,
        tags: `#${vibe.toLowerCase()} #beatlease #sonicstream #${productType}`,
        price: productType === 'beats' ? '$29.99 (Suggested Sweet Spot)' : '$65.00 (Median Artist Tier)'
      });
      toast.success("AI Generation optimized!");
    }, 1500);
  };

  return (
    <div className="bg-zinc-900 border border-white/5 p-8 rounded-[40px] space-y-6">
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-black bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-purple-400 rounded-lg">Phase 9 AI Copilot Suite</span>
        <h4 className="text-xl font-black text-white">Dynamic Asset Copy Curation</h4>
        <p className="text-xs text-zinc-500 font-medium">Use AI to generate optimized product titles, descriptions, SEO tracking tags, and market-demand price recommendations.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 pt-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Seed Product / Service Heading</label>
            <input 
              type="text" 
              placeholder="e.g. Chill Lofi Drum Loop pack" 
              value={rawTitle}
              onChange={(e) => setRawTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400block">Asset Class</label>
              <select 
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
              >
                <option value="beats">Beat Track</option>
                <option value="merch">Physical Apparel</option>
                <option value="services">Mixing Services</option>
                <option value="samples">Sample Pack</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Vibe Curation</label>
              <select 
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
              >
                <option value="Cyberpunk">Cyberpunk / Industrial</option>
                <option value="Ethereal">Ethereal / Dreamy</option>
                <option value="Sleek Brutalist">Sleek Brutalist / Lo-fi</option>
                <option value="Pop Anthemic">Pop Anthemic</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleGenerateCopy}
            disabled={loading}
            className="w-full py-4 bg-purple-500 hover:bg-purple-400 text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all cursor-pointer flex justify-center items-center gap-2"
          >
            {loading ? <RefreshCw className="animate-spin" size={13} /> : <Sparkles size={13} />}
            {loading ? 'Analyzing Demand Dynamics...' : 'Optimize Asset Metadata Copy'}
          </button>
        </div>

        {/* AI Results Output */}
        <div className="bg-black/60 p-6 rounded-3xl border border-white/10 flex flex-col justify-between h-full min-h-[250px]">
          {aiResult ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-purple-400 font-mono uppercase tracking-widest">Optimized Output Copy</span>
                <h5 className="text-sm font-bold text-white uppercase">{aiResult.title}</h5>
              </div>
              <div className="space-y-1 text-xs">
                <span className="text-[9px] font-mono text-zinc-500 block uppercase">Generated Rich Description</span>
                <p className="text-zinc-300 leading-relaxed font-medium bg-black/30 p-3 rounded-lg border border-white/5">{aiResult.desc}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1 font-mono text-[10px]">
                <div>
                  <span className="text-zinc-500 block">SEO TAGS:</span>
                  <span className="text-purple-400 font-bold block truncate">{aiResult.tags}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">DYNAMIC PRICING SUGGESTED:</span>
                  <span className="text-emerald-400 font-bold block">{aiResult.price}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full text-zinc-500 space-y-2 py-10">
              <Sparkles size={40} className="text-zinc-700 animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-wider">Awaiting dynamic optimization details...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 6. MARKETPLACE ANALYTICS & FRAUD RADAR (PHASE 10 & 11)
// -------------------------------------------------------------
export const MarketplaceAnalytics: React.FC<CreatorMarketplaceViewsProps> = () => {
  return (
    <div className="space-y-8">
      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Marketplace Views', value: '45,210', icon: Tv, change: '+14% month-over-month' },
          { label: 'Add-to-Carts', value: '3,842', icon: Volume2, change: '8.5% Conversion rate' },
          { label: 'Gross Revenue', value: '$12,450.40', icon: DollarSign, change: '15% platform fees net' },
          { label: 'Active Affiliates', value: '24 Artists', icon: Percent, change: 'Affiliate referral active' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-zinc-900 border border-white/5 p-6 rounded-[28px] space-y-2">
            <div className="flex justify-between items-center text-zinc-500">
              <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
              <stat.icon size={16} />
            </div>
            <h4 className="text-2xl font-black text-white font-mono">{stat.value}</h4>
            <p className="text-[9px] text-[#22c55e] font-bold tracking-tight">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Marketplace conversion funnel */}
        <div className="lg:col-span-2 bg-zinc-900 border border-white/5 p-8 rounded-[40px] space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              Conversion Funnel (Last 30 Days)
            </h3>
            <span className="text-[9px] font-black text-zinc-500 uppercase">Live tracking active</span>
          </div>

          <div className="space-y-4">
            {[
              { label: '1. Store Frontpage Views', value: '45,210 Views', raw: 100, color: 'bg-[#a855f7]' },
              { label: '2. Clicked Detail View / Preview Track', value: '18,840 Actions', raw: 41, color: 'bg-[#3b82f6]' },
              { label: '3. Cart Deposited Checkout Stage', value: '3,842 Checkouts', raw: 8.5, color: 'bg-[#06b6d4]' },
              { label: '4. Direct Completed Orders', value: '1,424 Purchases', raw: 3.14, color: 'bg-[#22c55e]' },
            ].map((fun, fIdx) => (
              <div key={fIdx} className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-300">{fun.label}</span>
                  <span className="text-white font-mono">{fun.value} ({fun.raw}%)</span>
                </div>
                <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5">
                  <div style={{ width: `${fun.raw}%` }} className={`h-full rounded-full ${fun.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 11 Guard: Fraud Prevention Logs */}
        <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] space-y-6">
          <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/10 pb-2">
            <ShieldAlert size={14} className="text-rose-500 animate-pulse" /> Active Guard Security Audits
          </h4>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
            {[
              { time: '19:40:02', event: '[IP VELOCITY CHECK] Approved Checkout transaction ID: tkt-00421', status: 'secure' },
              { time: '19:35:14', event: '[AFFILIATE BOT SCAN] Blocked duplicate referral click from anomalous subnet 84.142.*', status: 'alert' },
              { time: '19:22:45', event: '[ESCROW VALIDATION] Checked multi-sig milestone deposit signatures', status: 'secure' },
              { time: '19:10:02', event: '[CHARGEBACK AUDIT] No threat vectors flagged on payment processor Stripe Gateway v5.1', status: 'secure' }
            ].map((logs, lIdx) => (
              <div key={lIdx} className="bg-black/40 p-3 rounded-xl border border-white/5 flex gap-2.5 items-start font-mono text-[9px]">
                <span className="text-zinc-650 font-medium shrink-0">{logs.time}</span>
                <p className={`flex-1 ${logs.status === 'alert' ? 'text-rose-400' : 'text-zinc-400'}`}>{logs.event}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-[10px] text-zinc-500 leading-relaxed font-semibold">
            🛡️ <strong className="text-white">Fraud Prevention Active:</strong> IP reputation checkers, chargeback validation controls, and duplicate bot affiliate detection engines running natively on our Cloud Run instances.
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 7. DEVELOPER API PORTAL (PHASE 14)
// -------------------------------------------------------------
export const DeveloperApiPanel: React.FC<CreatorMarketplaceViewsProps> = () => {
  return (
    <div className="bg-zinc-900 border border-white/5 p-8 rounded-[40px] space-y-6">
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-black bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-cyan-400 rounded-lg">Phase 14 Developer Gateway</span>
        <h4 className="text-xl font-black text-white">Consolidated Marketplace API Router</h4>
        <p className="text-xs text-zinc-500 font-medium">Read-only open access protocols for record labels and physical distribution agencies to query inventory programmatically.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-black/60 p-4 rounded-2xl border border-white/10 space-y-3 font-mono text-xs text-zinc-400">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-[10px] font-black uppercase text-cyan-400">GET /api/v1/marketplace/inventory</span>
            <span className="text-[9px] uppercase font-bold text-zinc-500">JSON schema output format</span>
          </div>
          <pre className="text-[10px] text-cyan-200 overflow-x-auto whitespace-pre p-2 bg-black/40 rounded-xl leading-relaxed">
{`{
  "status": "success",
  "results": 3,
  "data": {
    "products": [
      {
        "id": "beat-Midnight Neon",
        "name": "Midnight Neon Beat License",
        "price": 49.99,
        "type": "beats",
        "licensing": "Commercial Lease",
        "bpm": 124,
        "escrow_guaranteed": true
      }
    ]
  }
}`}
          </pre>
        </div>

        <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl text-[10px] text-zinc-400 leading-relaxed font-semibold">
          📣 <strong className="text-white">API Core Access:</strong> External developer APIs use JWT Bearer verification to fetch raw HLS URLs, track listings, and ticket ledger statuses safely.
        </div>
      </div>
    </div>
  );
};
