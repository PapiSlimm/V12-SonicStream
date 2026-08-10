import React from 'react';
import { Search, Bell, Sparkles } from 'lucide-react';
import { SoundwaveAnimation } from './SoundwaveAnimation';
import { SoundboardParticles } from './SoundboardParticles';
import { useAuth } from '../../context/AuthContext';

export const SonicStreamLayout = ({ children, onSearch, initialQuery = '' }: { children: React.ReactNode, onSearch?: (query: string) => void, initialQuery?: string }) => {
  const [query, setQuery] = React.useState(initialQuery);
  const { user } = useAuth();

  const isPro = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'visionary';

  React.useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(query);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-black via-zinc-900 to-black">
      {/* Live Concert Background (Full Screen) */}
      <div className="fixed inset-0 z-0">
        {/* Using a placeholder image since local video might not exist */}
        <div 
          className="w-full h-full bg-cover bg-center opacity-40 brightness-50 contrast-125"
          style={{ backgroundImage: 'url("https://picsum.photos/seed/concert/1920/1080")' }}
        >
          {/* In a real app, this would be a video element */}
          {/* <video 
            autoPlay 
            muted 
            loop 
            playsInline 
            className="w-full h-full object-cover"
            poster="https://picsum.photos/seed/concert/1920/1080"
          >
            <source src="/videos/live-concert-4k.mp4" type="video/mp4" />
          </video> */}
        </div>
        
        {/* Animated Soundwave Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-purple-500/5 to-blue-500/10">
          <SoundwaveAnimation />
        </div>
        
        {/* Soundboard Particles */}
        <SoundboardParticles />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10">
        <div className="sticky top-0 z-50">
          <div className="max-w-7xl mx-auto">
            <header className="backdrop-blur-xl border border-white/5 bg-black/10 rounded-2xl mx-4 mt-4 px-6 py-4">
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center font-black text-white">S</div>
                  <span className="font-black uppercase tracking-tighter text-xl">SonicStream</span>
                </div>
                <nav className="hidden lg:flex items-center gap-6">
                  <a href="/search" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Search</a>
                  <a href="/marketplace" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Marketplace</a>
                  <a href="/manual" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Manual</a>
                  <a href="/radio" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Radio</a>
                </nav>
                <div className="flex-1 max-w-xl relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search for artists, tracks, or events..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all"
                  />
                </div>
                <div className="flex items-center gap-4">
                  {isPro && (
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      <Sparkles size={12} />
                      Pro
                    </div>
                  )}
                  <button className="text-zinc-400 hover:text-white transition-colors"><Bell size={20} /></button>
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500 uppercase">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>
          </div>
        </div>
        <div className="backdrop-blur-xl bg-black/40 min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
};
