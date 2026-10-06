import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Globe, Instagram, MessageSquare, Music, Upload } from 'lucide-react';

export default function OnboardingFlow({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const navigate = useNavigate();

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);
  const updateData = (data: any) => setFormData({ ...formData, ...data });

  const handleFinish = () => {
    onFinish();
    navigate('/dashboard');
  };

  const steps = [
    {
      title: "Welcome to Your Artist Journey",
      component: (
        <div className="text-center">
          <h2 className="text-5xl font-black mb-8 bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent uppercase tracking-tighter">
            Launch Your Music Career
          </h2>
          <div className="max-w-2xl mx-auto space-y-8">
            <p className="text-xl text-zinc-400 font-medium">Complete your profile in 3 minutes → Unlock AI tools + distribution</p>
            <button 
              onClick={nextStep} 
              className="px-12 py-5 bg-zinc-700 text-white rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-lg shadow-black/20"
            >
              Get Started
            </button>
          </div>
        </div>
      )
    },
    {
      title: "Your Sound",
      component: (
        <div className="max-w-md mx-auto space-y-8">
          <div className="space-y-4">
            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500">Pick your top 3 genres</label>
            <div className="grid grid-cols-2 gap-3">
              {['Indie', 'Hip Hop', 'Electronic', 'Rock', 'Pop', 'R&B'].map(genre => (
                <label key={genre} className="flex items-center p-4 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-zinc-800 cursor-pointer transition-all group">
                  <input 
                    type="checkbox" 
                    className="mr-4 w-5 h-5 accent-emerald-500"
                    onChange={(e) => {
                      const genres = formData.genres || [];
                      if (e.target.checked) {
                        updateData({ genres: [...genres, genre] });
                      } else {
                        updateData({ genres: genres.filter((g: string) => g !== genre) });
                      }
                    }}
                  />
                  <span className="font-bold text-zinc-300 group-hover:text-white">{genre}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500">How would you describe your mood?</label>
            <input 
              type="text" 
              placeholder="e.g. dreamy, nostalgic, energetic"
              onChange={(e) => updateData({ mood: e.target.value })}
              className="w-full p-5 bg-zinc-900 border border-white/5 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-white transition-all" 
            />
          </div>
          <div className="flex justify-between gap-4 pt-4">
            <button onClick={prevStep} className="px-8 py-4 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 transition-all">Back</button>
            <button onClick={nextStep} className="flex-1 px-8 py-4 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all">Next</button>
          </div>
        </div>
      )
    },
    {
      title: "First Release 🚀",
      component: (
        <div className="max-w-md mx-auto space-y-8 text-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl mx-auto flex items-center justify-center mb-4">
            <Music className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="space-y-2 text-left">
            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500">Track Title</label>
            <input 
              type="text" 
              placeholder="e.g. Midnight Drive"
              onChange={(e) => updateData({ trackTitle: e.target.value })}
              className="w-full p-5 bg-zinc-900 border border-white/5 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-white transition-all" 
            />
          </div>
          <div className="p-10 border-2 border-dashed border-white/10 rounded-[32px] hover:border-emerald-500/50 transition-all cursor-pointer group">
            <Upload className="w-12 h-12 text-zinc-600 group-hover:text-emerald-500 mx-auto mb-4 transition-all" />
            <p className="font-black uppercase tracking-widest text-xs text-zinc-500 group-hover:text-white">Upload Audio File (WAV/MP3)</p>
            <input type="file" className="hidden" accept="audio/*" />
          </div>
          <div className="flex justify-between gap-4 pt-4">
            <button onClick={prevStep} className="px-8 py-4 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 transition-all">Back</button>
            <button onClick={nextStep} className="flex-1 px-8 py-4 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all">Next</button>
          </div>
        </div>
      )
    },
    {
      title: "Connect Your World",
      component: (
        <div className="max-w-md mx-auto space-y-8">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500">Spotify Artist URL</label>
            <div className="relative">
              <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input type="url" placeholder="https://open.spotify.com/artist/..." className="w-full p-5 pl-14 bg-zinc-900 border border-white/5 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-white transition-all" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500">Instagram / TikTok</label>
            <div className="relative">
              <Instagram className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input type="text" placeholder="@yourhandle" className="w-full p-5 pl-14 bg-zinc-900 border border-white/5 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-white transition-all" />
            </div>
          </div>
          <div className="flex justify-between gap-4 pt-4">
            <button onClick={prevStep} className="px-8 py-4 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 transition-all">Back</button>
            <button onClick={nextStep} className="flex-1 px-8 py-4 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all">Next</button>
          </div>
        </div>
      )
    },
    {
      title: "You're Ready! 🎵",
      component: (
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-[32px] mx-auto mb-8 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Check className="w-12 h-12 text-black" />
          </div>
          <h2 className="text-4xl font-black mb-6 uppercase tracking-tighter">Profile Complete!</h2>
          <p className="text-xl text-zinc-400 mb-10 font-medium">Our AI just analyzed your genre and prepared your distribution strategy.</p>
          <div className="grid md:grid-cols-2 gap-6 mb-10 text-left">
            <div className="p-8 bg-zinc-900 rounded-3xl border border-white/5 shadow-xl">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="font-black text-lg mb-2 uppercase tracking-tight">AI Playlist Pitches</h3>
              <p className="text-sm text-zinc-500 font-medium">5 personalized emails ready for indie curators</p>
            </div>
            <div className="p-8 bg-zinc-900 rounded-3xl border border-white/5 shadow-xl">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="font-black text-lg mb-2 uppercase tracking-tight">Global Distribution</h3>
              <p className="text-sm text-zinc-500 font-medium">One-click release to 150+ streaming platforms</p>
            </div>
          </div>
          <button 
            onClick={handleFinish} 
            className="w-full px-12 py-5 bg-zinc-700 text-white rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20"
          >
            Go to Dashboard
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-zinc-900 border border-white/5 px-6 py-3 rounded-full shadow-xl mb-8">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></div>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Step {step} of 4</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-zinc-500">
            {steps[step-1].title}
          </h1>
        </div>
        
        <motion.div 
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-zinc-900/50 backdrop-blur-xl rounded-[48px] shadow-2xl border border-white/5 p-12"
        >
          {steps[step-1].component}
        </motion.div>

        <div className="mt-12 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${i + 1 <= step ? 'w-8 bg-emerald-500' : 'w-2 bg-zinc-800'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
