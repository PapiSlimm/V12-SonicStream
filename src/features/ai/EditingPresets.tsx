import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Sparkles, 
  Film, 
  Music, 
  Copy, 
  Check,
  ExternalLink,
  Layers,
  Cpu,
  Download,
  Play
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { PromptGuide } from './PromptGuide';

interface Preset {
  id: string;
  name: string;
  category: 'video' | 'audio' | 'vfx';
  description: string;
  software: 'After Effects' | 'Premiere Pro' | 'SonicAI';
  tags: string[];
}

interface Transition {
  id: string;
  name: string;
  type: string;
  description: string;
}

export const EditingPresets = () => {
  const [activeTab, setActiveTab] = useState<'presets' | 'transitions' | 'prompts' | 'x-effects'>('presets');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const presets: Preset[] = [
    { id: 'p1', name: 'Cinematic Teal & Orange', category: 'video', description: 'Hollywood-style color grading with deep blues and warm skin tones.', software: 'Premiere Pro', tags: ['Color', 'Cinematic'] },
    { id: 'p2', name: 'Glitch Distortion Pro', category: 'vfx', description: 'Advanced digital glitch effects with RGB splitting and noise.', software: 'After Effects', tags: ['Glitch', 'Cyberpunk'] },
    { id: 'p3', name: 'Smooth Parallax Slide', category: 'vfx', description: '3D depth effect for static images with smooth easing.', software: 'After Effects', tags: ['Motion', '3D'] },
    { id: 'p4', name: 'VHS Retro Aesthetic', category: 'video', description: 'Authentic 90s tape look with tracking errors and color bleed.', software: 'SonicAI', tags: ['Retro', 'Vintage'] },
    { id: 'p5', name: 'Deep Bass Enhancer', category: 'audio', description: 'Sub-bass boost and compression for high-impact music.', software: 'SonicAI', tags: ['Audio', 'Bass'] },
    { id: 'p6', name: 'Crystal Voice Clarity', category: 'audio', description: 'AI-driven noise reduction and vocal presence enhancement.', software: 'SonicAI', tags: ['Audio', 'Vocal'] },
    { id: 'p7', name: 'Kinetic Typography Master', category: 'vfx', description: 'Dynamic text animations that sync with audio beats.', software: 'After Effects', tags: ['Text', 'Motion'] },
    { id: 'p8', name: 'Modern Minimal Lower Thirds', category: 'video', description: 'Clean, professional text overlays for interviews and vlogs.', software: 'Premiere Pro', tags: ['UI', 'Minimal'] },
    { id: 'p9', name: 'Anamorphic Lens Flare', category: 'vfx', description: 'Realistic horizontal lens flares with chromatic aberration.', software: 'After Effects', tags: ['Optical', 'Cinematic'] },
    { id: 'p10', name: 'Dynamic Speed Ramp', category: 'video', description: 'Smooth velocity curves for high-action sports editing.', software: 'Premiere Pro', tags: ['Action', 'Speed'] },
    { id: 'p11', name: 'Lo-Fi Vinyl Texture', category: 'audio', description: 'Adds crackle, wow, and flutter for that authentic lo-fi feel.', software: 'SonicAI', tags: ['Retro', 'Lo-Fi'] },
    { id: 'p12', name: 'Hyper-Lapse Stabilizer', category: 'video', description: 'Advanced tracking to smooth out shaky hyper-lapse footage.', software: 'After Effects', tags: ['Stabilization', 'Time'] },
    { id: 'p13', name: 'Neural Reverb Pro', category: 'audio', description: 'AI-modeled acoustic spaces from cathedral to studio booth.', software: 'SonicAI', tags: ['Audio', 'Space'] },
    { id: 'p14', name: 'Dynamic Range Expander', category: 'audio', description: 'Intelligent compression that preserves transients while boosting loudness.', software: 'SonicAI', tags: ['Audio', 'Mastering'] },
  ];

  const xEffects = [
    { id: 'x1', name: 'AI Object Vanish', type: 'Video', description: 'Remove unwanted objects or people from your footage seamlessly.', icon: Zap, color: 'text-emerald-400' },
    { id: 'x2', name: 'Neural Style Transfer', type: 'Video', description: 'Apply the artistic style of any image to your entire video clip.', icon: Sparkles, color: 'text-blue-400' },
    { id: 'x3', name: 'Temporal Flow Master', type: 'Video', description: 'AI-generated intermediate frames for ultra-smooth slow motion.', icon: Cpu, color: 'text-purple-400' },
    { id: 'x4', name: 'Audio Scene Remaster', type: 'Audio', description: 'Reconstruct poor quality audio into studio-grade recordings.', icon: Music, color: 'text-orange-400' },
    { id: 'x5', name: 'Smart Sky Replacement', type: 'Video', description: 'Automatically detect and replace skies with cinematic alternatives.', icon: Film, color: 'text-cyan-400' },
    { id: 'x6', name: 'Vocal Isolation X', type: 'Audio', description: 'Extract clean vocals from any mixed track with zero artifacts.', icon: Music, color: 'text-pink-400' },
  ];

  const transitions: Transition[] = [
    { id: 't1', name: 'Cross Dissolve', type: 'Standard', description: 'Smooth fade between two clips.' },
    { id: 't2', name: 'Zoom In/Out', type: 'Dynamic', description: 'Fast zoom transition for high-energy edits.' },
    { id: 't3', name: 'Glitch Transition', type: 'VFX', description: 'Digital artifacting between scenes.' },
    { id: 't4', name: 'Light Leak', type: 'Stylized', description: 'Warm lens flare overlay during transition.' },
    { id: 't5', name: 'Whip Pan', type: 'Motion', description: 'Fast camera movement blur transition.' },
    { id: 't6', name: 'Spin Blur', type: 'Motion', description: 'Rotational blur effect between clips.' },
    { id: 't7', name: 'Ink Splash', type: 'Organic', description: 'Artistic ink bleed reveal transition.' },
    { id: 't8', name: 'Geometric Wipe', type: 'Graphic', description: 'Sharp polygonal shapes cutting between scenes.' },
    { id: 't9', name: 'Dreamy Bloom', type: 'Stylized', description: 'Soft glow and overexposure transition.' },
  ];

  const suggestedPrompts = [
    { title: 'Minimalist Product Reveal', prompt: 'Create a minimalist tech product reveal with soft shadows, a clean white background, and smooth 3D rotation. Use a "Modern Minimal" preset.' },
    { title: 'Cyberpunk Music Video', prompt: 'Generate a high-energy cyberpunk music video intro with neon lights, heavy glitch distortion, and fast-paced transitions synced to a 140bpm beat.' },
    { title: 'Cinematic Travel Vlog', prompt: 'Design a cinematic landscape transition for a travel vlog, using warm sunset colors, light leaks, and a smooth parallax slide effect.' },
    { title: 'Abstract Liquid Motion', prompt: 'Create an abstract liquid motion background with vibrant iridescent colors, slow organic movements, and a "Crystal Clear" audio profile.' },
    { title: 'Futuristic UI Dashboard', prompt: 'Animate a complex futuristic UI dashboard with data visualizations, glowing blue elements, and fast digital glitch transitions.' },
    { title: 'Organic Nature Macro', prompt: 'A macro shot of a dewdrop on a leaf, with extreme depth of field, soft morning light, and a dreamy bloom transition.' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">Presets & Transitions</h2>
          <p className="text-zinc-400">Professional editing assets for After Effects, Premiere Pro, and SonicAI.</p>
        </div>

        <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-white/5">
          {(['presets', 'transitions', 'x-effects', 'prompts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all",
                activeTab === tab ? "bg-white text-black" : "text-zinc-500 hover:text-white"
              )}
            >
              {tab === 'x-effects' ? 'X-Effects' : tab}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'presets' && (
          <motion.div
            key="presets"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {presets.map((preset) => (
              <div key={preset.id} className="group bg-zinc-900/50 border border-white/5 p-6 rounded-[32px] hover:border-emerald-500/20 transition-all space-y-4">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    preset.category === 'video' ? "bg-blue-500/10 text-blue-400" :
                    preset.category === 'audio' ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-purple-500/10 text-purple-400"
                  )}>
                    {preset.category === 'video' ? <Film size={20} /> :
                     preset.category === 'audio' ? <Music size={20} /> :
                     <Layers size={20} />}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800 px-2 py-1 rounded-md">
                    {preset.software}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-white">{preset.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{preset.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preset.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
                <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                  <Download size={14} />
                  Download Preset
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'transitions' && (
          <motion.div
            key="transitions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {transitions.map((t) => (
              <div key={t.id} className="bg-zinc-900/50 border border-white/5 p-6 rounded-[32px] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center font-bold">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{t.name}</h3>
                    <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold">{t.type}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{t.description}</p>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] text-zinc-600 font-bold uppercase">SonicAI Compatible</span>
                  <button className="text-emerald-400 hover:text-emerald-300 transition-colors">
                    <Play size={16} />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'x-effects' && (
          <motion.div
            key="x-effects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {xEffects.map((x) => (
              <div key={x.id} className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-6 group hover:border-emerald-500/20 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <x.icon size={80} />
                </div>
                <div className="flex items-center gap-4">
                  <div className={cn("w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center", x.color)}>
                    <x.icon size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{x.name}</h3>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", x.color)}>{x.type} Effect</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{x.description}</p>
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600 font-bold uppercase">AI Powered Engine</span>
                  <button className="px-4 py-2 bg-zinc-700 text-white text-xs font-black rounded-xl hover:bg-zinc-600 transition-all">
                    Apply Effect
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'prompts' && (
          <motion.div
            key="prompts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {suggestedPrompts.map((p, i) => (
                <div key={i} className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-4 relative group">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <Sparkles size={20} />
                    <h3 className="font-bold text-white text-lg">{p.title}</h3>
                  </div>
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 relative">
                    <p className="text-zinc-400 text-sm italic leading-relaxed">"{p.prompt}"</p>
                    <button 
                      onClick={() => handleCopy(p.prompt, `prompt-${i}`)}
                      className="absolute top-4 right-4 p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white transition-all"
                    >
                      {copiedId === `prompt-${i}` ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    <span>Structure: 16:9</span>
                    <span>•</span>
                    <span>Style: Professional</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[40px] flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center shrink-0">
                <Cpu size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">AI Prompt Engineering Guide</h3>
                <p className="text-zinc-400 text-sm">Learn how to write perfect prompts for SonicAI to get the best design and structure results every time.</p>
              </div>
              <button 
                onClick={() => setShowGuide(true)}
                className="md:ml-auto px-6 py-3 bg-zinc-700 text-white font-black rounded-2xl hover:bg-zinc-600 transition-all flex items-center gap-2"
              >
                Open Guide
                <ExternalLink size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGuide && <PromptGuide onClose={() => setShowGuide(false)} />}
      </AnimatePresence>
    </div>
  );
};
