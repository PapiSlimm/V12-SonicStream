import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Plus,
  ListMusic,
  Check,
  Loader2,
  Music
} from 'lucide-react';
// 2026-10-08 Firebase removal phase 2: Firestore reads/writes replaced with
// the platform's own /api/playlists endpoints (SONIC AUTH token via apiFetch).
import { playlistsApi } from '../../api/playlists';
import { apiFetch } from '../../api/apiFetch';
import { getToken } from '../../lib/sonicAuth';
import { Playlist, Track } from '../../types';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

interface AddToPlaylistModalProps {
  track: Track;
  onClose: () => void;
}

export const AddToPlaylistModal = ({ track, onClose }: AddToPlaylistModalProps) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!getToken()) { setLoading(false); return; }
      try {
        const [list, membership] = await Promise.all([
          playlistsApi.getAll(),
          apiFetch<{ playlistIds: string[] }>(`/api/playlists/membership/${encodeURIComponent(track.id)}`)
            .catch(() => ({ playlistIds: [] as string[] }))
        ]);
        setPlaylists(list || []);
        setMemberIds(new Set((membership.playlistIds || []).map(String)));
      } catch (err) {
        console.error('Failed to fetch playlists', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, [track.id]);

  const toggleTrackInPlaylist = async (playlist: Playlist) => {
    const pid = String(playlist.id);
    setProcessingId(pid);
    const isInPlaylist = memberIds.has(pid);

    try {
      if (isInPlaylist) {
        await playlistsApi.removeTrack(pid, track.id);
      } else {
        await playlistsApi.addTrack(pid, track.id);
      }
      setMemberIds(prev => {
        const next = new Set(prev);
        if (isInPlaylist) next.delete(pid); else next.add(pid);
        return next;
      });
      toast.success(isInPlaylist ? 'Removed from playlist' : 'Added to playlist');
    } catch (err) {
      console.error('Playlist update failed', err);
      toast.error('Could not update playlist. Try again.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <ListMusic className="text-emerald-500" size={20} />
            </div>
            <h3 className="text-xl font-black text-white">Add to Playlist</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
              <img src={track.coverUrl || 'https://picsum.photos/seed/track/100/100'} alt={track.title} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white truncate">{track.title}</p>
              <p className="text-xs text-zinc-500 truncate">{track.displayArtistName}</p>
            </div>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-zinc-500 text-xs">Loading playlists...</p>
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto">
                  <Music className="text-zinc-700" size={24} />
                </div>
                <p className="text-zinc-500 text-sm">No playlists found. Create one first!</p>
              </div>
            ) : (
              playlists.map(playlist => {
                const pid = String(playlist.id);
                const isInPlaylist = memberIds.has(pid);
                return (
                  <button
                    key={pid}
                    onClick={() => toggleTrackInPlaylist(playlist)}
                    disabled={processingId === pid}
                    className={cn(
                      "w-full p-4 rounded-2xl flex items-center justify-between transition-all group",
                      isInPlaylist ? "bg-emerald-500/10 border-emerald-500/20" : "hover:bg-white/5 border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                        {playlist.coverUrl ? (
                          <img src={playlist.coverUrl} alt={playlist.title} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <ListMusic size={20} className="text-zinc-600" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className={cn("font-bold", isInPlaylist ? "text-emerald-400" : "text-white")}>{playlist.title}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                          {isInPlaylist ? 'In this playlist' : 'Tap to add'}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                      isInPlaylist ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-600 group-hover:text-zinc-400"
                    )}>
                      {processingId === pid ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isInPlaylist ? (
                        <Check size={14} />
                      ) : (
                        <Plus size={14} />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="p-8 bg-black/40 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-black hover:bg-zinc-700 transition-all"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
