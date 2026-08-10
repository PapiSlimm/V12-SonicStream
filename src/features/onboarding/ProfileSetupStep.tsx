import { useState } from 'react';
import { Camera, MapPin, Globe, Instagram, Twitter, Music2, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface ProfileSetupStepProps {
  userData: any;
  onSuccess: () => void;
}

export const ProfileSetupStep = ({ userData, onSuccess }: ProfileSetupStepProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    profileImage: null as File | null,
    genres: [] as string[],
    locationCountry: '',
    locationCity: '',
    payoutCurrency: 'USD',
    socialLinks: { website: '', instagram: '', tiktok: '' }
  });

  const tabs = [
    { id: 0, title: 'Basics', icon: Music2 },
    { id: 1, title: 'Location', icon: MapPin },
    { id: 2, title: 'Links', icon: Globe },
    { id: 3, title: 'Finalize', icon: Check }
  ];

  const genres = ['R&B', 'Hip-Hop', 'Pop', 'Electronic', 'Rock', 'Country', 'Jazz', 'Classical', 'Latin'];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', userData.email);
      formDataToSend.append('type', userData.type);
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'profileImage' && value instanceof File) {
          formDataToSend.append(key, value);
        } else if (key === 'genres' || key === 'socialLinks') {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (typeof value === 'string') {
          formDataToSend.append(key, value);
        }
      });

      const res = await fetch('/api/artist/profile/setup', {
        method: 'POST',
        body: formDataToSend
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white">Setup your profile</h2>
        <p className="text-zinc-400">Tell us a bit more about your creative journey</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-zinc-800/30 rounded-2xl p-1.5 border border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-zinc-700 text-white shadow-lg'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden md:inline">{tab.title}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 0 && (
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                <div className="w-32 h-32 bg-zinc-800 rounded-full border-4 border-white/10 overflow-hidden flex items-center justify-center">
                  {formData.profileImage ? (
                    <img 
                      src={URL.createObjectURL(formData.profileImage)} 
                      className="w-full h-full object-cover" 
                      alt="Preview" 
                    />
                  ) : (
                    <Camera className="w-10 h-10 text-zinc-600" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={e => setFormData({...formData, profileImage: e.target.files?.[0] || null})}
                    accept="image/*"
                  />
                  <span className="text-xs font-bold text-white">Upload Photo</span>
                </label>
              </div>
              <div className="w-full space-y-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2">Stage Name / Display Name</label>
                  <input
                    value={formData.displayName}
                    onChange={e => setFormData({...formData, displayName: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="e.g. DJ Sonic"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-bold text-zinc-400">Primary Genres</label>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => {
                      const newGenres = formData.genres.includes(genre)
                        ? formData.genres.filter(g => g !== genre)
                        : [...formData.genres, genre];
                      setFormData({...formData, genres: newGenres.slice(0, 5)});
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                      formData.genres.includes(genre)
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-800/50 border-white/10 text-zinc-500 hover:border-white/20'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500">Select up to 5 genres that define your sound.</p>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-zinc-400">Country</label>
              <select
                value={formData.locationCountry}
                onChange={e => setFormData({...formData, locationCountry: e.target.value})}
                className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-emerald-500 focus:outline-none appearance-none"
              >
                <option value="">Select country</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-zinc-400">City</label>
              <input
                value={formData.locationCity}
                onChange={e => setFormData({...formData, locationCity: e.target.value})}
                className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-emerald-500 focus:outline-none transition-all"
                placeholder="e.g. Los Angeles"
              />
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                <input
                  value={formData.socialLinks.website}
                  onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, website: e.target.value}})}
                  className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Website URL"
                />
              </div>
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                <input
                  value={formData.socialLinks.instagram}
                  onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, instagram: e.target.value}})}
                  className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Instagram Handle"
                />
              </div>
              <div className="relative">
                <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                <input
                  value={formData.socialLinks.tiktok}
                  onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, tiktok: e.target.value}})}
                  className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="TikTok Handle"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="text-center space-y-8 py-8">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/50">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Ready to launch!</h3>
              <p className="text-zinc-400">Everything looks great. Click below to finalize your profile.</p>
            </div>
            <div className="bg-zinc-800/30 rounded-2xl p-6 border border-white/5 inline-block text-left space-y-2">
              <p className="text-sm text-zinc-500">Selected Currency</p>
              <select
                value={formData.payoutCurrency}
                onChange={e => setFormData({...formData, payoutCurrency: e.target.value})}
                className="bg-transparent text-xl font-black text-white focus:outline-none"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-8 border-t border-white/10">
        {activeTab > 0 && (
          <button
            onClick={() => setActiveTab(activeTab - 1)}
            className="flex items-center gap-2 px-8 py-4 text-zinc-400 hover:text-white font-bold transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}
        
        {activeTab < 3 ? (
          <button
            onClick={() => setActiveTab(activeTab + 1)}
            disabled={activeTab === 0 && (!formData.displayName || formData.genres.length === 0)}
            className="ml-auto flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-10 py-4 rounded-2xl transition-all disabled:opacity-50"
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="ml-auto bg-gradient-to-r from-emerald-500 to-purple-500 text-white font-black px-12 py-4 rounded-2xl shadow-xl hover:shadow-black/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Launching...' : 'Launch Profile'}
          </button>
        )}
      </div>
    </div>
  );
};
