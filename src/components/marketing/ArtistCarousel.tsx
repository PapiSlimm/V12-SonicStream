import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Artist } from '../../types';
import { apiFetch } from '../../api/apiFetch';

export const ArtistCarousel = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const data = await apiFetch<Artist[]>('/api/artist');
        setArtists(data.slice(0, 10)); // Top 10 featured
      } catch (error) {
        console.error('Failed to fetch artists:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % artists.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + artists.length) % artists.length);
  };

  if (loading) return <div className="h-64 flex items-center justify-center text-zinc-500">Loading featured artists...</div>;
  if (artists.length === 0) return null;

  return (
    <div className="relative group max-w-5xl mx-auto px-12">
      <div className="overflow-hidden rounded-[40px] bg-zinc-900/50 border border-white/5 p-8 md:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-emerald-500/20 shadow-2xl shadow-emerald-500/10 shrink-0">
              <img 
                src={artists[currentIndex].avatarUrl || `https://picsum.photos/seed/${artists[currentIndex].id}/400/400`} 
                alt={artists[currentIndex].name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 text-center md:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                <Star size={12} fill="currentColor" />
                Featured Artist
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl md:text-6xl font-black tracking-tight">{artists[currentIndex].name}</h3>
                <p className="text-emerald-500 font-bold uppercase tracking-[0.3em] text-sm italic">
                  {artists[currentIndex].genres?.join(' • ') || 'SonicStream Creator'}
                </p>
              </div>
              <p className="text-zinc-400 text-lg leading-relaxed line-clamp-3">
                {artists[currentIndex].bio || "Pushing the boundaries of sound and digital culture. Experience the latest releases and exclusive content only on SonicStream."}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-8 pt-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-black">{(artists[currentIndex] as any).monthlyListeners || '12.4K'}</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Listeners</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black">{(artists[currentIndex] as any).totalStreams || '1.2M'}</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Streams</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button 
        onClick={prev}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all border border-white/10 opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={next}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all border border-white/10 opacity-0 group-hover:opacity-100"
      >
        <ChevronRight size={24} />
      </button>

      <div className="flex justify-center gap-2 mt-8">
        {artists.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${currentIndex === i ? 'bg-emerald-500 w-8' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          />
        ))}
      </div>
    </div>
  );
};
