import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Video, Upload, Sparkles, Wand2, Download, Play, Pause, Settings, Layers, Film, Scissors, Monitor } from 'lucide-react';
import { toast } from '../../components/ui/Toast';

type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';
type Resolution = '720p' | '1080p' | '4K';

interface VideoFilter {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
}

export const VideoEditor = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const filters: VideoFilter[] = [
    { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon lights and high contrast', previewUrl: 'https://picsum.photos/seed/cyber/200/120' },
    { id: 'vintage', name: 'Vintage 8mm', description: 'Classic film look with grain', previewUrl: 'https://picsum.photos/seed/vintage/200/120' },
    { id: 'anime', name: 'Anime Style', description: 'Hand-drawn aesthetic', previewUrl: 'https://picsum.photos/seed/anime/200/120' },
    { id: 'dreamy', name: 'Dreamy Glow', description: 'Soft focus and ethereal lighting', previewUrl: 'https://picsum.photos/seed/dream/200/120' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        toast.success('Video uploaded successfully!');
      } else {
        toast.error('Please upload a valid video file');
      }
    }
  };

  const applyAIEffects = () => {
    if (!videoFile) return;
    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          toast.success('AI Effects applied successfully!');
          return 100;
        }
        return prev + 1;
      });
    }, 50);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Film className="text-emerald-500" size={36} />
            AI Video Studio
          </h1>
          <p className="text-zinc-400 mt-2">Transform your visuals with neural rendering and AI-driven editing.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-zinc-900 border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
            <Settings size={18} /> Project Settings
          </button>
          <button className="bg-zinc-700 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-zinc-600 transition-all flex items-center gap-2 shadow-lg shadow-black/20">
            <Download size={18} /> Export Video
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Sidebar: Tools */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Layers size={18} className="text-emerald-500" />
              AI Enhancement
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">AI Prompt</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
                  placeholder="e.g. Add cinematic lighting and 3D particles..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Aspect Ratio</label>
                  <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full bg-black border border-white/10 rounded-xl p-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:5">4:5 (Social)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Resolution</label>
                  <select 
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as Resolution)}
                    className="w-full bg-black border border-white/10 rounded-xl p-2 text-sm outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="4K">4K Ultra HD</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={applyAIEffects}
                disabled={!videoFile || isProcessing}
                className="w-full bg-zinc-700 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-600 transition-all disabled:opacity-50"
              >
                <Sparkles size={18} /> Apply AI Magic
              </button>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Wand2 size={18} className="text-emerald-500" />
              AI Filters
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`flex items-center gap-3 p-2 rounded-2xl border transition-all text-left group ${
                    selectedFilter === filter.id 
                      ? 'bg-emerald-500/10 border-emerald-500' 
                      : 'bg-black/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <img src={filter.previewUrl} alt={filter.name} className="w-16 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <div className={`text-sm font-bold ${selectedFilter === filter.id ? 'text-emerald-500' : 'text-white'}`}>{filter.name}</div>
                    <div className="text-[10px] text-zinc-500 line-clamp-1">{filter.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Preview Area */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-black border border-white/5 rounded-3xl overflow-hidden relative aspect-video flex items-center justify-center group">
            {videoUrl ? (
              <>
                <video 
                  ref={videoRef}
                  src={videoUrl} 
                  className={`w-full h-full object-contain ${aspectRatio === '9:16' ? 'max-w-[30%]' : ''}`}
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={togglePlay}
                      className="w-12 h-12 bg-zinc-700 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                    </button>
                    <div className="flex-grow h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-1/3" />
                    </div>
                    <div className="text-xs font-mono text-white/60">01:24 / 03:45</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6 p-12">
                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-white/5">
                  <Video className="text-zinc-700" size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">No video selected</h2>
                  <p className="text-zinc-500 mt-2">Upload a video to start editing with AI.</p>
                </div>
                <div className="relative inline-block">
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <button className="bg-white text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors">
                    <Upload size={20} /> Upload Video
                  </button>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
                <div className="max-w-md w-full px-8 space-y-6 text-center">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
                    <motion.div 
                      className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-emerald-500 font-bold">
                      {progress}%
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">AI Rendering in Progress</h3>
                    <p className="text-zinc-400 mt-2">Our neural engines are applying your requested effects. This usually takes a few moments.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline / Quick Actions */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-4">
                <button className="p-3 rounded-xl bg-black/40 border border-white/5 text-zinc-400 hover:text-white transition-all">
                  <Scissors size={20} />
                </button>
                <button className="p-3 rounded-xl bg-black/40 border border-white/5 text-zinc-400 hover:text-white transition-all">
                  <Monitor size={20} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                AI Real-time Preview Active
              </div>
            </div>
            
            <div className="h-24 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute inset-y-0 left-1/4 w-0.5 bg-emerald-500 z-10" />
              <div className="flex h-full">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-20 h-full border-r border-white/5 p-1">
                    <img 
                      src={`https://picsum.photos/seed/frame${i}/80/60`} 
                      alt="frame" 
                      className="w-full h-full object-cover rounded opacity-40"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
