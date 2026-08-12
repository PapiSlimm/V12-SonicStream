import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Video, 
  Type, 
  Layers, 
  Lock, 
  Clock,
  Zap,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { cn } from '../../utils/cn';
import { FEATURES } from '../../core/featureFlags';
import { SonicMotionStudio } from './SonicMotionStudio';
import { FontExplorer } from './FontExplorer';
import { AnimationShowcase } from './AnimationShowcase';
import { TemplateLibrary } from './TemplateLibrary';
import { EditingPresets } from './EditingPresets';
import { VideoEditor } from './VideoEditor';
import { CoverArtGenerator } from './CoverArtGenerator';
import { AIMasteringTool } from '../mastering/AIMasteringTool';
import { TrackSeparator } from './TrackSeparator';
import { MusicGenerator } from '../studio/MusicGenerator';
import { GenerateMusicStudio } from './GenerateMusicStudio';
import { LyricsAssistant } from './LyricsAssistant';
import { VideoRefinementStudio } from './VideoRefinementStudio';
import { AiJobsFeeDashboard } from './AiJobsFeeDashboard';

export const AIToolsHub = () => {
  const { user, isStar, isVisionary, isPro, isEnterprise, isCreatorTier, isAdmin } = useAuth();
  const [activeTool, setActiveTool] = useState<'generate' | 'motion' | 'fonts' | 'showcase' | 'templates' | 'presets' | 'editor' | 'cover' | 'mastering' | 'separator' | 'melody' | 'lyrics' | 'refinement' | 'ai_jobs_fees'>('generate');
  
  const isPaid = isStar || isCreatorTier || isVisionary || isPro || isEnterprise || isAdmin;

  const handleUpgrade = async (newTier: string) => {
    try {
      await api.post<any>('/user/upgrade', { tier: newTier });
      window.location.reload(); // Refresh to update context
    } catch (err) {
      console.error(err);
    }
  };

  const allTools = [
    { id: 'generate', name: 'Generate Music', icon: Sparkles, description: 'AI instant station + text-to-music' },
    { id: 'showcase', name: 'Showcase', icon: Layers, description: 'Explore AI-generated samples' },
    { id: 'motion', name: 'SonicMotion', icon: Video, description: 'AI Motion Graphics Studio', restricted: !isPaid || isCreatorTier, feature: 'VIDEO' },
    { id: 'editor', name: 'Video Editor', icon: Sliders, description: 'Advanced AI Video Editing', restricted: (!isPro && !isEnterprise && !isAdmin) || isCreatorTier, feature: 'VIDEO' },
    { id: 'fonts', name: 'Font Explorer', icon: Type, description: 'AI Font Recommendations', restricted: !isPaid || isCreatorTier },
    { id: 'presets', name: 'Presets & Transitions', icon: Zap, description: 'Pro Editing Assets', restricted: (!isPro && !isEnterprise && !isAdmin) || isCreatorTier },
    { id: 'templates', name: 'Templates', icon: Layers, description: 'Pro Video & Music Templates', restricted: (!isPro && !isEnterprise && !isAdmin) || isCreatorTier },
    { id: 'cover', name: 'Cover Art', icon: ImageIcon, description: 'AI Album Artwork Generator', restricted: !isPaid || isCreatorTier },
    { id: 'mastering', name: 'AI Mastering', icon: Sliders, description: 'Neural Audio Mastering', restricted: !isPaid },
    { id: 'separator', name: 'Track Separator', icon: Sliders, description: 'AI Stem Extraction', restricted: (!isPro && !isEnterprise && !isAdmin) || isCreatorTier },
    { id: 'melody', name: 'Melody Gen', icon: Sparkles, description: 'AI Melody & Chord Generation', restricted: (!isPro && !isEnterprise && !isAdmin) || isCreatorTier },
    { id: 'lyrics', name: 'Lyrics Assistant', icon: Type, description: 'AI Songwriting & Lyrics', restricted: !isPaid },
    { id: 'refinement', name: 'Video Refinement', icon: Video, description: 'AI Video Enhancement Studio', restricted: (!isPro && !isEnterprise && !isAdmin) || isCreatorTier, feature: 'VIDEO' },
    { id: 'ai_jobs_fees', name: 'Neural Jobs & Fee Tracking', icon: Sliders, description: 'Track 5.5% AI sales platform royalty', restricted: !isPaid },
  ];

  const tools = allTools.filter(tool => {
    if (tool.feature === 'VIDEO' && !FEATURES.VIDEO) return false;
    return true;
  });

  if (!isPaid) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="w-24 h-24 bg-zinc-900 rounded-[32px] flex items-center justify-center mx-auto border border-white/5">
          <Lock size={48} className="text-zinc-600" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white">AI Tools Restricted</h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            AI tools are exclusive to SonicPro and SonicVisionary members. Upgrade your plan to unlock the power of AI.
          </p>
        </div>
        <button className="px-8 py-4 bg-zinc-700 text-white font-black rounded-2xl hover:bg-zinc-600 transition-all">
          View Pricing Plans
        </button>

        <div className="pt-12 border-t border-white/5">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Demo: Switch Tiers</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => handleUpgrade('visionary')} className="px-4 py-2 bg-zinc-800 text-white text-xs font-bold rounded-xl hover:bg-zinc-700">SonicVisionary</button>
            <button onClick={() => handleUpgrade('pro')} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-500/30">SonicPro</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-emerald-400">
            <Sparkles size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">AI Creative Suite</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">SonicAI Studio</h1>
          <p className="text-zinc-400">Professional AI tools for modern creators.</p>
          
          <div className="flex gap-2 mt-4">
            <button onClick={() => handleUpgrade('free')} className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-full hover:text-white">Switch to Free</button>
            <button onClick={() => handleUpgrade('star')} className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-full hover:text-white">Switch to Star</button>
            <button onClick={() => handleUpgrade('creator')} className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-full hover:text-white">Switch to Creator</button>
            <button onClick={() => handleUpgrade('visionary')} className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-full hover:text-white">Switch to Visionary</button>
            <button onClick={() => handleUpgrade('pro')} className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-full hover:text-white">Switch to Pro</button>
            <button onClick={() => handleUpgrade('enterprise')} className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-full hover:text-white">Switch to Enterprise</button>
          </div>
        </div>

        { (isVisionary || isStar) && (
          <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <Clock className="text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Generations Left</p>
              <p className="text-xl font-black text-white">{(isStar ? 3 : 100) - (user?.aiGenerationsCount || 0)} / {isStar ? 3 : 100}</p>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id as any)}
            disabled={tool.restricted}
            className={cn(
              "p-6 rounded-[32px] border text-left transition-all relative overflow-hidden group",
              activeTool === tool.id 
                ? "bg-emerald-500/10 border-emerald-500/20" 
                : "bg-zinc-900/50 border-white/5 hover:border-white/10",
              tool.restricted && "opacity-50 cursor-not-allowed"
            )}
          >
            <tool.icon className={cn(
              "mb-4 transition-colors",
              activeTool === tool.id ? "text-emerald-400" : "text-zinc-500 group-hover:text-white"
            )} size={32} />
            <h3 className="font-bold text-white">{tool.name}</h3>
            <p className="text-xs text-zinc-500 mt-1">{tool.description}</p>
            
            {tool.restricted && (
              <div className="absolute top-4 right-4">
                <Lock size={16} className="text-zinc-600" />
              </div>
            )}
          </button>
        ))}
      </div>

      <main className="min-h-[600px] bg-zinc-900/30 border border-white/5 rounded-[48px] p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTool === 'generate' && <GenerateMusicStudio />}
            {activeTool === 'showcase' && <AnimationShowcase />}
            {activeTool === 'motion' && <SonicMotionStudio />}
            {activeTool === 'editor' && <VideoEditor />}
            {activeTool === 'fonts' && <FontExplorer />}
            {activeTool === 'presets' && <EditingPresets />}
            {activeTool === 'templates' && <TemplateLibrary />}
            {activeTool === 'cover' && <CoverArtGenerator />}
            {activeTool === 'mastering' && <AIMasteringTool />}
            {activeTool === 'separator' && <TrackSeparator />}
            {activeTool === 'melody' && <MusicGenerator />}
            {activeTool === 'lyrics' && <LyricsAssistant />}
            {activeTool === 'refinement' && <VideoRefinementStudio />}
            {activeTool === 'ai_jobs_fees' && <AiJobsFeeDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
