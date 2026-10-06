import { useState } from 'react';
import { Mail, Send, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIPlaylistPitching() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pitches, setPitches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generatePitches = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/playlist/playlist-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: 1 }) // Mock track ID
      });
      const data = await response.json();
      if (data.bestPitches) {
        setPitches(data.bestPitches);
      } else {
        setError(data.message || 'Failed to generate pitches');
      }
    } catch {
      setError('Failed to connect to AI service');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-emerald-500" />
            AI Playlist Pitching
          </h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2">100k Curator Database • Personalized AI Pitches</p>
        </div>
        <button 
          onClick={generatePitches}
          disabled={isGenerating}
          className="px-10 py-5 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 disabled:opacity-50 flex items-center gap-3"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Pitches
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[32px] flex items-center gap-6 text-red-500">
          <AlertCircle className="w-8 h-8" />
          <p className="font-black uppercase tracking-widest text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence>
          {pitches.map((pitch, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="bg-zinc-900 rounded-[48px] p-10 border border-white/5 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all"></div>
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center font-black text-xl text-emerald-500 border border-white/5">
                    {pitch.curator.name[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-xl uppercase tracking-tight text-white">{pitch.curator.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{pitch.curator.followers.toLocaleString()} Followers</span>
                      <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{pitch.curator.genre}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-500 tracking-tighter">{Math.round(pitch.successChance)}%</div>
                  <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Success Rate</div>
                </div>
              </div>

              <div className="bg-zinc-800/30 rounded-[32px] p-8 border border-white/5 mb-8 relative">
                <div className="absolute top-6 right-8 opacity-10">
                  <Mail className="w-12 h-12 text-white" />
                </div>
                <p className="text-zinc-400 font-medium leading-relaxed italic text-sm">
                  "{pitch.pitch}"
                </p>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 py-5 bg-white text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-700 transition-all flex items-center justify-center gap-3">
                  <Send className="w-4 h-4" />
                  Send Pitch
                </button>
                <button className="px-8 py-5 bg-zinc-800 text-zinc-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:text-white hover:bg-zinc-700 transition-all">
                  Edit
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {pitches.length === 0 && !isGenerating && !error && (
          <div className="col-span-full py-32 text-center bg-zinc-900/50 rounded-[64px] border border-dashed border-white/10">
            <Sparkles className="w-16 h-16 text-zinc-700 mx-auto mb-6 opacity-20" />
            <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-500">No Pitches Generated Yet</h3>
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs mt-2">Click the button above to analyze your track and find curators</p>
          </div>
        )}
      </div>
    </div>
  );
}
