import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/apiFetch';
import { Track } from '../../types';
import { Input } from '../../components/ui/Form';
import { toast } from '../../components/ui/Toast';
import { Plus, Trash2, Save, RefreshCw, Layers } from 'lucide-react';

interface TrackSplitsManagerProps {
  track: Track;
}

interface SplitItem {
  artistId: string;
  artistName: string;
  ownershipShare: number;
  publishingShare: number;
  mechanicalShare: number;
  neighboringShare: number;
}

export const TrackSplitsManager = ({ track }: TrackSplitsManagerProps) => {
  const [loading, setLoading] = useState(false);
  const [splits, setSplits] = useState<SplitItem[]>([]);

  const fetchSplits = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any[]>(`/api/v1/finance/royalties/splits/${track.id}`);
      if (data && data.length > 0) {
        setSplits(
          data.map(item => ({
            artistId: item.artist_id || item.artistId || '',
            artistName: item.artistName || item.artist_name || item.artist_id || 'Collaborator',
            ownershipShare: item.ownership_share ?? item.ownershipShare ?? 100,
            publishingShare: item.publishing_share ?? item.publishingShare ?? 100,
            mechanicalShare: item.mechanical_share ?? item.mechanicalShare ?? 100,
            neighboringShare: item.neighboring_share ?? item.neighboringShare ?? 100,
          }))
        );
      } else {
        // Default with 100% split for the track owner
        setSplits([
          {
            artistId: track.primaryArtistId || (track as any).artist_id || 'primary_owner',
            artistName: track.displayArtistName || (track as any).artist || 'You',
            ownershipShare: 100,
            publishingShare: 100,
            mechanicalShare: 100,
            neighboringShare: 100,
          }
        ]);
      }
    } catch (err) {
      console.error('[Fetch Splits Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSplits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.id]);

  const handleAddCollaborator = () => {
    setSplits([
      ...splits,
      {
        artistId: `art_${Math.random().toString(36).substr(2, 5)}`,
        artistName: '',
        ownershipShare: 0,
        publishingShare: 100,
        mechanicalShare: 100,
        neighboringShare: 100,
      }
    ]);
  };

  const handleUpdateSplit = (index: number, field: keyof SplitItem, value: any) => {
    const updated = [...splits];
    if (field === 'artistName' || field === 'artistId') {
      updated[index][field] = value;
    } else {
      updated[index][field] = Number(value);
    }
    setSplits(updated);
  };

  const handleRemoveCollaborator = (index: number) => {
    const updated = splits.filter((_, i) => i !== index);
    setSplits(updated);
  };

  const handleSave = async () => {
    const totalOwnership = splits.reduce((sum, item) => sum + item.ownershipShare, 0);
    if (totalOwnership !== 100) {
      toast.error(`Total Ownership Share must be exactly 100%. Currently it is ${totalOwnership}%.`);
      return;
    }

    // Validate names are present
    if (splits.some(item => !item.artistName.trim())) {
      toast.error('All collaborator names/IDs must be filled out.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/api/v1/finance/royalties/splits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackId: track.id,
          splits: splits.map(s => ({
            artistId: s.artistId,
            ownershipShare: s.ownershipShare,
            publishingShare: s.publishingShare,
            mechanicalShare: s.mechanicalShare,
            neighboringShare: s.neighboringShare,
          }))
        })
      });
      toast.success(`Royalty splits for "${track.title}" successfully persisted.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to persist rights ownership splits.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-zinc-950/60 border border-white/5 rounded-2xl space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
            <Layers size={20} />
          </div>
          <div>
            <h4 className="font-bold text-white text-base">{track.title}</h4>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-black mt-0.5">{track.genre} • ISRC: {track.isrc || 'Pending'}</p>
          </div>
        </div>
        <button 
          onClick={fetchSplits} 
          disabled={loading}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 text-[10px] text-zinc-500 uppercase font-black tracking-widest px-2">
          <div className="col-span-4">Collaborator (Artist / Email)</div>
          <div className="col-span-2 text-center">Ownership %</div>
          <div className="col-span-2 text-center">Publishing %</div>
          <div className="col-span-2 text-center">Mechanical %</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        {splits.map((split, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-black/30 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="col-span-4">
              <Input
                defaultValue={split.artistName}
                placeholder="Enter Name / Creator ID"
                containerClassName="mb-0"
                className="bg-zinc-900/80 border-white/10 text-sm py-2 px-3 h-9"
                onChange={(e) => handleUpdateSplit(idx, 'artistName', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                defaultValue={split.ownershipShare}
                containerClassName="mb-0"
                className="bg-zinc-900/80 border-white/10 text-center text-sm py-2 px-2 h-9"
                onChange={(e) => handleUpdateSplit(idx, 'ownershipShare', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                defaultValue={split.publishingShare}
                containerClassName="mb-0"
                className="bg-zinc-900/80 border-white/10 text-center text-sm py-2 px-2 h-9"
                onChange={(e) => handleUpdateSplit(idx, 'publishingShare', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                defaultValue={split.mechanicalShare}
                containerClassName="mb-0"
                className="bg-zinc-900/80 border-white/10 text-center text-sm py-2 px-2 h-9"
                onChange={(e) => handleUpdateSplit(idx, 'mechanicalShare', e.target.value)}
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <button
                onClick={() => handleRemoveCollaborator(idx)}
                disabled={splits.length === 1}
                className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-white/5 gap-4">
        <button
          onClick={handleAddCollaborator}
          className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors py-2 px-4 rounded-xl hover:bg-emerald-500/10"
        >
          <Plus size={16} />
          Add Collaborator Split
        </button>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          <div className="text-right pr-2">
            <span className="text-xs text-zinc-500">Total Ownership: </span>
            <span className={`text-sm font-black ${splits.reduce((sum, item) => sum + item.ownershipShare, 0) === 100 ? "text-emerald-400" : "text-yellow-500"}`}>
              {splits.reduce((sum, item) => sum + item.ownershipShare, 0)}%
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-zinc-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-600 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
          >
            <Save size={16} />
            Save Track Splits
          </button>
        </div>
      </div>
    </div>
  );
};
