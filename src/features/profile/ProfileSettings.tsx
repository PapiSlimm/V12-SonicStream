import React, { useState, useEffect } from 'react';
import { User, Instagram, Twitter, Music, Save, RefreshCw, Plus, X, Activity, Youtube, Facebook, Link, Globe } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import { api } from '../../api';
import { auth } from '../../firebase';

export const ProfileSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({
    name: '',
    bio: '',
    socialLinks: {
      instagram: '',
      twitter: '',
      spotify: '',
      youtube: '',
      facebook: '',
      thread: '',
      reddit: '',
      tiktok: ''
    },
    preferredGenres: []
  });
  const [newGenre, setNewGenre] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setProfile({
        ...data,
        socialLinks: data.socialLinks ? {
          instagram: '',
          twitter: '',
          spotify: '',
          youtube: '',
          facebook: '',
          thread: '',
          reddit: '',
          tiktok: '',
          ...JSON.parse(data.socialLinks)
        } : {
          instagram: '',
          twitter: '',
          spotify: '',
          youtube: '',
          facebook: '',
          thread: '',
          reddit: '',
          tiktok: ''
        },
        preferredGenres: data.preferredGenres ? JSON.parse(data.preferredGenres) : []
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      await api.artist.updateProfile(auth.currentUser.uid, {
        ...profile,
        socialLinks: profile.socialLinks,
        preferredGenres: profile.preferredGenres
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addGenre = () => {
    if (newGenre && !profile.preferredGenres.includes(newGenre)) {
      setProfile({
        ...profile,
        preferredGenres: [...profile.preferredGenres, newGenre]
      });
      setNewGenre('');
    }
  };

  const removeGenre = (genre: string) => {
    setProfile({
      ...profile,
      preferredGenres: profile.preferredGenres.filter((g: string) => g !== genre)
    });
  };

  if (loading) return <div className="p-12 text-center text-zinc-500">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Profile Settings</h1>
          <p className="text-zinc-500 font-medium">Customize your digital presence on SonicStream.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="h-14 px-8 rounded-2xl">
          {saving ? <RefreshCw className="animate-spin mr-2" /> : <Save className="mr-2" />}
          Save Changes
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Basic Info */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <User size={14} />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400">Display Name</label>
                <input 
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400">Biography</label>
                <textarea 
                  value={profile.bio || ''}
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                  placeholder="Tell the world your story..."
                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 h-40 focus:border-emerald-500/50 transition-all resize-none"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Music size={14} />
              Preferred Genres
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.preferredGenres.map((genre: string) => (
                <span key={genre} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-bold">
                  {genre}
                  <button onClick={() => removeGenre(genre)} className="hover:text-white">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                value={newGenre}
                onChange={e => setNewGenre(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addGenre()}
                placeholder="Add a genre..."
                className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-2"
              />
              <Button onClick={addGenre} variant="secondary" className="rounded-xl">
                <Plus size={18} />
              </Button>
            </div>
          </section>
        </div>

        {/* Social Links */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Activity size={14} />
              Artist Verification
            </h3>
            <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  profile.verificationStatus === 'verified' ? "bg-emerald-500/10 text-emerald-500" :
                  profile.verificationStatus === 'pending' ? "bg-orange-500/10 text-orange-500" :
                  "bg-zinc-800 text-zinc-500"
                )}>
                  <Activity size={24} />
                </div>
                <div>
                  <p className="font-bold uppercase tracking-tight">
                    {profile.verificationStatus === 'verified' ? 'Verified Artist' :
                     profile.verificationStatus === 'pending' ? 'Verification Pending' :
                     'Unverified Profile'}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {profile.verificationStatus === 'verified' ? 'Your identity has been confirmed.' :
                     profile.verificationStatus === 'pending' ? 'We are reviewing your documents.' :
                     'Verify your identity to unlock exclusive features.'}
                  </p>
                </div>
              </div>
              {profile.verificationStatus === 'unverified' && (
                <Button 
                  variant="outline" 
                  className="rounded-xl"
                  onClick={() => window.location.href = '/artist/verify'}
                >
                  Verify Now
                </Button>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Instagram size={14} />
              Social Media Links
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-2xl p-4">
                <Instagram className="text-zinc-500" />
                <input 
                  placeholder="Instagram URL"
                  value={profile.socialLinks.instagram}
                  onChange={e => setProfile({...profile, socialLinks: {...profile.socialLinks, instagram: e.target.value}})}
                  className="bg-transparent border-none focus:ring-0 w-full"
                />
              </div>
              <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-2xl p-4">
                <Twitter className="text-zinc-500" />
                <input 
                  placeholder="X (Twitter) URL"
                  value={profile.socialLinks.twitter}
                  onChange={e => setProfile({...profile, socialLinks: {...profile.socialLinks, twitter: e.target.value}})}
                  className="bg-transparent border-none focus:ring-0 w-full"
                />
              </div>

              <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-2xl p-4">
                <Youtube className="text-zinc-500" />
                <input 
                  placeholder="YouTube URL"
                  value={profile.socialLinks.youtube || ''}
                  onChange={e => setProfile({...profile, socialLinks: {...profile.socialLinks, youtube: e.target.value}})}
                  className="bg-transparent border-none focus:ring-0 w-full"
                />
              </div>

              <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-2xl p-4">
                <Facebook className="text-zinc-500" />
                <input 
                  placeholder="Facebook URL"
                  value={profile.socialLinks.facebook || ''}
                  onChange={e => setProfile({...profile, socialLinks: {...profile.socialLinks, facebook: e.target.value}})}
                  className="bg-transparent border-none focus:ring-0 w-full"
                />
              </div>

              <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-2xl p-4">
                <Globe className="text-zinc-500" />
                <input 
                  placeholder="Threads URL"
                  value={profile.socialLinks.thread || ''}
                  onChange={e => setProfile({...profile, socialLinks: {...profile.socialLinks, thread: e.target.value}})}
                  className="bg-transparent border-none focus:ring-0 w-full"
                />
              </div>

              <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-2xl p-4">
                <Globe className="text-zinc-500" />
                <input 
                  placeholder="Reddit URL"
                  value={profile.socialLinks.reddit || ''}
                  onChange={e => setProfile({...profile, socialLinks: {...profile.socialLinks, reddit: e.target.value}})}
                  className="bg-transparent border-none focus:ring-0 w-full"
                />
              </div>

              <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-2xl p-4">
                <Link className="text-zinc-500" />
                <input 
                  placeholder="TikTok URL"
                  value={profile.socialLinks.tiktok || ''}
                  onChange={e => setProfile({...profile, socialLinks: {...profile.socialLinks, tiktok: e.target.value}})}
                  className="bg-transparent border-none focus:ring-0 w-full"
                />
              </div>

              <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-2xl p-4">
                <Music className="text-zinc-500" />
                <input 
                  placeholder="Spotify URL"
                  value={profile.socialLinks.spotify}
                  onChange={e => setProfile({...profile, socialLinks: {...profile.socialLinks, spotify: e.target.value}})}
                  className="bg-transparent border-none focus:ring-0 w-full"
                />
              </div>
            </div>
          </section>

          <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-4xl space-y-4">
            <h4 className="font-black uppercase tracking-tight text-emerald-400">Subscription Status</h4>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black uppercase">{profile.subscriptionTier || 'Free'}</span>
              <Button variant="outline" className="rounded-xl">Upgrade Plan</Button>
            </div>
            <p className="text-sm text-zinc-500">Your next billing date is April 9, 2026.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
