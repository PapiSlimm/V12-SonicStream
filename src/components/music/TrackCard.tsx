import React from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, Zap } from 'lucide-react';
import { Track } from '../../types';

interface TrackCardProps {
  track: Track;
  onPlay?: (track: Track) => void;
  onBuy?: (track: Track) => void;
  index?: number;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, onPlay, onBuy, index = 0 }) => {
  const isVerifiedCreator = track.moderationStatus === 'verified_creator';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative group rounded-[32px] overflow-hidden aspect-[4/5] border border-white/5 bg-zinc-900/50"
    >
      <img 
        src={track.coverUrl || `https://picsum.photos/seed/track${track.id}/500/600`} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-80" 
        alt={track.title} 
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {isVerifiedCreator && (
          <div className="px-3 py-1 bg-zinc-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl shadow-black/20">
            <CheckCircle size={12} />
            Verified Creator
          </div>
        )}
        {track.editorialFeatured && (
          <div className="px-3 py-1 bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl shadow-blue-500/20">
            <Zap size={12} fill="currentColor" />
            Curated Node
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-6 right-6 space-y-4">
        <div className="space-y-1">
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{track.genre}</p>
          <h3 className="text-xl font-bold text-white leading-tight truncate">{track.title}</h3>
          <p className="text-zinc-500 text-sm font-medium truncate">by {track.displayArtistName}</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => onBuy?.(track)}
            className="flex-1 py-3 bg-white hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Buy ${track.price}
          </button>
          <button 
            onClick={() => onPlay?.(track)}
            className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-zinc-700 hover:text-white transition-all"
          >
            <Play size={16} fill="currentColor" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
