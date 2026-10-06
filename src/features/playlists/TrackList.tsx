import React from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripVertical, Clock, X, Music } from 'lucide-react';
import { Track } from '../../types';
import { cn } from '../../utils/cn';

interface TrackListProps {
  tracks: Track[];
  currentTrackId?: string;
  onReorder: (newTracks: Track[]) => void;
  onRemove: (trackId: string) => void;
}

export const TrackList: React.FC<TrackListProps> = ({ 
  tracks, 
  currentTrackId, 
  onReorder, 
  onRemove 
}) => {
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center">
          <Music className="text-zinc-600" size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-zinc-400">Playlist is empty</h3>
          <p className="text-sm text-zinc-600 max-w-xs">Add tracks from the catalog to start building your collection.</p>
        </div>
      </div>
    );
  }

  return (
    <Reorder.Group axis="y" values={tracks} onReorder={onReorder} className="space-y-2">
      {tracks.map((track, index) => (
        <Reorder.Item 
          key={track.id} 
          value={track}
          className={cn(
            "group p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/10 transition-all flex items-center gap-4 cursor-grab active:cursor-grabbing",
            currentTrackId === track.id && "border-emerald-500/50 bg-emerald-500/5"
          )}
        >
          <div className="flex items-center gap-3 shrink-0">
            <GripVertical className="text-zinc-600 group-hover:text-zinc-400" size={18} />
            {currentTrackId === track.id ? (
              <div className="flex gap-1 items-end h-5 w-5 mb-1">
                <motion.div 
                  animate={{ height: [4, 16, 4] }} 
                  transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }} 
                  className="w-1 bg-emerald-500 rounded-full" 
                />
                <motion.div 
                  animate={{ height: [8, 4, 16, 8] }} 
                  transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }} 
                  className="w-1 bg-emerald-500 rounded-full" 
                />
                <motion.div 
                  animate={{ height: [16, 4, 16] }} 
                  transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }} 
                  className="w-1 bg-emerald-500 rounded-full" 
                />
                <motion.div 
                  animate={{ height: [6, 12, 6] }} 
                  transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }} 
                  className="w-1 bg-emerald-500 rounded-full" 
                />
              </div>
            ) : (
              <div className="w-4 h-4 flex items-center justify-center text-zinc-600 font-mono text-[10px]">
                {index + 1}
              </div>
            )}
          </div>
          <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
            <img 
              src={track.coverUrl || `https://picsum.photos/seed/${track.id}/100/100`} 
              alt={track.title} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-bold truncate",
              currentTrackId === track.id ? "text-emerald-400" : "text-white"
            )}>
              {track.title}
            </p>
            <p className="text-xs text-zinc-500 truncate">{track.displayArtistName}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-zinc-500 text-xs">
            <Clock size={14} />
            {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(track.id); }}
            className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
};
