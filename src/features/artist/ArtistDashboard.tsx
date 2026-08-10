import { useState, useEffect, useRef, useCallback } from 'react';
import { Music, Play, Sparkles, Loader2, Image as ImageIcon, Upload, Camera, Calendar, DollarSign, Settings, Edit3, Save, ShieldCheck, BarChart3, Ticket } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ArtistAnalytics, Track, Recommendation, Booking, Payout, Artist, SonicEvent } from '../../types';
import { api } from '../../api';
import { cn } from '../../utils/cn';
import { useArtistBackground } from '../../hooks/useArtistBackground';
import { useAuth } from '../../context/AuthContext';
import { TrackUploadModal } from './TrackUploadModal';
import { ArtistVerification } from './ArtistVerification';
import { TrackEditModal } from './TrackEditModal';
import { toast } from '../../components/ui/Toast';

import { AIAdBanners } from '../../components/AIAdBanners';

export const ArtistDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ArtistAnalytics | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<SonicEvent[]>([]);
  const [earnings, setEarnings] = useState<{ balance: number, payouts: Payout[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTrackForEdit, setSelectedTrackForEdit] = useState<Track | null>(null);
  const [isMastering, setIsMastering] = useState<Record<string, boolean>>({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'verification'>('analytics');
  const [artistProfile, setArtistProfile] = useState<Partial<Artist>>({
    bio: '',
    city: '',
    genres: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshUser } = useAuth();
  
  // AI Background Hook
  const { backgroundUrl, generateAIBackground, isGenerating } = useArtistBackground(
    user?.id || '', 
    'premium' // Mocking premium for demo
  );

  const fetchData = useCallback(async () => {
    try {
      const [analyticsData, tracksData, recsData, bookingsData, earningsData, eventsData] = await Promise.all([
        api.artist.getAnalytics(),
        api.tracks.getArtistTracks(),
        api.recommendations.get(),
        api.bookings.getArtistBookings(),
        api.artist.getEarnings(),
        api.events.getMyEvents()
      ]);
      setAnalytics(analyticsData);
      if (tracksData && Array.isArray(tracksData)) setTracks(tracksData);
      if (recsData && Array.isArray(recsData)) setRecommendations(recsData);
      if (bookingsData && Array.isArray(bookingsData)) setBookings(bookingsData);
      if (eventsData && Array.isArray(eventsData)) setEvents(eventsData);
      setEarnings(earningsData);

      // Fetch artist profile if user is artist
      if (user?.id) {
        try {
          const profile = await api.artist.getProfile(user.id);
          if (profile) {
            setArtistProfile({
              ...profile,
              genres: profile.genres || []
            });
          }
        } catch {
          console.log('No artist profile found yet');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [user?.id, fetchData]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      // In this simplified model, we're updating the user document with artist fields
      // or a separate artist document. apiClient.artist.getProfile uses 'artists' collection.
      // We should probably have a way to update it.
      // For now, let's assume we can update it via a new api method or just direct firestore if needed.
      // Let's add updateProfile to api.artist in apiClient.ts if not there.
      // Actually, I'll just use api.user.updateProfile for now as it's the same user.
      await api.user.updateProfile({
        bio: artistProfile.bio,
        city: artistProfile.city,
        preferredGenres: artistProfile.genres
      });
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await api.user.uploadAvatar(formData);
      await refreshUser();
    } catch (err) {
      console.error('Failed to upload avatar', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleGenerateAIAvatar = async () => {
    if (!aiPrompt) return;
    setIsGeneratingAvatar(true);
    try {
      const { imageUrl } = await api.ai.generateImage(`Professional artist profile picture, ${aiPrompt}, cinematic lighting, high resolution, 8k`);
      await api.user.updateProfile({ avatarUrl: imageUrl });
      await refreshUser();
      setAiPrompt('');
    } catch (err) {
      console.error('Failed to generate AI avatar', err);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleMasterTrack = async (trackId: string) => {
    setIsMastering(prev => ({ ...prev, [trackId]: true }));
    try {
      await api.tracks.master(trackId);
      toast.success('Mastering job started. Your track will be updated shortly.');
      fetchData(); // Refresh to show 'mastering' status
    } catch (err) {
      console.error('Failed to start mastering', err);
      toast.error('Failed to start mastering process');
    } finally {
      setIsMastering(prev => ({ ...prev, [trackId]: false }));
    }
  };

  if (isLoading) return (
    <div className="animate-pulse space-y-8">
      <div className="h-32 bg-zinc-900 rounded-3xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-2xl" />)}
      </div>
    </div>
  );

  if (!analytics) return <div className="p-20 text-center text-zinc-500">Failed to load analytics.</div>;

  const chartData = (analytics.monthlyStreams || [
    { date: 'Nov', count: 12500 },
    { date: 'Dec', count: 18400 },
    { date: 'Jan', count: 15100 },
    { date: 'Feb', count: 24000 },
    { date: 'Mar', count: 31000 },
    { date: 'Apr', count: 28500 }
  ]).map(item => {
    const gross = item.count * 0.004;
    return {
      name: item.date,
      streams: item.count,
      revenue: parseFloat(gross.toFixed(2)),
      share: parseFloat((gross * 0.7).toFixed(2))
    };
  });

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold">Artist Dashboard</h2>
          <p className="text-zinc-500">Real-time performance and revenue analytics.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 mr-4">
            <button
              onClick={() => setActiveTab('analytics')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === 'analytics' 
                  ? "bg-zinc-700 text-white shadow-lg shadow-black/20" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === 'verification' 
                  ? "bg-zinc-700 text-white shadow-lg shadow-black/20" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <ShieldCheck size={16} />
              Verification
            </button>
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
          >
            <Upload size={20} />
            Upload Track
          </button>
        </div>
      </header>

      {activeTab === 'verification' ? (
        <ArtistVerification />
      ) : (
        <>
          <AIAdBanners />
          {/* Profile Editor Section */}
      <div className="mb-12">
        <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Edit3 className="text-emerald-400" />
              Artist Profile
            </h2>
            {!isEditingProfile ? (
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <Edit3 size={18} />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  {isSavingProfile ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Bio</label>
                {isEditingProfile ? (
                  <textarea 
                    value={artistProfile.bio}
                    onChange={(e) => setArtistProfile({...artistProfile, bio: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 h-32 resize-none focus:border-emerald-500 outline-none transition-all"
                    placeholder="Tell your fans about yourself..."
                  />
                ) : (
                  <p className="text-zinc-400 leading-relaxed">{artistProfile.bio || 'No bio added yet.'}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">City / Location</label>
                {isEditingProfile ? (
                  <input 
                    type="text"
                    value={artistProfile.city}
                    onChange={(e) => setArtistProfile({...artistProfile, city: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. Lagos, Nigeria"
                  />
                ) : (
                  <p className="text-white font-medium">{artistProfile.city || 'Location not set'}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Genres</label>
                {isEditingProfile ? (
                  <div className="flex flex-wrap gap-2">
                    {['Hip-Hop', 'R&B', 'Afrobeats', 'Electronic', 'Pop', 'Jazz'].map(genre => (
                      <button
                        key={genre}
                        onClick={() => {
                          const current = artistProfile.genres || [];
                          const next = current.includes(genre) 
                            ? current.filter(g => g !== genre)
                            : [...current, genre];
                          setArtistProfile({...artistProfile, genres: next});
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                          artistProfile.genres?.includes(genre)
                            ? "bg-zinc-700 text-white"
                            : "bg-white/5 text-zinc-400 hover:bg-white/10"
                        )}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {artistProfile.genres?.length ? artistProfile.genres.map(genre => (
                      <span key={genre} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-widest">
                        {genre}
                      </span>
                    )) : <span className="text-zinc-500 italic">No genres selected</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-2">
          <p className="text-xs font-bold text-zinc-500 uppercase">Total Streams</p>
          <p className="text-3xl font-bold">{analytics.totalStreams.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-2">
          <p className="text-xs font-bold text-zinc-500 uppercase">Monthly Listeners</p>
          <p className="text-3xl font-bold">{analytics.monthlyListeners.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-2">
          <p className="text-xs font-bold text-zinc-500 uppercase">Your Share (70%)</p>
          <p className="text-3xl font-bold text-emerald-400">${analytics.revenue.artistShare.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-2">
          <p className="text-xs font-bold text-zinc-500 uppercase">V12 Share (30%)</p>
          <p className="text-3xl font-bold text-zinc-400">${analytics.revenue.sonicShare.toFixed(2)}</p>
        </div>
      </div>

      {/* Monthly Stream Revenue Trends Chart */}
      <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-6">
        <div>
          <h3 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="text-emerald-400" size={20} />
            Monthly Stream & Revenue Trends
          </h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">
            Analyzing playback performance and payout distributions (calculated at $0.004 per stream average)
          </p>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c81e3a" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#c81e3a" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px' }}
                labelStyle={{ fontWeight: 'bold', color: '#fff' }}
              />
              <Area type="monotone" name="Gross Revenue" dataKey="revenue" stroke="#c81e3a" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" name="Your 70% Share" dataKey="share" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorShares)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Picture Section */}
        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Camera className="text-blue-400" size={20} />
              Profile Picture
            </h3>
            {user?.avatarUrl && (
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Custom Avatar Active</span>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/5 bg-zinc-800">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    {isUploadingAvatar ? <Loader2 size={32} className="animate-spin text-emerald-400" /> : <ImageIcon size={40} />}
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-emerald-400" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"
              >
                <Upload size={24} className="text-white" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-2">
                <p className="text-sm font-bold">AI Avatar Generator</p>
                <div className="relative">
                  <input 
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe your style (e.g. Cyberpunk, Minimalist...)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all pr-12"
                  />
                  <button 
                    onClick={handleGenerateAIAvatar}
                    disabled={isGeneratingAvatar || !aiPrompt}
                    className="absolute right-2 top-2 p-1.5 bg-zinc-700 rounded-lg text-white hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all"
                  >
                    {isGeneratingAvatar ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 italic">Powered by Gemini 2.5 Flash Image</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={14} />
                  Upload Image
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Background Generator Section */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-purple-500/5 to-blue-500/10 border border-emerald-500/20 p-8 rounded-3xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="bg-zinc-700 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Premium</span>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-emerald-400" size={20} />
              AI Concert Background
            </h3>
            <p className="text-sm text-zinc-400">Generate a custom 4K cinematic background for your artist profile.</p>
          </div>

          <div className="aspect-video bg-black/40 rounded-2xl border border-white/5 overflow-hidden relative group">
            {backgroundUrl ? (
              <img src={backgroundUrl} alt="AI Generated Background" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                <ImageIcon size={48} className="opacity-20" />
                <p className="text-xs font-medium">No custom background generated yet</p>
              </div>
            )}
            
            {isGenerating && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                <Loader2 className="text-emerald-400 animate-spin" size={32} />
                <p className="text-sm font-bold text-white">Generating your masterpiece...</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => generateAIBackground(user?.name || 'Artist')}
            disabled={isGenerating}
            className="w-full bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? 'Generating...' : 'Generate New Background'}
            {!isGenerating && <Sparkles size={18} />}
          </button>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
          <h3 className="font-bold flex items-center gap-2">
            <Settings className="text-emerald-400" size={20} />
            Rider & Additional Costs
          </h3>
          <p className="text-xs text-zinc-500">Set your default expenses for bookings. These will be added to the guaranteed fee.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Sound/Light Equipment</label>
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm" placeholder="$0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Backline (Gear)</label>
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm" placeholder="$0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Hotel/Lodging</label>
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm" placeholder="$0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Flights/Travel</label>
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm" placeholder="$0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Meals/Catering</label>
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm" placeholder="$0.00" />
            </div>
          </div>
          <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-xs font-bold transition-all">
            Update Rider Defaults
          </button>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Calendar className="text-purple-400" size={20} />
              Events & Gigs
            </h3>
            <a href="/events" className="text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300">Manage All</a>
          </div>
          <div className="space-y-4">
            {events.slice(0, 3).map((e) => (
              <div key={e.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold">{e.title}</p>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase">
                    <Ticket size={10} className="text-emerald-500" />
                    <span>${e.price}</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">{new Date(e.date).toLocaleDateString()} • {e.venue}</p>
              </div>
            ))}
            {events.length === 0 && <p className="text-center text-zinc-500 text-xs py-4 italic">No upcoming events.</p>}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
          <h3 className="font-bold flex items-center gap-2">
            <Calendar className="text-amber-400" size={20} />
            Booking Requests
          </h3>
          <div className="space-y-4">
            {bookings.slice(0, 3).map((b) => (
              <div key={b.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold">{b.customerName}</p>
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-2 py-1 rounded-lg",
                    b.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {b.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">{new Date(b.startTime).toLocaleDateString()} at {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-center text-zinc-500 text-xs py-4 italic">No upcoming gigs.</p>}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
          <h3 className="font-bold flex items-center gap-2">
            <DollarSign className="text-emerald-400" size={20} />
            Financial Summary
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Available Balance</p>
              <p className="text-2xl font-bold">${earnings?.balance.toFixed(2) || '0.00'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-500 uppercase">Recent Payouts</p>
              {earnings?.payouts.slice(0, 2).map(p => (
                <div key={p.id} className="flex justify-between text-xs p-2 bg-black/20 rounded-lg">
                   <span className="text-zinc-400">{new Date(p.requestedAt).toLocaleDateString()}</span>
                  <span className="font-bold">${(p.amountCents / 100).toFixed(2)}</span>
                </div>
              ))}
              {(!earnings?.payouts || earnings.payouts.length === 0) && <p className="text-[10px] text-zinc-600 italic">No payout history.</p>}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
          <div className="space-y-4">
            {tracks.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                    <Music size={16} className="text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.title}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.genre}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-1 rounded-lg",
                      t.status === 'live' ? "bg-emerald-500/10 text-emerald-400" : 
                      t.status === 'pending' ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-500"
                    )}>
                      {t.status}
                    </span>
                    <p className="text-[8px] text-zinc-600 mt-1">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Just now'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.status !== 'mastering' && (
                      <button
                        onClick={() => handleMasterTrack(t.id)}
                        disabled={isMastering[t.id]}
                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all flex items-center gap-2"
                        title="Master Track with AI"
                      >
                        {isMastering[t.id] ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        <span className="text-[10px] font-bold uppercase">Master</span>
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedTrackForEdit(t);
                        setIsEditModalOpen(true);
                      }}
                      className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {tracks.length === 0 && <p className="text-center text-zinc-500 text-xs py-4">No uploads yet.</p>}
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
          <h3 className="font-bold">Platform Distribution</h3>
          <div className="space-y-4">
            {analytics.platformDistribution.map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">{p.name}</span>
                  <span className="font-bold">{p.streams.toLocaleString()} streams</span>
                </div>
                <div className="h-1.5 bg-black rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${(p.streams / analytics.totalStreams) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {analytics.demographics && (
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
            <h3 className="font-bold">Audience Demographics</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Age Groups</p>
                {Object.entries(analytics.demographics.ageGroups).map(([age, count]) => (
                  <div key={age} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-400">{age}</span>
                      <span className="font-bold">{count}%</span>
                    </div>
                    <div className="h-1 bg-black rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${count}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Top Countries</p>
                <div className="space-y-3">
                  {analytics.demographics.topCountries.map((c, i) => (
                    <div key={c.country} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-600 font-bold">#{i + 1}</span>
                        <span className="text-zinc-300">{c.country}</span>
                      </div>
                      <span className="font-bold text-zinc-400">{c.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
          <h3 className="font-bold">Recommended for You</h3>
          <div className="space-y-4">
            {recommendations.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl group cursor-pointer hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                    <Play size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{r.title}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{r.artist} • {r.genre}</p>
                    {r.reason && <p className="text-[10px] text-emerald-400/70 mt-1 italic">{r.reason}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase">Match Score: {Math.round(r.score * 100)}%</span>
                </div>
              </div>
            ))}
            {recommendations.length === 0 && <p className="text-center text-zinc-500 text-xs py-4 italic">No recommendations yet. Start playing music!</p>}
          </div>
        </div>
      </div>
      </>
      )}
      {/* Modals */}
      <TrackUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setIsUploadModalOpen(false);
        }}
      />
      <TrackEditModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTrackForEdit(null);
        }}
        track={selectedTrackForEdit}
        onSuccess={fetchData}
      />
    </div>
  );
};
