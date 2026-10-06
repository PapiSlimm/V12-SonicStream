import { useState, useEffect, useCallback } from 'react';
import { Search, Music, Users, Zap, Filter, Calendar, MapPin, Play, Sparkles, Globe, Loader2 } from 'lucide-react';
import { api } from '../../api';
import { apiFetch } from '../../api/apiFetch';
import { Track, Artist, SonicEvent } from '../../types';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { GroundedSearchResults } from './GroundedSearchResults';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTrack } from '../../context/TrackContext';

import { AISmartPlaylist } from './AISmartPlaylist';

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { playTrack } = useTrack();
  
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<'all' | 'track' | 'artist' | 'event'>('all');
  const [showAIPlaylist, setShowAIPlaylist] = useState(false);
  const [useGroundedSearch, setUseGroundedSearch] = useState(false);
  const [groundedResult, setGroundedResult] = useState<{ text: string, chunks: any[] } | null>(null);
  const [isGroundedLoading, setIsGroundedLoading] = useState(false);
  const [results, setResults] = useState<{ tracks: Track[], artists: Artist[], events: SonicEvent[] }>({
    tracks: [],
    artists: [],
    events: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setQuery(q);
    }
  }, [searchParams]);

  const updateSearchQuery = (newQuery: string) => {
    setQuery(newQuery);
    setSearchParams({ q: newQuery }, { replace: true });
  };
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    genre: '',
    location: '',
    date: '',
    mood: '',
    lyrics: '',
    availability: 'all'
  });

  const handleGroundedSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsGroundedLoading(true);
    setGroundedResult(null);
    try {
      const data = await apiFetch<any>('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: query })
      });

      const text = data.response || '';
      const chunks = data.groundingSources || [];

      setGroundedResult({
        text,
        chunks
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGroundedLoading(false);
    }
  }, [query]);

  const handleSearch = useCallback(async () => {
    if (useGroundedSearch && query.length > 3) {
      handleGroundedSearch();
      return;
    }
    setIsLoading(true);
    try {
      const params: any = { q: query };
      if (activeType !== 'all') params.type = activeType;
      if (filters.genre) params.genre = filters.genre;
      if (filters.location) params.location = filters.location;
      if (filters.date) params.date = filters.date;
      if (filters.mood) params.mood = filters.mood;
      if (filters.lyrics) params.lyrics = filters.lyrics;
      if (filters.availability !== 'all') params.availability = filters.availability;

      const data = await api.search.query(params);
      setResults(data as any);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [query, activeType, filters, useGroundedSearch, handleGroundedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeType, filters, handleSearch]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="space-y-6">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={24} />
          <input 
            type="text"
            value={query}
            onChange={(e) => updateSearchQuery(e.target.value)}
            placeholder="Search for tracks, artists, or live events..."
            className="w-full bg-zinc-900 border border-white/5 rounded-[32px] pl-16 pr-6 py-6 text-xl outline-none focus:border-emerald-500/50 transition-all shadow-2xl"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5">
            {[
              { id: 'all', label: 'All Results', icon: Search },
              { id: 'track', label: 'Tracks', icon: Music },
              { id: 'artist', label: 'Artists', icon: Users },
              { id: 'event', label: 'Live Events', icon: Zap },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveType(t.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeType === t.id 
                    ? "bg-zinc-700 text-white shadow-lg shadow-black/20" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setUseGroundedSearch(!useGroundedSearch);
                if (!useGroundedSearch) setResults({ tracks: [], artists: [], events: [] });
              }}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold border transition-all",
                useGroundedSearch 
                  ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20" 
                  : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"
              )}
            >
              <Globe size={16} />
              Grounded Search
            </button>

            <button
              onClick={() => setShowAIPlaylist(!showAIPlaylist)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold border transition-all",
                showAIPlaylist 
                  ? "bg-zinc-700 text-white border-zinc-600 shadow-lg shadow-black/20" 
                  : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"
              )}
            >
              <Sparkles size={16} />
              AI Smart Playlist
            </button>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold border transition-all",
                showFilters ? "bg-white text-black border-white" : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"
              )}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showAIPlaylist && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <AISmartPlaylist />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6 bg-zinc-900/30 border border-white/5 rounded-3xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Music size={12} /> Genre
                  </label>
                  <select 
                    value={filters.genre}
                    onChange={(e) => setFilters({...filters, genre: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">All Genres</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Hip Hop">Hip Hop</option>
                    <option value="Rock">Rock</option>
                    <option value="Jazz">Jazz</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={12} /> Mood
                  </label>
                  <select 
                    value={filters.mood}
                    onChange={(e) => setFilters({...filters, mood: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">Any Mood</option>
                    <option value="Energetic">Energetic</option>
                    <option value="Chill">Chill</option>
                    <option value="Dark">Dark</option>
                    <option value="Happy">Happy</option>
                    <option value="Melancholic">Melancholic</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={12} /> Location
                  </label>
                  <input 
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                    placeholder="City or Venue..."
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> Date
                  </label>
                  <input 
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({...filters, date: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Music size={12} /> Lyrics
                  </label>
                  <input 
                    type="text"
                    value={filters.lyrics}
                    onChange={(e) => setFilters({...filters, lyrics: e.target.value})}
                    placeholder="Search in lyrics..."
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Users size={12} /> Availability
                  </label>
                  <select 
                    value={filters.availability}
                    onChange={(e) => setFilters({...filters, availability: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Artists</option>
                    <option value="available">Available for Booking</option>
                    <option value="touring">Currently Touring</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="space-y-12">
        {isGroundedLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-zinc-500 font-bold animate-pulse">Searching the global music web...</p>
          </div>
        )}

        {groundedResult && (
          <GroundedSearchResults text={groundedResult.text} chunks={groundedResult.chunks} />
        )}

        {!isLoading && !query && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <Sparkles className="text-emerald-400" size={24} />
                Recommended for You
              </h3>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Based on your taste</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {results.tracks.slice(0, 4).map((track) => (
                <div 
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className="group cursor-pointer space-y-4"
                >
                  <div className="aspect-square bg-zinc-900 rounded-[32px] overflow-hidden relative border border-white/5 group-hover:border-emerald-500/30 transition-all">
                    <img src={track.coverUrl || 'https://picsum.photos/seed/track/400/400'} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center text-white">
                        <Play size={24} fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold truncate">{track.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{track.displayArtistName}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && results.tracks.length > 0 && (activeType === 'all' || activeType === 'track') && (
          <section className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Music className="text-emerald-400" size={20} />
              Tracks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.tracks.map((track) => (
                <div 
                  key={track.id} 
                  onClick={() => playTrack(track)}
                  className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-all group cursor-pointer"
                >
                  <div className="w-16 h-16 bg-zinc-800 rounded-xl overflow-hidden shrink-0">
                    <img src={track.coverUrl || 'https://picsum.photos/seed/track/200/200'} alt={track.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{track.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{track.displayArtistName}</p>
                  </div>
                  <button className="p-2 bg-zinc-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap size={16} fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isLoading && results.artists.length > 0 && (activeType === 'all' || activeType === 'artist') && (
          <section className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Users className="text-blue-400" size={20} />
              Artists
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {results.artists.map((artist) => (
                <div 
                  key={artist.id} 
                  onClick={() => navigate(`/artist/${artist.id}`)}
                  className="text-center space-y-3 group cursor-pointer"
                >
                  <div className="aspect-square rounded-full overflow-hidden border-2 border-transparent group-hover:border-emerald-500 transition-all">
                    <img src={artist.imageUrl || `https://picsum.photos/seed/${artist.id}/200/200`} alt={artist.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{artist.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{artist.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isLoading && results.events.length > 0 && (activeType === 'all' || activeType === 'event') && (
          <section className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Zap className="text-purple-400" size={20} />
              Live Events & Tickets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.events.map((event) => (
                <div 
                  key={event.id} 
                  className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between hover:border-emerald-500/30 transition-all group cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                      <img src={event.imageUrl || `https://picsum.photos/seed/${event.id}/200/200`} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{event.title}</p>
                      <p className="text-sm text-zinc-500">{event.artistName} • {event.venue}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs font-bold text-emerald-400">${event.price}</span>
                        <span className="text-xs text-zinc-600">{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button className="bg-white text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-all">
                    Get Tickets
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isLoading && results.tracks.length === 0 && results.artists.length === 0 && results.events.length === 0 && query && (
          <div className="text-center py-20 space-y-4">
            <Search size={48} className="mx-auto text-zinc-800" />
            <h3 className="text-xl font-bold">No results found</h3>
            <p className="text-zinc-500">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
};
