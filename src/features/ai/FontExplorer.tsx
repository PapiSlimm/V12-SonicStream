import { useState } from 'react';
import { motion } from 'framer-motion';
import { Type, Search, Loader2, Copy } from 'lucide-react';
import { api } from '../../api';

interface FontRec {
  name: string;
  category: string;
  description: string;
  pairing: string;
}

export const FontExplorer = () => {
  const [mood, setMood] = useState('modern');
  const [purpose, setPurpose] = useState('branding');
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState<FontRec[]>([]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const recs = await api.post<FontRec[]>('/ai/font-recommendations', { mood, purpose });
      setRecommendations(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row gap-8 items-end">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Project Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="modern">Modern & Minimal</option>
              <option value="brutalist">Bold & Brutalist</option>
              <option value="elegant">Elegant & Luxury</option>
              <option value="playful">Playful & Vibrant</option>
              <option value="tech">Tech & Futuristic</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Project Purpose</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="branding">Brand Identity</option>
              <option value="website">Website Design</option>
              <option value="poster">Event Poster</option>
              <option value="app">Mobile App</option>
              <option value="editorial">Editorial/Magazine</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-8 py-4 bg-white text-black font-black rounded-2xl flex items-center gap-2 hover:bg-zinc-200 disabled:opacity-50 transition-all"
        >
          {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
          Find Fonts
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recommendations.length > 0 ? (
          recommendations.map((font, i) => (
            <motion.div
              key={font.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-900/50 border border-white/5 p-8 rounded-[32px] space-y-6 hover:border-white/10 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800 px-3 py-1 rounded-full">
                  {font.category}
                </span>
                <button className="text-zinc-500 hover:text-white transition-colors">
                  <Copy size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-4xl font-medium text-white" style={{ fontFamily: 'Inter' }}>{font.name}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{font.description}</p>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Best Paired With</p>
                  <p className="text-sm font-bold text-emerald-400">{font.pairing}</p>
                </div>
                <button className="w-full py-3 bg-white/5 text-white text-sm font-bold rounded-xl hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                  Import to Project
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-[48px]">
            <Type size={48} className="text-zinc-800 mx-auto" />
            <p className="text-zinc-500">Select your project mood and purpose to get AI font recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
};
