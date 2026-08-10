import React from 'react';
import { Play, Download, Share2, Music, Video, ExternalLink, ShoppingCart, Twitter, Facebook, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';
import { Track } from '../../types';
import { cn } from '../../utils/cn';

interface PublicReleasePageProps {
  track: Track;
  onPlay: (track: Track) => void;
}

export const PublicReleasePage: React.FC<PublicReleasePageProps> = ({ track, onPlay }) => {
  const isVideo = track.isVideo;

  const externalPlatforms = [
    { name: 'Spotify', icon: Music, color: 'text-[#1DB954]' },
    { name: 'Apple Music', icon: Music, color: 'text-[#FA243C]' },
    { name: 'SoundCloud', icon: Music, color: 'text-[#FF3300]' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Blur */}
        <div className="absolute inset-0 z-0">
          <img 
            src={track.coverUrl || `https://picsum.photos/seed/${track.id}/1920/1080`} 
            className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square rounded-4xl overflow-hidden shadow-2xl border border-white/10 group relative"
          >
            <img 
              src={track.coverUrl || `https://picsum.photos/seed/${track.id}/800/800`} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              alt={track.title}
            />
            <button 
              onClick={() => onPlay(track)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-24 h-24 bg-zinc-700 rounded-full flex items-center justify-center text-white shadow-2xl shadow-black/40">
                <Play size={48} fill="currentColor" className="ml-2" />
              </div>
            </button>
          </motion.div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-black uppercase tracking-widest">
                {isVideo ? 'New Music Video' : 'New Single'}
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
                {track.title}
              </h1>
              <p className="text-2xl md:text-3xl text-zinc-400 font-medium">
                {track.displayArtistName}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => onPlay(track)}
                className="px-10 py-5 bg-zinc-700 text-white rounded-2xl font-black text-xl flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-black/20"
              >
                <Play fill="currentColor" />
                Listen Now
              </button>
              <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xl flex items-center gap-3 hover:bg-white/10 transition-all">
                <Download />
                Buy ${track.price || '0.99'}
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Share</p>
              <div className="flex gap-4">
                <button className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-white/5">
                  <Twitter size={18} />
                </button>
                <button className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-white/5">
                  <Facebook size={18} />
                </button>
                <button className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-white/5">
                  <Instagram size={18} />
                </button>
                <button className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-white/5">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-black uppercase tracking-tight">About this release</h2>
            <p className="text-zinc-400 leading-relaxed text-lg">
              {track.description || `The latest masterpiece from ${track.displayArtistName}. This release pushes the boundaries of ${track.genre || 'contemporary music'}, blending rhythmic complexity with emotive melodies. Available now exclusively on SonicStream and global platforms.`}
            </p>
          </div>

          {/* Embedded Player Placeholder */}
          <div className="aspect-video bg-zinc-900 rounded-4xl border border-white/5 flex items-center justify-center relative group overflow-hidden">
            {isVideo ? (
              <div className="text-center space-y-4">
                <Video size={64} className="mx-auto text-zinc-800" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">4K HLS Stream Ready</p>
              </div>
            ) : (
              <div className="w-full h-full p-12 flex flex-col justify-end space-y-6">
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-emerald-500" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <Play fill="currentColor" className="text-emerald-500" />
                    <span className="font-mono text-xs text-zinc-500">01:24 / 03:45</span>
                  </div>
                  <Music className="text-zinc-800" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </div>

        <div className="space-y-12">
          <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-4xl space-y-8">
            <h3 className="text-xl font-black uppercase tracking-tight">Listen Everywhere</h3>
            <div className="grid gap-4">
              {externalPlatforms.map((platform, i) => (
                <button 
                  key={i}
                  className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <platform.icon className={cn("transition-transform group-hover:scale-110", platform.color)} size={20} />
                    <span className="font-bold text-sm">{platform.name}</span>
                  </div>
                  <ExternalLink size={14} className="text-zinc-600 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 bg-zinc-700 text-white rounded-4xl space-y-6">
            <ShoppingCart size={32} />
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight">Support the Artist</h3>
              <p className="text-black/70 text-sm font-medium">
                Buy this track directly to ensure the artist receives 100% of the revenue.
              </p>
            </div>
            <button className="w-full py-4 bg-black text-white rounded-xl font-black text-lg hover:scale-105 transition-all">
              Buy Now — ${track.price || '0.99'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
