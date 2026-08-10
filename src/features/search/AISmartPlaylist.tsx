import { useState } from 'react';
import { Sparkles, Loader2, Play, Plus, Music } from 'lucide-react';
import { api } from '../../api';
import { Track } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrack } from '../../context/TrackContext';

export const AISmartPlaylist = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<Track[]>([]);
  const { setQueue, playTrack } = useTrack();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await api.ai.generatePlaylist(prompt);
      setGeneratedPlaylist(response.tracks);
    } catch (error) {
      console.error('Failed to generate playlist:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const playAll = () => {
    if (generatedPlaylist.length > 0) {
      setQueue(generatedPlaylist);
      playTrack(generatedPlaylist[0]);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-8 mb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
          <Sparkles className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">AI Smart Playlist</h2>
          <p className="text-zinc-400 text-sm">Describe the vibe, and let AI curate the perfect set for you.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. 'Late night drive through Tokyo' or 'High energy workout mix'"
          className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:border-emerald-500 outline-none transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-bold px-8 rounded-2xl flex items-center gap-2 transition-all"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          Generate
        </button>
      </div>

      <AnimatePresence>
        {generatedPlaylist.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-zinc-400 uppercase tracking-widest text-xs">Generated Selection</h3>
              <button 
                onClick={playAll}
                className="text-emerald-400 hover:text-emerald-300 text-sm font-bold flex items-center gap-2"
              >
                <Play size={16} fill="currentColor" />
                Play All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedPlaylist.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl group hover:border-emerald-500/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative">
                    <img 
                      src={track.coverUrl || `https://picsum.photos/seed/${track.id}/200/200`} 
                      className="w-full h-full object-cover"
                      alt={track.title}
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      onClick={() => playTrack(track)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play size={20} fill="white" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{track.title}</h4>
                    <p className="text-xs text-zinc-500 truncate">{track.displayArtistName}</p>
                  </div>
                  <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                    <Plus size={20} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isGenerating && generatedPlaylist.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
            <Music className="text-zinc-600" />
          </div>
          <p className="text-zinc-500 text-sm max-w-xs">Your AI generated playlist will appear here. Try describing a mood or setting!</p>
        </div>
      )}
    </div>
  );
};
