import { useState, useEffect } from 'react';
import { X, Save, Loader2, DollarSign, Music, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track } from '../../types';
import { api } from '../../api';
import { toast } from '../../components/ui/Toast';

interface TrackEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onSuccess: () => void;
}

export const TrackEditModal = ({ isOpen, onClose, track, onSuccess }: TrackEditModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    price: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (track) {
      setFormData({
        title: track.title || '',
        genre: track.genre || '',
        price: track.price || 0
      });
    }
  }, [track]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!track) return;

    setIsSaving(true);
    try {
      await api.tracks.update(track.id, formData);
      toast.success('Track updated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update track');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !track) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
        >
          <header className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                <Music size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Edit Track</h2>
                <p className="text-zinc-500 text-sm">Update your track details.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white/5 text-zinc-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all"
            >
              <X size={24} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Music size={12} />
                Track Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-emerald-500 outline-none transition-all"
                placeholder="Enter track title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} />
                Genre
              </label>
              <select
                required
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-emerald-500 outline-none transition-all appearance-none"
              >
                <option value="">Select Genre</option>
                {['Hip-Hop', 'R&B', 'Afrobeats', 'Electronic', 'Pop', 'Jazz', 'Rock', 'Classical'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <DollarSign size={12} />
                Price ($)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-emerald-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 bg-zinc-700 text-white font-black rounded-2xl hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
