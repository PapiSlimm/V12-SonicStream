import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause,
  Upload,
  Users, 
  Sparkles, 
  ShoppingBag, 
  ArrowRight, 
  Heart, 
  CheckCircle2, 
  Headphones,
  Download,
  Flame,
  Volume2,
  ShieldCheck,
  Smartphone,
  Info,
  ShoppingCart,
  Grid,
  Gift,
  Copy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

// Simulated Tracks for our Streaming / Smart Radio preview
const STREAMING_TRACKS = [
  { id: 't1', title: 'Cosmic Drift', artist: 'Hyperion', duration: '3:45', mood: 'Aether (Chill)' },
  { id: 't2', title: 'Neural Highway', artist: 'Pixel Ghost', duration: '4:12', mood: 'Focus (Mono Synth)' },
  { id: 't3', title: 'Pulse Catalyst', artist: 'Nova Storm', duration: '3:20', mood: 'Euphoria (High Energy)' },
  { id: 't4', title: 'Solar Flare', artist: 'Ron Dickson', duration: '5:02', mood: 'Euphoria (High Energy)' },
  { id: 't5', title: 'Cyber Sunset', artist: 'Hologram Kid', duration: '3:50', mood: 'Aether (Chill)' }
];

export const LandingPage = memo(() => {
  const { user } = useAuth();

  // 1. Core State Managers
  const [activeTab, setActiveTab] = useState<'creators' | 'fans'>('creators');
  const [cart, setCart] = useState<{ id: string; title: string; price: number; type: string }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeSupporterTier, setActiveSupporterTier] = useState<string | null>(null);
  
  // 2. AI Promotion Toolkit States
  const [promptText, setPromptText] = useState('Chill lofi synthwave track under neon lights');
  const [isGeneratingPromo, setIsGeneratingPromo] = useState(false);
  const [promoGenerated, setPromoGenerated] = useState(false);
  const [generatedPromo, setGeneratedPromo] = useState({
    caption: '',
    creativeIdea: '',
    audience: ''
  });

  // 3. Listening Room / SonicRoom simulator
  const [activeRoomTrack, setActiveRoomTrack] = useState(STREAMING_TRACKS[0]);
  const [isRoomPlaying, setIsRoomPlaying] = useState(false);
  const [roomMessages, setRoomMessages] = useState([
    { id: 1, user: 'Kai_Neon', text: 'This bassline in Cosmic Drift goes crazy! 🛸' },
    { id: 2, user: 'Aria_Vibes', text: 'Ron Dickson really mastered the stereo field here.' },
    { id: 3, user: 'Dev_Audio', text: 'Listening from Berlin, the buffer is literally 0ms!' }
  ]);
  const [newRoomMsg, setNewRoomMsg] = useState('');

  // 4. Fan Missions (Gamification)
  const [unlockedMissions, setUnlockedMissions] = useState<string[]>([]);
  
  // 5. Smart Radio & Streaming
  const [selectedMood, setSelectedMood] = useState('Aether (Chill)');
  const [crossfadeSeconds, setCrossfadeSeconds] = useState(4);
  const [offlineDownloaded, setOfflineDownloaded] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  
  // 6. SonicClips Feed (TikTok Style)
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [clipHearts, setClipHearts] = useState<{ [key: number]: number }>({ 0: 452, 1: 890, 2: 320 });
  const [votedClips, setVotedClips] = useState<{ [key: number]: boolean }>({});

  const CLIPS_DATA = [
    { 
      id: 0, 
      artist: 'Hyperion', 
      title: 'Cosmic Drift Live Preview', 
      desc: 'Jamming on the OB-6 synthesizer in real-time. Full stems available in storefront below!', 
      videoUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600&h=400',
      tag: 'Studio Session'
    },
    { 
      id: 1, 
      artist: 'Pixel Ghost', 
      title: 'How I mixed Neon Highway', 
      desc: 'Using the dynamic EQ to separate kick and sub bass. Grab my preset pack inside the marketplace.', 
      videoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600&h=400',
      tag: 'Tutorial'
    },
    { 
      id: 2, 
      artist: 'Nova Storm', 
      title: 'Arena Live Show Snippet', 
      desc: 'Epic crowd response during the dropout! Tickets for the tour are on sale now.', 
      videoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600&h=400',
      tag: 'Live Event'
    }
  ];

  // 7. Store Products
  const STORE_PRODUCTS = [
    { id: 'p1', title: 'Neon Nights STEMS Collection', price: 19, type: 'Stems (Audio Files)', desc: 'Pre-separated high quality 24-bit WAV files.' },
    { id: 'p2', title: 'SonicStream Velvet Heavyweight Hoodie', price: 65, type: 'Merch (Streetwear)', desc: 'Organic 450GSM French Terry custom bleach wash.' },
    { id: 'p3', title: 'Immersive Virtual Concert Ticket', price: 20, type: 'Ticket Pass', desc: 'Secure passage into the Neon Canopy Virtual Room.' },
    { id: 'p4', title: '808 Bass Massive Preset Pack', price: 12, type: 'Synth Presets', desc: '30 custom patches for Serum & Massive VSTs.' }
  ];

  // Performance dashboard metrics
  const [performanceMode, setPerformanceMode] = useState<'standard' | 'optimized'>('optimized');
  const [throttleMs, setThrottleMs] = useState(50);

  // --- Handlers ---
  const handleAddToCart = (product: typeof STORE_PRODUCTS[0]) => {
    setCart(prev => [...prev, product]);
    toast.success(`Added "${product.title}" to your checkout cart!`);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    toast.error('Removed item from cart.');
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    toast.loading('Synchronizing secure digital ledger receipt...', { duration: 1500 });
    setTimeout(() => {
      toast.success('Simulated Order Processed Successfully! Ledger updated.');
      setCart([]);
      setIsCartOpen(false);
    }, 1600);
  };

  const handleTriggerAI = () => {
    setIsGeneratingPromo(true);
    toast.loading('Analyzing artist audio DNA & parsing targeting schemas...', { duration: 1200 });
    setTimeout(() => {
      setGeneratedPromo({
        caption: `🔥 DROPPING SOON: The ultimate future sonic experience is almost here! Dive into "${promptText}" on SonicStream. Get direct membership access and exclusive merch drops! #SonicStream #IndependentCreators #AudioInnovation`,
        creativeIdea: `Create a 15-second loop featuring a glowing neon waveform expanding slowly to the kick-drum hits. Place the pre-order link under a high-contrast 'Join Supporting Fan Circle' call to action.`,
        audience: `Target: 18-35 age bracket, intersecting Synthesizer community, Independent Audio Collectors, and Indie Label supporters in major digital centers.`
      });
      setIsGeneratingPromo(false);
      setPromoGenerated(true);
      toast.success('Successfully calibrated release campaign toolkit!');
    }, 1300);
  };

  const handleSendRoomMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomMsg.trim()) return;
    setRoomMessages(prev => [
      ...prev,
      { id: Date.now(), user: user?.name || 'Local_Guest', text: newRoomMsg.trim() }
    ]);
    setNewRoomMsg('');
    toast.success('Message broadcasted to Active Room!');
  };

  // Gamification Mission completion
  const handleCompleteMission = (missionId: string, missionName: string) => {
    if (unlockedMissions.includes(missionId)) {
      toast('You already unlocked this badge award!');
      return;
    }
    setUnlockedMissions(prev => [...prev, missionId]);
    toast.success(`Completed Quest! You unlocked the elite "${missionName}" Badge!`, {
      icon: '🏆',
      duration: 3000
    });
  };

  // Offline Mode toggle download simulator
  const handleDownloadTrack = (trackId: string, trackTitle: string) => {
    if (offlineDownloaded.includes(trackId)) {
      setOfflineDownloaded(prev => prev.filter(id => id !== trackId));
      toast.error(`Removed offline cache for "${trackTitle}"`);
      return;
    }

    setDownloadProgress(prev => ({ ...prev, [trackId]: 5 }));
    toast.loading(`Caching chunked bitstreams for offline playback...`);
    
    let currentProgress = 5;
    const interval = setInterval(() => {
      currentProgress += 15;
      if (currentProgress >= 100) {
        clearInterval(interval);
        toast.dismiss();
        setOfflineDownloaded(prev => [...prev, trackId]);
        setDownloadProgress(prev => {
          const next = { ...prev };
          delete next[trackId];
          return next;
        });
        toast.success(`"${trackTitle}" cached successfully! 100% playable offline.`);
      } else {
        setDownloadProgress(prev => ({ ...prev, [trackId]: currentProgress }));
      }
    }, 200);
  };

  // Double-tap vertical video heart increment
  const handleLikeClip = (clipId: number) => {
    if (votedClips[clipId]) {
      setClipHearts(prev => ({ ...prev, [clipId]: prev[clipId] - 1 }));
      setVotedClips(prev => ({ ...prev, [clipId]: false }));
      toast('Unliked clip');
    } else {
      setClipHearts(prev => ({ ...prev, [clipId]: prev[clipId] + 1 }));
      setVotedClips(prev => ({ ...prev, [clipId]: true }));
      toast.success('Voted on SonicClip preview! 🔥', { id: 'clip-like' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07070a] text-zinc-100 font-sans overflow-x-hidden selection:bg-zinc-700 selection:text-white">
      
      {/* GLOW DECORATIONS */}
      <div className="absolute top-[5%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[700px] h-[700px] rounded-full bg-pink-500/5 blur-[180px] pointer-events-none" />

      {/* FLOAT CART LOGO */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-full shadow-2xl shadow-black/30 flex items-center gap-2 font-black transition-all hover:scale-105 active:scale-95"
      >
        <ShoppingCart size={20} />
        {cart.length > 0 && (
          <span className="w-5 h-5 bg-black text-emerald-400 rounded-full flex items-center justify-center text-xs">
            {cart.length}
          </span>
        )}
      </button>

      {/* --- CART DRAWER --- */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-md bg-[#0a0a0f] border-l border-white/10 h-full relative z-10 p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center pb-6 border-b border-white/5 mb-6">
                  <h3 className="font-extrabold uppercase tracking-widest text-lg flex items-center gap-2">
                    <ShoppingBag className="text-emerald-400" />
                    Digital Ledger Cart
                  </h3>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-zinc-500 hover:text-white font-bold"
                  >
                    CLOSE
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <ShoppingCart size={48} className="text-zinc-700 mx-auto" />
                    <p className="text-zinc-400 text-sm">Your secure shopping cart is empty.</p>
                    <p className="text-zinc-600 text-xs">Add stems, merch, or virtual event tickets below.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                    {cart.map((item, index) => (
                      <div 
                        key={index} 
                        className="p-4 bg-white/2 border border-white/5 rounded-2xl flex justify-between items-start"
                      >
                        <div>
                          <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">{item.type}</p>
                          <h4 className="font-bold text-sm text-white mt-1">{item.title}</h4>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="font-extrabold text-white text-sm">${item.price}</p>
                          <button 
                            onClick={() => handleRemoveFromCart(index)}
                            className="text-[10px] text-red-400 hover:underline uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between text-sm font-black uppercase">
                    <span className="text-zinc-400">Projected Total Cost</span>
                    <span className="text-white text-lg">${cart.reduce((acu, cur) => acu + cur.price, 0)}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full py-4 bg-zinc-700 hover:bg-zinc-600 font-extrabold text-white uppercase tracking-widest rounded-2xl transition-all"
                  >
                    Proceed To Checkout
                  </button>
                  <p className="text-[10px] text-zinc-600 text-center">
                    Simulated transaction powered securely via integrated creator ledger routing.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION WITH IDENTITY & POSITIONING --- */}
      <header className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto border-b border-white/5 text-center">

        {/* VIDEO INSERT — brand reveal, sits above all typographic content below it */}
        <div className="max-w-4xl mx-auto mb-12 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
          <video
            className="w-full h-auto block motion-reduce:hidden"
            autoPlay
            muted
            loop
            playsInline
            poster="/media/sonicstream-hero-poster.jpg"
          >
            <source src="/media/sonicstream-hero.webm" type="video/webm" />
            <source src="/media/sonicstream-hero.mp4" type="video/mp4" />
          </video>
          <img
            src="/media/sonicstream-hero-poster.jpg"
            alt="V12 SonicStream — Where Creators Thrive"
            className="hidden motion-reduce:block w-full h-auto"
          />
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mx-auto"
          >
            <Sparkles size={12} className="animate-spin text-emerald-400" />
            <span>THE CREATOR OPERATING SYSTEM</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.95] uppercase"
          >
            SonicStream
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-2xl md:text-3xl font-extrabold text-emerald-400 tracking-tight max-w-3xl mx-auto"
          >
            “AI-Powered Platform For Entrepreneurs, Creators, & Independent Artists”
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            We are <span className="text-white font-bold">NOT</span> another music distributor or generic passive streaming app. SonicStream is the ultimate Business Operating System for All Creators—featuring a Website Builder, a global Marketplace, Booking system, Printing, Ticketing, Memberships, Fan CRM, Affiliate Programs, AI Marketing, and integrated Commerce.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="flex flex-wrap justify-center items-center gap-3 pt-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-full text-xs font-bold text-zinc-300">
              <ShoppingBag size={13} className="text-emerald-400" />
              Global Marketplace
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-full text-xs font-bold text-zinc-300">
              <Sparkles size={13} className="text-emerald-400" />
              Reach Fans &amp; Buyers Worldwide
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-full text-xs font-bold text-zinc-300">
              <ShieldCheck size={13} className="text-emerald-400" />
              Built-In Global Payouts
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4"
          >
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-2xl font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10 inline-flex items-center justify-center gap-2"
              >
                <span>Navigate to Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="w-full sm:w-auto px-8 py-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-2xl font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10 inline-flex items-center justify-center gap-2"
                >
                  <span>Build Creator Account</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/signin"
                  className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white rounded-2xl font-semibold transition-all hover:scale-[1.02] inline-flex items-center justify-center gap-2"
                >
                  <span>Sign In As Supporter</span>
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </header>


      {/* --- SECTION 2: CHOOSE YOUR JOURNEY (FANS VS. CREATORS DISCOVERY) --- */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="text-center space-y-4 mb-16">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">EXPLORE COHERENT ROADMAPS</p>
          <h3 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Designed for Both Sides of the Art
          </h3>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm">
            Toggle the specialized view below to discover how our interface serves fans and creative professionals with laser focus.
          </p>

          <div className="flex justify-center pt-6">
            <div className="p-1 bg-zinc-950/80 border border-white/5 rounded-2xl flex gap-2">
              <button 
                onClick={() => setActiveTab('creators')}
                className={`px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all ${activeTab === 'creators' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
              >
                For Creators & Artists
              </button>
              <button 
                onClick={() => setActiveTab('fans')}
                className={`px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all ${activeTab === 'fans' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
              >
                For Fans & Supporters
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'creators' ? (
            <motion.div 
              key="creators"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-stretch"
            >
              <div className="lg:col-span-2 space-y-6 flex flex-col justify-center">
                <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold uppercase">
                  MONETIZE & GROW
                </div>
                <h4 className="text-3xl font-black text-white uppercase leading-tight">
                  Supercharge Your Creative Enterprise
                </h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Avoid platform gatekeepers. Build direct-to-supporter subscription portals, host physical streetwear store inventory, license instrumentals, prepare metadata, and generate release marketing budgets in seconds.
                </p>

                <ul className="space-y-4">
                  {[
                    { title: "Website Builder & Booking", desc: "Design elegant custom websites and configure instant client and fan booking calendars." },
                    { title: "Ticketing & Memberships", desc: "Sell event tickets and recurring fan memberships directly, bypassing expensive ticket platforms." },
                    { title: "AI Marketing & Fan CRM", desc: "Deploy AI marketing campaigns and nurture fan relationships using segmented database tools." },
                    { title: "Marketplace, Commerce & Printing", desc: "Stock physical print-on-demand merchandise, digital items, and digital products on your own web store." }
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-3 align-start">
                      <div className="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={12} />
                      </div>
                      <div>
                        <h5 className="text-sm font-extrabold text-white">{item.title}</h5>
                        <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Creators Interactive Simulator Screen */}
              <div className="lg:col-span-3 bg-zinc-950/80 border border-white/5 rounded-3xl p-8 relative flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 blur-[80px] rounded-full" />
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Live Creator Workbench Preview</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold">PRO ACCOUNT</span>
                  </div>

                  {/* Simulated Upload widget */}
                  <div className="p-6 bg-white/2 border border-white/5 rounded-2xl border-dashed hover:border-emerald-500/50 transition-all text-center">
                    <Upload className="text-emerald-400 mx-auto mb-3" size={32} />
                    <h5 className="text-sm font-bold text-white mb-1">Drag instrumentals or audio files here</h5>
                    <p className="text-[10px] text-zinc-500">WAV, AIFF, or FLAC formats. Max 100MB per stem track.</p>
                    <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-[11px] text-zinc-400 font-mono mt-4 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Volume2 size={12} /> track_master_v12.wav</span>
                      <span className="text-emerald-400 font-extrabold">Ready (FLAC 16/44)</span>
                    </div>
                  </div>

                  {/* Fast API creator business simulator stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Business Channels</p>
                      <h6 className="text-lg font-black text-white mt-1">Multi-Channel Active</h6>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-400 h-full w-[100%]" />
                      </div>
                    </div>
                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Commerce Revenue Scale</p>
                      <h6 className="text-lg font-black text-emerald-400 mt-1">$4,520 / Mo</h6>
                      <p className="text-[9px] text-zinc-500 mt-0.5">Website, ticketing & fan memberships</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                  <span>Automatic transcode engine: HLS + adaptive fallback</span>
                  <Link to="/signup" className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
                    Claim Your Spot <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="fans"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-stretch"
            >
              <div className="lg:col-span-2 space-y-6 flex flex-col justify-center">
                <div className="inline-block px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-emerald-400 rounded-lg text-xs font-bold uppercase">
                  UNMATCHED ACCESS
                </div>
                <h4 className="text-3xl font-black text-white uppercase leading-tight">
                  Experience Music With Real Impact
                </h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Move beyond algorithms. Directly back individual creators, participate in live collaborative Listening Rooms with synchronized spectrum visualizers, unlock tier badges through fun Missions, and secure access to events.
                </p>

                <ul className="space-y-4">
                  {[
                    { title: "Direct Member Tiers", desc: "Gain access to exclusive demos, raw audio stems, and direct messaging." },
                    { title: "Simulated Live Stage Streams", desc: "Experience real-time interactive Listening Stages with live chat feeds." },
                    { title: "Gamified Fan Achievements", desc: "Unlock exclusive badges and early track drops by completing daily quizzes and streams." },
                    { title: "Premium Digital Storefronts", desc: "Directly secure custom clothing, high-fidelity audio releases, and physical gig tickets." }
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-3 align-start">
                      <div className="w-5 h-5 bg-pink-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={12} />
                      </div>
                      <div>
                        <h5 className="text-sm font-extrabold text-white">{item.title}</h5>
                        <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fans Interactive Board Preview */}
              <div className="lg:col-span-3 bg-zinc-950/80 border border-white/5 rounded-3xl p-8 relative flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-pink-500/5 blur-[80px] rounded-full" />
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Live Supporter Portal Preview</span>
                    <span className="px-2 py-0.5 bg-pink-500/10 border border-pink-500/20 text-emerald-400 rounded text-[9px] font-bold">VERIFIED FAN</span>
                  </div>

                  {/* Supporter view - unlocked items */}
                  <div className="space-y-3">
                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                          <Gift size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Active Supporter Circle</p>
                          <h6 className="font-extrabold text-sm text-white">Ron Dickson Backstage Inner Circle</h6>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-white text-black font-extrabold text-[10px] rounded-lg uppercase tracking-wider">
                        ACTIVE UNLOCKED
                      </span>
                    </div>

                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Milestone Progress Challenge</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-zinc-300 font-extrabold">Stream 2 More Releases Natively</span>
                        <span className="text-xs text-emerald-400 font-mono">2 / 4 Completed</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1 rounded-full mt-2">
                        <div className="bg-pink-500 h-full w-[50%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                  <span>Loyalty tracking calibrated down to individual bitstream decibels</span>
                  <Link to="/signin" className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
                    Sign In & Explorer <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>


      {/* --- SECTION 3: TECHNICAL PERFORMANCE CONTROL ROOM --- */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-b border-white/5 bg-[#0a0a0f]/50 rounded-[40px] border border-white/5 p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-zinc-900 border border-white/10 text-zinc-400 rounded-full text-xs font-bold uppercase tracking-wider">
              PERFORMANCE ENGINE DIALS
            </div>
            <h3 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">
              Optimization Dashboard
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Standard consumer platforms load giant JavaScript bundles, trigger websocket client storms, and suffer from heavy rendering lags. SonicStream resolves this with aggressive route-level chunking, throttled socket backpressure, and local HLS stream chunking.
            </p>

            <div className="space-y-4 pt-4">
              <div 
                onClick={() => setPerformanceMode('optimized')}
                className={`p-4 bg-[#07070a] border rounded-2xl flex items-start gap-4 cursor-pointer transition-all ${performanceMode === 'optimized' ? 'border-emerald-500/50 hover:bg-emerald-500/2' : 'border-white/5 opacity-50 hover:opacity-80'}`}
              >
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-white uppercase">Calibrated Optimized Mode (Active)</h5>
                  <p className="text-xs text-zinc-400 mt-1">Route-level lazy loading active. Estimated bundle size: <strong className="text-emerald-400">182KB</strong>. Playback Latency: <strong className="text-emerald-400">12ms</strong>.</p>
                </div>
              </div>

              <div 
                onClick={() => setPerformanceMode('standard')}
                className={`p-4 bg-[#07070a] border rounded-2xl flex items-start gap-4 cursor-pointer transition-all ${performanceMode === 'standard' ? 'border-red-500/50 hover:bg-red-500/2' : 'border-white/5 opacity-50 hover:opacity-80'}`}
              >
                <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                  <Info size={20} />
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-zinc-400 uppercase">Standard Platform Architecture</h5>
                  <p className="text-xs text-zinc-500 mt-1">Single monolith bundle downloads. Full bundle: <strong className="text-red-400">6.4MB</strong>. Playback Latency: <strong className="text-red-400">850ms</strong>.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive performance analyzer graph */}
          <div className="bg-black/90 p-8 border border-white/10 rounded-3xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="font-mono text-xs text-zinc-400 font-bold uppercase">Dynamic CPU / Load Diagnostics</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Realtime Telemetry
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
                  <span>Javascript Thread Lag</span>
                  <span className={performanceMode === 'optimized' ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                    {performanceMode === 'optimized' ? '0.4ms (Ideal)' : '142ms (Unresponsive)'}
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${performanceMode === 'optimized' ? 'bg-emerald-400 w-[5%]' : 'bg-red-400 w-[72%]'}`} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
                  <span>Websocket Event Congestion</span>
                  <span>{performanceMode === 'optimized' ? 'Throttled Room Isolations' : 'Socket Storm active'}</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${performanceMode === 'optimized' ? 'bg-emerald-400 w-[12%]' : 'bg-red-400 w-[95%]'}`} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
                  <span>Web Socket Event Filter Period</span>
                  <span>{throttleMs}ms throttle delay</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="200" 
                  value={throttleMs}
                  onChange={(e) => setThrottleMs(Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div className="p-4 bg-[#0a0a0f] border border-white/5 rounded-2xl space-y-2">
                <h6 className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">Under-the-Hood Stack Optimization</h6>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 border border-white/5 bg-white/2 rounded">Edge Caching: <span className="text-emerald-400 font-extrabold">Active</span></div>
                  <div className="p-2 border border-white/5 bg-white/2 rounded">Bitrate: <span className="text-emerald-400 font-extrabold">Adaptive (HLS)</span></div>
                  <div className="p-2 border border-white/5 bg-white/2 rounded">Backpressure: <span className="text-emerald-400 font-extrabold">Throttled</span></div>
                  <div className="p-2 border border-white/5 bg-white/2 rounded">Redis Scaling: <span className="text-emerald-400 font-extrabold">Online</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* --- SECTION 4: INTENSE CREATOR MONETIZATION HUB --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-b border-white/5 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black flex items-center justify-center gap-1">
            <Volume2 size={12} /> RETAIN 100% OWNERSHIP
          </p>
          <h3 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight">
            Direct Creator Storefronts & Fan Subscriptions
          </h3>
          <p className="text-zinc-400 text-sm">
            Host Patreon-style recurrent subscription tiers directly alongside your digital stem catalogs and physical merch lines with zero secondary servers required.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          
          {/* Fan Membership Tiers - Patreon style (3 categories) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-4 bg-zinc-950 border border-white/10 rounded-2xl">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                <Users size={14} className="text-emerald-400" /> Supporter Membership Circles
              </h4>
              <p className="text-[11px] text-zinc-500 mb-4">Click to simulate joining a customized artist subscription circle.</p>
              
              <div className="space-y-3">
                {[
                  { id: 't-bronze', name: 'BRONZE MEMBER', price: '$5 / Mo', perks: ['Access exclusive audio previews', 'Standard member profile badge'] },
                  { id: 't-silver', name: 'SILVER BACKSTAGE VIP', price: '$15 / Mo', perks: ['Unlock high-fidelity raw audio STEM files', 'Interactive Listening Stage direct pass'] },
                  { id: 't-gold', name: 'GOLD CO-PRODUCER', price: '$45 / Mo', perks: ['Direct DM chat workspace to the artist', 'Exclusive heavy physical hoodie shipment', 'Premium Discord community seat'] }
                ].map((tier) => (
                  <div 
                    key={tier.id}
                    onClick={() => {
                      setActiveSupporterTier(tier.id);
                      toast.success(`Successfully simulation-subscribed to the ${tier.name}! Dashboard configured.`);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${activeSupporterTier === tier.id ? 'bg-emerald-500/10 border-emerald-500' : 'bg-black/55 border-white/5 hover:border-white/20'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-white">{tier.name}</span>
                      <span className="font-mono text-xs font-black text-emerald-400">{tier.price}</span>
                    </div>
                    <ul className="mt-2.5 space-y-1">
                      {tier.perks.map((p, i) => (
                        <li key={i} className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                          <CheckCircle2 size={10} className="text-emerald-400" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Direct Merchandise & Digital Product Storefront */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <ShoppingBag size={14} className="text-emerald-400" /> CREATOR STOREFRONT LAYOUT
              </h4>
              <span className="text-[10px] text-zinc-500">Double-click adds directly to invoice ledger</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {STORE_PRODUCTS.map((prod) => (
                <div 
                  key={prod.id}
                  className="p-5 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 bg-white/5 text-zinc-400 text-[9px] rounded font-bold uppercase tracking-wider">{prod.type}</span>
                      <span className="text-white font-extrabold text-sm">${prod.price}</span>
                    </div>
                    <h5 className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition-colors">{prod.title}</h5>
                    <p className="text-xs text-zinc-500">{prod.desc}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleAddToCart(prod)}
                    className="w-full mt-4 py-2.5 bg-zinc-900 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all"
                  >
                    Add to Cart Ledger
                  </button>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-xs text-zinc-500 flex items-center justify-between">
              <span>Supports Sample Packs, Beat Licensing contracts, & Custom stems</span>
              <span className="text-zinc-600 font-mono">Ledger updates instantly on click</span>
            </div>
          </div>
        </div>


        {/* --- AI WORKFLOW PROMOTION ASSETS ENGINE --- */}
        <div className="pt-16 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="inline-block px-3 py-1 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white rounded-lg text-xs font-black uppercase">
                AI INTEGRATION HUB
              </div>
              <h4 className="text-3xl font-black text-white uppercase tracking-tight">
                AI-Assisted Release & Promotions Architect
              </h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Provide our custom intelligence script generator tool with a simple descriptive conceptual prompt, and deploy social captions, video promotional outlines, targeted demographic brackets, and calendar schedules instantly.
              </p>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Prompt description for AI generation</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="e.g. Grungy dark synthwave, heavy compression..."
                    className="flex-1 px-4 py-3 bg-zinc-950 border border-white/10 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                  <button 
                    onClick={handleTriggerAI}
                    disabled={isGeneratingPromo}
                    className="px-6 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                  >
                    {isGeneratingPromo ? 'Generating...' : 'LAUNCH AI'}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 bg-zinc-950 border border-white/5 rounded-3xl p-8 relative min-h-[300px] flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full" />
              
              {!promoGenerated ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <Sparkles size={32} className="text-zinc-700 animate-pulse" />
                  <p className="text-zinc-400 text-sm">Calibration toolkit pending.</p>
                  <p className="text-zinc-600 text-xs">Enter a release idea to generate autogenerated promos on-the-fly.</p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold flex items-center gap-1">
                          <Copy size={10} /> AUTO SOCIAL CAPTIONS
                        </span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(generatedPromo.caption);
                            toast.success('Social caption copied to clipboard!');
                          }}
                          className="text-[9px] text-emerald-400 uppercase hover:underline"
                        >
                          Copy Caption
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-300 italic">
                        {generatedPromo.caption}
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold block">
                        AUTOMATIC VIDEO CLIP ARCHITECT
                      </span>
                      <p className="text-xs text-white leading-relaxed font-semibold">
                        {generatedPromo.creativeIdea}
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold block">
                        AUDIENCE DEMOGRAPHIC ARRAYS
                      </span>
                      <p className="text-xs text-zinc-400">
                        {generatedPromo.audience}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] text-emerald-400 flex items-center justify-between">
                    <span>Generated instantly via multi-layered model routing.</span>
                    <button 
                      onClick={() => setPromoGenerated(false)}
                      className="text-[9px] uppercase underline font-extrabold"
                    >
                      Clear Assets
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

          </div>
        </div>
      </section>


      {/* --- SECTION 5: SOCIAL LAYER MOVEMENT & LISTENING ROOMS --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-b border-white/5 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black flex items-center justify-center gap-1">
            <Users size={12} /> ENGAGEMENT REDEFINED
          </p>
          <h3 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight">
            Refocused Music-Centric Social Layer
          </h3>
          <p className="text-zinc-400 text-sm">
            Avoid messy timelines. Engage directly inside live synchronized stage Listening Rooms, complete fan loyalty missions, and participate in artist Discord-alternative Communities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-stretch">
          
          {/* Listening Stage Section */}
          <div className="lg:col-span-3 bg-zinc-950 border border-white/10 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full" />
            
            <div className="space-y-6 flex-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE listening Room: Canopy-09
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-black uppercase">
                  SYNC AUDIO ACTIVE
                </span>
              </div>

              {/* Connected sound wave area */}
              <div className="p-6 bg-[#07070a]/70 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center space-y-6">
                
                <div className="relative">
                  <div className="w-24 h-24 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center relative">
                    <Headphones size={40} className="text-emerald-400" />
                    {isRoomPlaying && (
                      <motion.div 
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                        className="absolute inset-0 border-2 border-emerald-500/40 rounded-full scale-90 border-dashed"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h5 className="font-extrabold text-white text-lg">{activeRoomTrack.title}</h5>
                  <p className="text-xs text-zinc-400 font-medium">Released by {activeRoomTrack.artist}</p>
                </div>

                {/* Synced Audio Wavelength representation */}
                <div className="flex justify-center items-end gap-1 h-12 w-full pt-2">
                  {[20, 45, 12, 60, 32, 54, 18, 50, 40, 22, 59, 12, 38, 50, 15, 45, 30, 10, 60].map((height, idx) => (
                    <motion.div 
                      key={idx}
                      animate={{
                        height: isRoomPlaying ? `${height + Math.random() * 20}%` : '15%'
                      }}
                      transition={{ repeat: Infinity, duration: 0.4, ease: 'easeInOut' }}
                      className="w-1.5 bg-emerald-400 rounded-full"
                    />
                  ))}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsRoomPlaying(prev => !prev)}
                    className="px-6 py-2.5 bg-white text-black font-extrabold uppercase text-xs tracking-wider rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-1.5"
                  >
                    {isRoomPlaying ? <Pause size={14} /> : <Play size={14} />}
                    {isRoomPlaying ? 'Simulate Mute' : 'Simulate Play Sync'}
                  </button>
                  <button 
                    onClick={() => {
                      const nextIdx = (STREAMING_TRACKS.findIndex(t => t.id === activeRoomTrack.id) + 1) % STREAMING_TRACKS.length;
                      setActiveRoomTrack(STREAMING_TRACKS[nextIdx]);
                      toast.success(`Broadcasting synced track: "${STREAMING_TRACKS[nextIdx].title}"`);
                    }}
                    className="px-4 py-2.5 bg-zinc-900 border border-white/5 text-xs text-zinc-300 font-bold uppercase rounded-xl hover:bg-zinc-800 transition-all"
                  >
                    Next Sync Track
                  </button>
                </div>
              </div>

              {/* Chat simulator inside room */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <span className="text-[10px] uppercase font-black text-zinc-600 tracking-wider">Listening Chat Stream</span>
                <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-2 scrollbar-hide text-xs">
                  {roomMessages.map((msg) => (
                    <div key={msg.id} className="p-2 bg-white/2 rounded-lg border border-white/5">
                      <strong className="text-emerald-400 font-bold font-mono">{msg.user} </strong>
                      <span className="text-zinc-300 ml-1.5">{msg.text}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendRoomMsg} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newRoomMsg}
                    onChange={(e) => setNewRoomMsg(e.target.value)}
                    placeholder="Contribute to active listening room talk..."
                    className="flex-1 px-4 py-2 bg-zinc-900 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold uppercase rounded-xl text-white transition-all"
                  >
                    BroadCast
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Gamified Fan Missions Section */}
          <div className="lg:col-span-2 flex flex-col justify-between gap-6">
            
            {/* Missions List */}
            <div className="p-8 bg-zinc-950 border border-white/10 rounded-3xl space-y-6 flex-1">
              <div className="space-y-2">
                <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1">
                  <Flame size={12} /> ENGAGEMENT CONVERGENCE
                </span>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">
                  Active Gamified Fan Missions
                </h4>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'quest-audio', name: 'Inner Circle Pioneer', detail: 'Listen to Ron Dickson’s launch reel natively for 10s.', questId: 'qa1' },
                  { id: 'quest-ticket', name: 'Neon Passage Collector', detail: 'Claim and book a ticket stream to Neon Canopy Room event.', questId: 'qa2' },
                  { id: 'quest-store', name: 'Digital Supporter Advocate', detail: 'Simulated review or checkout on the storefront items.', questId: 'qa3' }
                ].map((quest) => (
                  <div 
                    key={quest.id}
                    className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex justify-between items-center"
                  >
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-white text-xs">{quest.name}</h5>
                      <p className="text-[10px] text-zinc-500 leading-normal">{quest.detail}</p>
                    </div>
                    <button 
                      onClick={() => handleCompleteMission(quest.id, quest.name)}
                      className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all ${unlockedMissions.includes(quest.id) ? 'bg-zinc-800 text-zinc-500 cursor-default' : 'bg-pink-500 hover:bg-pink-400 text-black'}`}
                    >
                      {unlockedMissions.includes(quest.id) ? 'UNLOCKED' : 'CLAIM QUEST'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Collected Badge showcase widget */}
            <div className="p-6 bg-zinc-950 border border-white/10 rounded-3xl space-y-4">
              <span className="text-[10px] font-black uppercase text-zinc-500 block">Your Unlocked Supporters' Badges ({unlockedMissions.length})</span>
              {unlockedMissions.length === 0 ? (
                <div className="py-4 text-center border border-white/5 border-dashed rounded-2xl">
                  <p className="text-[11px] text-zinc-500 font-semibold">No badges unlocked yet.</p>
                  <p className="text-[9px] text-zinc-600 mt-0.5">Click "CLAIM QUEST" above to earn high value badges.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {unlockedMissions.includes('quest-audio') && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-extrabold">
                      🏆 INNER CIRCLE PIONEER
                    </span>
                  )}
                  {unlockedMissions.includes('quest-ticket') && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-extrabold">
                      🌌 NEON PASSAGE PASS
                    </span>
                  )}
                  {unlockedMissions.includes('quest-store') && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 text-emerald-400 rounded-xl text-[10px] font-extrabold">
                      💎 STAGE ADVOCATE
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>


      {/* --- SECTION 6: STREAMING TECHNOLOGY & POLISH CODES --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-b border-white/5 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-zinc-900 border border-white/10 text-zinc-400 rounded-full text-xs font-bold uppercase">
              HIGH FIDELITY STREAM CONTROL
            </div>
            <h3 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">
              Smart Radio, Crossfades, & Offline Caching
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Enable advanced streaming indicators like mood-based radio taste graphs, a functional seamless audio crossfade period slider, and direct chunked bitstream offline downloads persistent in local storage.
            </p>

            <div className="space-y-4 pt-4">
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 block">Seamless Audio Crossfade Interval</span>
                <div className="flex justify-between text-xs text-zinc-400 font-mono">
                  <span>Current fade boundary</span>
                  <span className="text-emerald-400 font-bold">{crossfadeSeconds} Seconds</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="12" 
                  value={crossfadeSeconds}
                  onChange={(e) => setCrossfadeSeconds(Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex justify-between items-center">
                <div>
                  <h5 className="font-extrabold text-sm text-white">Smart Taste Graph Generators</h5>
                  <p className="text-xs text-zinc-500 mt-0.5">Select high-converting mood signals to filter audio queues.</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['Aether (Chill)', 'Focus (Mono Synth)', 'Euphoria (High Energy)'].map((mood) => (
                    <button 
                      key={mood}
                      onClick={() => {
                        setSelectedMood(mood);
                        toast.success(`Taste Graph locked to specialized mood: ${mood}`);
                      }}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all ${selectedMood === mood ? 'bg-zinc-700 text-white border-emerald-500' : 'bg-[#0a0a0f] text-zinc-500 border-white/5 hover:border-white/20'}`}
                    >
                      {mood.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Offline Download Monitor & Lyric Syncing frame */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 space-y-6">
            <span className="text-xs font-black uppercase text-zinc-500 tracking-wider block">Realtime Streaming Queue Dashboard</span>
            
            <div className="space-y-3">
              {STREAMING_TRACKS.filter(t => t.mood === selectedMood || selectedMood === 'all').map((track) => (
                <div 
                  key={track.id}
                  className="p-3 bg-[#07070a]/70 border border-white/5 rounded-xl flex justify-between items-center"
                >
                  <div className="space-y-0.5">
                    <h6 className="text-xs font-extrabold text-white">{track.title}</h6>
                    <p className="text-[10px] text-zinc-500">{track.artist} • {track.mood}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {downloadProgress[track.id] !== undefined && (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">{downloadProgress[track.id]}%</span>
                    )}
                    <button 
                      onClick={() => handleDownloadTrack(track.id, track.title)}
                      className={`p-2 rounded-lg transition-all ${offlineDownloaded.includes(track.id) ? 'bg-zinc-700 text-white' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
                      title={offlineDownloaded.includes(track.id) ? 'Cached Offline' : 'Cache for Offline Enjoyment'}
                    >
                      <Download size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Synced Lyric preview frame */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <span className="text-[9px] uppercase font-black text-zinc-600 tracking-wider block">Live Lyric Flow & Spectral Text Glow</span>
              <div className="p-4 bg-black rounded-2xl border border-white/5 text-center font-bold tracking-tight">
                <p className="text-[10px] text-zinc-600 uppercase font-bold mb-2">Synchronized Lyric Timeline Indicator</p>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">Step out of the dark shadows</p>
                  <p className="text-sm text-emerald-400 animate-pulse text-glow-emerald">“Waves of sound glowing neon tonight”</p>
                  <p className="text-xs text-zinc-500">The operating system commands the light</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      
      {/* --- SECTION 7: SONICCLIPS SHORT-FORM CONTENT PREVIEWS --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-b border-white/5 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-black flex items-center justify-center gap-1">
            <Smartphone size={12} /> VIRAL REACH ENGAGEMENT
          </p>
          <h3 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight">
            SonicClips Short Vertical Previews
          </h3>
          <p className="text-zinc-400 text-sm">
            Discover independent artist vlogs, instrumentals presets, and unreleased hooks inside our responsive vertical media viewfinder.
          </p>
        </div>

        {/* Short form TikTok mock reels layout */}
        <div className="flex justify-center">
          <div className="w-full max-w-md bg-black border border-white/10 rounded-[44px] p-4 shadow-2xl relative overflow-hidden">
            
            {/* Standard phone frame bar */}
            <div className="w-full h-8 flex justify-between items-center px-6 pb-2 border-b border-white/5 text-[10px] text-zinc-500 font-mono">
              <span>9:41</span>
              <div className="w-2.5 h-2.5 bg-zinc-800 rounded-full" />
              <span>5G</span>
            </div>

            {/* Vertical Video Carousel Viewport */}
            <div className="relative aspect-[9/16] bg-zinc-950 rounded-[32px] overflow-hidden mt-4">
              <img 
                src={CLIPS_DATA[activeClipIndex].videoUrl} 
                alt={CLIPS_DATA[activeClipIndex].title}
                className="w-full h-full object-cover opacity-60 transition-all duration-300"
              />

              {/* Vertical clip absolute controllers */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between z-10 pointer-events-none">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 bg-black/60 border border-white/10 backdrop-blur-md rounded-full text-[9px] font-black uppercase text-emerald-400">
                    {CLIPS_DATA[activeClipIndex].tag}
                  </span>
                  
                  {/* Hearts counter */}
                  <div className="flex flex-col items-center gap-2 pointer-events-auto">
                    <button 
                      onClick={() => handleLikeClip(CLIPS_DATA[activeClipIndex].id)}
                      className={`p-3 rounded-full backdrop-blur-md border transition-all ${votedClips[CLIPS_DATA[activeClipIndex].id] ? 'bg-pink-500 border-pink-500 text-black' : 'bg-black/60 border-white/10 text-white hover:scale-105'}`}
                    >
                      <Heart size={18} fill={votedClips[CLIPS_DATA[activeClipIndex].id] ? 'currentColor' : 'none'} />
                    </button>
                    <span className="text-[10px] text-white font-bold font-mono">{clipHearts[CLIPS_DATA[activeClipIndex].id]}</span>
                  </div>
                </div>

                {/* Bottom text overlays inside vertical frame */}
                <div className="space-y-2 pointer-events-auto bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 rounded-b-2xl">
                  <h5 className="font-extrabold text-sm text-white">@{CLIPS_DATA[activeClipIndex].artist}</h5>
                  <h6 className="text-xs text-zinc-300 font-bold">{CLIPS_DATA[activeClipIndex].title}</h6>
                  <p className="text-[10px] text-zinc-400 leading-normal">{CLIPS_DATA[activeClipIndex].desc}</p>
                  
                  {/* Progress simulator */}
                  <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-pink-500 w-[45%]" />
                  </div>
                </div>
              </div>

              {/* Floating spin logo */}
              <div className="absolute bottom-16 right-6 w-8 h-8 rounded-full bg-black/40 border border-white/10 backdrop-blur flex items-center justify-center animate-spin z-20">
                <Headphones size={12} className="text-emerald-400" />
              </div>
            </div>

            {/* Clip sliders switcher below vertical viewport */}
            <div className="flex justify-between items-center mt-6 px-4">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Vertical Swipe controls</span>
              <div className="flex gap-2">
                {CLIPS_DATA.map((clip, i) => (
                  <button 
                    key={clip.id}
                    onClick={() => setActiveClipIndex(i)}
                    className={`w-3 h-3 rounded-full transition-all ${activeClipIndex === i ? 'bg-pink-500 scale-110' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* --- SECTION 8: SPECIALIZED CREATOR MARKETPLACE ADVERTISING --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-b border-white/5 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="text-[10px] text-amber-400 uppercase tracking-widest font-black flex items-center justify-center gap-1">
            <Grid size={12} /> COMPLETE TRANSCENDENCE
          </p>
          <h3 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight">
            Integrated Marketplace Assets
          </h3>
          <p className="text-zinc-400 text-sm">
            We cover specific high-value transaction contracts that professional creators require: sample pack royalties, producer licensing scopes, collaborate schedules, and campaign push dates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-zinc-950 border border-white/5 rounded-3xl space-y-4">
            <span className="p-2 bg-amber-500/10 text-amber-400 text-xs rounded-lg font-bold uppercase inline-block">100% Royalty Free</span>
            <h4 className="font-extrabold text-xl text-white">Sample & Vocal Stems</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Rent or purchase elite loop packages and audio waveforms complete with legally binding cryptographic ownership certificates recorded inside the creator workspace.
            </p>
          </div>

          <div className="p-8 bg-zinc-950 border border-white/5 rounded-3xl space-y-4">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg font-bold uppercase inline-block">Contract Generators</span>
            <h4 className="font-extrabold text-xl text-white">Instrumental Beat Licensing</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Automate licenses ranging from non-exclusive soundboard streaming uses up to full publishing copyright ownership models, designed to yield maximum payout splits.
            </p>
          </div>

          <div className="p-8 bg-zinc-950 border border-white/5 rounded-3xl space-y-4">
            <span className="p-2 bg-pink-500/10 text-emerald-400 text-xs rounded-lg font-bold uppercase inline-block">Booking Contracts</span>
            <h4 className="font-extrabold text-xl text-white">Interactive Collaborations</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Book mastering engineers, visual design agencies, session guitarists, or venue stage permissions with automated ledger billing tracking of escrow milestones.
            </p>
          </div>
        </div>
      </section>


      {/* --- FOOTER EXPLICIT SIGN OFF --- */}
      <footer className="py-20 px-6 max-w-7xl mx-auto text-zinc-500 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h4 className="text-white font-black uppercase tracking-tight text-lg">SonicStream</h4>
          <p className="text-xs text-zinc-600 max-w-sm">
            The comprehensive high-performance operating system designed exclusively for independent digital creators, entrepreneurs, and artists.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 text-xs">
          <p className="font-mono text-[10px] text-zinc-600">
            Calibrated securely: No unrequested client telemetry active.
          </p>
          <p className="text-zinc-700">
            © 2026 SonicStream. Built in high-performance React & Tailwind.
          </p>
        </div>
      </footer>

    </div>
  );
});

LandingPage.displayName = 'LandingPage';
