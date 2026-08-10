import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  MoreHorizontal, 
  Image as ImageIcon, 
  Target,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  UserCheck,
  X,
  Radio,
  Settings as SettingsIcon,
  Camera,
  Mic,
  StopCircle,
  Play,
  Music,
  Zap,
  TrendingUp,
  Send,
  Plus,
  Calendar,
  Sparkles,
  Clock,
  Instagram
} from 'lucide-react';
import { apiFetch, json as apiJson } from '../../api';
import { Post, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

// Local Feature Overlays/Components
import { BookingSettings } from '../booking/BookingSettings';
import { AIMasteringTool } from '../mastering/AIMasteringTool';

interface SocialProfile extends User {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  posts: Post[];
  lastSeen: string;
}

export const SocialBanner = ({ onVisit }: { onVisit: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-r from-purple-600 to-emerald-500 text-white p-6 rounded-3xl mb-8 shadow-2xl shadow-purple-500/20"
  >
    <div className="flex items-center justify-between gap-6">
      <div className="space-y-1">
        <h3 className="font-black text-2xl tracking-tighter flex items-center gap-2">
          <Share2 size={24} />
          SonicStream Social
        </h3>
        <p className="text-sm opacity-90 font-medium">Connect with artists, fans, and the global music community.</p>
      </div>
      <button 
        onClick={onVisit}
        className="px-8 py-3 bg-white text-purple-600 rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-xl"
      >
        Visit Community →
      </button>
    </div>
  </motion.div>
);

export const SocialFeed = ({ onUpgrade }: { onUpgrade?: () => void }) => {
  const { token, isPaid, isCreatorTier } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [boostingPost, setBoostingPost] = useState<Post | null>(null);
  const [profileData, setProfileData] = useState<SocialProfile | null>(null);
  const [followingOnly, setFollowingOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'live' | 'integrations' | 'messages' | 'groups' | 'analytics' | 'booking' | 'mastering'>('feed');

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Post[]>(`/api/social/feed?following=${followingOnly}`);
      setPosts(data);
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [followingOnly]);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const data = await apiFetch<SocialProfile>(`/api/social/profile/${userId}`);
      setProfileData(data);
      setViewingProfile(userId);
    } catch {
      toast.error('Failed to load profile');
    }
  }, []);

  useEffect(() => {
    if (viewingProfile) {
      fetchProfile(viewingProfile);
    }
  }, [viewingProfile, token, fetchProfile]);

  useEffect(() => {
    fetchFeed();

    const socket = io();
    socket.on('new_post', (newPost: Post) => {
      setPosts(prev => [newPost, ...prev]);
      toast('New post in community!', { icon: '🔔' });
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchFeed]);

  const handlePost = async (content: string, mediaFile?: File, cta?: { link: string, text: string }, tierRequirement: string = 'everyone') => {
    if (!isPaid) {
      toast.error('Upgrade to SonicPro to share content');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('subscriptionTierRequirement', tierRequirement);
      if (mediaFile) formData.append('media', mediaFile);
      if (cta?.link) formData.append('ctaLink', cta.link); // FormData doesn't auto-convert to snake_case, but the server handles these specifically
      if (cta?.text) formData.append('ctaText', cta.text);

      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        toast.success('Post shared!');
        fetchFeed();
      }
    } catch {
      toast.error('Failed to post');
    }
  };

  const handleInteract = async (postId: string, type: string, commentText?: string) => {
    try {
      const data = await apiFetch<any>(`/api/social/interact/${postId}`, {
        method: 'POST',
        ...apiJson({ type, commentText })
      });
      
      if (type === 'share') {
        toast.success('Post shared to your profile!');
        fetchFeed();
        return;
      }
      
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: data.action === 'liked' ? p.likes + 1 : (data.action === 'unliked' ? p.likes - 1 : p.likes),
            hasLiked: data.action === 'liked',
            shares: type === 'share' ? p.shares + 1 : p.shares
          };
        }
        return p;
      }));
    } catch {
      toast.error('Action failed');
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const data = await apiFetch<any>(`/api/social/follow/${userId}`, {
        method: 'POST'
      });
      
      toast.success(data.following ? 'Following user' : 'Unfollowed user');
      if (profileData && profileData.id === userId) {
        setProfileData({
          ...profileData,
          isFollowing: !!data.following,
          followersCount: data.following ? profileData.followersCount + 1 : profileData.followersCount - 1
        });
      }
    } catch {
      toast.error('Follow action failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          <button 
            onClick={() => { setActiveTab('feed'); setFollowingOnly(false); }}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'feed' && !followingOnly ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Global Feed
          </button>
          <button 
            onClick={() => { setActiveTab('feed'); setFollowingOnly(true); }}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'feed' && followingOnly ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Following
          </button>
          <button 
            onClick={() => {
              if (!isPaid) {
                toast.error('SonicLive is exclusive to SonicPro members');
                return;
              }
              setActiveTab('live');
            }}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'live' ? 'bg-red-500 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Radio size={14} className={activeTab === 'live' ? 'animate-pulse' : ''} />
            Live
          </button>
          <button 
            onClick={() => {
              if (!isPaid || isCreatorTier) {
                toast.error('Integrations are exclusive to SonicPro members');
                return;
              }
              setActiveTab('integrations');
            }}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'integrations' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <SettingsIcon size={14} />
            Integrations
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'messages' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <MessageSquare size={14} />
            Messages
          </button>
          <button 
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'groups' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <UserCheck size={14} />
            Groups
          </button>
          {isPaid && !isCreatorTier && (
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <TrendingUp size={14} />
              Analytics
            </button>
          )}
          {isPaid && (
            <button 
              onClick={() => setActiveTab('booking')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'booking' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Calendar size={14} />
              Booking
            </button>
          )}
          {isPaid && !isCreatorTier && (
            <button 
              onClick={() => setActiveTab('mastering')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'mastering' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Zap size={14} />
              Mastering
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'feed' && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {isPaid ? (
              <PostComposer onPost={handlePost} />
            ) : (
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-8 rounded-[40px] text-center space-y-4 shadow-2xl shadow-orange-500/20">
                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto">
                  <ShieldCheck className="text-white" size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-2xl tracking-tighter text-white">Go Pro → Unlock Social</h4>
                  <p className="text-white/80 text-sm font-medium">Post content, promote products, and connect with fans directly.</p>
                </div>
                <button 
                  onClick={onUpgrade}
                  className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-xl"
                >
                  Upgrade to SonicPro
                </button>
              </div>
            )}

            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500" />
                </div>
              ) : (
                posts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onInteract={handleInteract}
                    onProfileClick={setViewingProfile}
                    onBoost={setBoostingPost}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'live' && (
          <motion.div
            key="live"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <LiveStreamingStudio />
          </motion.div>
        )}

        {activeTab === 'integrations' && (
          <motion.div
            key="integrations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >

          </motion.div>
        )}

        {activeTab === 'messages' && (
          <motion.div
            key="messages"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <MessagingSystem />
          </motion.div>
        )}

        {activeTab === 'groups' && (
          <motion.div
            key="groups"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GroupsSystem />
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SocialAnalytics />
          </motion.div>
        )}

        {activeTab === 'booking' && (
          <motion.div
            key="booking"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BookingSettings />
          </motion.div>
        )}

        {activeTab === 'mastering' && (
          <motion.div
            key="mastering"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AIMasteringTool />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingProfile && profileData && (
          <ProfileModal 
            profile={profileData} 
            onClose={() => setViewingProfile(null)}
            onFollow={handleFollow}
            onInteract={handleInteract}
          />
        )}

        {boostingPost && (
          <BoostModal 
            post={boostingPost} 
            onClose={() => setBoostingPost(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const BoostModal = ({ post, onClose }: { post: Post, onClose: () => void }) => {
  const [budget, setBudget] = useState(10);
  const [targeting, setTargeting] = useState('all');
  const [location, setLocation] = useState('Global');

  const budgets = [10, 20, 50, 100];
  const targetGroups = [
    { id: 'all', label: 'All Users' },
    { id: 'creators', label: 'Content Creators' },
    { id: 'artists', label: 'Independent Artists' },
    { id: 'podcasters', label: 'Podcasters' }
  ];

  const handleBoost = async () => {
    try {
      await apiFetch(`/api/social/ads/boost/${post.id}`, {
        method: 'POST',
        ...apiJson({ budget, targeting, location })
      });
      toast.success(`Ad Campaign Launched with ${budget} budget!`);
      onClose();
    } catch {
      toast.error('Failed to launch campaign');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[40px] overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
              <img src={post.mediaUrl || post.avatar} alt="Post Preview" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tighter">Boost Your Reel</h3>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mt-1">Reach more fans with Meta Ads</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
          {/* Budget Selection */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-emerald-500">Select Budget</label>
            <div className="grid grid-cols-4 gap-4">
              {budgets.map(b => (
                <button
                  key={b}
                  onClick={() => setBudget(b)}
                  className={cn(
                    "py-4 rounded-2xl font-black text-lg transition-all border",
                    budget === b 
                      ? "bg-zinc-700 text-white border-zinc-600 shadow-lg shadow-black/20" 
                      : "bg-black text-zinc-500 border-white/5 hover:border-white/10"
                  )}
                >
                  ${b}
                </button>
              ))}
            </div>
          </div>

          {/* Targeting Selection */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-emerald-500">Target Audience</label>
            <div className="grid grid-cols-2 gap-4">
              {targetGroups.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTargeting(t.id)}
                  className={cn(
                    "p-4 rounded-2xl font-bold text-sm transition-all border text-left flex items-center justify-between",
                    targeting === t.id 
                      ? "bg-white/10 text-white border-white/20" 
                      : "bg-black text-zinc-500 border-white/5 hover:border-white/10"
                  )}
                >
                  {t.label}
                  {targeting === t.id && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {/* Location / Map Integration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-widest text-emerald-500">Target Area</label>
              <span className="text-[10px] font-bold text-zinc-500">Current: {location}</span>
            </div>
            <div className="aspect-video bg-zinc-800 rounded-3xl overflow-hidden relative border border-white/5">
              <img 
                src="https://picsum.photos/seed/map/800/450" 
                alt="Target Area Map" 
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-12 h-12 bg-black/50 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                  <Target className="text-emerald-500" size={24} />
                </div>
                <p className="text-xs font-bold text-white max-w-xs">Use Google Maps to pinpoint the exact demographics and areas you want to focus on.</p>
                <button 
                  onClick={() => setLocation('New York, USA')}
                  className="px-6 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Open Map Selector
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-black/40 border-t border-white/5">
          <button 
            onClick={handleBoost}
            className="w-full py-6 bg-zinc-700 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-2xl shadow-black/40 flex items-center justify-center gap-3"
          >
            <Zap size={24} />
            Launch Ad Campaign
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PostComposer = ({ onPost }: { onPost: (content: string, media?: File, cta?: { link: string, text: string }, tierRequirement?: string) => void }) => {
  const [content, setContent] = useState('');
  const [showCta, setShowCta] = useState(false);
  const [ctaLink, setCtaLink] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState('everyone');
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-[40px] space-y-4">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500 flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's happening in your studio?"
            className="w-full bg-transparent border-none outline-none text-lg resize-none h-24 placeholder:text-zinc-600"
            maxLength={280}
          />
          
          {mediaFile && (
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-white/10">
              <img src={URL.createObjectURL(mediaFile)} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setMediaFile(null)}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {showCta && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Call to Action (CTA)</h5>
                <button onClick={() => setShowCta(false)} className="text-zinc-500 hover:text-white"><X size={12} /></button>
              </div>
              <input 
                type="text" 
                placeholder="CTA Text (e.g., Join Waitlist)" 
                value={ctaText}
                onChange={e => setCtaText(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none"
              />
              <input 
                type="text" 
                placeholder="CTA Link (URL)" 
                value={ctaLink}
                onChange={e => setCtaLink(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none"
              />
            </motion.div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-white/5 flex-wrap gap-4">
        <div className="flex gap-2 items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*"
            onChange={e => e.target.files?.[0] && setMediaFile(e.target.files[0])}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 hover:bg-white/5 rounded-xl text-zinc-400 transition-colors"
          >
            <ImageIcon size={20} />
          </button>
          <button 
            onClick={() => setShowCta(!showCta)}
            className={cn(
              "p-3 rounded-xl transition-colors",
              showCta ? "bg-emerald-500/10 text-emerald-500" : "hover:bg-white/5 text-zinc-400"
            )}
          >
            <Target size={20} />
          </button>
          
          <div className="flex items-center gap-1.5 bg-black/60 px-3.5 py-2 rounded-xl border border-white/5">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Visible to:</span>
            <select
              value={subscriptionTier}
              onChange={(e) => setSubscriptionTier(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-emerald-400 focus:outline-none cursor-pointer uppercase tracking-widest border-none p-0"
            >
              <option value="everyone" className="bg-zinc-950 text-white font-sans text-xs">Everyone</option>
              <option value="listener" className="bg-zinc-950 text-white font-sans text-xs">Listener Tier +</option>
              <option value="star" className="bg-zinc-950 text-white font-sans text-xs">Star Tier +</option>
              <option value="creator" className="bg-zinc-950 text-white font-sans text-xs">Creator Tier +</option>
              <option value="pro" className="bg-zinc-950 text-white font-sans text-xs">Pro Studio +</option>
            </select>
          </div>
        </div>
        <button 
          onClick={() => { 
            onPost(content, mediaFile || undefined, showCta ? { link: ctaLink, text: ctaText } : undefined, subscriptionTier); 
            setContent(''); 
            setMediaFile(null);
            setCtaLink('');
            setCtaText('');
            setShowCta(false);
          }}
          disabled={!content.trim()}
          className="bg-zinc-700 disabled:opacity-50 disabled:hover:scale-100 hover:bg-zinc-600 text-white px-8 py-3 rounded-2xl font-black transition-all hover:scale-105"
        >
          Post
        </button>
      </div>
    </div>
  );
};

import { DownloadButton } from '../../components/music/DownloadButton';

const PostCard = ({ post, onInteract, onProfileClick, onBoost }: { 
  post: Post, 
  onInteract: (id: string, type: string, commentText?: string) => void,
  onProfileClick: (userId: string) => void,
  onBoost?: (post: Post) => void
}) => {
  const { user } = useAuth();
  const isOwnPost = user?.id === post.userId;
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [hoveredMedia, setHoveredMedia] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setLoadingComments(true);
      const data = await apiFetch<any[]>(`/api/social/posts/${post.id}/comments`);
      setComments(data);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  }, [post.id]);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, fetchComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await onInteract(post.id, 'comment', newComment);
    setNewComment('');
    fetchComments();
  };

  const handleNativeShare = async (platform: string) => {
    try {
      await apiFetch(`/api/social/posts/${post.id}/share/native`, {
        method: 'POST',
        ...apiJson({ platform })
      });
      toast.success(`Natively uploading to ${platform}...`);
    } catch {
      toast.error('Native share failed');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 border border-white/5 rounded-[40px] overflow-hidden group"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onProfileClick(post.userId)}>
              <img src={post.avatar || `https://picsum.photos/seed/${post.userId}/100/100`} alt={post.name} className="w-12 h-12 rounded-full object-cover hover:opacity-80 transition-opacity" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <button onClick={() => onProfileClick(post.userId)} className="font-bold text-white hover:text-emerald-400 transition-colors">{post.name}</button>
                {post.isVerified && <ShieldCheck size={14} className="text-blue-400" />}
                {post.isPromotion && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Target size={10} />
                    Sponsored
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 font-medium">@{post.name.toLowerCase().replace(' ', '')} • 2h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwnPost && !post.isPromotion && (
              <button 
                onClick={() => onBoost?.(post)}
                className="px-4 py-1.5 bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-600 transition-all flex items-center gap-1"
              >
                <TrendingUp size={12} />
                Boost
              </button>
            )}
            <button className="p-2 text-zinc-500 hover:text-white transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

      <p className="text-zinc-300 leading-relaxed">{post.content}</p>

      {post.musicId && (
        <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-700 rounded-xl flex items-center justify-center text-white">
              <Music size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-tight">{post.trackTitle || 'Untitled Track'}</p>
              <p className="text-xs text-zinc-500 font-bold">{post.artistName || 'Unknown Artist'}</p>
            </div>
          </div>
          <DownloadButton 
            trackId={post.musicId} 
            trackTitle={post.trackTitle || 'Track'} 
            artistName={post.artistName || 'Artist'} 
          />
        </div>
      )}

      {post.ctaLink && (
        <a 
          href={post.ctaLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full py-4 bg-zinc-700 text-white text-center rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-lg shadow-black/20"
        >
          {post.ctaText || 'Learn More'}
        </a>
      )}

      {post.mediaUrl && (
        <motion.div 
          className="relative rounded-3xl overflow-hidden border border-white/10 aspect-video group/media cursor-pointer bg-black"
          onMouseEnter={() => setHoveredMedia(true)}
          onMouseLeave={() => setHoveredMedia(false)}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {post.mediaUrl.endsWith('.mp4') ? (
            <div className="relative w-full h-full">
              <video 
                src={post.mediaUrl} 
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                onMouseOver={e => (e.target as HTMLVideoElement).play()}
                onMouseOut={e => (e.target as HTMLVideoElement).pause()}
              />
              <div className="absolute inset-0 bg-black/20 group-hover/media:bg-black/0 transition-colors flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: hoveredMedia ? 1 : 0,
                    scale: hoveredMedia ? 1 : 0.5
                  }}
                  className="bg-white/20 backdrop-blur-md p-4 rounded-full"
                >
                  <Play size={32} className="text-white fill-white" />
                </motion.div>
              </div>
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1">
                <Clock size={10} /> 0:30
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <motion.div 
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6"
              >
                <div className="flex items-center gap-2 text-white/80 text-xs font-medium">
                  <Sparkles size={14} className="text-yellow-400" />
                  AI Enhanced Preview
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}

      {post.isPromotion && (
        <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <AlertCircle size={14} />
            Paid partnership with {post.name}
          </div>
          <button className="text-xs font-black uppercase tracking-widest text-emerald-400 hover:underline">
            Learn More
          </button>
        </div>
      )}

      <div className="flex items-center gap-8 pt-2">
        <button 
          onClick={() => onInteract(post.id, 'like')}
          className={`flex items-center gap-2 transition-colors group/btn ${post.hasLiked ? 'text-emerald-400' : 'text-zinc-500 hover:text-emerald-400'}`}
        >
          <div className={`p-2 rounded-full transition-colors ${post.hasLiked ? 'bg-emerald-500/10' : 'group-hover/btn:bg-emerald-500/10'}`}>
            <Heart size={20} fill={post.hasLiked ? 'currentColor' : 'none'} />
          </div>
          <span className="text-xs font-bold">{post.likes}</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-zinc-500 hover:text-blue-400 transition-colors group/btn"
        >
          <div className="p-2 group-hover/btn:bg-blue-500/10 rounded-full transition-colors">
            <MessageSquare size={20} />
          </div>
          <span className="text-xs font-bold">{post.comments}</span>
        </button>
        <div className="relative">
          <button 
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 text-zinc-500 hover:text-purple-400 transition-colors group/btn"
          >
            <div className="p-2 group-hover/btn:bg-purple-500/10 rounded-full transition-colors">
              <Share2 size={20} />
            </div>
            <span className="text-xs font-bold">{post.shares}</span>
          </button>

          <AnimatePresence>
            {showShareMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-2 w-48 bg-zinc-900 border border-white/10 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-xl"
              >
                <button 
                  onClick={() => {
                    onInteract(post.id, 'share');
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl text-sm font-medium transition-colors text-white"
                >
                  <Zap size={16} className="text-yellow-400" />
                  Internal Share
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button 
                  onClick={() => handleNativeShare('instagram')}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl text-sm font-medium transition-colors text-white"
                >
                  <Instagram size={16} className="text-pink-500" />
                  Instagram
                </button>
                <button 
                  onClick={() => handleNativeShare('tiktok')}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl text-sm font-medium transition-colors text-white"
                >
                  <Music size={16} className="text-white" />
                  TikTok
                </button>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {post.mediaUrl && post.mediaUrl.endsWith('.mp4') && (
          <div className="flex gap-2 ml-auto">
            <button 
              onClick={() => handleNativeShare('instagram')}
              className="p-2 bg-gradient-to-tr from-yellow-500 to-purple-500 rounded-lg text-white hover:scale-110 transition-transform"
              title="Upload to Instagram"
            >
              <Camera size={14} />
            </button>
            <button 
              onClick={() => handleNativeShare('tiktok')}
              className="p-2 bg-black rounded-lg text-white hover:scale-110 transition-transform border border-white/10"
              title="Upload to TikTok"
            >
              <Music size={14} />
            </button>

          </div>
        )}
      </div>

      {showComments && (
        <div className="mt-6 pt-6 border-t border-white/5 space-y-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 shrink-0" />
            <div className="flex-1 flex gap-2">
              <input 
                type="text" 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                onKeyPress={e => e.key === 'Enter' && handleAddComment()}
              />
              <button 
                onClick={handleAddComment}
                className="px-4 py-2 bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-600 transition-all"
              >
                Post
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-emerald-500" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-zinc-500 text-xs py-4">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <img src={comment.avatar || `https://picsum.photos/seed/${comment.userId}/100/100`} alt={comment.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1 bg-white/5 rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{comment.name}</span>
                      <span className="text-[10px] text-zinc-500">Just now</span>
                    </div>
                    <p className="text-xs text-zinc-300">{comment.commentText}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {post.isPromotion && (
        <div className="mt-4 p-6 bg-zinc-800/50 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ad Management</h5>
            <span className="text-[10px] font-black text-emerald-500 uppercase">Active Campaign</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Budget</p>
              <p className="text-sm font-black text-white">$100.00</p>
            </div>
            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
              <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Reach</p>
              <p className="text-sm font-black text-white">12.4k</p>
            </div>
          </div>
          <button className="w-full py-3 bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-600 transition-all">
            View Analytics
          </button>
        </div>
      )}
    </div>
  </motion.div>
  );
};

const ProfileModal = ({ profile, onClose, onFollow, onInteract }: { 
  profile: SocialProfile, 
  onClose: () => void,
  onFollow: (id: string) => void,
  onInteract: (id: string, type: string) => void
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[40px] overflow-hidden max-h-[90vh] flex flex-col"
    >
      <div className="relative h-32 bg-gradient-to-r from-emerald-500 to-blue-500">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="px-8 pb-8 -mt-12 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-end">
          <div className="relative">
            <img src={profile.avatarUrl || `https://picsum.photos/seed/${profile.id}/100/100`} alt={profile.name} className="w-24 h-24 rounded-full border-4 border-zinc-900 object-cover" />
            <div className={cn(
              "absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-zinc-900",
              new Date().getTime() - new Date(profile.lastSeen).getTime() < 300000 ? "bg-emerald-500" : "bg-zinc-500"
            )} />
          </div>
          <button 
            onClick={() => onFollow(profile.id)}
            className={`px-8 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${profile.isFollowing ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-zinc-700 text-white hover:scale-105'}`}
          >
            {profile.isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
            {profile.isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black text-white tracking-tighter">{profile.name}</h3>
            {profile.isVerified && <ShieldCheck size={20} className="text-blue-400" />}
          </div>
          <p className="text-zinc-500 text-sm">@{profile.name.toLowerCase().replace(' ', '')}</p>
        </div>

        <p className="text-zinc-300">{profile.bio || 'No bio yet.'}</p>

        <div className="flex gap-6 border-y border-white/5 py-4">
          <div className="flex gap-1 items-baseline">
            <span className="text-white font-black">{profile.followingCount}</span>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Following</span>
          </div>
          <div className="flex gap-1 items-baseline">
            <span className="text-white font-black">{profile.followersCount}</span>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Followers</span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Posts</h4>
          {profile.posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onInteract={onInteract} 
              onProfileClick={() => {}} 
            />
          ))}
        </div>
      </div>
    </motion.div>
  </div>
);

const LiveStreamingStudio = () => {
  const { isPaid } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [viewers, setViewers] = useState(0);

  const startStream = async () => {
    if (!isPaid) {
      toast.error('Live streaming is a V12 Pro feature. Please upgrade to access.', {
        icon: '🔒',
        duration: 5000
      });
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsLive(true);
      setViewers(Math.floor(Math.random() * 100));
      toast.success('You are now LIVE!');
    } catch {
      toast.error('Could not access camera/microphone');
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsLive(false);
    toast('Live stream ended', { icon: '⏹️' });
  };

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900/50 border border-white/5 rounded-[48px] p-8 space-y-8 overflow-hidden relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
              isLive ? "bg-red-500 animate-pulse" : "bg-zinc-800"
            )}>
              <Radio className={isLive ? "text-white" : "text-zinc-500"} size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Live Performance Studio</h3>
              <p className="text-xs text-zinc-500">Stream high-fidelity audio and video to your fans.</p>
            </div>
          </div>
          
          {isLive && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Live
              </div>
              <div className="text-xs font-bold text-zinc-400">
                {viewers} Viewers
              </div>
            </div>
          )}
        </div>

        <div className="aspect-video bg-black rounded-[32px] border border-white/5 relative overflow-hidden group">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          
          {!isLive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-black/60 backdrop-blur-sm">
              <div className="w-20 h-20 bg-zinc-900 rounded-[32px] flex items-center justify-center border border-white/10">
                <Camera size={40} className="text-zinc-700" />
              </div>
              <p className="text-sm text-zinc-400 font-medium">Camera preview will appear here</p>
            </div>
          )}

          {isLive && (
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10">1080p 60fps</span>
                  <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-emerald-400 border border-white/10">Excellent Connection</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {!isLive ? (
            <button
              onClick={startStream}
              className="flex-1 py-6 bg-zinc-700 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3"
            >
              <Play size={24} />
              Start Live Stream
            </button>
          ) : (
            <button
              onClick={stopStream}
              className="flex-1 py-6 bg-red-500 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-3"
            >
              <StopCircle size={24} />
              End Stream
            </button>
          )}
          
          <button className="w-16 h-16 bg-zinc-800 text-zinc-400 rounded-[24px] flex items-center justify-center hover:bg-zinc-700 transition-all">
            <Mic size={24} />
          </button>
          <button className="w-16 h-16 bg-zinc-800 text-zinc-400 rounded-[24px] flex items-center justify-center hover:bg-zinc-700 transition-all">
            <SettingsIcon size={24} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bitrate</p>
            <p className="text-lg font-bold text-white">6.5 Mbps</p>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Latency</p>
            <p className="text-lg font-bold text-white">1.2s</p>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Dropped</p>
            <p className="text-lg font-bold text-white">0%</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-6">
        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Live Chat</h4>
        <div className="space-y-4 h-48 overflow-y-auto no-scrollbar">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Alex Rivera <span className="text-zinc-500 font-normal ml-2">This track is fire! 🔥</span></p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Sarah J. <span className="text-zinc-500 font-normal ml-2">Love the studio setup!</span></p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Mike D <span className="text-zinc-500 font-normal ml-2">Can you play the new single?</span></p>
            </div>
          </div>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Say something nice..."
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs uppercase tracking-widest">Send</button>
        </div>
      </div>
    </div>
  );
};

// --- NEW COMPONENTS FOR HONEYCOMB FRAMEWORK ---

function MessagingSystem() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const socketRef = useRef<any>(null);

  const fetchConversations = useCallback(async () => {
    try {
      // In a real app, we'd have an endpoint for this. 
      // For now, we'll mock some based on recent messages or follows
      await apiFetch('/api/social/groups');
      // Mocking some users for the demo if no groups
      setConversations([
        { id: 'user_1', name: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?u=user_1' },
        { id: 'user_2', name: 'Sarah J.', avatar: 'https://i.pravatar.cc/150?u=user_2' },
        { id: 'user_3', name: 'Mike D', avatar: 'https://i.pravatar.cc/150?u=user_3' }
      ]);
    } catch {
      console.error('Failed to fetch conversations');
    }
  }, []);

  // Initialize Socket.io
  useEffect(() => {
    if (!user?.id) return;
    
    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.emit('join-user-room', user.id);

    socket.on('new_message', (msg: any) => {
      // Check if message belongs to current active chat
      if (activeChat === msg.senderId || activeChat === msg.receiverId) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      
      // Refresh conversation list to show latest message
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, activeChat, fetchConversations]);

  const fetchMessages = useCallback(async () => {
    if (!activeChat) return;
    try {
      const data = await apiFetch<any[]>(`/api/social/messages/${activeChat}`);
      setMessages(data);
    } catch {
      console.error('Failed to fetch messages');
    }
  }, [activeChat]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages();
    }
  }, [activeChat, fetchMessages]);

  const sendMessage = async () => {
    if (!content.trim() || !activeChat) return;
    try {
      const data = await apiFetch<any>('/api/social/messages', {
        method: 'POST',
        ...apiJson({ receiverId: activeChat, content })
      });
      
      // Optimistically add to UI
      const newMsg = {
        id: data.messageId,
        senderId: user?.id,
        receiverId: activeChat,
        content,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMsg]);
      setContent('');
    } catch {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="bg-zinc-900 rounded-3xl border border-white/5 overflow-hidden flex h-[600px]">
      <div className="w-1/3 border-r border-white/5 p-4 space-y-4 overflow-y-auto no-scrollbar">
        <h3 className="text-lg font-black text-white px-2">Conversations</h3>
        {conversations.map((conv) => (
          <button 
            key={conv.id}
            onClick={() => setActiveChat(conv.id)}
            className={cn(
              "w-full p-4 rounded-2xl flex items-center gap-3 transition-all",
              activeChat === conv.id ? "bg-zinc-700 text-white" : "hover:bg-white/5 text-zinc-400"
            )}
          >
            <img src={conv.avatar} alt={conv.name} className="w-10 h-10 rounded-full bg-zinc-800 object-cover" />
            <div className="text-left overflow-hidden">
              <p className="font-bold truncate">{conv.name}</p>
              <p className="text-xs opacity-60 truncate">Click to chat</p>
            </div>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800" />
              <h4 className="font-bold text-white">Chatting with {conversations.find(c => c.id === activeChat)?.name}</h4>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.senderId === user?.id ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] p-4 rounded-2xl",
                    m.senderId === user?.id ? "bg-zinc-700 text-white rounded-tr-none" : "bg-zinc-800 text-white rounded-tl-none"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5 flex gap-2">
              <input 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-800 border-none rounded-xl px-4 text-white focus:ring-2 focus:ring-emerald-500"
              />
              <button onClick={sendMessage} className="p-3 bg-zinc-700 text-white rounded-xl hover:scale-105 transition-transform">
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
              <MessageSquare size={32} />
            </div>
            <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GroupsSystem() {
  const [groups, setGroups] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      const data = await apiFetch<any[]>('/api/social/groups');
      setGroups(data);
    } catch {
      console.error('Failed to fetch groups');
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async () => {
    if (!name.trim()) return;
    try {
      await apiFetch('/api/social/groups', {
        method: 'POST',
        ...apiJson({ name, description: 'A new community' })
      });
      setName('');
      setShowCreate(false);
      fetchGroups();
      toast.success('Group created!');
    } catch {
      toast.error('Failed to create group');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-white tracking-tighter">Your Communities</h3>
        <button 
          onClick={() => setShowCreate(true)}
          className="bg-zinc-700 text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2"
        >
          <Plus size={18} />
          Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((g, i) => (
          <div key={i} className="bg-zinc-900 p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 mb-4 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              {g.name[0].toUpperCase()}
            </div>
            <h4 className="text-xl font-bold text-white mb-2">{g.name}</h4>
            <p className="text-zinc-500 text-sm mb-4">{g.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 bg-white/5 px-3 py-1 rounded-full">{g.memberCount} members</span>
              <button className="text-emerald-400 font-bold text-sm hover:underline">View Group</button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 p-8 rounded-[40px] border border-white/10 w-full max-w-md space-y-6"
          >
            <h3 className="text-2xl font-black text-white">New Community</h3>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group Name"
              className="w-full bg-zinc-800 border-none rounded-2xl p-4 text-white"
            />
            <div className="flex gap-4">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-4 rounded-2xl font-bold text-zinc-400 hover:bg-white/5">Cancel</button>
              <button onClick={createGroup} className="flex-1 py-4 bg-zinc-700 text-white rounded-2xl font-bold hover:scale-105 transition-transform">Create</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SocialAnalytics() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Reach', value: '1.2M', trend: '+12%', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Engagement Rate', value: '4.8%', trend: '+2.1%', icon: MessageSquare, color: 'text-blue-400' },
          { label: 'New Followers', value: '12.4K', trend: '+8%', icon: UserPlus, color: 'text-purple-400' },
          { label: 'Ad ROI', value: '3.2x', trend: '+0.5x', icon: Target, color: 'text-orange-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900 p-6 rounded-3xl border border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-emerald-400 text-xs font-bold">{stat.trend}</span>
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            <h4 className="text-3xl font-black text-white mt-1">{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 p-8 rounded-[40px] border border-white/5">
        <h3 className="text-xl font-black text-white mb-6">Growth Guidelines & Procedures</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-emerald-400 font-bold flex items-center gap-2">
              <ShieldCheck size={18} />
              SonicPro Content Standards
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex gap-2">• High-fidelity audio/video assets only</li>
              <li className="flex gap-2">• Mandatory metadata tagging for AI discovery</li>
              <li className="flex gap-2">• Minimum 3 posts per week for algorithm priority</li>
              <li className="flex gap-2">• Engagement with top 5% of followers daily</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-blue-400 font-bold flex items-center gap-2">
              <Target size={18} />
              Marketing Procedures
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex gap-2">• Ad campaigns must use SonicVisionary targeting</li>
              <li className="flex gap-2">• Cross-platform native sharing required for all releases</li>
              <li className="flex gap-2">• Community groups must have at least 1 active moderator</li>
              <li className="flex gap-2">• Monthly analytics review with SonicAI strategist</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
