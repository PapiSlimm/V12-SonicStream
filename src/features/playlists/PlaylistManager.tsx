import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Play, 
  Trash2, 
  Search, 
  X, 
  Check,
  ListMusic,
  Share2,
  Users,
  Lock,
  Globe,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '../../firebase';
import { Playlist, Track } from '../../types';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import { api } from '../../api';
import { useTrack } from '../../context/TrackContext';
import { useDebounce } from '../../hooks/useDebounce';
import { TrackList } from './TrackList';
import { ErrorBoundary } from '../../components/ErrorBoundary';

export const PlaylistManager = () => {
  const queryClient = useQueryClient();
  const { currentTrack } = useTrack();
  
  // UI State
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const debouncedUserSearch = useDebounce(userSearchQuery, 300);
  
  // Create Modal State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isCollaborative, setIsCollaborative] = useState(false);

  // Queries
  const { data: playlists = [], isLoading: loading } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => api.playlists.getAll()
  });

  const { data: selectedPlaylist, isLoading: loadingDetails } = useQuery({
    queryKey: ['playlist', selectedPlaylistId],
    queryFn: () => selectedPlaylistId ? api.playlists.getById(selectedPlaylistId) : null,
    enabled: !!selectedPlaylistId
  });

  const { data: userSearchResults = [], isFetching: isSearchingUsers } = useQuery({
    queryKey: ['user-search', debouncedUserSearch],
    queryFn: () => debouncedUserSearch.length >= 2 ? api.user.search(debouncedUserSearch) : [],
    enabled: debouncedUserSearch.length >= 2
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.playlists.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      toast.success('Playlist created!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.playlists.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      if (selectedPlaylistId) setSelectedPlaylistId(null);
      toast.success('Playlist deleted');
    }
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, trackIds }: { id: string, trackIds: string[] }) => api.playlists.reorder(id, trackIds),
    onMutate: async ({ id, trackIds }) => {
      await queryClient.cancelQueries({ queryKey: ['playlist', id] });
      const previousPlaylist = queryClient.getQueryData(['playlist', id]);
      
      // Optimistically update the tracks order
      if (previousPlaylist) {
        const playlist = previousPlaylist as any;
        const tracksMap = new Map(playlist.tracks.map((t: any) => [t.id, t]));
        const reorderedTracks = trackIds.map(tid => tracksMap.get(tid)).filter(Boolean);
        
        queryClient.setQueryData(['playlist', id], {
          ...playlist,
          tracks: reorderedTracks
        });
      }
      
      return { previousPlaylist };
    },
    onError: (_err, variables, context) => {
      if (context?.previousPlaylist) {
        queryClient.setQueryData(['playlist', variables.id], context.previousPlaylist);
      }
      toast.error('Failed to save order');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.id] });
    }
  });

  const removeTrackMutation = useMutation({
    mutationFn: ({ id, trackId }: { id: string, trackId: string }) => api.playlists.removeTrack(id, trackId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.id] });
      toast.success('Track removed');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.playlists.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    }
  });

  const addCollabMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string, userId: string }) => api.playlists.addCollaborator(id, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.id] });
      setUserSearchQuery('');
      toast.success('Collaborator added');
    }
  });

  const removeCollabMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string, userId: string }) => api.playlists.removeCollaborator(id, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.id] });
      toast.success('Collaborator removed');
    }
  });

  const isOwner = selectedPlaylist?.userId === auth.currentUser?.uid;
  const canEdit = isOwner || selectedPlaylist?.collaborators?.some((c: any) => c.userId === auth.currentUser?.uid && c.role === 'editor');

  const handleCreatePlaylist = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({
      title: newTitle,
      description: newDescription,
      isPublic: isPublic,
      isCollaborative: isCollaborative,
      coverType: 'collage'
    });
  };

  const handleReorder = (newTracks: Track[]) => {
    if (!selectedPlaylistId) return;
    reorderMutation.mutate({
      id: selectedPlaylistId,
      trackIds: newTracks.map(t => t.id)
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPlaylistId || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const toastId = toast.loading('Uploading cover art...');
    try {
      const { url } = await api.tracks.uploadFile(file);
      await updateMutation.mutateAsync({
        id: selectedPlaylistId,
        data: { coverUrl: url, coverType: 'custom' }
      });
      toast.success('Cover art updated!', { id: toastId });
    } catch {
      toast.error('Failed to upload cover art', { id: toastId });
    }
  };

  const renderCover = (playlist: Playlist | (Playlist & { tracks: Track[] }), size: 'sm' | 'lg' = 'sm') => {
    const tracks = 'tracks' in playlist ? playlist.tracks : [];
    const collageTracks = tracks.slice(0, 4);

    // 1. Cyberpunk Style
    if (playlist.coverType === 'cyberpunk') {
      return (
        <div className={cn(
          "bg-black border border-emerald-500/30 flex items-center justify-center shrink-0 overflow-hidden relative group/cover shadow-2xl",
          size === 'sm' ? "w-12 h-12 rounded-xl" : "w-48 h-48 rounded-[32px]"
        )}>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.06)_1px,transparent_1px)] bg-[size:8px_8px]" />
          <div className="absolute top-1 right-1 w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
          <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-pink-500 rounded-full" />
          <span className={cn(
            "font-mono font-black text-emerald-400 tracking-tighter relative z-10 select-none",
            size === 'sm' ? "text-xs" : "text-3xl"
          )}>
            {playlist.title.slice(0, 3).toUpperCase()}
          </span>
        </div>
      );
    }

    // 2. Fluid Gradient Style
    if (playlist.coverType === 'gradient') {
      const charCodeSum = playlist.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const gradients = [
        "bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500",
        "bg-gradient-to-br from-emerald-400 via-teal-600 to-indigo-600",
        "bg-gradient-to-br from-rose-500 via-orange-500 to-yellow-500",
        "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-500",
      ];
      const selectedGradient = gradients[charCodeSum % gradients.length];
      return (
        <div className={cn(
          "flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xl transition-all",
          selectedGradient,
          size === 'sm' ? "w-12 h-12 rounded-xl" : "w-48 h-48 rounded-[32px]"
        )}>
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />
          <span className={cn(
            "font-serif font-black text-white tracking-widest relative z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]",
            size === 'sm' ? "text-lg" : "text-6xl"
          )}>
            {playlist.title.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    }

    // 3. Minimal Monochrome Frame
    if (playlist.coverType === 'minimal') {
      return (
        <div className={cn(
          "bg-zinc-950 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xl",
          size === 'sm' ? "w-12 h-12 rounded-xl" : "w-48 h-48 rounded-[32px]"
        )}>
          <div className="absolute inset-2 border border-white/5 rounded-2xl" />
          <span className={cn(
            "font-serif font-bold text-zinc-300 relative z-10",
            size === 'sm' ? "text-sm" : "text-4xl"
          )}>
            {playlist.title.slice(0, 2).toUpperCase()}
          </span>
        </div>
      );
    }

    // 4. Track Collage (Default)
    if ((playlist.coverType === 'collage' || !playlist.coverType) && collageTracks.length > 0) {
      return (
        <div className={cn(
          "grid gap-0.5 bg-zinc-800 overflow-hidden shadow-2xl",
          collageTracks.length === 1 ? "grid-cols-1 grid-rows-1" : 
          collageTracks.length === 2 ? "grid-cols-2 grid-rows-1" : 
          collageTracks.length === 3 ? "grid-cols-2 grid-rows-2" : "grid-cols-2 grid-rows-2",
          size === 'sm' ? "w-12 h-12 rounded-xl" : "w-48 h-48 rounded-[32px]"
        )}>
          {collageTracks.map((t, i) => (
            <img 
              key={t.id} 
              src={t.coverUrl || `https://picsum.photos/seed/${t.id}/100/100`} 
              alt="" 
              className={cn(
                "w-full h-full object-cover",
                collageTracks.length === 3 && i === 0 ? "row-span-2" : ""
              )}
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      );
    }

    // 5. Fallback Default Icon
    return (
      <div className={cn(
        "bg-zinc-800 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden shadow-2xl",
        size === 'sm' ? "w-12 h-12 rounded-xl" : "w-48 h-48 rounded-[32px]"
      )}>
        {playlist.coverUrl ? (
          <img src={playlist.coverUrl} alt={playlist.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <ListMusic size={size === 'sm' ? 24 : 64} className="text-zinc-600" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent tracking-tighter">
            V12 Playlists
          </h1>
          <p className="text-zinc-400">Curate, collaborate, and share your sound.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-zinc-700 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-black/20"
        >
          <Plus size={20} />
          Create New
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar: Playlist List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-zinc-900/40 border border-white/10 rounded-[32px] p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Search playlists..." 
                className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto no-scrollbar">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-emerald-500" />
                </div>
              ) : playlists.length === 0 ? (
                <p className="text-center text-zinc-500 text-xs py-8">No playlists found.</p>
              ) : (
                playlists.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlaylistId(p.id)}
                    className={cn(
                      "w-full p-4 rounded-2xl flex items-center gap-4 transition-all group",
                      selectedPlaylistId === p.id ? "bg-zinc-700 text-white" : "hover:bg-white/5 text-zinc-400"
                    )}
                  >
                    {renderCover(p, 'sm')}
                    <div className="text-left overflow-hidden">
                      <p className="font-bold truncate">{p.title}</p>
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          selectedPlaylistId === p.id ? "text-black/60" : "text-zinc-600"
                        )}>
                          {p.trackIds?.length || 0} Tracks
                        </p>
                        {p.isCollaborative && <Users size={10} className={selectedPlaylistId === p.id ? "text-black/60" : "text-emerald-500"} />}
                        {!p.isPublic && <Lock size={10} className={selectedPlaylistId === p.id ? "text-black/60" : "text-zinc-600"} />}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Playlist Editor */}
        <div className="lg:col-span-3">
          <ErrorBoundary>
            {loadingDetails ? (
              <div className="bg-zinc-900/40 border border-white/10 rounded-[40px] h-full min-h-[600px] flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
              </div>
            ) : selectedPlaylist ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/40 border border-white/10 rounded-[40px] overflow-hidden"
              >
                <div className="p-8 bg-gradient-to-b from-emerald-500/10 to-transparent flex flex-col md:flex-row gap-8 items-end">
                  <div className="relative group">
                    {renderCover(selectedPlaylist, 'lg')}
                    {canEdit && (
                      <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[32px]">
                        <ImageIcon size={32} className="text-white mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Upload Cover</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                      </label>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                        <Check size={14} />
                        {isOwner ? 'Your Playlist' : 'Collaborative Playlist'}
                      </div>
                      <button 
                        onClick={() => updateMutation.mutate({ id: selectedPlaylist.id, data: { isPublic: !selectedPlaylist.isPublic } })}
                        disabled={!canEdit}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                          selectedPlaylist.isPublic ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500",
                          !canEdit && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {selectedPlaylist.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                        {selectedPlaylist.isPublic ? 'Public' : 'Private'}
                      </button>
                      <button 
                        onClick={() => updateMutation.mutate({ id: selectedPlaylist.id, data: { isCollaborative: !selectedPlaylist.isCollaborative } })}
                        disabled={!isOwner}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                          selectedPlaylist.isCollaborative ? "bg-blue-500/10 text-blue-500" : "bg-zinc-800 text-zinc-500",
                          !isOwner && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Users size={12} />
                        {selectedPlaylist.isCollaborative ? 'Collaborative' : 'Personal'}
                      </button>
                    </div>
                    <h2 className="text-5xl font-black text-white tracking-tighter">{selectedPlaylist.title}</h2>
                    <p className="text-zinc-400 font-medium">{selectedPlaylist.description || 'No description provided.'}</p>
                    
                    {canEdit && (
                      <div className="pt-2 flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Art Generation/Visual Theme</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'collage', label: '📸 Collage', desc: 'Auto track covers grid' },
                            { key: 'gradient', label: '🌈 Gradient', desc: 'Dynamic mesh aura' },
                            { key: 'cyberpunk', label: '🧪 Matrix', desc: 'Neon cyberpunk grid' },
                            { key: 'minimal', label: '🖤 Minimal', desc: 'Classy monochrome frame' },
                          ].map((style) => (
                            <button
                              key={style.key}
                              onClick={() => {
                                updateMutation.mutate({
                                  id: selectedPlaylist.id,
                                  data: { coverType: style.key }
                                });
                                toast.success(`Playlist visual style set to ${style.label}!`);
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-left border transition-all flex flex-col gap-0.5",
                                selectedPlaylist.coverType === style.key || (style.key === 'collage' && !selectedPlaylist.coverType)
                                  ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                                  : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                              )}
                            >
                              <span className="text-xs font-black">{style.label}</span>
                              <span className="text-[9px] text-zinc-500 font-medium">{style.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-6 pt-4">
                      <button className="bg-zinc-700 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-black/20">
                        <Play size={20} fill="currentColor" />
                        Play All
                      </button>
                      <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all">
                        <Share2 size={20} />
                      </button>
                      {selectedPlaylist.isCollaborative && (
                        <button 
                          onClick={() => setShowCollaboratorsModal(true)}
                          className="flex items-center gap-2 px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-2xl text-blue-400 transition-all border border-blue-500/20"
                        >
                          <Users size={20} />
                          <span className="text-xs font-black uppercase tracking-widest">Collaborators</span>
                        </button>
                      )}
                      {isOwner && (
                        <button 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this playlist?')) {
                              deleteMutation.mutate(selectedPlaylist.id);
                            }
                          }}
                          className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-500 transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <TrackList 
                    tracks={selectedPlaylist.tracks}
                    currentTrackId={currentTrack?.id}
                    onReorder={handleReorder}
                    onRemove={(trackId) => removeTrackMutation.mutate({ id: selectedPlaylist.id, trackId })}
                  />
                </div>
              </motion.div>
            ) : (
              <div className="bg-zinc-900/40 border border-white/10 rounded-[40px] h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-32 h-32 bg-zinc-800/50 rounded-[40px] flex items-center justify-center border border-white/5">
                  <ListMusic className="text-zinc-700" size={64} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tighter">No Playlist Selected</h2>
                  <p className="text-zinc-500 max-w-md mx-auto">Select a playlist from the sidebar or create a new one to start managing your music.</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white text-black px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all"
                >
                  Create Your First Playlist
                </button>
              </div>
            )}
          </ErrorBoundary>
        </div>
      </div>

      {/* Create Playlist Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-black text-white">New Playlist</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="My Awesome Mix"
                    className="w-full bg-zinc-800 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Description (Optional)</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="What's the vibe?"
                    className="w-full bg-zinc-800 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-emerald-500 outline-none h-24 resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsPublic(!isPublic)}
                    className={cn(
                      "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                      isPublic ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-zinc-800 border-white/5 text-zinc-500"
                    )}
                  >
                    {isPublic ? <Globe size={20} /> : <Lock size={20} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{isPublic ? 'Public' : 'Private'}</span>
                  </button>
                  <button 
                    onClick={() => setIsCollaborative(!isCollaborative)}
                    className={cn(
                      "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                      isCollaborative ? "bg-blue-500/10 border-blue-500 text-blue-500" : "bg-zinc-800 border-white/5 text-zinc-500"
                    )}
                  >
                    <Users size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isCollaborative ? 'Collaborative' : 'Personal'}</span>
                  </button>
                </div>

                <button
                  onClick={handleCreatePlaylist}
                  className="w-full bg-zinc-700 text-white font-black py-5 rounded-2xl hover:bg-zinc-600 transition-all shadow-xl shadow-black/20"
                >
                  Create Playlist
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collaborators Modal */}
      <AnimatePresence>
        {showCollaboratorsModal && selectedPlaylist && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-black text-white">Collaborators</h3>
                <button onClick={() => setShowCollaboratorsModal(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Add Collaborator</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full bg-zinc-800 border border-white/10 rounded-2xl px-10 py-4 text-sm text-white focus:border-emerald-500 outline-none"
                    />
                    {isSearchingUsers && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-emerald-500" size={16} />
                      </div>
                    )}
                  </div>

                  {userSearchResults.length > 0 && (
                    <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                      {userSearchResults.map(user => (
                        <button
                          key={user.id}
                          onClick={() => addCollabMutation.mutate({ id: selectedPlaylist.id, userId: user.id })}
                          className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-all text-left"
                        >
                          <img src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/40/40`} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                          </div>
                          <Plus size={14} className="ml-auto text-emerald-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Current Collaborators</label>
                  <div className="space-y-2">
                    {selectedPlaylist.collaborators.map(collab => (
                      <div key={collab.userId} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                        <img src={collab.avatarUrl || `https://picsum.photos/seed/${collab.userId}/40/40`} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{collab.name}</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{collab.role}</p>
                        </div>
                        {isOwner && collab.role !== 'owner' && (
                          <button 
                            onClick={() => removeCollabMutation.mutate({ id: selectedPlaylist.id, userId: collab.userId })}
                            className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
