import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, RefreshCw, Image as ImageIcon, Wand2, Layout, Palette, Zap } from 'lucide-react';
import { api } from '../../api';
import { toast } from '../../components/ui/Toast';
import { cn } from '../../utils/cn';

export const CoverArtGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const styles = [
    { id: 'cinematic', name: 'Cinematic', icon: Zap },
    { id: 'abstract', name: 'Abstract', icon: Palette },
    { id: 'minimalist', name: 'Minimalist', icon: Layout },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: Wand2 },
    { id: 'vintage', name: 'Vintage', icon: ImageIcon },
    { id: 'surreal', name: 'Surreal', icon: Sparkles },
    { id: 'brutalist', name: 'Brutalist', icon: Layout },
    { id: 'ethereal', name: 'Ethereal', icon: Wand2 },
    { id: 'vibrant', name: 'Vibrant', icon: Palette },
  ];

  const handleGenerate = async (bypassConfirm = false) => {
    if (!prompt) return;
    if (!bypassConfirm) {
      setShowConfirm(true);
      return;
    }
    setIsGenerating(true);
    try {
      const fullPrompt = `Professional album cover art, ${prompt}, style: ${style}, high resolution, 4k, artistic, no text, centered composition`;
      const { imageUrl } = await api.ai.generateImage(fullPrompt);
      setGeneratedImage(imageUrl);
      setHistory(prev => [imageUrl, ...prev].slice(0, 4));
      toast.success('Cover art generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate cover art');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `sonicstream-cover-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight">AI Cover Art Generator</h2>
          <p className="text-zinc-500">Create professional album artwork in seconds using advanced AI.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Describe your vision</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A lonely astronaut floating in a sea of neon jellyfish..."
              className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 h-32 resize-none focus:border-emerald-500/50 outline-none transition-all text-lg"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Style</label>
            <div className="grid grid-cols-3 gap-3">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                    style === s.id 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10 hover:text-white"
                  )}
                >
                  <s.icon size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !prompt}
            className="w-full py-6 bg-zinc-700 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={24} className="animate-spin" />
                Generating Masterpiece...
              </>
            ) : (
              <>
                <Sparkles size={24} />
                Generate Cover Art
              </>
            )}
          </button>
        </div>

        {history.length > 0 && (
          <div className="space-y-4 pt-8 border-t border-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Recent Generations</h3>
            <div className="grid grid-cols-4 gap-4">
              {history.map((img, i) => (
                <button 
                  key={i}
                  onClick={() => setGeneratedImage(img)}
                  className="aspect-square rounded-xl overflow-hidden border border-white/5 hover:border-emerald-500/50 transition-all"
                >
                  <img src={img} alt="History" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="sticky top-8">
          <div className="aspect-square bg-zinc-900/50 border border-white/5 rounded-[48px] overflow-hidden relative group shadow-2xl">
            <AnimatePresence mode="wait">
              {generatedImage ? (
                <motion.img 
                  key={generatedImage}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  src={generatedImage} 
                  alt="Generated Cover Art" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 space-y-6">
                  <div className="w-24 h-24 bg-zinc-800 rounded-[32px] flex items-center justify-center">
                    <ImageIcon size={48} className="opacity-20" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl font-black uppercase tracking-tight">Preview Canvas</p>
                    <p className="text-sm font-medium opacity-40">Your AI artwork will appear here</p>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {isGenerating && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-emerald-500/20 rounded-full animate-ping" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="text-emerald-400 animate-pulse" size={32} />
                  </div>
                </div>
                <p className="text-sm font-bold text-white uppercase tracking-widest">Painting your vision...</p>
              </div>
            )}

            {generatedImage && !isGenerating && (
              <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-4">
                <button 
                  onClick={downloadImage}
                  className="px-6 py-3 bg-white text-white rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-700 transition-all"
                >
                  <Download size={18} />
                  Download 4K
                </button>
                <button 
                  onClick={() => setGeneratedImage(null)}
                  className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-all"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Zap className="text-emerald-400" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">Pro Tip</p>
              <p className="text-[10px] text-zinc-500">Use descriptive adjectives like "ethereal", "brutalist", or "vibrant" for better results.</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 p-8 rounded-[32px] max-w-md w-full space-y-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase text-white tracking-tight">Confirm AI processing</h3>
                <p className="text-sm text-zinc-400">
                  Generating professional AI album cover art requires server-side image scaling and will consume <span className="text-emerald-400 font-bold font-mono">1 AI Generation Credit</span> from your monthly allotment.
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xl font-bold uppercase text-xs tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowConfirm(false);
                    handleGenerate(true);
                  }}
                  className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider transition-all"
                >
                  Confirm & Start
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
