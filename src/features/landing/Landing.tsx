import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Music, Truck, Calendar, ArrowRight, Star, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Track } from '../../types';
import { api } from '../../api';
import { TrackCard } from '../../components/music/TrackCard';
import { useTrack } from '../../context/TrackContext';

const PILLARS = [
  { 
    title: 'Music Streaming', 
    desc: 'HLS/DASH + 3D immersive players for global delivery.', 
    icon: Music, 
    color: 'purple',
    stats: '1.2B Streams'
  },
  { 
    title: 'Print-on-Demand', 
    desc: 'Merch that ships worldwide. Custom fits for every fan.', 
    icon: Truck, 
    color: 'indigo',
    stats: '120+ Countries'
  },
  { 
    title: 'Gig Booking', 
    desc: 'Connect with venues instantly. Escrow protected payments.', 
    icon: Calendar, 
    color: 'emerald',
    stats: '500+ Venues'
  }
];

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="aspect-[4/5] rounded-[32px] bg-zinc-900 animate-pulse border border-white/5" />
    ))}
  </div>
);

const Landing = () => {
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { playTrack } = useTrack();

  useEffect(() => {
    let isMounted = true;
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const tracks = await api.tracks.getAll();
        if (isMounted) {
          // Since API now filters Global Stream, these are Curated Nodes
          setFeaturedTracks(tracks.slice(0, 4) as Track[]);
          setError(false);
        }
      } catch (err) {
        console.error('Failed to fetch featured tracks', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchFeatured();
    return () => { isMounted = false; };
  }, []);

  const handlePlay = useCallback((t: Track) => {
    playTrack(t);
  }, [playTrack]);

  return (
    <main className="min-h-screen bg-black font-sans selection:bg-purple-500/30 selection:text-purple-200">
      {/* 
        PREMIUM HERO HEADER 
      */}
      <header className="relative min-h-[80vh] flex flex-col items-center justify-center text-white px-6 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black to-indigo-900/40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-purple-500/10 blur-[150px] opacity-30 animate-pulse hidden md:block" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]"
          >
            <Star size={14} className="animate-spin-slow" />
            V12 SonicStream Elite
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-7xl md:text-[120px] font-black leading-[0.85] tracking-tighter"
          >
            Indie Artist
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Platform.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Upload • Stream • Monetize • Book Gigs
            <span className="block mt-2 text-zinc-600 text-sm italic">The total ecosystem for the visionary creator.</span>
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex flex-wrap justify-center gap-6"
          >
            <Link 
              to="/signup" 
              className="group relative px-12 py-6 bg-white text-black rounded-[32px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-white/5 overflow-hidden"
              role="button"
              aria-label="Start Free Account"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link 
              to="/demo" 
              className="px-12 py-6 border border-white/20 rounded-[32px] text-white font-black uppercase tracking-widest hover:bg-white/5 transition-all backdrop-blur-md"
              role="button"
              aria-label="View Live Demo"
            >
              Live Demo
            </Link>
          </motion.div>
        </div>
      </header>
      
      {/* 
        THE THREE PILLARS (Requested Categories) 
      */}
      <section className="relative z-20 max-w-7xl mx-auto grid md:grid-cols-3 gap-8 px-6 -mt-32 pb-40">
        {PILLARS.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-zinc-900/60 backdrop-blur-3xl border border-white/5 rounded-[48px] p-12 hover:bg-zinc-900 transition-all hover:border-purple-500/30"
          >
            <div className="w-14 h-14 bg-zinc-800 text-purple-400 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
              <item.icon size={32} />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-white uppercase tracking-tight">{item.title}</h3>
              <p className="text-zinc-500 leading-relaxed font-medium">{item.desc}</p>
            </div>
            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.stats}</span>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={16} />
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* 
        CURATED NODES (Global Stream)
      */}
      <section className="py-24 px-6 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">
              <Zap size={14} fill="currentColor" />
              Invite-Only Elite Catalog
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter uppercase">Curated Nodes</h2>
            <p className="text-zinc-500 max-w-md font-medium">
              The high-traffic Global Stream is reserved for Verified Creators and Pro users. Direct signal, zero noise.
            </p>
          </div>
          <Link to="/marketplace" className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2">
            Enter Marketplace <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="py-20 text-center space-y-4">
            <p className="text-zinc-500 font-medium tracking-widest uppercase text-xs">Signal Interrupted</p>
            <p className="text-zinc-400">Failed to load curated nodes. Please refresh.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredTracks.map((track, i) => (
              <TrackCard 
                key={track.id} 
                track={track} 
                index={i} 
                onPlay={handlePlay}
              />
            ))}
          </div>
        )}
      </section>

      {/* 
        TRUST SECTION 
      */}
      <section className="py-24 border-t border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <p className="text-center text-zinc-600 font-black uppercase tracking-[0.4em] text-[10px]">
            Trusted by Revolutionary Labels & Venues
          </p>
          <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             <div className="text-3xl font-black text-white tracking-widest italic">ULTRA</div>
             <div className="text-2xl font-bold text-white tracking-tighter">OAKLAND ARENA</div>
             <div className="text-3xl font-black text-white underline decoration-purple-500 uppercase">Sonic</div>
             <div className="text-2xl font-light text-white uppercase tracking-[0.5em]">Paradigm</div>
          </div>
        </div>
      </section>

      {/* 
        SOCIAL PROOF & FOOTER 
      */}
      <section className="py-40 bg-zinc-950 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[60px] p-16 text-center space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-purple-500/5 blur-[80px]" />
          <Users className="text-purple-500 mx-auto" size={48} />
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase relative z-10">
            Join the movement.
          </h2>
          <p className="text-zinc-500 text-lg relative z-10">
            Over 50,000 artists have already made the switch to SonicStream.
          </p>
          <Link 
            to="/signup" 
            className="relative z-10 inline-block px-12 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-[28px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-purple-900/20"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </main>
  );
};

export default memo(Landing);
