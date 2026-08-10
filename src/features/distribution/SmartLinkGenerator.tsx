import { useState, useEffect } from 'react';
import { Link2, Copy, ExternalLink, Globe, Music, BarChart2, Plus, Trash2 } from 'lucide-react';
import { SmartLink, Track } from '../../types';
import { api } from '../../api';
import { Input } from '../../components/ui/Form';
import { toast } from '../../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

export const SmartLinkGenerator = () => {
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newLink, setNewLink] = useState({
    trackId: '',
    slug: '',
    title: '',
    releaseDate: new Date().toISOString().split('T')[0],
    platforms: {
      spotify: '',
      appleMusic: '',
      sonicstream: ''
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [linksData, tracksData] = await Promise.all([
        api.distribution.getSmartLinks(),
        api.tracks.getArtistTracks()
      ]);
      setLinks(linksData || []);
      setTracks(tracksData || []);
    } catch (err) {
      console.error('Failed to fetch smart links data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.trackId || !newLink.slug) {
      toast.error('Please select a track and enter a slug');
      return;
    }

    try {
      const selectedTrack = tracks.find(t => t.id === newLink.trackId);
      const payload = {
        ...newLink,
        title: newLink.title || selectedTrack?.title || 'New Release',
        coverUrl: selectedTrack?.coverUrl,
        platforms: {
          ...newLink.platforms,
          sonicstream: `${window.location.origin}/track/${newLink.trackId}`
        }
      };

      await api.distribution.createSmartLink(payload);
      toast.success('Smart Link created successfully!');
      setIsCreating(false);
      fetchData();
    } catch {
      toast.error('Failed to create Smart Link');
    }
  };

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/release/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight">Smart Links</h3>
          <p className="text-zinc-500 text-sm">Create high-conversion landing pages for your releases.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-600 transition-all shadow-lg shadow-black/20"
        >
          <Plus size={18} />
          Create New Link
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-zinc-900/50 border border-white/5 rounded-[32px] p-8 space-y-6"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-black uppercase tracking-tight">New Smart Link</h4>
              <button onClick={() => setIsCreating(false)} className="text-zinc-500 hover:text-white">Cancel</button>
            </div>

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Track</label>
                  <select
                    value={newLink.trackId}
                    onChange={(e) => {
                      const track = tracks.find(t => t.id === e.target.value);
                      setNewLink({ 
                        ...newLink, 
                        trackId: e.target.value,
                        title: track?.title || '',
                        slug: track?.title.toLowerCase().replace(/\s+/g, '-') || ''
                      });
                    }}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none"
                  >
                    <option value="">Select a track...</option>
                    {tracks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Custom Slug"
                  placeholder="my-awesome-release"
                  value={newLink.slug}
                  onChange={e => setNewLink({ ...newLink, slug: e.target.value })}
                />

                <Input
                  label="Release Date"
                  type="date"
                  value={newLink.releaseDate}
                  onChange={e => setNewLink({ ...newLink, releaseDate: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Store Links (Optional)</label>
                <Input
                  placeholder="Spotify URL"
                  value={newLink.platforms.spotify}
                  onChange={e => setNewLink({ ...newLink, platforms: { ...newLink.platforms, spotify: e.target.value } })}
                />
                <Input
                  placeholder="Apple Music URL"
                  value={newLink.platforms.appleMusic}
                  onChange={e => setNewLink({ ...newLink, platforms: { ...newLink.platforms, appleMusic: e.target.value } })}
                />
              </div>

              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20"
                >
                  Generate Smart Link
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {links.map((link) => (
          <div key={link.id} className="bg-zinc-900/50 border border-white/5 rounded-[32px] p-6 space-y-6 group hover:border-emerald-500/20 transition-all">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-zinc-800 rounded-2xl overflow-hidden shrink-0 border border-white/5">
                {link.coverUrl ? (
                  <img src={link.coverUrl} alt={link.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Music size={32} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold truncate">{link.title}</h4>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">
                  Release: {new Date(link.releaseDate).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <BarChart2 size={14} />
                    <span className="text-xs font-bold">{link.visits} Visits</span>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-500">
                    <Globe size={14} />
                    <span className="text-xs font-bold">{Object.values(link.platforms).filter(Boolean).length} Stores</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 truncate">/release/{link.slug}</span>
                <button onClick={() => copyToClipboard(link.slug)} className="text-emerald-400 hover:text-emerald-300">
                  <Copy size={14} />
                </button>
              </div>
              <button 
                onClick={() => window.open(`${window.location.origin}/release/${link.slug}`, '_blank')}
                className="p-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all"
              >
                <ExternalLink size={18} />
              </button>
              <button 
                onClick={async () => {
                  try {
                    await api.distribution.deleteSmartLink(link.id);
                    toast.success('Smart Link deleted');
                    fetchData();
                  } catch {
                    toast.error('Failed to delete');
                  }
                }}
                className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {links.length === 0 && !isCreating && (
          <div className="md:col-span-2 py-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-[48px]">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700">
              <Link2 size={32} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-zinc-400">No Smart Links yet</p>
              <p className="text-xs text-zinc-600">Create your first landing page to boost your streams.</p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-2 bg-zinc-800 text-white rounded-xl text-xs font-bold hover:bg-zinc-700 transition-all"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
