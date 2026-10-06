import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Calendar, 
  MapPin, 
  Users, 
  Music, 
  Share2, 
  Heart, 
  Instagram, 
  Twitter, 
  Globe,
  ExternalLink,
  Clock,
  Radio,
  Ticket,
  Youtube,
  Facebook,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Artist, Track, SonicEvent } from '../../types';
import { api } from '../../api';
import { useTrack } from '../../context/TrackContext';
import { cn } from '../../utils/cn';
import { DownloadButton } from '../../components/commerce/DownloadButton';
import toast from 'react-hot-toast';

interface PublicArtistProfileProps {
  artist: Artist;
  tracks?: Track[];
  onPlay?: (track: Track) => void;
  onBook?: () => void;
  onSelectEvent?: (event: SonicEvent) => void;
}

export const PublicArtistProfile = ({ artist: initialArtist, onBook, onSelectEvent }: PublicArtistProfileProps) => {
  const [artist, setArtist] = useState<Artist>(initialArtist);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [events, setEvents] = useState<SonicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'tracks' | 'events' | 'about'>('tracks');
  const [isFollowing, setIsFollowing] = useState(initialArtist.isFollowing || false);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  
  const { currentTrack, playTrack, isPlaying, pause, addToQueue } = useTrack();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [artistData, tracksData, eventsData] = await Promise.all([
          api.artist.getProfile(initialArtist.id),
          api.artist.getTracks(initialArtist.id),
          api.artist.getEvents(initialArtist.id)
        ]);
        setArtist(artistData);
        setTracks(tracksData);
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching artist data:', error);
        toast.error('Failed to load artist profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialArtist.id]);

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      playTrack(track);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.artist.unfollow(artist.id);
        setIsFollowing(false);
        setArtist(prev => ({ ...prev, followersCount: (prev.followersCount || 1) - 1 }));
        toast.success(`Unfollowed ${artist.name}`);
      } else {
        await api.artist.follow(artist.id);
        setIsFollowing(true);
        setArtist(prev => ({ ...prev, followersCount: (prev.followersCount || 0) + 1 }));
        toast.success(`Following ${artist.name}`);
      }
    } catch {
      toast.error('Failed to update follow status');
    }
  };

  const handleLikeTrack = async (trackId: string) => {
    try {
      const isLiked = likedTracks.has(trackId);
      if (isLiked) {
        // await api.tracks.unlike(trackId);
        setLikedTracks(prev => {
          const next = new Set(prev);
          next.delete(trackId);
          return next;
        });
      } else {
        // await api.tracks.like(trackId);
        setLikedTracks(prev => new Set(prev).add(trackId));
        toast.success('Added to your favorites');
      }
    } catch {
      toast.error('Failed to update like status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-32 -mt-8 -mx-8">
      {/* Hero Section - Recipe 2: Editorial / Magazine Hero */}
      <section className="relative h-[70vh] overflow-hidden bg-black">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img 
            src={artist.bannerUrl || artist.imageUrl || `https://picsum.photos/seed/${artist.id}/1920/1080`} 
            alt={artist.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </motion.div>

        <div className="relative h-full max-w-7xl mx-auto px-8 flex flex-col justify-end pb-16">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-zinc-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                Verified Artist
              </span>
              <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold">
                <Users size={14} className="text-emerald-500" />
                <span>{artist.followersCount?.toLocaleString() || '0'} Followers</span>
              </div>
            </div>

            <h1 className="text-[10vw] font-black uppercase leading-[0.8] tracking-tighter text-white">
              {artist.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button 
                onClick={() => tracks.length > 0 && handlePlayTrack(tracks[0])}
                className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-3"
              >
                <Play size={20} fill="black" />
                Play Latest
              </button>
              
              <button 
                onClick={handleFollow}
                className={cn(
                  "px-8 py-4 border rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-3",
                  isFollowing ? "bg-zinc-700 border-zinc-600 text-white" : "border-white/20 text-white hover:bg-white/10"
                )}
              >
                <Heart size={20} fill={isFollowing ? "black" : "none"} />
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              <button 
                onClick={onBook}
                className="px-8 py-4 bg-zinc-900 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3"
              >
                <Calendar size={20} />
                Book Now
              </button>

              <div className="flex items-center gap-3 ml-auto">
                <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
                  <Instagram size={20} />
                </button>
                <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
                  <Twitter size={20} />
                </button>
                <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
                  <Globe size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="sticky top-20 z-30 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-12">
            {(['tracks', 'events', 'about'] as const).map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={cn(
                  "py-6 text-xs font-black uppercase tracking-[0.2em] transition-all relative",
                  activeSection === section ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {section}
                {activeSection === section && (
                  <motion.div 
                    layoutId="activeTabProfile"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        <AnimatePresence mode="wait">
          {activeSection === 'tracks' && (
            <motion.div
              key="tracks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 gap-1">
                {tracks.map((track, idx) => (
                  <div 
                    key={track.id}
                    className={cn(
                      "group flex items-center gap-8 p-6 rounded-3xl transition-all cursor-pointer",
                      currentTrack?.id === track.id ? "bg-emerald-500/10 border border-emerald-500/20" : "hover:bg-white/5 border border-transparent"
                    )}
                    onClick={() => handlePlayTrack(track)}
                  >
                    <span className="w-8 text-zinc-700 font-black text-xl">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 relative shadow-2xl">
                      <img 
                        src={track.coverUrl || `https://picsum.photos/seed/${track.id}/200/200`} 
                        alt={track.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className={cn(
                        "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                        currentTrack?.id === track.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause size={24} className="text-white fill-white" />
                        ) : (
                          <Play size={24} className="text-white fill-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-black text-2xl uppercase tracking-tight truncate",
                        currentTrack?.id === track.id ? "text-emerald-400" : "text-white"
                      )}>
                        {track.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{track.genre}</p>
                        <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                        {track.releaseDate && (
                          <>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{track.releaseDate}</p>
                            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                          </>
                        )}
                        <div className="flex items-center gap-1 text-xs text-zinc-500 font-mono">
                          <Play size={10} />
                          {track.plays?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                      <DownloadButton 
                        trackId={track.id}
                        trackTitle={track.title}
                        artistName={artist.name}
                        price={track.price || 0.99}
                      />
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueue(track);
                            toast.success('Added to queue');
                          }}
                          className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Radio size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeTrack(track.id);
                          }}
                          className={cn(
                            "p-3 bg-white/5 rounded-2xl transition-all",
                            likedTracks.has(track.id) ? "text-red-500 bg-red-500/10" : "text-zinc-500 hover:text-red-500 hover:bg-white/10"
                          )}
                        >
                          <Heart size={18} fill={likedTracks.has(track.id) ? "currentColor" : "none"} />
                        </button>
                        <button className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-emerald-400 hover:bg-white/10 transition-all">
                          <Share2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {tracks.length === 0 && (
                  <div className="text-center py-32 bg-zinc-900/30 rounded-[40px] border border-dashed border-white/10">
                    <Music size={48} className="mx-auto mb-4 text-zinc-800" />
                    <p className="text-zinc-500 font-bold uppercase tracking-widest">No tracks released yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeSection === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {events.map((event) => (
                <div 
                  key={event.id}
                  className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-10 flex flex-col justify-between group hover:border-emerald-500/30 transition-all shadow-2xl"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex flex-col items-center justify-center w-24 h-24 bg-zinc-700 text-white rounded-[32px] flex-shrink-0 shadow-lg shadow-black/20">
                      <span className="text-xs font-black uppercase tracking-widest">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-4xl font-black">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-white">${event.price}</span>
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Starting Price</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-3xl font-black uppercase tracking-tight leading-none">{event.title}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 text-zinc-400">
                        <div className="p-2 bg-white/5 rounded-xl">
                          <MapPin size={16} className="text-emerald-500" />
                        </div>
                        <span className="text-sm font-bold">{event.venue}, {event.city}</span>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-400">
                        <div className="p-2 bg-white/5 rounded-xl">
                          <Clock size={16} className="text-emerald-500" />
                        </div>
                        <span className="text-sm font-bold">{event.time || '20:00'}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => onSelectEvent?.(event)}
                    className="mt-10 w-full py-5 bg-white text-black rounded-[24px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                  >
                    <Ticket size={20} />
                    Get Tickets
                  </button>
                </div>
              ))}
              {events.length === 0 && (
                <div className="col-span-full text-center py-32 bg-zinc-900/30 rounded-[40px] border border-dashed border-white/10">
                  <Calendar size={48} className="mx-auto mb-4 text-zinc-800" />
                  <p className="text-zinc-500 font-bold uppercase tracking-widest">No upcoming events scheduled.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-16"
            >
              <div className="lg:col-span-2 space-y-12">
                <div className="space-y-6">
                  <h3 className="text-3xl font-black uppercase tracking-tight">Biography</h3>
                  <p className="text-zinc-400 leading-relaxed text-xl font-medium">
                    {artist.bio || `${artist.name} is a visionary artist pushing the boundaries of sound. Based in ${artist.city || 'the digital realm'}, they blend complex rhythms with ethereal melodies to create an immersive sonic experience.`}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-12 pt-12 border-t border-white/10">
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Origin</p>
                    <p className="text-white text-xl font-black uppercase">{artist.city || 'Global'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Genre</p>
                    <p className="text-white text-xl font-black uppercase">{artist.genres?.join(', ') || 'Various'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Active Since</p>
                    <p className="text-white text-xl font-black uppercase">2022</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-10 space-y-8 shadow-2xl">
                  <h4 className="font-black uppercase tracking-widest text-sm text-zinc-500">Social Presence</h4>
                  <div className="space-y-4">
                    {(() => {
                      const platforms = [
                        { key: 'instagram', label: 'Instagram', icon: Instagram, url: artist.socialLinks?.instagram },
                        { key: 'twitter', label: 'X (Twitter)', icon: Twitter, url: artist.socialLinks?.twitter },
                        { key: 'youtube', label: 'YouTube', icon: Youtube, url: artist.socialLinks?.youtube },
                        { key: 'facebook', label: 'Facebook', icon: Facebook, url: artist.socialLinks?.facebook },
                        { key: 'tiktok', label: 'TikTok', icon: LinkIcon, url: artist.socialLinks?.tiktok },
                        { key: 'thread', label: 'Threads', icon: Globe, url: artist.socialLinks?.thread },
                        { key: 'reddit', label: 'Reddit', icon: Globe, url: artist.socialLinks?.reddit },
                        { key: 'spotify', label: 'Spotify', icon: Music, url: artist.socialLinks?.spotify },
                      ];
                      const active = platforms.filter(p => p.url && p.url.trim() !== '');
                      
                      if (active.length === 0) {
                        return (
                          <>
                            <div className="text-sm text-zinc-500 font-medium italic mb-2">No custom links set. Standard contacts:</div>
                            <a href="#" className="flex items-center justify-between p-5 bg-white/5 rounded-3xl hover:bg-white/10 transition-all group border border-white/5">
                              <div className="flex items-center gap-4">
                                <Instagram size={24} className="text-zinc-400 group-hover:text-white transition-colors" />
                                <span className="font-black uppercase tracking-tight">Instagram</span>
                              </div>
                              <ExternalLink size={16} className="text-zinc-700" />
                            </a>
                            <a href="#" className="flex items-center justify-between p-5 bg-white/5 rounded-3xl hover:bg-white/10 transition-all group border border-white/5">
                              <div className="flex items-center gap-4">
                                <Twitter size={24} className="text-zinc-400 group-hover:text-white transition-colors" />
                                <span className="font-black uppercase tracking-tight">Twitter</span>
                              </div>
                              <ExternalLink size={16} className="text-zinc-700" />
                            </a>
                          </>
                        );
                      }

                      return active.map((platform) => {
                        const Icon = platform.icon;
                        let finalHref = platform.url?.trim() || '#';
                        if (finalHref !== '#' && !finalHref.startsWith('http://') && !finalHref.startsWith('https://')) {
                          if (platform.key === 'instagram') finalHref = `https://instagram.com/${finalHref}`;
                          else if (platform.key === 'twitter') finalHref = `https://twitter.com/${finalHref}`;
                          else if (platform.key === 'youtube') finalHref = `https://youtube.com/@${finalHref}`;
                          else if (platform.key === 'tiktok') finalHref = `https://tiktok.com/@${finalHref}`;
                          else if (platform.key === 'reddit') finalHref = `https://reddit.com/r/${finalHref}`;
                          else finalHref = `https://${finalHref}`;
                        }
                        return (
                          <a 
                            key={platform.key}
                            href={finalHref} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-5 bg-white/5 rounded-3xl hover:bg-white/10 transition-all group border border-white/5"
                          >
                            <div className="flex items-center gap-4">
                              <Icon size={24} className="text-zinc-400 group-hover:text-white transition-colors" />
                              <span className="font-black uppercase tracking-tight">{platform.label}</span>
                            </div>
                            <ExternalLink size={16} className="text-zinc-700" />
                          </a>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
