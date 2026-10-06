import { useState, useEffect } from 'react';
import { 
  Music, 
  Plus, 
  Globe, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  BarChart3,
  ExternalLink,
  Edit3,
  Video,
  FileAudio,
  Undo2,
  Redo2,
  UploadCloud,
  Wand2,
  ListMusic,
  Share2
} from 'lucide-react';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { cn } from '../../utils/cn';
import { useHistory } from '../../hooks/useHistory';
import { MasteringStudio } from '../mastering/MasteringStudio';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import toast from 'react-hot-toast';
import { api } from '../../api';
import { Track } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

const CatalogManager = () => {
  const [releases, setReleases] = useState<Track[]>([]);
  const [showNewRelease, setShowNewRelease] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'audio' | 'video'>('audio');
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTrackForMastering, setSelectedTrackForMastering] = useState<Track | null>(null);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);
  const [selectedTrackForDistribution, setSelectedTrackForDistribution] = useState<Track | null>(null);
  const [distributionPlatforms, setDistributionPlatforms] = useState<string[]>([]);

  const platforms = [
    { id: 'tiktok', name: 'TikTok', icon: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png' },
    { id: 'amazon', name: 'Amazon Music', icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968250.png' }
  ];

  const handleDistribute = async () => {
    toast.error('Music distribution services are currently disabled.');
    setSelectedTrackForDistribution(null);
  };

  const { 
    state: formData, 
    set: setFormData, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useHistory({
    title: '',
    displayArtistName: '',
    genre: 'Electronic',
    price: 0.99,
    isrc: ''
  });

  const [stats, setStats] = useState({
    draft: 0,
    ready_for_review: 0,
    submitted: 0,
    live: 0
  });

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const data = await api.tracks.getAll();
      if (data && Array.isArray(data)) {
        setReleases(data);
        
        // Calculate stats locally
        const counts = data.reduce((acc: any, track: any) => {
          acc[track.status] = (acc[track.status] || 0) + 1;
          return acc;
        }, {});
        setStats({
          draft: counts.pending || 0,
          ready_for_review: counts.processing || 0,
          submitted: counts.mastering || 0,
          live: counts.live || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadProgress(10); // Start progress

    try {
      const data = new FormData();
      data.append('file', uploadFile);
      data.append('data', JSON.stringify({
        title: formData.title,
        displayArtistName: formData.displayArtistName,
        genre: formData.genre,
        price: Number(formData.price || 0.99),
        isVideo: fileType === 'video'
      }));

      setUploadProgress(35);
      await api.tracks.upload(data);

      setUploadProgress(100);
      toast.success('Upload successful!');
      setShowNewRelease(false);
      setUploadFile(null);
      fetchCatalog();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        setUploadFile(file);
        setFileType(file.type.startsWith('audio/') ? 'audio' : 'video');
      } else {
        toast.error('Please drop an audio or video file');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'submitted': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'ready_for_review': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'mastering': return 'text-purple-400 bg-purple-400/10 border-purple-400/20 animate-pulse';
      case 'processing': return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20 animate-pulse';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500">Loading catalog...</div>;

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">V12 SonicStream Catalog</h1>
          <p className="text-zinc-400">Manage your releases, metadata, and global distribution.</p>
        </div>
        <button 
          onClick={() => setShowNewRelease(true)}
          className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          New Release
        </button>
      </div>

      {showNewRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-4xl p-10 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black">Create New Release</h2>
              <button onClick={() => setShowNewRelease(false)} className="p-2 hover:bg-white/5 rounded-full"><Plus className="rotate-45" /></button>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setFileType('audio')}
                    className={cn("px-6 py-3 rounded-2xl border flex items-center justify-center gap-2 transition-all", fileType === 'audio' ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-white/5 border-white/10 text-zinc-400')}
                  >
                    <FileAudio size={20} />
                    Audio Track
                  </button>
                  <button 
                    onClick={() => setFileType('video')}
                    className={cn("px-6 py-3 rounded-2xl border flex items-center justify-center gap-2 transition-all", fileType === 'video' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white/5 border-white/10 text-zinc-400')}
                  >
                    <Video size={20} />
                    Music Video
                  </button>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={undo} 
                    disabled={!canUndo}
                    className="p-3 bg-zinc-800 text-zinc-400 rounded-xl disabled:opacity-30 hover:text-white transition-all"
                    title="Undo"
                  >
                    <Undo2 size={20} />
                  </button>
                  <button 
                    onClick={redo} 
                    disabled={!canRedo}
                    className="p-3 bg-zinc-800 text-zinc-400 rounded-xl disabled:opacity-30 hover:text-white transition-all"
                    title="Redo"
                  >
                    <Redo2 size={20} />
                  </button>
                </div>
              </div>

              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all group",
                  isDragging ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 hover:border-white/20 bg-black/20"
                )}
              >
                <input 
                  type="file" 
                  accept={fileType === 'audio' ? 'audio/*' : 'video/*'}
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <UploadCloud size={40} className={isDragging ? "text-emerald-400" : "text-zinc-500"} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">
                      {uploadFile ? uploadFile.name : `Drop your ${fileType} here`}
                    </p>
                    <p className="text-zinc-500 mt-1">or click to browse files</p>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-emerald-400">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadFile && fileType === 'audio' && (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-zinc-500 uppercase">V12 Visualizer Preview</label>
                  <AudioVisualizer audioFile={uploadFile} className="w-full bg-black rounded-2xl border border-white/5" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Release Title</label>
                  <input 
                    placeholder="e.g. Neon Pulse" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-zinc-800 border border-white/5 rounded-2xl p-4" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Artist</label>
                  <input 
                    placeholder="e.g. V12 Collective" 
                    value={formData.displayArtistName}
                    onChange={e => setFormData({...formData, displayArtistName: e.target.value})}
                    className="w-full bg-zinc-800 border border-white/5 rounded-2xl p-4" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Genre</label>
                  <select 
                    value={formData.genre}
                    onChange={e => setFormData({...formData, genre: e.target.value})}
                    className="w-full bg-zinc-800 border border-white/5 rounded-2xl p-4"
                  >
                    <option>Electronic</option>
                    <option>Hip Hop</option>
                    <option>Rock</option>
                    <option>Jazz</option>
                    <option>Classical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Price ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full bg-zinc-800 border border-white/5 rounded-2xl p-4" 
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">ISRC Code (Optional)</label>
                  <input 
                    placeholder="US-ABC-23-00001" 
                    value={formData.isrc}
                    onChange={e => setFormData({...formData, isrc: e.target.value})}
                    className="w-full bg-zinc-800 border border-white/5 rounded-2xl p-4" 
                  />
                </div>
              </div>

              <button 
                onClick={handleUpload}
                disabled={isUploading || !uploadFile}
                className="w-full h-16 bg-zinc-700 text-white font-black text-xl rounded-3xl hover:bg-zinc-600 transition-all disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Submit for Distribution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending', value: stats.draft, icon: Edit3, color: 'zinc' },
          { label: 'Processing', value: stats.ready_for_review, icon: Clock, color: 'yellow' },
          { label: 'Mastering', value: stats.submitted, icon: Wand2, color: 'purple' },
          { label: 'Live on DSPs', value: stats.live, icon: Globe, color: 'emerald' }
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
                <stat.icon size={24} />
              </div>
              <span className="text-emerald-400 text-xs font-bold">+12%</span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
            <div className="text-zinc-500 text-sm font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Release List */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Your Releases</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-sm font-medium hover:text-white transition-all">All</button>
            <button className="px-4 py-2 text-zinc-500 rounded-lg text-sm font-medium hover:text-white transition-all">Live</button>
            <button className="px-4 py-2 text-zinc-500 rounded-lg text-sm font-medium hover:text-white transition-all">Pending</button>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {releases.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Music size={48} className="mx-auto mb-4 opacity-20" />
              <p>No releases found in your catalog.</p>
            </div>
          ) : (
            releases.map(release => (
              <div key={release.id} className="p-6 hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-zinc-800 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 shadow-xl">
                    {release.coverUrl ? (
                      <img src={release.coverUrl} alt={release.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        {release.isVideo ? <Video size={32} /> : <Music size={32} />}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-white truncate">{release.title}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(release.status)}`}>
                        {release.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span className="font-medium">{release.displayArtistName}</span>
                      <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                      <span>{release.genre}</span>
                      <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                      <span>ISRC: {release.isrc || 'Pending'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4 hidden md:block">
                      <div className="text-xs text-zinc-500 mb-1">Price</div>
                      <div className="text-sm font-bold text-emerald-400">${release.price}</div>
                    </div>
                    
                    {release.status === 'live' && !release.isVideo && (
                      <button 
                        onClick={() => setSelectedTrackForMastering(release)}
                        className="p-3 bg-zinc-700/10 hover:bg-zinc-700 text-emerald-400 hover:text-white rounded-xl transition-all"
                        title="AI Mastering"
                      >
                        <Wand2 size={20} />
                      </button>
                    )}

                    <button 
                      onClick={() => setSelectedTrackForPlaylist(release)}
                      className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all"
                      title="Add to Playlist"
                    >
                      <ListMusic size={20} />
                    </button>

                    <button 
                      onClick={() => setSelectedTrackForDistribution(release)}
                      className="p-3 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-black rounded-xl transition-all"
                      title="Distribute"
                    >
                      <Globe size={20} />
                    </button>

                    <button className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all">
                      <BarChart3 size={20} />
                    </button>
                    <button className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all">
                      <Edit3 size={20} />
                    </button>
                    <button className="p-3 bg-zinc-700/10 hover:bg-zinc-700 text-emerald-400 hover:text-white rounded-xl transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedTrackForMastering && (
        <MasteringStudio 
          track={selectedTrackForMastering} 
          onClose={() => {
            setSelectedTrackForMastering(null);
            fetchCatalog();
          }} 
        />
      )}

      <AnimatePresence>
        {selectedTrackForPlaylist && (
          <AddToPlaylistModal 
            track={selectedTrackForPlaylist} 
            onClose={() => setSelectedTrackForPlaylist(null)} 
          />
        )}

        {selectedTrackForDistribution && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[40px] overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Globe className="text-blue-500" size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white">Distribute Release</h3>
                </div>
                <button onClick={() => setSelectedTrackForDistribution(null)} className="text-zinc-500 hover:text-white">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                  <div className="w-20 h-20 bg-zinc-800 rounded-2xl overflow-hidden shrink-0">
                    <img src={selectedTrackForDistribution.coverUrl || 'https://picsum.photos/seed/track/100/100'} alt={selectedTrackForDistribution.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-white tracking-tight">{selectedTrackForDistribution.title}</h4>
                    <p className="text-zinc-500 font-medium">{selectedTrackForDistribution.displayArtistName}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Select Platforms</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {platforms.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (distributionPlatforms.includes(p.id)) {
                            setDistributionPlatforms(distributionPlatforms.filter(id => id !== p.id));
                          } else {
                            setDistributionPlatforms([...distributionPlatforms, p.id]);
                          }
                        }}
                        className={cn(
                          "p-4 rounded-2xl border flex items-center gap-3 transition-all",
                          distributionPlatforms.includes(p.id) ? "bg-blue-500/10 border-blue-500/50 text-white" : "bg-black/40 border-white/5 text-zinc-500 hover:border-white/10"
                        )}
                      >
                        <img src={p.icon} alt={p.name} className="w-6 h-6 rounded-md grayscale group-hover:grayscale-0" />
                        <span className="text-sm font-bold">{p.name}</span>
                        {distributionPlatforms.includes(p.id) && <CheckCircle size={14} className="ml-auto text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleDistribute}
                  disabled={distributionPlatforms.length === 0}
                  className="w-full py-6 bg-blue-500 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-blue-400 transition-all shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Share2 size={24} />
                  Deliver to Platforms
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Distribution Partners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { name: 'Bandzoogle', status: 'Syncing', icon: Clock }
        ].map((partner, i) => (
          <div key={i} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400">
                <partner.icon size={24} />
              </div>
              <div>
                <div className="font-bold text-white">{partner.name}</div>
                <div className="text-xs text-zinc-500">{partner.status}</div>
              </div>
            </div>
            <button className="text-zinc-500 hover:text-white transition-all">
              <ExternalLink size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CatalogManager;
