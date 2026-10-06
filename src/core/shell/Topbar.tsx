import { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Sparkles, 
  User, 
  Settings, 
  LogOut,
  Grid,
  ChevronDown,
  Layout,
  ShoppingCart,
  Headphones,
  Calendar,
  TrendingUp,
  Radio,
  Newspaper,
  Users,
  Music,
  Compass,
  Video
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOverlayStore } from '../state/overlay.store';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export const Topbar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const { user, logout } = useAuth();
  const { setNotificationsOpen } = useOverlayStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showServicesMenu, setShowServicesMenu] = useState(false);

  const isPro = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'visionary';

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Define SonicStream's services
  const services = [
    { name: 'Live Broadcast', description: 'Omnicast to social sites', path: '/live-stream', icon: Video, color: 'text-rose-400' },
    { name: 'Discover', description: 'Explore premium music', path: '/', icon: Compass, color: 'text-indigo-400' },
    { name: 'Smart Feed', description: 'Personalized stream feed', path: '/feed', icon: Sparkles, color: 'text-yellow-400' },
    { name: 'AI Studio', description: 'AI mastering & isolation', path: '/ai', icon: Sparkles, color: 'text-emerald-400' },
    { name: 'Site Builder', description: 'Build your artist website', path: '/builder', icon: Layout, color: 'text-pink-400' },
    { name: 'Marketplace', description: 'Buy & sell music merchandise', path: '/marketplace', icon: ShoppingCart, color: 'text-purple-400' },
    { name: 'Bookings', description: 'Host gigs & ticket sales', path: '/bookings', icon: Calendar, color: 'text-blue-400' },
    { name: 'SonicRooms', description: 'Interactive chat rooms', path: '/rooms', icon: Headphones, color: 'text-cyan-400' },
    { name: 'Radio Hub', description: 'Continuous broadcast stream', path: '/radio', icon: Radio, color: 'text-amber-400' },
    { name: 'Growth Tools', description: 'Promote with Smart Links', path: '/growth', icon: TrendingUp, color: 'text-green-400' },
    { name: 'News Wall', description: 'Industry news & updates', path: '/news', icon: Newspaper, color: 'text-orange-400' },
    { name: 'Affiliates', description: 'Refer artists and earn', path: '/affiliate', icon: Users, color: 'text-red-400' },
    { name: 'Playlists', description: 'Your custom playlist catalogs', path: '/playlists', icon: Music, color: 'text-teal-400' },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b border-white/5 bg-black/20 px-8 py-4">
      <div className="flex items-center justify-between gap-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search for artists, tracks, or events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all text-white placeholder:text-zinc-600"
          />
        </form>

        {/* Services Quick Links */}
        <div className="hidden xl:flex items-center gap-6 text-sm font-semibold text-zinc-400 shrink-0">
          <Link to="/ai" className="hover:text-emerald-400 hover:scale-105 transition-all flex items-center gap-1.5 py-1">
            <Sparkles size={14} className="text-emerald-400" />
            AI Studio
          </Link>
          <Link to="/marketplace" className="hover:text-purple-400 hover:scale-105 transition-all flex items-center gap-1.5 py-1">
            <ShoppingCart size={14} className="text-purple-400" />
            Marketplace
          </Link>
          <Link to="/builder" className="hover:text-pink-400 hover:scale-105 transition-all flex items-center gap-1.5 py-1">
            <Layout size={14} className="text-pink-400" />
            Site Builder
          </Link>
          <Link to="/bookings" className="hover:text-blue-400 hover:scale-105 transition-all flex items-center gap-1.5 py-1">
            <Calendar size={14} className="text-blue-400" />
            Bookings
          </Link>
        </div>

        {/* All Services Dropdown Trigger */}
        <div className="relative shrink-0">
          <button 
            onClick={() => setShowServicesMenu(!showServicesMenu)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all text-sm font-semibold text-white ${
              showServicesMenu 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <Grid size={16} />
            <span>Services</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${showServicesMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showServicesMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowServicesMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-[320px] md:w-[480px] bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50 p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">SonicStream Services</h3>
                    <p className="text-xs text-zinc-500 mt-1">Quickly select any service platform to launch</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                    {services.map((srv) => {
                      const IconComponent = srv.icon;
                      return (
                        <Link
                          key={srv.name}
                          to={srv.path}
                          onClick={() => setShowServicesMenu(false)}
                          className="flex items-start gap-3 p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                        >
                          <div className={`p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors ${srv.color}`}>
                            <IconComponent size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{srv.name}</p>
                            <p className="text-[11px] text-zinc-500 line-clamp-1 leading-relaxed mt-0.5">{srv.description}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-6">
          {isPro && (
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10">
              <Sparkles size={12} className="animate-pulse" />
              Pro Member
            </div>
          )}

          <button 
            onClick={() => setNotificationsOpen(true)}
            className="relative p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
          >
            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-black" />
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500 uppercase">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-64 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5 bg-white/5">
                      <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate uppercase tracking-widest font-black">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
                        <User size={18} />
                        <span className="text-sm font-medium">Profile</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
                        <Settings size={18} />
                        <span className="text-sm font-medium">Settings</span>
                      </button>
                      <div className="my-2 border-t border-white/5" />
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/5 transition-all"
                      >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
