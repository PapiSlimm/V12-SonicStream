import { useState, useEffect } from 'react';
import { Music, Play, Pause, MoreVertical, RefreshCw, Radio, SkipBack, SkipForward, Volume2, Heart, Share2, Star, Plus, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track } from '../../types';
import { cn } from '../../utils/cn';
import { useTrack } from '../../context/TrackContext';
import { MusicStreamVisualizer } from '../../components/Player/MusicStreamVisualizer';
import { useAuth } from '../../context/AuthContext';
import { useArtists, useTracks } from '../../hooks/useApi';
import { soundEngine } from '../../services/soundEngine';
import { api } from '../../api';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { RadioHub } from './RadioHub';
import { useNavigate } from 'react-router-dom';

export const StreamingPage = () => {
  const navigate = useNavigate();
  const { currentTrack, playTrack, isPlaying, pause, nextTrack, previousTrack, addToQueue } = useTrack();
  const { isArtist } = useAuth();
  const { data: artists = [] } = useArtists();
  const { data: initialTracks = [] } = useTracks();
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [isRadioActive, setIsRadioActive] = useState(false);
  const [isLoadingRadio, setIsLoadingRadio] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'streaming' | 'radio'>('streaming');
  const [showVisualizer, setShowVisualizer] = useState(false);

  useEffect(() => {
    if (initialTracks.length > 0) {
      setTracks(initialTracks);
    }
  }, [initialTracks]);

  useEffect(() => {
    const q = query(collection(db, 'tracks'), where('status', '==', 'live'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedTracks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Track));
      setTracks(updatedTracks);
    });
    return () => unsubscribe();
  }, []);

  const featuredArtists = artists.slice(0, 5);

  const categories = [
    { id: 'all', label: 'All Tracks' },
    { id: 'trending', label: 'Trending' },
    { id: 'new', label: 'New Releases' },
    { id: 'electronic', label: 'Electronic' },
    { id: 'hiphop', label: 'Hip Hop' },
  ];

  const filteredTracks = tracks.filter(t => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'trending') return t.plays && t.plays > 100;
    if (activeCategory === 'new') return true; // Could filter by date
    return t.genre?.toLowerCase() === activeCategory;
  });

  const handlePlayTrack = (track: Track) => {
    soundEngine.playChime();
    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      playTrack(track);
    }
  };

  const startArtistRadio = async (artistName: string) => {
    setIsLoadingRadio(true);
    setIsRadioActive(true);
    try {
      const genre = currentTrack?.genre || 'Electronic';
      const radioTracks = await api.radio.getGenreRadio(genre);
      if (radioTracks && radioTracks.length > 0) {
        // Add all radio tracks to queue and play first
        radioTracks.forEach(t => addToQueue(t));
        playTrack(radioTracks[0]);
        toast.success(`Starting ${artistName} Radio`);
      } else {
        // Fallback to local filtering if API fails
        const similarTracks = tracks.filter(t => t.displayArtistName !== artistName && (t.genre === currentTrack?.genre || Math.random() > 0.5));
        if (similarTracks.length > 0) {
          playTrack(similarTracks[0]);
          toast.success(`Starting ${artistName} Radio (Local)`);
        }
      }
    } catch {
      toast.error('Failed to start radio');
    } finally {
      setIsLoadingRadio(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div className="flex items-center gap-8">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold tracking-tight">Streaming</h2>
            <p className="text-zinc-400">Listen to the latest releases from SonicStream artists.</p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 h-fit mt-auto">
            <button
              onClick={() => setActiveTab('streaming')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'streaming' ? "bg-white text-black" : "text-zinc-500 hover:text-white"
              )}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab('radio')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'radio' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              <Radio size={14} />
              Radio Hub
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isArtist && (
            <button 
              onClick={() => navigate('/catalog')}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-700 text-white rounded-2xl font-bold hover:bg-zinc-600 transition-all shadow-lg shadow-black/20"
            >
              <Music size={18} />
              Upload Track
            </button>
          )}
          {currentTrack && (
            <button 
              onClick={() => startArtistRadio(currentTrack.displayArtistName)}
              disabled={isLoadingRadio}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all",
                isRadioActive ? "bg-zinc-700 text-white" : "bg-zinc-900 text-white hover:bg-zinc-800"
              )}
            >
              {isLoadingRadio ? <RefreshCw className="animate-spin" size={18} /> : <Radio size={18} />}
              {isRadioActive ? 'Radio Active' : 'Start Artist Radio'}
            </button>
          )}
        </div>
      </header>

      {activeTab === 'radio' ? (
        <RadioHub />
      ) : (
        <>
          {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
              activeCategory === cat.id 
                ? "bg-white text-black" 
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Featured Artists */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Star className="text-amber-400" size={20} />
            Featured Artists
          </h3>
          <button className="text-xs text-zinc-500 hover:text-white">View All</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {featuredArtists.map((artist) => (
            <motion.div 
              key={artist.id}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/artist/${artist.id}`)}
              className="bg-zinc-900/50 border border-white/5 p-4 rounded-3xl text-center space-y-3 group cursor-pointer hover:border-emerald-500/30 transition-all"
            >
              <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto overflow-hidden border-2 border-white/5 group-hover:border-emerald-500/50 transition-all">
                <img 
                  src={artist.avatarUrl || `https://picsum.photos/seed/${artist.id}/200/200`} 
                  alt={artist.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-sm truncate">{artist.name}</h4>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{artist.genres?.[0] || 'Artist'}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold">Recent Tracks</h3>
              <button className="text-xs text-emerald-400 hover:underline">View All</button>
            </div>
            <div className="divide-y divide-white/5">
              {filteredTracks.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">No tracks available in this category.</div>
              ) : (
                filteredTracks.map((track: Track) => (
                  <div 
                    key={track.id} 
                    className={cn(
                      "p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group",
                      currentTrack?.id === track.id && "bg-emerald-500/5"
                    )}
                    onClick={() => handlePlayTrack(track)}
                  >
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden relative">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <Music size={20} className="text-zinc-600" />
                      )}
                      <div className={cn(
                        "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                        currentTrack?.id === track.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        {currentTrack?.id === track.id && isPlaying ? <Pause size={16} className="text-white fill-white" /> : <Play size={16} className="text-white fill-white" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn("font-bold truncate", currentTrack?.id === track.id && "text-emerald-400")}>{track.title}</h4>
                      <p className="text-xs text-zinc-500 truncate">{track.displayArtistName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-zinc-600 font-mono">
                        {track.genre}
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1">
                        <Play size={10} /> {track.plays || 0}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(track);
                          toast.success('Added to queue');
                        }}
                        className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors"
                        title="Add to Queue"
                      >
                        <Plus size={16} />
                      </button>
                      <button className="p-2 text-zinc-500 hover:text-white">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {currentTrack ? (
              <motion.div 
                key={currentTrack.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-zinc-900/50 border border-white/5 rounded-[48px] p-10 space-y-10 sticky top-24 shadow-2xl"
              >
                <div className="aspect-square rounded-[40px] overflow-hidden shadow-2xl border border-white/10 group relative">
                  {showVisualizer ? (
                    <div className="w-full h-full bg-zinc-950/90 relative p-4">
                      <MusicStreamVisualizer isPlaying={isPlaying} />
                    </div>
                  ) : (
                    <>
                      <img 
                        src={currentTrack.coverUrl || `https://picsum.photos/seed/${currentTrack.id}/600/600`} 
                        alt={currentTrack.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                    </>
                  )}
                  
                  {/* Visualizer view toggle button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowVisualizer(!showVisualizer);
                    }}
                    className="absolute bottom-4 right-4 z-20 bg-black/75 hover:bg-zinc-700 hover:text-white text-white px-3.5 py-1.5 rounded-full text-[10px] font-sans font-black flex items-center gap-1.5 transition-all shadow-md border border-white/10"
                    title={showVisualizer ? "Show Cover Art" : "Show Real-time Visualizer"}
                  >
                    <Activity size={10} className={isPlaying && showVisualizer ? "animate-pulse" : ""} />
                    <span>{showVisualizer ? "Show Cover" : "Visualizer Mode"}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">{currentTrack.title}</h3>
                    <p className="text-emerald-400 font-black uppercase tracking-widest text-sm">{currentTrack.displayArtistName}</p>
                  </div>

                  <div className="flex items-center justify-between px-4">
                    <button className="text-zinc-500 hover:text-red-500 transition-colors"><Heart size={20} /></button>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                      <Music size={10} /> {currentTrack.genre}
                    </div>
                    <button className="text-zinc-500 hover:text-emerald-400 transition-colors"><Share2 size={20} /></button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: isPlaying ? '60%' : '30%' }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                      <span>1:24</span>
                      <span>3:45</span>
                    </div>
                  </div>

                  <div className="flex justify-center items-center gap-8">
                    <button 
                      onClick={previousTrack}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      <SkipBack size={28} />
                    </button>
                    <button 
                      onClick={() => handlePlayTrack(currentTrack)}
                      className="w-24 h-24 bg-zinc-700 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-black/20"
                    >
                      {isPlaying ? <Pause size={40} className="fill-black" /> : <Play size={40} className="fill-black ml-1" />}
                    </button>
                    <button 
                      onClick={nextTrack}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      <SkipForward size={28} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 px-4">
                    <Volume2 size={18} className="text-zinc-500" />
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full">
                      <div className="w-3/4 h-full bg-zinc-400 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <button 
                    onClick={() => {
                      const text = `Listening to ${currentTrack.title} by ${currentTrack.displayArtistName} on SonicStream!`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                    }}
                    className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-[#1DA1F2] hover:bg-white/10 transition-all"
                  >
                    <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  </button>
                  <button 
                    onClick={() => {
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                    }}
                    className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-[#4267B2] hover:bg-white/10 transition-all"
                  >
                    <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-zinc-900/50 border border-white/5 rounded-[48px] p-16 text-center space-y-6 sticky top-24">
                <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                  <Music size={48} className="text-zinc-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tight">Ready to Stream?</h3>
                  <p className="text-zinc-500 text-sm">Select a track to start your SonicStream experience.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )}
</div>
);
};
