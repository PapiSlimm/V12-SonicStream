import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Link } from 'react-router-dom';
import { 
  Video,
  Users,
  Package,
  Zap,
  ArrowRight,
  Play,
  Music,
  ShoppingBag,
  Truck,
  Calendar,
  Copy,
  Globe,
  Code
} from 'lucide-react';
import { Product, Track, Venue } from '../../types';
import { api } from '../../api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { Filters } from './components/Filters';
import { SearchBar } from './components/SearchBar';
import { QuickViewModal } from './components/QuickViewModal';
import { TrackCard } from '../../components/music/TrackCard';
import { useTrack } from '../../context/TrackContext';
import { 
  BeatLab, 
  ServicesHub, 
  TicketsCenter, 
  AffiliateCenter, 
  AiCreatorSuite, 
  MarketplaceAnalytics, 
  DeveloperApiPanel 
} from './components/CreatorMarketplaceViews';

type FilterType = 'all' | 'digital_download' | 'webinar' | 'membership' | 'physical_good' | 'ticket';

const Marketplace = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  
  const { items, addToCart, itemCount } = useCart();
  const { playTrack } = useTrack();
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [activeSegment, setActiveSegment] = useState<'all' | 'merch' | 'streaming' | 'bookings'>('all');
  const [marketplaceTab, setMarketplaceTab] = useState<'store' | 'beats' | 'services' | 'tickets' | 'affiliate' | 'ai' | 'analytics' | 'api'>('store');
  
  // Selling merchandise states
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellName, setSellName] = useState('');
  const [sellDesc, setSellDesc] = useState('');
  const [sellBrand, setSellBrand] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellType, setSellType] = useState<FilterType>('physical_good');
  const [sellImage, setSellImage] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);

  const handleSellProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to list a product');
      return;
    }
    if (!sellName || !sellPrice) {
      toast.error('Please enter a product name and price');
      return;
    }

    const priceNum = parseFloat(sellPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please specify a valid positive price');
      return;
    }

    setSubmittingProduct(true);
    const toastId = toast.loading('Listing product and broadcasting to News Wall...');
    try {
      const imageUrl = sellImage || `https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80`;
      
      // 1. Create product in Firebase Firestore (makes it live on Marketplace)
      const result = await api.commerce.products.create({
        name: sellName,
        description: sellDesc,
        brandName: sellBrand || user.name || 'Sonic Artist',
        price: priceNum,
        type: sellType as any,
        imageUrl: imageUrl,
        stock: 100
      });

      if (result.success) {
        // 2. Cross-post to News Wall (rss_feeds table) & Social feed (posts table)
        await api.rss.postProduct({
          title: sellName,
          content: sellDesc,
          price: priceNum,
          productLink: `/marketplace`,
          mediaUrl: imageUrl
        });

        toast.success('Listed in Marketplace & broadcast to News Wall + Feed!', { id: toastId });
        setShowSellModal(false);
        setSellName('');
        setSellDesc('');
        setSellBrand('');
        setSellPrice('');
        setSellImage('');

        // Refresh products list
        const productList = await api.commerce.products.getAll();
        setProducts(productList);
      } else {
        toast.error('Failed to create product listing', { id: toastId });
      }
    } catch (err) {
      console.error('Error listing product', err);
      toast.error('Failed to register product or cross-post', { id: toastId });
    } finally {
      setSubmittingProduct(false);
    }
  };

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('v12_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('v12_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productList, trackList, venueList] = await Promise.all([
          api.commerce.products.getAll(),
          api.tracks.getAll(),
          api.venues.getAll()
        ]);
        setProducts(productList);
        setTracks(trackList as Track[]);
        setVenues(venueList);
      } catch (err) {
        console.error('Failed to fetch marketplace data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesFilter = filter === 'all' || p.type === filter;
      const matchesSearch = p.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()) || 
                           (p.description || '').toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
                           p.brandName?.toLowerCase().includes(deferredSearchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [products, filter, deferredSearchQuery]);

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'webinar': return <Video className="text-blue-400" size={20} />;
      case 'membership': return <Users className="text-purple-400" size={20} />;
      case 'digital_download': return <Music className="text-emerald-400" size={20} />;
      case 'physical_good': return <Package className="text-orange-400" size={20} />;
      case 'ticket': return <Calendar className="text-pink-400" size={20} />;
      default: return <Zap className="text-zinc-400" size={20} />;
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    const toastId = toast.loading('Preparing checkout...');
    try {
      const { url } = await api.commerce.products.createCheckoutSession(
        items.map(i => ({ productId: i.id, quantity: i.quantity }))
      );
      window.location.href = url;
    } catch {
      toast.error('Checkout failed. Please try again.', { id: toastId });
    }
  };

  const toggleWishlist = (id: string) => {
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    toast.success(wishlist.includes(id) ? 'Removed from wishlist' : 'Added to wishlist');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500" />
      <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Syncing Global Inventory...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 font-sans">
      {/* TIER & SERVICES EMPHASIS BAR — every buyer is a potential earner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-emerald-950/60 border-b border-emerald-500/20 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Make Money Here</span>
          <Link to="/pricing" className="text-xs font-bold text-white hover:text-emerald-400 transition-colors">
            Pro Tier: 80/20 splits + instant payouts →
          </Link>
          <Link to="/dashboard" className="text-xs font-bold text-zinc-300 hover:text-white transition-colors">
            Sell your products · 0 listing fees
          </Link>
          <Link to="/affiliate" className="text-xs font-bold text-zinc-300 hover:text-white transition-colors">
            Earn commission as an affiliate
          </Link>
          <Link to="/bookings" className="text-xs font-bold text-zinc-300 hover:text-white transition-colors">
            Get booked for events
          </Link>
        </div>
      </div>

      {/* 
        HERO LANDING (Requested Segmented UI) 
      */}
      <div className="relative pt-20 pb-40 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black to-emerald-900/40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/10 blur-[160px] opacity-20" />
        
        <div className="relative z-10 max-w-7xl mx-auto text-center space-y-12">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            <Zap size={14} className="text-emerald-400" />
            Unified Creator Marketplace
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-[0.85]">
            Everything for the
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Independent Artist.
            </span>
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
            From HLS streaming to global print-on-demand and real-time gig bookings. 
            The only marketplace built on AI-powered distribution.
          </p>

          {/* Feature Categories (Pillars from Request) */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-16">
            {[
              { id: 'streaming', title: 'Music & HLS', desc: 'DASH/HLS + 3D Players', icon: Music, color: 'emerald', tab: 'beats' },
              { id: 'merch', title: 'Print-on-Demand', desc: 'Global POD Fulfillment', icon: Truck, color: 'blue', tab: 'store' },
              { id: 'bookings', title: 'Gig Bookings', desc: 'Secure Venue Marketplace', icon: Calendar, color: 'purple', tab: 'services' }
            ].map((pillar) => (
              <button
                key={pillar.id}
                onClick={() => {
                  setActiveSegment(pillar.id as any);
                  setMarketplaceTab(pillar.tab as any);
                }}
                className={`group relative p-8 rounded-[40px] border transition-all text-left space-y-6 ${
                  activeSegment === pillar.id 
                    ? `bg-${pillar.color}-500/10 border-${pillar.color}-500/50` 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-14 h-14 bg-${pillar.color}-500 text-black rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <pillar.icon size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">{pillar.title}</h3>
                  <p className="text-zinc-500 font-medium">{pillar.desc}</p>
                </div>
                <div className="absolute bottom-8 right-8 opacity-20 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={24} className="text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 
        MAIN CONTENT AREAS 
      */}
      <div className="max-w-7xl mx-auto px-6 space-y-16 -mt-24 relative z-20 pb-32">
        
        {/* SUB-MARKETPLACES TAB SELECTOR (PHASES 1-14) */}
        <div className="overflow-x-auto pb-4 scrollbar-none">
          <div className="flex gap-2.5 bg-zinc-900/80 backdrop-blur-3xl p-3.5 rounded-[32px] border border-white/5 shadow-2x min-w-max">
            {[
              { id: 'store', name: 'Featured Drops', desc: 'Merchandise & Goods' },
              { id: 'beats', name: 'Beats Lab', desc: 'BPM, Key Licensing' },
              { id: 'services', name: 'Services Hub', desc: 'Escrow & Freelance' },
              { id: 'tickets', name: 'QR Tickets', desc: 'Event Checked-In' },
              { id: 'affiliate', name: 'Affiliate Portal', desc: 'Referral ledger' },
              { id: 'ai', name: 'AI Suite', desc: 'SEO Copilot Suite' },
              { id: 'analytics', name: 'Stats & Fraud', desc: 'Anti-bot funnels' },
              { id: 'api', name: 'Developers API', desc: 'External Gateway' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMarketplaceTab(tab.id as any)}
                className={`flex flex-col items-start px-7 py-3 rounded-2xl transition-all font-sans relative shrink-0 text-left ${
                  marketplaceTab === tab.id 
                    ? 'bg-zinc-700 text-white shadow-lg shadow-black/10' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-[11px] font-black uppercase tracking-wider">{tab.name}</span>
                <span className={`text-[8px] font-semibold mt-0.5 uppercase ${marketplaceTab === tab.id ? 'text-black/60' : 'text-zinc-500'}`}>{tab.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {marketplaceTab === 'store' && (
          <div className="space-y-32">
            {/* SHOP TOOLBAR */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-zinc-900/60 backdrop-blur-3xl p-8 rounded-[40px] border border-white/5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Inventory</h2>
                <div className="h-8 w-px bg-white/10 hidden sm:block" />
                <Filters activeFilter={filter} onFilterChange={setFilter} />
                <button
                  id="sell-product-btn"
                  onClick={() => setShowSellModal(true)}
                  className="px-6 py-2.5 bg-zinc-700 font-bold hover:bg-zinc-600 text-white rounded-full text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 self-start sm:self-auto active:scale-95 duration-150 cursor-pointer"
                >
                  <Package size={14} />
                  Sell Product
                </button>
              </div>
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery} 
                itemCount={itemCount} 
                onOpenCart={() => setShowCart(true)} 
              />
            </div>

            {/* PRODUCTS GRID */}
            <section className="space-y-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Featured Drops</h2>
                </div>
                <div className="hidden md:flex gap-2">
                  <span className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase text-zinc-500">Live Items: {filteredProducts.length}</span>
                  <span className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase text-zinc-500">Global Sellers: 42</span>
                </div>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredProducts.map(product => (
                    <ProductCard 
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      onQuickView={setSelectedProduct}
                      isWishlisted={wishlist.includes(product.id)}
                      onToggleWishlist={toggleWishlist}
                      getProductIcon={getProductIcon}
                      onShare={setShareProduct}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 bg-zinc-950/50 rounded-[40px] border border-dashed border-white/10">
                  <Package size={48} className="text-zinc-800" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">No products match your criteria</h3>
                    <p className="text-zinc-500">Try exploring other categories or clearing your search.</p>
                  </div>
                  <button 
                    onClick={() => { setFilter('all'); setSearchQuery(''); setActiveSegment('all'); }}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/5"
                  >
                    Reset Marketplace
                  </button>
                </div>
              )}
            </section>

            {/* TRENDING TRACKS (Streaming Segment) */}
            <section className="bg-zinc-900/40 rounded-[60px] p-12 border border-white/5 space-y-12">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                    <Play size={12} fill="currentColor" />
                    DASH / HLS Streaming Store
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Viral Recordings</h2>
                </div>
                <button className="px-8 py-4 bg-white/5 hover:bg-zinc-700 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all">
                  Launch Player
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {tracks.slice(0, 8).map((track, i) => (
                  <TrackCard 
                    key={track.id} 
                    track={track} 
                    index={i} 
                    onPlay={(t) => playTrack(t)}
                    onBuy={(t) => toast.success(`Buying ${t.title}...`)}
                  />
                ))}
              </div>
            </section>

            {/* PRINT ON DEMAND HIGHLIGHT */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-900 rounded-[50px] p-12 text-white flex flex-col justify-between min-h-[500px] overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400 blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="space-y-8 relative z-10">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <Truck size={32} />
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase leading-tight">
                    Your Merch.<br />Global Delivery.
                  </h2>
                  <p className="text-blue-100 text-lg font-medium max-w-sm">
                    Connect your Print-On-Demand account and sell high-quality hoodies, tees, and more directly to your fans.
                  </p>
                </div>
                <button className="relative z-10 self-start px-10 py-5 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all">
                  Manage Collection
                </button>
                <div className="absolute bottom-0 right-0 p-12 translate-x-12 translate-y-12 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Package size={300} />
                </div>
              </div>

              <div className="bg-zinc-900 border border-white/5 rounded-[50px] p-12 flex flex-col justify-between min-h-[500px]">
                <div className="space-y-8">
                  <div className="w-16 h-16 bg-zinc-700 text-white rounded-2xl flex items-center justify-center">
                    <Calendar size={32} />
                  </div>
                  <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-tight">
                    Secure Your<br /><span className="text-emerald-500">Next Gig.</span>
                  </h2>
                  <p className="text-zinc-500 text-lg font-medium max-w-sm">
                    Browse verified venues and book performances with integrated technical riders and escrow payments.
                  </p>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Active Opportunities:</p>
                  <div className="flex -space-x-4">
                    {[1, 2, 3, 4].map(i => (
                      <img key={i} className="w-12 h-12 rounded-full border-4 border-black object-cover" src={`https://picsum.photos/seed/venue${i}/100/100`} alt="" />
                    ))}
                    <div className="w-12 h-12 rounded-full border-4 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500">+12</div>
                  </div>
                  <button 
                    onClick={() => window.location.href='/bookings'}
                    className="w-full py-5 bg-white/5 hover:bg-zinc-700 hover:text-white border border-white/5 rounded-2xl font-black uppercase tracking-widest text-white transition-all mt-4"
                  >
                    Search Venues
                  </button>
                </div>
              </div>
            </div>

            {/* SHOPPABLE LIVESTREAMS (AI GROUNDED) */}
            <div className="space-y-12 px-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                    Live Social Commerce
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Shop The Stream</h2>
                </div>
                <button className="text-emerald-500 font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:gap-3 transition-all underline underline-offset-8">
                  Explore Live Drops
                  <ArrowRight size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[1, 2, 3].map(i => (
                  <div key={i} className="group cursor-pointer space-y-6">
                    <div className="relative aspect-video rounded-[40px] overflow-hidden border border-white/5">
                      <img 
                        src={`https://picsum.photos/seed/live${i}/800/450`} 
                        alt="Stream" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
                          <Play size={24} fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute top-6 left-6 flex gap-3">
                        <div className="px-4 py-1.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          Live
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 px-4">
                      <h4 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">V12 Studio Drop #{i}</h4>
                      <div className="flex items-center justify-between">
                        <p className="text-zinc-500 text-sm font-medium">Official V12 Soundware</p>
                        <div className="flex items-center gap-2 text-zinc-600 text-xs font-bold uppercase tracking-widest">
                           <Users size={14} /> 1.{i}k watching
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {marketplaceTab === 'beats' && (
          <div className="py-6">
            <BeatLab onAddToCart={addToCart} currentUser={user} />
          </div>
        )}

        {marketplaceTab === 'services' && (
          <div className="py-6">
            <ServicesHub onAddToCart={addToCart} currentUser={user} />
          </div>
        )}

        {marketplaceTab === 'tickets' && (
          <div className="py-6">
            <TicketsCenter onAddToCart={addToCart} currentUser={user} />
          </div>
        )}

        {marketplaceTab === 'affiliate' && (
          <div className="py-6">
            <AffiliateCenter onAddToCart={addToCart} currentUser={user} />
          </div>
        )}

        {marketplaceTab === 'ai' && (
          <div className="py-6">
            <AiCreatorSuite onAddToCart={addToCart} currentUser={user} />
          </div>
        )}

        {marketplaceTab === 'analytics' && (
          <div className="py-6">
            <MarketplaceAnalytics onAddToCart={addToCart} currentUser={user} />
          </div>
        )}

        {marketplaceTab === 'api' && (
          <div className="py-6">
            <DeveloperApiPanel onAddToCart={addToCart} currentUser={user} />
          </div>
        )}
      </div>

      {/* OVERLAYS */}
      <CartDrawer 
        isOpen={showCart} 
        onClose={() => setShowCart(false)} 
        onCheckout={handleCheckout} 
      />
      
      <QuickViewModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onAddToCart={addToCart}
        getProductIcon={getProductIcon}
      />

      {/* SELL PRODUCT MODAL */}
      <AnimatePresence>
        {showSellModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] overflow-y-auto"
          >
            <div className="flex items-center justify-center min-h-screen p-6">
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="relative bg-zinc-900 border border-white/5 rounded-[40px] p-8 md:p-12 w-full max-w-xl space-y-8 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Launch a Listing</span>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Sell New Merchandise</h3>
                  </div>
                  <button 
                    onClick={() => setShowSellModal(false)}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSellProduct} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Product Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. V12 Signature Organic Hoodie"
                      value={sellName}
                      onChange={(e) => setSellName(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white placeholder-zinc-600 text-sm focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description</label>
                    <textarea 
                      placeholder="Specify materials, fits, and features of your premium merch drop."
                      rows={3}
                      value={sellDesc}
                      onChange={(e) => setSellDesc(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white placeholder-zinc-600 text-sm focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Price (USD) *</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        placeholder="45.00"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white placeholder-zinc-600 text-sm focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Brand Name</label>
                      <input 
                        type="text" 
                        placeholder="Default Artist Name"
                        value={sellBrand}
                        onChange={(e) => setSellBrand(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white placeholder-zinc-600 text-sm focus:border-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Product Type</label>
                    <select 
                      value={sellType}
                      onChange={(e) => setSellType(e.target.value as FilterType)}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-emerald-500 focus:outline-none transition-all"
                    >
                      <option value="physical_good">Physical Merchandise (Hoodie, Tee, Vinyl)</option>
                      <option value="digital_download">Digital Download (Stem Pack, Mastering Preset)</option>
                      <option value="membership">Fanbase VIP Membership</option>
                      <option value="ticket">Concert / Event Entry Ticket</option>
                      <option value="webinar">Live Interactive Stream / Webinar</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Custom Image URL (Optional)</label>
                    <input 
                      type="url" 
                      placeholder="e.g. https://images.unsplash.com/..."
                      value={sellImage}
                      onChange={(e) => setSellImage(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white placeholder-zinc-600 text-sm focus:border-emerald-500 focus:outline-none transition-all"
                    />
                    <p className="text-[9px] text-zinc-500 font-medium">Leave blank to automagically assign an elegant lifestyle photography placeholder.</p>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowSellModal(false)}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all border border-white/5"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submittingProduct}
                      className="flex-1 py-4 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {submittingProduct ? 'Broadcasting...' : 'Publish Listing'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHARE & EMBED MODAL */}
      <AnimatePresence>
        {shareProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] overflow-y-auto"
          >
            <div className="flex items-center justify-center min-h-screen p-6">
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="relative bg-zinc-900 border border-white/5 rounded-[40px] p-8 md:p-12 w-full max-w-2xl space-y-8 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Share Center</span>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Share & Embed Product</h3>
                  </div>
                  <button 
                    onClick={() => setShareProduct(null)}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                  {/* Left Column: Product info */}
                  <div className="space-y-4 bg-black/30 p-6 rounded-[32px] border border-white/5">
                    <div className="aspect-square bg-zinc-800 rounded-2xl overflow-hidden relative">
                      <img 
                        src={shareProduct.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'} 
                        alt={shareProduct.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md border border-white/10 text-white rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest">
                        {shareProduct.type.replace('_', ' ')}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white">{shareProduct.name}</h4>
                      <p className="text-xs text-zinc-400">by {shareProduct.brandName || 'Sonic Artist'}</p>
                      <p className="text-sm font-bold text-emerald-400 mt-1">${shareProduct.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Right Column: Top 10 Social sharing */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Syndicate to Top 10 Social Networks</h4>
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { name: 'X / Twitter', url: `https://twitter.com/intent/tweet?text=Check out ${encodeURIComponent(shareProduct.name)} by ${encodeURIComponent(shareProduct.brandName || 'Sonic Artist')} on @SonicStream! Only $${shareProduct.price} ${encodeURIComponent(window.location.origin + '/marketplace')}`, color: 'bg-zinc-950 border-white/20 text-white', icon: '𝕏' },
                          { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/marketplace')}`, color: 'bg-blue-600/20 border-blue-500/30 text-blue-400', icon: 'FB' },
                          { name: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/marketplace')}`, color: 'bg-cyan-600/20 border-cyan-500/30 text-cyan-400', icon: 'LN' },
                          { name: 'Reddit', url: `https://www.reddit.com/submit?url=${encodeURIComponent(window.location.origin + '/marketplace')}&title=${encodeURIComponent('Cozy drop on SonicStream!')}`, color: 'bg-orange-600/20 border-orange-500/30 text-orange-400', icon: 'RD' },
                          { name: 'Pinterest', url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.origin + '/marketplace')}&media=${encodeURIComponent(shareProduct.imageUrl || '')}&description=${encodeURIComponent(shareProduct.name)}`, color: 'bg-red-600/20 border-red-500/30 text-red-500', icon: 'PT' },
                          { name: 'WhatsApp', url: `https://api.whatsapp.com/send?text=${encodeURIComponent('Check this out: ' + shareProduct.name + ' ' + window.location.origin + '/marketplace')}`, color: 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400', icon: 'WA' },
                          { name: 'Telegram', url: `https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/marketplace')}&text=${encodeURIComponent(shareProduct.name)}`, color: 'bg-sky-600/20 border-sky-500/30 text-sky-400', icon: 'TG' },
                          { name: 'Threads', url: `https://threads.net/intent/post?text=${encodeURIComponent('Fresh listing: ' + shareProduct.name + ' on SonicStream!')}`, color: 'bg-purple-600/20 border-purple-500/30 text-purple-400', icon: 'TH' },
                          { name: 'TikTok', url: '#', color: 'bg-pink-600/10 border-pink-500/20 text-pink-400', icon: 'TT', info: 'Copy link to paste in your TikTok link-in-bio!' },
                          { name: 'Instagram', url: '#', color: 'bg-amber-600/10 border-amber-500/20 text-amber-400', icon: 'IG', info: 'Add this checkout link to your Instagram Story!' }
                        ].map(soc => (
                          <a
                            key={soc.name}
                            href={soc.url === '#' ? undefined : soc.url}
                            target={soc.url === '#' ? undefined : '_blank'}
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (soc.url === '#') {
                                e.preventDefault();
                                navigator.clipboard.writeText(window.location.origin + `/marketplace`);
                                toast.success(`${soc.name} Share: Link copied! ${soc.info}`);
                              } else {
                                toast.success(`Sharing on ${soc.name}...`);
                              }
                            }}
                            className={`h-11 rounded-full border flex flex-col items-center justify-center font-black text-xs transition-all hover:scale-105 cursor-pointer ${soc.color}`}
                            title={soc.name}
                          >
                            <span>{soc.icon}</span>
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                          <Code size={14} className="text-emerald-400" />
                          Independent Web Embed IFrame
                        </label>
                        <button
                          onClick={() => {
                            const embedCode = `<iframe src="${window.location.origin}/marketplace" width="100%" height="600" style="border:none;border-radius:32px;background:#09090b" allow="autoplay; clipboard-write; encrypted-media"></iframe>`;
                            navigator.clipboard.writeText(embedCode);
                            toast.success("Embed tag block copied successfully!");
                          }}
                          className="text-[9px] font-black uppercase text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Copy size={12} />
                          Copy Widget Code
                        </button>
                      </div>
                      <textarea
                        readOnly
                        rows={3}
                        value={`<iframe src="${window.location.origin}/marketplace" width="100%" height="600" style="border:none;border-radius:32px;background:#09090b" allow="autoplay; clipboard-write; encrypted-media"></iframe>`}
                        className="w-full bg-black font-mono text-[10px] text-zinc-500 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-zinc-800 transition-all select-all resize-none"
                      />
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-[10px] text-zinc-400 leading-relaxed font-medium">
                        📣 <strong className="text-white">Pro Seller Tip:</strong> Simply paste this responsive IFrame code directly inside your WordPress, Squarespace, Webflow, Shopify, or custom static HTML layout. Customers can purchase your products natively from anywhere on the web.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Share checkout link</span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + `/marketplace`);
                      toast.success("Secure direct product link copied!");
                    }}
                    className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-black uppercase tracking-wider text-[10px] rounded-full transition-all"
                  >
                    Copy Direct Link
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIXED CHECKOUT BAR (MOBILE) */}
      <AnimatePresence>
        {itemCount > 0 && !showCart && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-6"
          >
            <button 
              onClick={() => setShowCart(true)}
              className="w-full bg-zinc-700 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 hover:scale-105 transition-all"
            >
              <ShoppingBag size={20} />
              Checkout ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketplace;
