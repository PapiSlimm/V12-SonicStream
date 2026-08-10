import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { ProAsset, User } from '../../types';
import { 
  Download, 
  Layers, 
  Zap, 
  Music, 
  Video, 
  Image as ImageIcon, 
  Search,
  Filter,
  Lock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import { query, collection, where, getDocs } from 'firebase/firestore';

interface ProAssetLibraryProps {
  onUseAsset?: (asset: ProAsset) => void;
}

export const ProAssetLibrary: React.FC<ProAssetLibraryProps> = ({ onUseAsset }) => {
  const [assets, setAssets] = useState<ProAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)));
        if (!userDoc.empty) {
          setUser(userDoc.docs[0].data() as User);
        }
      }
    };

    const fetchAssets = async () => {
      try {
        const assetsData = await api.assets.getAll();
        
        if (assetsData.length === 0) {
          // Mock data if empty for demo purposes
          const mockAssets: ProAsset[] = [
            {
              id: '1',
              name: 'Cinematic Dust Overlay',
              description: 'High-quality dust and scratch overlay for a vintage film look.',
              type: 'overlay',
              category: 'Visual Effects',
              previewUrl: 'https://picsum.photos/seed/dust/400/225',
              fileUrl: '#',
              requiredTier: 'visionary',
              tags: ['film', 'vintage', 'texture'],
              createdAt: new Date().toISOString()
            },
            {
              id: '2',
              name: 'Glitch Transition Pack',
              description: '10 dynamic glitch transitions for high-energy edits.',
              type: 'transition',
              category: 'Transitions',
              previewUrl: 'https://picsum.photos/seed/glitch/400/225',
              fileUrl: '#',
              requiredTier: 'pro',
              tags: ['glitch', 'digital', 'fast'],
              createdAt: new Date().toISOString()
            },
            {
              id: '3',
              name: 'Deep Space Soundscape',
              description: 'Atmospheric background music for sci-fi or ambient projects.',
              type: 'bg_music',
              category: 'Audio',
              previewUrl: 'https://picsum.photos/seed/space/400/225',
              fileUrl: '#',
              requiredTier: 'visionary',
              tags: ['ambient', 'space', 'cinematic'],
              createdAt: new Date().toISOString()
            },
            {
              id: '4',
              name: 'Cyberpunk LUT Pack',
              description: 'Neon-inspired color grading presets for a futuristic look.',
              type: 'lut',
              category: 'Color Grading',
              previewUrl: 'https://picsum.photos/seed/cyber/400/225',
              fileUrl: '#',
              requiredTier: 'pro',
              tags: ['cyberpunk', 'neon', 'color'],
              createdAt: new Date().toISOString()
            },
            {
              id: '5',
              name: 'Impact SFX Bundle',
              description: 'Powerful cinematic impact sounds for trailers and transitions.',
              type: 'sfx',
              category: 'Audio',
              previewUrl: 'https://picsum.photos/seed/impact/400/225',
              fileUrl: '#',
              requiredTier: 'visionary',
              tags: ['impact', 'cinematic', 'sfx'],
              createdAt: new Date().toISOString()
            },
            {
              id: '6',
              name: 'Abstract Motion Backgrounds',
              description: 'Looping 4K motion graphics for live streams and visuals.',
              type: 'motion_graphic',
              category: 'Motion Graphics',
              previewUrl: 'https://picsum.photos/seed/abstract/400/225',
              fileUrl: '#',
              requiredTier: 'pro',
              tags: ['abstract', 'loop', '4k'],
              createdAt: new Date().toISOString()
            }
          ];
          setAssets(mockAssets);
        } else {
          setAssets(assetsData);
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    fetchAssets();
  }, []);

  const canAccess = (asset: ProAsset) => {
    if (!user) return false;
    if (user.userType === 'admin') return true;
    
    const tiers = ['free', 'star', 'visionary', 'pro'];
    const userTierIndex = tiers.indexOf(user.subscriptionTier || 'free');
    const requiredTierIndex = tiers.indexOf(asset.requiredTier);
    
    return userTierIndex >= requiredTierIndex;
  };

  const filteredAssets = assets.filter(asset => {
    const matchesFilter = filter === 'all' || asset.type === filter;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'overlay': return <Layers className="text-blue-400" size={18} />;
      case 'transition': return <Zap className="text-yellow-400" size={18} />;
      case 'sfx': return <Music className="text-purple-400" size={18} />;
      case 'lut': return <Video className="text-emerald-400" size={18} />;
      case 'motion_graphic': return <ImageIcon className="text-pink-400" size={18} />;
      case 'bg_music': return <Music className="text-orange-400" size={18} />;
      default: return <Sparkles className="text-zinc-400" size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center opacity-30 scale-110 blur-sm"
            style={{ backgroundImage: 'url("https://picsum.photos/seed/pro-assets/1920/1080")' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <Sparkles size={14} />
              Exclusive Creative Suite
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85]">
              Sonic <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-purple-400 to-blue-400">Pro Assets</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
              The ultimate toolkit for modern creators. Access 4K overlays, cinematic LUTs, and studio-grade sound effects instantly.
            </p>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-10">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Filter size={12} />
                Asset Categories
              </h3>
              <div className="flex flex-col gap-1">
                {['all', 'overlay', 'transition', 'sfx', 'lut', 'motion_graphic', 'bg_music'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all group ${
                      filter === t 
                      ? 'bg-white/10 text-white border border-white/10 shadow-lg' 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {getTypeIcon(t)}
                      {t.replace('_', ' ')}
                    </span>
                    {filter === t && <motion.div layoutId="active-filter" className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[32px] space-y-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Zap className="text-emerald-400" size={20} />
              </div>
              <h4 className="font-bold text-sm">Instant Sync</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                All downloaded assets are automatically synced to your SonicAI Studio cloud storage.
              </p>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-12">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="relative w-full group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search 5,000+ professional assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-[32px] py-5 pl-16 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-video bg-zinc-900 rounded-[40px] animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <AnimatePresence mode="popLayout">
                    {filteredAssets.map((asset) => {
                      const accessible = canAccess(asset);
                      return (
                        <motion.div
                          key={asset.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="group relative bg-zinc-900/30 border border-white/5 rounded-[40px] overflow-hidden hover:border-emerald-500/30 transition-all hover:shadow-[0_32px_64px_rgba(0,0,0,0.6)]"
                        >
                          <div className="aspect-video relative overflow-hidden">
                            <img 
                              src={asset.previewUrl} 
                              alt={asset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                            
                            <div className="absolute top-6 left-6">
                              <div className="px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3">
                                {getTypeIcon(asset.type)}
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{asset.type.replace('_', ' ')}</span>
                              </div>
                            </div>
 
                            {!accessible && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center">
                                <div className="text-center space-y-4 p-8">
                                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                                    <Lock className="text-zinc-500" size={24} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-white mb-1">Premium Asset</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Requires {asset.requiredTier} Tier</p>
                                  </div>
                                  <button className="px-6 py-3 bg-white text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all">
                                    Upgrade Now
                                  </button>
                                </div>
                              </div>
                            )}
 
                            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                              <div className="space-y-1">
                                <h3 className="text-2xl font-black tracking-tight text-white">{asset.name}</h3>
                                <div className="flex gap-2">
                                  {asset.tags.map(tag => (
                                    <span key={tag} className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">#{tag}</span>
                                  ))}
                                </div>
                              </div>
                              {accessible && (
                                <div className="flex gap-2">
                                  {onUseAsset && (
                                    <button 
                                      onClick={() => onUseAsset(asset)}
                                      className="px-6 py-3 bg-white text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl"
                                    >
                                      Use in Editor
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => window.open(asset.fileUrl, '_blank')}
                                    className="w-14 h-14 bg-zinc-700 text-white rounded-2xl flex items-center justify-center hover:bg-zinc-600 transition-all transform hover:scale-110 shadow-xl shadow-black/20"
                                  >
                                    <Download size={24} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {filteredAssets.length === 0 && (
                  <div className="text-center py-24">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="text-zinc-600" size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No assets found</h3>
                    <p className="text-zinc-500">Try adjusting your search or filter to find what you're looking for.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <section className="mt-24 p-12 bg-gradient-to-br from-emerald-500/10 to-purple-500/10 rounded-[40px] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-4">Unlock the Full Creative Suite</h2>
            <p className="text-zinc-400 mb-8 text-lg">
              Upgrade to <span className="text-emerald-400 font-bold">Sonic Pro</span> for unlimited access to our entire library of 4K motion graphics, premium LUTs, and exclusive sound effects.
            </p>
            <button className="px-8 py-4 bg-white text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all transform hover:-translate-y-1 shadow-2xl">
              View Subscription Plans
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
