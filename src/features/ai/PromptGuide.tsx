import { motion } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Target, 
  Layers, 
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PromptGuideProps {
  onClose: () => void;
}

export const PromptGuide = ({ onClose }: PromptGuideProps) => {
  const steps = [
    {
      title: 'Define the Subject',
      icon: Target,
      description: 'Be specific about what is in the scene. Instead of "a car", use "a sleek matte black electric supercar".',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Set the Environment',
      icon: Layers,
      description: 'Describe the background and lighting. "In a rain-slicked futuristic Tokyo alleyway with neon reflections".',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Specify Movement',
      icon: Zap,
      description: 'Tell the AI how things should move. "Camera slowly orbits the subject while rain falls in slow motion".',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10'
    },
    {
      title: 'Choose a Style',
      icon: Sparkles,
      description: 'Add aesthetic keywords. "Cinematic, photorealistic, 8k, volumetric lighting, anamorphic lens flare".',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-zinc-900 border border-white/5 rounded-[48px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <header className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">AI Prompt Engineering Guide</h2>
              <p className="text-zinc-500 text-sm">Master the art of creative AI prompting.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 text-zinc-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all"
          >
            <X size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="bg-zinc-800/50 p-6 rounded-[32px] border border-white/5 space-y-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", step.bg, step.color)}>
                  <step.icon size={24} />
                </div>
                <h3 className="font-bold text-white text-lg">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </section>

          <section className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <CheckCircle2 className="text-emerald-400" />
              The Perfect Prompt Formula
            </h3>
            <div className="bg-black/40 p-8 rounded-[32px] border border-white/5 font-mono text-sm leading-relaxed">
              <span className="text-emerald-400">[Subject]</span> + 
              <span className="text-blue-400"> [Environment]</span> + 
              <span className="text-orange-400"> [Movement]</span> + 
              <span className="text-purple-400"> [Style/Lighting]</span>
            </div>
            <p className="text-zinc-500 text-xs italic">
              Example: "A golden mechanical butterfly (Subject) hovering over a crystal flower (Environment) with wings flapping in slow motion (Movement), cinematic macro shot with soft bokeh (Style)."
            </p>
          </section>

          <section className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-[32px] flex items-start gap-4">
            <AlertCircle className="text-orange-400 shrink-0 mt-1" size={20} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-orange-400">Pro Tip</p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Avoid negative prompts like "no blur". Instead, use positive reinforcement like "sharp focus" or "crystal clear details". The AI responds better to what you want, not what you don't want.
              </p>
            </div>
          </section>

          <section className="space-y-8">
            <h3 className="text-xl font-bold text-white">Design & Structure Principles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="text-emerald-400 font-black text-2xl">01</div>
                <h4 className="font-bold text-white">Rule of Thirds</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">Place your subject along the grid lines or at their intersections to create more tension, energy and interest.</p>
              </div>
              <div className="space-y-3">
                <div className="text-blue-400 font-black text-2xl">02</div>
                <h4 className="font-bold text-white">Visual Hierarchy</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">Use scale, color, and contrast to guide the viewer's eye to the most important elements first.</p>
              </div>
              <div className="space-y-3">
                <div className="text-purple-400 font-black text-2xl">03</div>
                <h4 className="font-bold text-white">Negative Space</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">Don't crowd the frame. White space (or empty space) allows the subject to breathe and creates a premium feel.</p>
              </div>
            </div>
          </section>
        </div>

        <footer className="p-8 border-t border-white/5 bg-zinc-900/50 shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-zinc-700 text-white font-black rounded-2xl hover:bg-zinc-600 transition-all"
          >
            Got it, let's create!
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
};

// Helper for class names
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
