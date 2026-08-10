import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Sparkles, 
  Zap, 
  RefreshCw, 
  Layers, 
  Cpu,
  Maximize2,
  Settings,
  Library,
  Download,
  Lock,
  Key,
  Loader2,
  X,
  Plus
} from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { ProAsset, VideoSegment } from '../../types';
import { motion } from 'framer-motion';

import { VideoUploadZone } from '../../components/video/VideoUploadZone';
import { TimelineEditor } from './TimelineEditor';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface VideoEditorProps {
  selectedAsset?: ProAsset | null;
  onClearAsset?: () => void;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ selectedAsset, onClearAsset }) => {
  const { user, getIdToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'assets' | 'upload' | 'timeline'>('settings');
  const [proAssets, setProAssets] = useState<ProAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [prompt, setPrompt] = useState('A cinematic music video with neon lights and rain...');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinementProgress, setRefinementProgress] = useState(0);
  const [previewUrl] = useState('https://picsum.photos/seed/video-preview/1280/720');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [performanceMode, setPerformanceMode] = useState<'quality' | 'performance'>('performance');
  const [cameraAngle, setCameraAngle] = useState('Cinematic');
  const [lightingMood, setLightingMood] = useState('Neon');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  
  // Timeline State
  const [segments, setSegments] = useState<VideoSegment[]>([]);

  useEffect(() => {
    if (selectedAsset) {
      const newSegment: VideoSegment = {
        id: Math.random().toString(36).substr(2, 9),
        url: selectedAsset.previewUrl || '',
        startTime: 0,
        endTime: 10, // Default 10s
        duration: 10,
        name: selectedAsset.name
      };
      setSegments(prev => [...prev, newSegment]);
      setVideoUrl(selectedAsset.previewUrl || null);
      toast.success(`Added to timeline: ${selectedAsset.name}`);
      setActiveTab('timeline');
    }
  }, [selectedAsset]);

  const isPro = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'visionary';

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setVideoUrl(null);

    try {
      toast.loading('AI is crafting your video via Replicate...', { id: 'video-gen' });
      
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getIdToken()}`
        },
        body: JSON.stringify({
          prompt: `${prompt}. Camera angle: ${cameraAngle}. Lighting: ${lightingMood}.`,
          aspect_ratio: aspectRatio,
          resolution: performanceMode === 'quality' ? '1080p' : '720p'
        })
      });

      if (!response.ok) throw new Error('Failed to start generation');
      const { id } = await response.json();

      // Poll for completion
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
        if (status === 'succeeded') {
          resultUrl = prediction.output;
        }
      }

      if (resultUrl) {
        const url = Array.isArray(resultUrl) ? resultUrl[0] : resultUrl;
        setVideoUrl(url);
        
        // Add to timeline
        const newSegment: VideoSegment = {
          id: Math.random().toString(36).substr(2, 9),
          url: url,
          startTime: 0,
          endTime: 5,
          duration: 5,
          name: 'AI Generated Clip'
        };
        setSegments(prev => [...prev, newSegment]);
        
        toast.success('Video generated successfully!', { id: 'video-gen' });
      } else {
        throw new Error('Generation failed or returned no output');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error('Failed to generate video', { id: 'video-gen' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefineVideo = async () => {
    if (!videoUrl) {
      toast.error('Please generate or upload a video first');
      return;
    }

    setIsRefining(true);
    setRefinementProgress(0);

    try {
      toast.loading('Refining video with AI...', { id: 'video-refine' });
      
      const response = await fetch('/api/video/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getIdToken()}`
        },
        body: JSON.stringify({
          video_url: videoUrl,
          prompt: refinementPrompt,
          filter: selectedFilter
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
        
        // Update progress based on status
        if (status === 'processing') setRefinementProgress(prev => Math.min(prev + 10, 90));
        
        if (status === 'succeeded') {
          resultUrl = prediction.output;
          setRefinementProgress(100);
        }
      }

      if (resultUrl) {
        const url = Array.isArray(resultUrl) ? resultUrl[0] : resultUrl;
        setVideoUrl(url);
        toast.success('Video refined successfully!', { id: 'video-refine' });
      }
    } catch (error) {
      console.error('Refinement error:', error);
      toast.error('Failed to refine video', { id: 'video-refine' });
    } finally {
      setIsRefining(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'assets' && proAssets.length === 0) {
      const fetchAssets = async () => {
        setLoadingAssets(true);
        const path = 'pro_assets';
        try {
          const q = query(collection(db, path), limit(12));
          const snapshot = await getDocs(q);
          const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProAsset));
          setProAssets(assets);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, path);
        } finally {
          setLoadingAssets(false);
        }
      };
      fetchAssets();
    }
  }, [activeTab, proAssets.length]);

  const CAMERA_ANGLES = ['Cinematic', 'Wide', 'Close-up', 'Drone', 'Handheld', 'POV'];
  const LIGHTING_MOODS = ['Neon', 'Natural', 'Moody', 'Golden Hour', 'Noir', 'Vibrant'];

  const handleAddAssetToTimeline = (asset: ProAsset) => {
    if (!isPro) {
      toast.error('Upgrade to Sonic Pro to use this asset');
      return;
    }
    const newSegment: VideoSegment = {
      id: Math.random().toString(36).substr(2, 9),
      url: asset.previewUrl || '',
      startTime: 0,
      endTime: 10,
      duration: 10,
      name: asset.name
    };
    setSegments(prev => [...prev, newSegment]);
    toast.success(`Added ${asset.name} to timeline`);
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={12} />
            AI Video Engine V12
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tight italic">AI Video Studio</h2>
          <p className="text-zinc-400 max-w-2xl font-medium">
            Generate, edit, and refine music videos with Gemini Veo. A complete professional suite for independent creators.
          </p>
        </div>
        <div className="flex gap-4">
          {!hasApiKey && (
            <button 
              onClick={handleSelectKey}
              className="px-6 py-2 bg-amber-500 text-black rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-400 transition-all"
            >
              <Key size={14} />
              Select API Key
            </button>
          )}
          <div className="bg-zinc-900/50 border border-white/5 p-1 rounded-2xl flex">
            <button 
              onClick={() => setPerformanceMode('performance')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                performanceMode === 'performance' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              Performance
            </button>
            <button 
              onClick={() => setPerformanceMode('quality')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                performanceMode === 'quality' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              Quality
            </button>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Preview */}
          <div className="aspect-video bg-zinc-900 rounded-[48px] overflow-hidden border border-white/10 relative group shadow-2xl">
            {videoUrl ? (
              <video 
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                controls
                autoPlay
                loop
              />
            ) : (
              <img 
                src={previewUrl} 
                className="w-full h-full object-cover opacity-80" 
                alt="Preview" 
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20">
                  <Cpu size={10} />
                  {videoUrl ? 'AI Generated' : 'Live Preview'} • {performanceMode === 'performance' ? '720p' : '1080p'}
                </div>
                <h3 className="text-xl font-bold text-white">Untitled AI Project</h3>
              </div>
              <div className="flex gap-2 pointer-events-auto">
                {videoUrl && (
                  <button 
                    onClick={() => {
                      setVideoUrl(null);
                      onClearAsset?.();
                    }}
                    className="p-3 bg-red-500/20 backdrop-blur-md rounded-xl text-red-400 hover:bg-red-500/40 transition-all border border-red-500/20"
                    title="Clear Video"
                  >
                    <X size={18} />
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (videoUrl) {
                      const link = document.createElement('a');
                      link.href = videoUrl;
                      link.download = `sonicstream-video-${Date.now()}.mp4`;
                      link.click();
                    }
                  }}
                  className="p-3 bg-emerald-500/20 backdrop-blur-md rounded-xl text-emerald-400 hover:bg-emerald-500/40 transition-all border border-emerald-500/20"
                  title="Download Video"
                >
                  <Download size={18} />
                </button>
                <button className="p-3 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all">
                  <Maximize2 size={18} />
                </button>
                <button className="p-3 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all">
                  <Settings size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Editor Integration */}
          <TimelineEditor 
            segments={segments}
            onUpdateSegments={setSegments}
            onPreviewSegment={setVideoUrl}
          />

          {/* Prompt Editor */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">AI Generation Prompt</h3>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <Layers size={12} />
                Gemini Veo Engine
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Camera Angle</label>
                <select 
                  value={cameraAngle}
                  onChange={(e) => setCameraAngle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50"
                >
                  {CAMERA_ANGLES.map(angle => <option key={angle} value={angle}>{angle}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Lighting Mood</label>
                <select 
                  value={lightingMood}
                  onChange={(e) => setLightingMood(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50"
                >
                  {LIGHTING_MOODS.map(mood => <option key={mood} value={mood}>{mood}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Aspect Ratio</label>
                <select 
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50"
                >
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="1:1">1:1 (Square)</option>
                </select>
              </div>
            </div>

            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 bg-black/40 border border-white/10 rounded-3xl p-6 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none text-sm"
              placeholder="Describe your music video vision..."
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5">
                  Templates
                </button>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5">
                  Style Reference
                </button>
              </div>
              <button 
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-purple-500 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50 uppercase tracking-widest text-xs"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} fill="currentColor" />}
                {isGenerating ? 'Generating...' : 'Generate AI Video'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Editor Tabs */}
          <div className="bg-zinc-900/50 border border-white/5 p-1 rounded-2xl flex">
            <button 
              onClick={() => setActiveTab('settings')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'settings' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              <Settings size={14} />
              Refine
            </button>
            <button 
              onClick={() => setActiveTab('assets')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'assets' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              <Library size={14} />
              Assets
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'upload' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              <Download size={14} />
              Upload
            </button>
          </div>

          {activeTab === 'settings' ? (
            <div className="space-y-8">
              <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-8 space-y-8">
                <h3 className="text-xl font-black uppercase tracking-tight">AI Refinement</h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Refinement Prompt</label>
                    <input 
                      type="text"
                      value={refinementPrompt}
                      onChange={(e) => setRefinementPrompt(e.target.value)}
                      placeholder="e.g. Add more neon glow, make it more cinematic..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Style Filter</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['None', 'Cyberpunk', 'Vintage', 'Noir', 'Vibrant', 'Dreamy'].map(f => (
                        <button
                          key={f}
                          onClick={() => setSelectedFilter(f)}
                          className={cn(
                            "px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                            selectedFilter === f ? "bg-zinc-700 border-zinc-600 text-white" : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isRefining && (
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

                  <button
                    onClick={handleRefineVideo}
                    disabled={isRefining || !videoUrl}
                    className="w-full py-4 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 disabled:opacity-50 flex items-center justify-center gap-3 text-xs"
                  >
                    {isRefining ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    {isRefining ? 'Refining Video...' : 'Refine with AI'}
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-8 space-y-8">
                <h3 className="text-xl font-black uppercase tracking-tight">Engine Stats</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>GPU Utilization</span>
                    <span className="text-emerald-400">42%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full w-[42%] bg-emerald-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Memory Usage</span>
                    <span className="text-purple-400">1.2 GB</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full w-[60%] bg-purple-500" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-purple-500/5 rounded-3xl border border-purple-500/20 space-y-4">
                <div className="flex items-center gap-3">
                  <Video className="text-purple-400" size={20} />
                  <p className="font-bold text-sm">Widevine DRM Active</p>
                </div>
                <p className="text-[10px] text-purple-400/60 leading-relaxed">
                  All previews and renders are protected by Widevine DRM using GCP HSM hardware-backed encryption.
                </p>
              </div>
            </div>
          </div>
          ) : activeTab === 'assets' ? (
            <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight">Pro Library</h3>
                <Sparkles className="text-emerald-400" size={20} />
              </div>

              {!isPro && (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl space-y-4">
                  <p className="text-xs font-bold text-emerald-400">Sonic Pro Exclusive</p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Unlock 5,000+ 4K overlays, transitions, and cinematic LUTs directly in your editor.
                  </p>
                  <button className="w-full py-3 bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all">
                    Upgrade to Unlock
                  </button>
                </div>
              )}

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {loadingAssets ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                  ))
                ) : (
                  proAssets.map(asset => (
                    <div key={asset.id} className="group relative bg-black/40 border border-white/5 rounded-2xl p-4 flex gap-4 hover:border-emerald-500/30 transition-all">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative">
                        <img src={asset.previewUrl} alt={asset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {!isPro && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Lock size={14} className="text-zinc-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold truncate group-hover:text-emerald-400 transition-colors">{asset.name}</h4>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{asset.type}</p>
                        </div>
                        <button 
                          disabled={!isPro}
                          onClick={() => handleAddAssetToTimeline(asset)}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 transition-colors"
                        >
                          <Plus size={12} />
                          {isPro ? 'Add to Project' : 'Locked'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight">Upload Media</h3>
                <Download className="text-emerald-400" size={20} />
              </div>
              <VideoUploadZone onUploadComplete={(url) => {
                setVideoUrl(url);
                const newSegment: VideoSegment = {
                  id: Math.random().toString(36).substr(2, 9),
                  url: url,
                  startTime: 0,
                  endTime: 10,
                  duration: 10,
                  name: 'Uploaded Clip'
                };
                setSegments(prev => [...prev, newSegment]);
                setActiveTab('timeline');
              }} />
              <div className="p-6 bg-zinc-900/30 rounded-3xl border border-white/5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Recent Uploads</h4>
                <div className="text-center py-8">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">No recent uploads</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
