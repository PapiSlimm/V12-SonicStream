import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Sparkles, 
  Music, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Sliders,
  ShieldCheck,
  Activity,
  RefreshCw,
  X,
  Trash2,
  Plus
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { api } from '../../api';
import toast from 'react-hot-toast';
import { Track } from '../../types';
import { MASTERING_PROFILES } from '../../constants';
import { PrintingTerms } from './PrintingTerms';
import { MasteringVisualizer } from './MasteringVisualizer';
import { useAuth } from '../../context/AuthContext';

export interface MasteringPreset {
  id: string;
  name: string;
  profile: string; // 'balanced', 'warm', 'bright', 'club'
  intensity: number;
  bass: number;
  clarity: number;
  width: number;
}

export const AIMasteringTool: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('balanced');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [recentJobs, setRecentJobs] = useState<Track[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  // Custom AI Presets States
  const [presets, setPresets] = useState<MasteringPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [showCreatePreset, setShowCreatePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetProfile, setNewPresetProfile] = useState('balanced');
  const [presetIntensity, setPresetIntensity] = useState(50);
  const [presetBass, setPresetBass] = useState(50);
  const [presetClarity, setPresetClarity] = useState(50);
  const [presetWidth, setPresetWidth] = useState(50);

  // Load Presets
  useEffect(() => {
    try {
      const saved = localStorage.getItem('v12_custom_presets');
      if (saved) {
        setPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load custom mastering presets', e);
    }
  }, []);

  const savePresetsToStorage = (updated: MasteringPreset[]) => {
    localStorage.setItem('v12_custom_presets', JSON.stringify(updated));
    setPresets(updated);
  };

  const handleCreatePreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name.');
      return;
    }
    const newPreset: MasteringPreset = {
      id: `preset_${Date.now()}`,
      name: newPresetName.trim(),
      profile: newPresetProfile,
      intensity: presetIntensity,
      bass: presetBass,
      clarity: presetClarity,
      width: presetWidth
    };
    const updated = [...presets, newPreset];
    savePresetsToStorage(updated);
    setSelectedPresetId(newPreset.id);
    setSelectedProfile(newPreset.profile);
    setNewPresetName('');
    setShowCreatePreset(false);
    toast.success(`Preset "${newPreset.name}" saved successfully!`);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.filter(p => p.id !== id);
    savePresetsToStorage(updated);
    if (selectedPresetId === id) {
      setSelectedPresetId(null);
    }
    toast.success('Preset deleted.');
  };

  const handleSelectPreset = (preset: MasteringPreset) => {
    if (selectedPresetId === preset.id) {
      setSelectedPresetId(null);
    } else {
      setSelectedPresetId(preset.id);
      setSelectedProfile(preset.profile);
    }
  };

  const fetchJobs = async () => {
    try {
      const tracks = await api.get<Track[]>('/tracks');
      setRecentJobs(tracks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const startAnalysis = () => {
    if (!file) return;
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisComplete(false);

    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          setAnalysisComplete(true);
          toast.success('Audio analysis complete!');
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleUpload = async (bypassConfirm = false) => {
    if (!file || !agreedToTerms) {
      if (!agreedToTerms) toast.error('Please agree to the Printing Terms & Conditions.');
      return;
    }

    // SonicStar limit check
    if ((user?.subscriptionTier as string) === 'star' && (user?.aiMasteringCount || 0) >= 10) {
      toast.error('You have reached the 10-track limit for SonicStar. Please upgrade to Visionary or Pro for unlimited mastering.');
      return;
    }

    if (!bypassConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('genre', 'Mastering');
    formData.append('mastering_profile', selectedProfile);

    try {
      const { id } = await api.post<{ id: number }>('/tracks/upload', formData);
      
      const activePreset = presets.find(p => p.id === selectedPresetId);
      const settingsPayload = activePreset ? {
        intensity: activePreset.intensity,
        bass: activePreset.bass,
        clarity: activePreset.clarity,
        width: activePreset.width,
        name: activePreset.name
      } : undefined;

      await api.post(`/tracks/${id}/master`, { 
        profile: selectedProfile,
        settings: settingsPayload
      });

      toast.success('Track uploaded and mastering started!');
      setFile(null);
      setTitle('');
      setAnalysisComplete(false);
      setAgreedToTerms(false);
      fetchJobs();
    } catch (error) {
      console.error('Mastering failed:', error);
      toast.error('Failed to start mastering process.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
          <Sparkles size={12} />
          Professional AI Mastering Studio
        </div>
        <h1 className="text-6xl font-black uppercase tracking-tighter">Master Your Sound</h1>
        <p className="text-xl text-zinc-500 max-w-2xl font-medium">
          Upload your mix and let our V12 AI engine enhance your audio to professional streaming standards in seconds.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-10 space-y-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                <Upload className="text-emerald-400" />
                1. Upload Your Mix
              </h3>
              
              <MasteringVisualizer isAnalyzing={isAnalyzing} isProcessing={isUploading} />

              <div 
                className={`
                  relative border-2 border-dashed rounded-[2rem] p-12 transition-all group
                  ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 bg-black/20'}
                `}
              >
                <input 
                  type="file" 
                  accept="audio/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      if (!title) setTitle(f.name.split('.')[0]);
                      startAnalysis();
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-6 rounded-full transition-all ${file ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-500 group-hover:scale-110'}`}>
                    <Music size={32} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{file ? file.name : 'Drop your audio file here'}</p>
                    <p className="text-sm text-zinc-500">WAV, AIFF, or MP3 (High Quality recommended)</p>
                  </div>
                </div>
              </div>

              {file && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Track Title</label>
                    <input 
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter track title..."
                      className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>

                  {isAnalyzing && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-emerald-400 flex items-center gap-2">
                          <Activity size={12} className="animate-pulse" />
                          Analyzing Audio Spectrum...
                        </span>
                        <span>{analysisProgress}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${analysisProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {analysisComplete && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3"
                    >
                      <CheckCircle2 className="text-emerald-400" size={20} />
                      <div className="text-xs font-medium text-emerald-400">
                        Analysis complete: Dynamic range detected (-14 LUFS). Optimal for {selectedProfile} profile.
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                <Sliders className="text-purple-400" />
                2. Select Mastering Profile & Presets
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MASTERING_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => {
                      setSelectedProfile(profile.id);
                      setSelectedPresetId(null);
                    }}
                    type="button"
                    className={`
                      flex items-start gap-4 p-6 rounded-[2rem] border transition-all text-left
                      ${selectedProfile === profile.id && !selectedPresetId
                        ? 'bg-white text-black border-white shadow-xl shadow-white/10' 
                        : 'bg-black/40 border-white/5 text-white hover:border-white/20'}
                    `}
                  >
                    <div className={`p-3 rounded-2xl ${selectedProfile === profile.id && !selectedPresetId ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                      <profile.icon size={20} />
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-tight">{profile.name}</p>
                      <p className={`text-xs ${selectedProfile === profile.id && !selectedPresetId ? 'text-black/60' : 'text-zinc-500'}`}>
                        {profile.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Presets Subsection */}
              <div className="border-t border-white/5 pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <Sparkles size={14} className="text-emerald-400" />
                      Custom AI Presets
                    </h4>
                    <p className="text-xs text-zinc-600">Save and reapply your custom audio mastering settings.</p>
                  </div>
                  <button 
                    onClick={() => setShowCreatePreset(!showCreatePreset)}
                    type="button"
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/20"
                  >
                    {showCreatePreset ? 'Cancel' : <><Plus size={12} /> Create Custom Preset</>}
                  </button>
                </div>

                {/* Create Preset Form */}
                {showCreatePreset && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-black/40 border border-white/5 rounded-[2rem] space-y-6"
                  >
                    <h5 className="text-xs font-black uppercase tracking-widest text-zinc-400">New Custom Preset</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Preset Name */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Preset Name</label>
                        <input 
                          type="text"
                          value={newPresetName}
                          onChange={(e) => setNewPresetName(e.target.value)}
                          placeholder="e.g. Heavy Techno Crunch, Cozy Jazz..."
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
                        />
                      </div>

                      {/* Base Profile Selector */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Base Profile</label>
                        <select
                          value={newPresetProfile}
                          onChange={(e) => setNewPresetProfile(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
                        >
                          <option value="balanced">Balanced</option>
                          <option value="warm">Warm & Analog</option>
                          <option value="bright">Modern Bright</option>
                          <option value="club">Club Ready</option>
                        </select>
                      </div>
                    </div>

                    {/* Sliders Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Intensity */}
                      <div className="space-y-2 bg-black/20 p-4 border border-white/5 rounded-xl">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Intensity</label>
                          <span className="text-xs font-bold text-zinc-500">{presetIntensity}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={presetIntensity}
                          onChange={(e) => setPresetIntensity(Number(e.target.value))}
                          className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Bass */}
                      <div className="space-y-2 bg-black/20 p-4 border border-white/5 rounded-xl">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Bass Focus</label>
                          <span className="text-xs font-bold text-zinc-500">{presetBass}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={presetBass}
                          onChange={(e) => setPresetBass(Number(e.target.value))}
                          className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Clarity */}
                      <div className="space-y-2 bg-black/20 p-4 border border-white/5 rounded-xl">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Clarity</label>
                          <span className="text-xs font-bold text-zinc-500">{presetClarity}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={presetClarity}
                          onChange={(e) => setPresetClarity(Number(e.target.value))}
                          className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Width */}
                      <div className="space-y-2 bg-black/20 p-4 border border-white/5 rounded-xl">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Stereo Width</label>
                          <span className="text-xs font-bold text-zinc-500">{presetWidth}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={presetWidth}
                          onChange={(e) => setPresetWidth(Number(e.target.value))}
                          className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      onClick={handleCreatePreset}
                      className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-black text-xs uppercase tracking-widest transition-all"
                    >
                      Save Custom Preset
                    </Button>
                  </motion.div>
                )}

                {/* Presets List */}
                <div className="space-y-3">
                  {presets.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-white/5 rounded-[2rem] text-xs text-zinc-500">
                      No custom presets saved yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {presets.map((preset) => {
                        const styleClass = selectedPresetId === preset.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-black/20 border-white/5 hover:border-white/10 text-white';
                        
                        return (
                          <div
                            key={preset.id}
                            onClick={() => handleSelectPreset(preset)}
                            className={`flex justify-between items-center p-4 border rounded-2xl cursor-pointer select-none transition-all ${styleClass}`}
                          >
                            <div className="space-y-1 min-w-0 pr-2">
                              <div className="font-bold text-sm truncate flex items-center gap-2">
                                <span className={selectedPresetId === preset.id ? 'text-emerald-400' : 'text-white'}>
                                  {preset.name}
                                </span>
                                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                                  {preset.profile}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono truncate">
                                I:{preset.intensity}% B:{preset.bass}% C:{preset.clarity}% W:{preset.width}%
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeletePreset(preset.id, e)}
                              type="button"
                              className="text-zinc-600 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition-all"
                              title="Delete preset"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                <ShieldCheck className="text-blue-400" />
                3. Legal & Printing Terms
              </h3>
              
              <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <input 
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-white/10 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="terms" className="text-sm text-zinc-400 leading-relaxed">
                    I agree to the <button onClick={() => setShowTerms(true)} className="text-emerald-400 hover:underline font-bold">Printing Terms & Conditions</button>. 
                    I certify that I own the rights to this material or have authority to reproduce it.
                  </label>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => handleUpload()}
              disabled={!file || isUploading || !agreedToTerms || isAnalyzing}
              className="w-full h-20 rounded-[2rem] bg-zinc-700 text-white hover:bg-zinc-600 font-black text-xl uppercase tracking-tighter disabled:opacity-50 shadow-2xl shadow-black/20"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin mr-3" size={24} />
                  Mastering Your Track...
                </>
              ) : (
                <>
                  <Sparkles className="mr-3" size={24} />
                  Master My Track
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-8 space-y-6">
            <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
              <RefreshCw className="text-zinc-500" size={20} />
              Recent Jobs
            </h3>

            <div className="space-y-4">
              {isLoadingJobs ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-zinc-700" size={32} />
                </div>
              ) : recentJobs.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-600">
                    <Music size={24} />
                  </div>
                  <p className="text-zinc-500 text-sm font-medium">No recent mastering jobs.</p>
                </div>
              ) : (
                recentJobs.map((job) => (
                  <div 
                    key={job.id}
                    className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                        ${(job.status as string) === 'live' ? 'bg-emerald-500/10 text-emerald-400' : 
                          (job.status as string) === 'error' ? 'bg-red-500/10 text-red-400' : 
                          'bg-purple-500/10 text-purple-400'}
                      `}>
                        {(job.status as string) === 'live' ? <CheckCircle2 size={18} /> : 
                         (job.status as string) === 'error' ? <AlertCircle size={18} /> : 
                         <Loader2 size={18} className="animate-spin" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{job.title}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                          {(job.status as string) === 'live' ? 'Completed' : (job.status as string) === 'error' ? 'Failed' : 'Mastering...'}
                        </p>
                      </div>
                    </div>

                    {(job.status as string) === 'live' && (
                      <a 
                        href={job.fileUrl} 
                        download 
                        className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 hover:text-white transition-all"
                      >
                        <Download size={16} />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>

            <Button variant="ghost" className="w-full text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest">
              View All History
              <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>

          <div className="bg-zinc-700 rounded-[3rem] p-8 text-white space-y-4">
            <h4 className="font-black uppercase tracking-tight text-lg">Pro Tip</h4>
            <p className="text-sm font-medium leading-relaxed opacity-80">
              For the best results, ensure your mix has at least -6dB of headroom and no limiting on the master bus.
            </p>
          </div>
        </div>
      </div>
      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTerms(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] bg-zinc-900 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tighter">Printing Terms & Conditions</h3>
                <button onClick={() => setShowTerms(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <PrintingTerms />
              </div>
              <div className="p-8 border-t border-white/5">
                <Button 
                  onClick={() => {
                    setAgreedToTerms(true);
                    setShowTerms(false);
                  }}
                  className="w-full h-16 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-widest text-xs"
                >
                  I Accept These Terms
                </Button>
              </div>
            </motion.div>
          </div>
        )}

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
                  Audio Mastering uses continuous multi-band neural networks and will consume <span className="text-emerald-400 font-bold font-mono">1 AI Generation Credit</span> from your account allocation.
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
                    handleUpload(true);
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

export default AIMasteringTool;
