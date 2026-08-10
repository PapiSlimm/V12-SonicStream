import { useState } from 'react';
import { RefreshCw, Image as ImageIcon, Send, Layout, Maximize2, Download, Globe, MapPin } from 'lucide-react';
import { apiFetch } from '../../api/apiFetch';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

export const AIAssistant = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [groundingSources, setGroundingSources] = useState<any[]>([]);

  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResponse('');
    setGeneratedImage(null);
    setGroundingSources([]);

    try {
      if (mode === 'text') {
        const data = await apiFetch<any>('/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({ prompt, genre, mood })
        });
        
        setResponse(data.response || 'No response generated.');
        if (data.groundingSources) {
          setGroundingSources(data.groundingSources);
        }
      } else {
        const data = await apiFetch<any>('/api/ai/generate-image', {
          method: 'POST',
          body: JSON.stringify({ prompt, aspectRatio })
        });

        if (data.imageUrl) {
          setGeneratedImage(data.imageUrl);
        } else {
          setResponse('No image generated or invalid response from AI.');
        }
      }
    } catch (err) {
      console.error('AI Error:', err);
      setResponse('Sorry, I encountered an error processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <RefreshCw size={24} className={cn("text-black", isLoading && "animate-spin")} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">SonicStream AI</h3>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Powered by Gemini</p>
          </div>
        </div>
        
        <div className="flex bg-black p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setMode('text')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              mode === 'text' ? "bg-white text-black" : "text-zinc-500 hover:text-white"
            )}
          >
            <Send size={14} />
            Chat
          </button>
          <button 
            onClick={() => setMode('image')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
              mode === 'image' ? "bg-white text-black" : "text-zinc-500 hover:text-white"
            )}
          >
            <ImageIcon size={14} />
            Generate
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <form onSubmit={handleAsk} className="space-y-6">
          {mode === 'text' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Genre Context</label>
                <input 
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                  placeholder="e.g. Techno, Jazz"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mood Context</label>
                <input 
                  value={mood}
                  onChange={e => setMood(e.target.value)}
                  placeholder="e.g. Dark, Euphoric"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          )}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'text' ? "Ask me anything about music, artists, or your catalog..." : "Describe the image you want to generate..."}
              className="w-full bg-black border border-white/10 rounded-3xl p-6 text-lg focus:outline-none focus:border-emerald-500 transition-all min-h-[150px] resize-none"
            />
            {mode === 'image' && (
              <div className="absolute bottom-6 right-6 flex items-center gap-3">
                <Layout size={18} className="text-zinc-500" />
                <select 
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="bg-zinc-900 text-xs font-bold border border-white/10 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="16:9">16:9 Wide</option>
                  <option value="9:16">9:16 Tall</option>
                  <option value="4:3">4:3 Classic</option>
                </select>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-zinc-700 text-white font-black uppercase tracking-widest py-5 rounded-2xl hover:bg-zinc-600 transition-all disabled:opacity-50 shadow-xl shadow-black/20 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {mode === 'text' ? <Send size={20} /> : <ImageIcon size={20} />}
                {mode === 'text' ? "Send Message" : "Generate Image"}
              </>
            )}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {(response || generatedImage) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {generatedImage && (
                <div className="relative group rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                  <img src={generatedImage} alt="AI Generated" className="w-full h-auto" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button className="p-4 bg-white text-black rounded-2xl hover:scale-110 transition-transform">
                      <Download size={24} />
                    </button>
                    <button className="p-4 bg-white text-black rounded-2xl hover:scale-110 transition-transform">
                      <Maximize2 size={24} />
                    </button>
                  </div>
                </div>
              )}
              
              {response && (
                <div className="bg-black/50 border border-white/5 p-8 rounded-[32px] text-zinc-300 leading-relaxed shadow-inner">
                  <div className="prose prose-invert max-w-none prose-p:text-lg">
                    {response}
                  </div>
                  
                  {groundingSources.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sources & Grounding</h4>
                      <div className="flex flex-wrap gap-3">
                        {groundingSources.map((chunk, i) => {
                          const web = chunk.web;
                          const maps = chunk.maps;
                          if (web) {
                            return (
                              <a 
                                key={i} 
                                href={web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold hover:bg-white/10 transition-colors"
                              >
                                <Globe size={12} className="text-emerald-400" />
                                {web.title}
                              </a>
                            );
                          }
                          if (maps) {
                            return (
                              <a 
                                key={i} 
                                href={maps.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold hover:bg-white/10 transition-colors"
                              >
                                <MapPin size={12} className="text-blue-400" />
                                {maps.title}
                              </a>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
