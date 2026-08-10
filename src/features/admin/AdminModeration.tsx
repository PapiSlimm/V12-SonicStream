import { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { api } from '../../api';
import { Track } from '../../types';

export const AdminModeration = () => {
  const [pendingTracks, setPendingTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const data = await api.admin.getPendingTracks();
      if (data && Array.isArray(data)) {
        setPendingTracks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await api.admin.approveTrack(id);
      } else {
        await api.admin.rejectTrack(id);
      }
      await fetchPending();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse">Loading moderation queue...</div>;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold">Moderation Queue</h2>
        <p className="text-zinc-500">Review and approve content for global distribution.</p>
      </header>

      <div className="space-y-4">
        <h3 className="font-bold px-2">Pending Tracks ({pendingTracks.length})</h3>
        {pendingTracks.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/30 border border-white/5 rounded-3xl text-zinc-500">
            Queue is empty.
          </div>
        ) : (
          pendingTracks.map((t) => (
            <div key={t.id} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                  <Music size={20} className="text-zinc-500" />
                </div>
                <div>
                  <p className="font-bold">{t.title}</p>
                  <p className="text-xs text-zinc-500">by {t.displayArtistName} • {t.genre}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction(t.id, 'reject')}
                  className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleAction(t.id, 'approve')}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-xl text-xs font-bold hover:bg-zinc-600 transition-all"
                >
                  Approve & Distribute
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
