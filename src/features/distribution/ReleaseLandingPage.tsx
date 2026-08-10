import React, { useState, useEffect } from 'react';
import { Share2, Music, Twitter, Facebook, Instagram, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SmartLink, Track } from '../../types';
import { api } from '../../api';
import { cn } from '../../utils/cn';

interface ReleaseLandingPageProps {
  slug: string;
}

export const ReleaseLandingPage: React.FC<ReleaseLandingPageProps> = ({ slug }) => {
  const [link, setLink] = useState<SmartLink | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const linkData = await api.public.getReleaseBySlug(slug);
        setLink(linkData);
        if (linkData.trackId) {
          const trackData = await api.tracks.getById(linkData.trackId);
          setTrack(trackData);
        }
      } catch (err) {
        console.error('Failed to fetch release data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center p-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-black uppercase tracking-tight">Release Not Found</h1>
          <p className="text-zinc-500">This link may have expired or is incorrect.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-zinc-700 text-white rounded-xl font-bold"
          >
            Back to SonicStream
          </button>
        </div>
      </div>
    );
  }

  const platforms = [
    { id: 'spotify', name: 'Spotify', url: link.platforms.spotify, color: 'text-[#1DB954]' },
    { id: 'apple_music', name: 'Apple Music', url: link.platforms.appleMusic, color: 'text-[#FA243C]' },
    { id: 'deezer', name: 'Deezer', url: link.platforms.deezer, color: 'text-[#00C7FF]' },
    { id: 'tidal', name: 'Tidal', url: link.platforms.tidal, color: 'text-white' },
    { id: 'amazon_music', name: 'Amazon Music', url: link.platforms.amazonMusic, color: 'text-[#00A8E1]' },
    { id: 'sonicstream', name: 'SonicStream', url: link.platforms.sonicstream, color: 'text-emerald-400' },
  ].filter(p => p.url);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Blur */}
      <div className="fixed inset-0 z-0">
        <img 
          src={link.coverUrl || `https://picsum.photos/seed/${link.id}/1920/1080`} 
          className="w-full h-full object-cover blur-3xl opacity-20 scale-110"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-20 space-y-12">
        {/* Cover Art */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aspect-square rounded-[48px] overflow-hidden shadow-2xl border border-white/10"
        >
          <img 
            src={link.coverUrl || `https://picsum.photos/seed/${link.id}/800/800`} 
            className="w-full h-full object-cover"
            alt={link.title}
          />
        </motion.div>

        {/* Info */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
            {link.title}
          </h1>
          <p className="text-xl text-zinc-400 font-medium">
            {track?.displayArtistName || 'Independent Artist'}
          </p>
        </div>

        {/* Platform Links */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden divide-y divide-white/5">
          {platforms.map((platform) => (
            <a 
              key={platform.id}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-6 hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center", platform.color)}>
                  <Music size={20} />
                </div>
                <span className="font-bold">{platform.name}</span>
              </div>
              <div className="px-4 py-2 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest group-hover:bg-zinc-700 group-hover:text-white transition-all">
                Play
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center space-y-8">
          <div className="flex justify-center gap-6">
            <button className="text-zinc-500 hover:text-white transition-colors"><Twitter size={20} /></button>
            <button className="text-zinc-500 hover:text-white transition-colors"><Facebook size={20} /></button>
            <button className="text-zinc-500 hover:text-white transition-colors"><Instagram size={20} /></button>
            <button className="text-zinc-500 hover:text-white transition-colors"><Share2 size={20} /></button>
          </div>
          <div className="pt-8 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-zinc-600">
              <span className="text-[10px] font-black uppercase tracking-widest">Powered by</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center">
                  <Music size={10} className="text-black" />
                </div>
                <span className="text-xs font-bold text-white tracking-tighter">SonicStream</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
