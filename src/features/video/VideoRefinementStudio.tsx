import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  RefreshCw, 
  Film,
  Wind,
  Palette,
  Timer,
  CheckCircle,
  Lock
} from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export const VideoRefinementStudio: React.FC = () => {
  const { isPro, isVisionary } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [refinementType, setRefinementType] = useState<'animation' | 'filter' | 'speed'>('filter');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState('Cinematic');

  const hasAccess = isPro || isVisionary;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      toast.success('Video uploaded successfully');
    }
  };

  const [refinementProgress, setRefinementProgress] = useState(0);
  const { getIdToken } = useAuth();

  const handleRefine = async () => {
    if (!selectedFile) {
      toast.error('Please upload a video first');
      return;
    }
    if (!hasAccess) {
      toast.error('Upgrade to Sonic Pro to use Video Refinement Studio');
      return;
    }
    setIsProcessing(true);
    setRefinementProgress(0);

    try {
      toast.loading('Refining video with AI...', { id: 'refine-studio' });
      
      // In a real app, we'd upload the file to storage first.
      // For this demo, we'll use the local object URL as if it were a remote one,
      // but the backend expects a real URL. We'll simulate the backend call
      // or use a placeholder if the file is local.
      const videoUrl = previewUrl || '';

      const response = await fetch('/api/video/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getIdToken()}`
        },
        body: JSON.stringify({
          video_url: videoUrl,
          prompt: `${prompt}. Filter: ${selectedFilter}. Speed: ${playbackSpeed}x.`,
          refinement_type: refinementType
        })
      });

      if (!response.ok) throw new Error('Failed to start refinement');
      const { id } = await response.json();

      let status = 'starting';
      let resultUrl = null;

      while (status !== 'succeeded' && status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const statusRes = await fetch(`/api/video/status/${id}`, {
          headers: {
            'Authorization': `Bearer ${await getIdToken()}`
          }
        });
        const prediction = await statusRes.json();
        status = prediction.status;
        
        if (status === 'processing') setRefinementProgress(prev => Math.min(prev + 10, 90));
        
        if (status === 'succeeded') {
          resultUrl = prediction.output;
          setRefinementProgress(100);
        }
      }

      if (resultUrl) {
        const url = Array.isArray(resultUrl) ? resultUrl[0] : resultUrl;
        setPreviewUrl(url);
        toast.success('Video refined successfully!', { id: 'refine-studio' });
      }
    } catch (error) {
      console.error('Refinement error:', error);
      toast.error('Failed to refine video', { id: 'refine-studio' });
    } finally {
      setIsProcessing(false);
    }
  };

  const FILTERS = ['Cinematic', 'Vintage', 'Cyberpunk', 'Noir', 'Vibrant', 'Muted'];
  const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={12} />
            AI Refinement Engine V12
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tight italic">Video Refinement Studio</h2>
          <p className="text-zinc-400 max-w-2xl font-medium">
            Transform your raw footage into cinematic masterpieces. Apply AI-driven animations, stylistic filters, and dynamic speed adjustments.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Preview Area */}
          <div className="aspect-video bg-zinc-900 rounded-[48px] overflow-hidden border border-white/10 relative group shadow-2xl flex items-center justify-center">
            {previewUrl ? (
              <video 
                src={previewUrl} 
                className="w-full h-full object-cover opacity-80" 
                controls
              />
            ) : (
              <div className="text-center space-y-6 p-12">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                  <Film className="text-zinc-600" size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">No Video Uploaded</h3>
                  <p className="text-zinc-500 text-sm mt-2">Upload a clip to start refining with AI.</p>
                </div>
                <label className="inline-block px-8 py-4 bg-white text-white rounded-2xl font-black uppercase tracking-widest cursor-pointer hover:bg-zinc-600 transition-all">
                  <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                  Upload Clip
                </label>
              </div>
            )}
          </div>

          {/* Refinement Controls */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">Refinement Controls</h3>
              <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setRefinementType('filter')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    refinementType === 'filter' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                  )}
                >
                  Filters
                </button>
                <button 
                  onClick={() => setRefinementType('animation')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    refinementType === 'animation' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                  )}
                >
                  Animations
                </button>
                <button 
                  onClick={() => setRefinementType('speed')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    refinementType === 'speed' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                  )}
                >
                  Speed
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {refinementType === 'filter' && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Palette size={12} />
                      Stylistic Filters
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {FILTERS.map(f => (
                        <button
                          key={f}
                          onClick={() => setSelectedFilter(f)}
                          className={cn(
                            "px-3 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                            selectedFilter === f 
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                            : "bg-black/40 border-white/5 text-zinc-500 hover:border-white/20"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {refinementType === 'speed' && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Timer size={12} />
                      Playback Speed
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {SPEEDS.map(s => (
                        <button
                          key={s}
                          onClick={() => setPlaybackSpeed(s)}
                          className={cn(
                            "px-3 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                            playbackSpeed === s 
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                            : "bg-black/40 border-white/5 text-zinc-500 hover:border-white/20"
                          )}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {refinementType === 'animation' && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Wind size={12} />
                      AI Animations
                    </label>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Describe the animation you want to overlay on your video. Our AI will generate custom motion graphics based on your prompt.
                    </p>
                  </div>
                )}
              </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Sparkles size={12} />
                      AI Refinement Prompt
                    </label>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full h-32 bg-black/40 border border-white/10 rounded-3xl p-6 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none text-sm"
                      placeholder="e.g., 'Add a subtle neon glow to the edges' or 'Apply a grainy 16mm film texture'..."
                    />
                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          <span>Refining...</span>
                          <span className="text-emerald-400">{refinementProgress}%</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${refinementProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleRefine}
                disabled={isProcessing || !selectedFile}
                className="px-12 py-5 bg-zinc-800 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-zinc-700 transition-all shadow-xl shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} fill="currentColor" />}
                Refine with AI
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Studio Status */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">Studio Status</h3>
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                hasAccess ? "bg-emerald-500" : "bg-zinc-700"
              )} />
            </div>

            {!hasAccess ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <Lock className="text-emerald-400" size={20} />
                  <p className="font-bold text-sm">Pro Feature Locked</p>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Video Refinement Studio is exclusive to Sonic Pro and Sonic Visionary members.
                </p>
                <button className="w-full py-4 bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all">
                  Upgrade to Unlock
                </button>
              </div>
            ) : (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-emerald-400" size={20} />
                  <p className="font-bold text-sm">Pro Access Active</p>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  You have unlimited access to AI video refinement tools.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Recent Refinements</h4>
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex gap-4 opacity-50 grayscale">
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <Film size={20} className="text-zinc-600" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 w-24 bg-zinc-800 rounded-full mb-2" />
                      <div className="h-2 w-16 bg-zinc-800/50 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="p-8 bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[40px] space-y-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Sparkles className="text-purple-400" size={24} />
            </div>
            <h4 className="font-bold">Pro Tip</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Combine filters with speed adjustments for dramatic cinematic effects. Try "Noir" with 0.5x speed for a moody slow-motion look.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
