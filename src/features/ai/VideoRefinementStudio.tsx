import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Upload, Sparkles, Loader2, Play, Sliders, Layers, Wand2, CheckCircle2 } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { toast } from '../../components/ui/Toast';
import { cn } from '../../utils/cn';

export const VideoRefinementStudio = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refinementPlan, setRefinementPlan] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRefine = async () => {
    if (!prompt) {
      toast.error('Please enter a refinement prompt');
      return;
    }

    setIsProcessing(true);
    setRefinementPlan(null);

    try {
      const plan = await aiService.refineVideo(prompt, videoFile?.name);
      setRefinementPlan(plan);
      toast.success('AI Refinement plan generated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to refine video');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight">Video Refinement Studio</h2>
          <p className="text-zinc-500">Enhance your visual content with AI-driven stylistic filters and animations.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Upload Video Clip</label>
            <div 
              className={cn(
                "border-2 border-dashed rounded-[32px] p-12 text-center transition-all cursor-pointer group",
                videoFile ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 hover:border-white/20 bg-zinc-900/50"
              )}
              onClick={() => document.getElementById('video-upload')?.click()}
            >
              <input 
                id="video-upload"
                type="file" 
                accept="video/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                  videoFile ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-500 group-hover:text-white"
                )}>
                  {videoFile ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                </div>
                <div>
                  <p className="font-bold text-white">{videoFile ? videoFile.name : 'Drop your video here'}</p>
                  <p className="text-xs text-zinc-500 mt-1">MP4, MOV or WEBM up to 50MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Refinement Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Apply a cinematic cyberpunk filter, add subtle particle animations, and slow down the playback by 20%'"
              className="w-full h-32 bg-zinc-900/50 border border-white/5 rounded-3xl p-6 text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>

          <button
            onClick={handleRefine}
            disabled={isProcessing || !prompt}
            className="w-full py-6 bg-zinc-700 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Refining Content...
              </>
            ) : (
              <>
                <Sparkles size={24} />
                Refine with AI
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="sticky top-8 bg-zinc-900/50 border border-white/5 rounded-[48px] p-10 space-y-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <Video className="text-emerald-400" size={24} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight">Preview Monitor</h3>
              <p className="text-sm text-zinc-500">Visualizing AI refinements.</p>
            </div>

            <div className="aspect-video bg-black rounded-3xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
              {previewUrl ? (
                <video 
                  src={previewUrl} 
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-zinc-700">
                  <Play size={48} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Video Selected</p>
                </div>
              )}
              
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="animate-spin text-emerald-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">AI Processing</p>
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {refinementPlan ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="p-6 bg-zinc-900/80 border border-white/5 rounded-[32px] space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Wand2 size={16} className="text-emerald-400" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-tight">Refinement Plan</h4>
                    </div>
                    
                    <div className="space-y-4">
                      {Object.entries(refinementPlan).map(([key, value]: [string, any]) => (
                        <div key={key} className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{key}</p>
                          <p className="text-xs text-white leading-relaxed">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Sliders size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Filters</span>
                      </div>
                      <p className="text-xs font-bold text-emerald-400">Optimized</p>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Layers size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Layers</span>
                      </div>
                      <p className="text-xs font-bold text-emerald-400">Added</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="p-12 text-center border border-dashed border-white/10 rounded-[32px] text-zinc-600 space-y-4">
                  <Sparkles size={32} className="mx-auto opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">Refinement details will appear here</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
