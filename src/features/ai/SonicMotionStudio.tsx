import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Sparkles, 
  Loader2, 
  Download, 
  AlertCircle, 
  Sliders, 
  Zap, 
  Music, 
  ChevronDown
} from 'lucide-react';
import { api } from '../../api';
import { cn } from '../../utils/cn';

export const SonicMotionStudio = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState('none');
  const [selectedTransition, setSelectedTransition] = useState('none');
  const [enhanceAudio, setEnhanceAudio] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [showConfirm, setShowConfirm] = useState(false);
  const [duration, setDuration] = useState('10');

  const presets = [
    { id: 'none', name: 'No Preset' },
    { id: 'cinematic', name: 'Cinematic Teal & Orange' },
    { id: 'glitch', name: 'Glitch Distortion Pro' },
    { id: 'vhs', name: 'VHS Retro Aesthetic' },
    { id: 'minimal', name: 'Modern Minimal' },
  ];

  const transitions = [
    { id: 'none', name: 'No Transition' },
    { id: 'dissolve', name: 'Cross Dissolve' },
    { id: 'zoom', name: 'Dynamic Zoom' },
    { id: 'glitch', name: 'Glitch Transition' },
    { id: 'whip', name: 'Whip Pan' },
  ];

  const suggestions = [
    'Minimalist product reveal with soft shadows',
    'Cyberpunk music video intro with neon lights',
    'Cinematic landscape transition for travel vlog',
    'Abstract liquid motion with vibrant colors',
  ];

  const handleGenerate = async (bypassConfirm = false) => {
    if (!prompt.trim()) return;
    if (!bypassConfirm) {
      setShowConfirm(true);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    try {
      const response = await api.post<{ videoUrl?: string; status?: string; message?: string }>('/ai/generate-video', { 
        prompt,
        preset: selectedPreset,
        transition: selectedTransition,
        enhanceAudio,
        aspectRatio,
        resolution,
        duration
      });
      if (response.videoUrl) {
        setGeneratedVideo(response.videoUrl);
      } else if (response.status === 'processing') {
        setError(response.message ?? null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-white">SonicMotion Studio</h2>
          <p className="text-zinc-400">Transform your ideas into professional motion graphics using AI.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Describe your animation</label>
              <div className="flex gap-2">
                {suggestions.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => setPrompt(s)}
                    className="text-[10px] bg-white/5 hover:bg-white/10 text-zinc-400 px-2 py-1 rounded-md transition-all"
                  >
                    Suggest {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A cinematic product reveal of a sleek headphone with neon glowing edges, floating in a dark studio..."
              className="w-full h-32 bg-black/40 border border-white/5 rounded-3xl p-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Sliders size={12} />
                Editing Preset
              </label>
              <div className="relative">
                <select 
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-emerald-500/50 transition-all"
                >
                  {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Zap size={12} />
                Transition
              </label>
              <div className="relative">
                <select 
                  value={selectedTransition}
                  onChange={(e) => setSelectedTransition(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-emerald-500/50 transition-all"
                >
                  {transitions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Ratio</label>
              <select 
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
                <option value="4:5">4:5</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Res</label>
              <select 
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4K">4K</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Secs</label>
              <select 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="5">5s</option>
                <option value="10">10s</option>
                <option value="15">15s</option>
                <option value="30">30s</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                enhanceAudio ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"
              )}>
                <Music size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">AI Audio Enhancement</p>
                <p className="text-[10px] text-zinc-500">Auto-mastering & beat sync</p>
              </div>
            </div>
            <button 
              onClick={() => setEnhanceAudio(!enhanceAudio)}
              className={cn(
                "w-12 h-6 rounded-full relative transition-all",
                enhanceAudio ? "bg-emerald-500" : "bg-zinc-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                enhanceAudio ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="flex-1 py-4 bg-zinc-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Animation
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="bg-black/60 rounded-[40px] border border-white/5 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {generatedVideo ? (
          <div className="w-full space-y-6">
            <div className="aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <video 
                src={generatedVideo} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-4">
              <button className="flex-1 py-3 bg-zinc-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all">
                <Download size={18} />
                Download MP4
              </button>
              <button className="px-6 py-3 bg-white/5 text-zinc-400 font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all">
                Share
              </button>
            </div>

            <div className="pt-8 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Timeline Preview</h4>
                <div className="flex gap-2">
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">00:00:00</span>
                  <span className="text-[10px] text-zinc-600">/</span>
                  <span className="text-[10px] text-zinc-600">00:00:{duration.padStart(2, '0')}</span>
                </div>
              </div>
              <div className="h-24 bg-black/40 rounded-2xl border border-white/5 p-4 relative group overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-0.5 bg-emerald-500 z-10 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <div className="space-y-2">
                  <div className="h-4 bg-emerald-500/20 rounded-md w-full border border-emerald-500/30 flex items-center px-2">
                    <span className="text-[8px] text-emerald-400 font-bold uppercase">Video Track 1</span>
                  </div>
                  <div className="h-4 bg-blue-500/20 rounded-md w-3/4 border border-blue-500/30 flex items-center px-2">
                    <span className="text-[8px] text-blue-400 font-bold uppercase">Audio Track 1</span>
                  </div>
                  <div className="h-4 bg-purple-500/20 rounded-md w-1/2 border border-purple-500/30 flex items-center px-2">
                    <span className="text-[8px] text-purple-400 font-bold uppercase">VFX Overlay</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 max-w-xs">
            <div className="w-20 h-20 bg-zinc-900 rounded-[28px] flex items-center justify-center mx-auto border border-white/5">
              <Video size={40} className="text-zinc-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Preview Window</h3>
              <p className="text-sm text-zinc-500">Your AI-generated animation will appear here. Start by describing your vision.</p>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="animate-spin text-emerald-400 mx-auto" size={48} />
              <p className="text-emerald-400 font-bold animate-pulse">Veo AI is crafting your motion...</p>
            </div>
          </div>
        )}
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
                  This high-compute AI Video generation task wraps complex pipelines and will consume <span className="text-emerald-400 font-bold font-mono">1 AI Generation Credit</span> from your monthly allotment.
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
