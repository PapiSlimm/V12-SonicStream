import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Waves, CheckCircle2, Loader2, Zap, Headphones, BarChart3, Activity, Save, FolderOpen, Trash2 } from 'lucide-react';
import { api } from '../../api';
import { Track } from '../../types';
import { toast } from '../../components/ui/Toast';
import { cn } from '../../utils/cn';
import { aiService } from '../../services/aiService';
import { MASTERING_PROFILES } from '../../constants';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { AudioVisualizer } from '../../components/AudioVisualizer';

export const MasteringStudio = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedProfile, setSelectedProfile] = useState('balanced');
  const [isMastering, setIsMastering] = useState(false);
  const [masteringStep, setMasteringStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [masteringReport, setMasteringReport] = useState<any>(null);
  const [presets, setPresets] = useState<any[]>([]);
  const [presetName, setPresetName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const steps = [
    "Analyzing frequency spectrum...",
    "Applying dynamic EQ...",
    "Optimizing stereo width...",
    "Normalizing LUFS levels...",
    "Finalizing AI master..."
  ];

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const data = await api.tracks.getArtistTracks();
        setTracks(data.filter(t => t.status !== 'mastering'));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTracks();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'mastering_presets'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const presetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPresets(presetsData);
    });

    return () => unsubscribe();
  }, []);

  const handleSavePreset = async () => {
    if (!presetName || !auth.currentUser) {
      toast.error('Please enter a preset name');
      return;
    }

    setIsSavingPreset(true);
    try {
      await addDoc(collection(db, 'mastering_presets'), {
        userId: auth.currentUser.uid,
        name: presetName,
        profile: selectedProfile,
        createdAt: serverTimestamp()
      });
      toast.success('Preset saved successfully!');
      setPresetName('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save preset');
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'mastering_presets', id));
      toast.success('Preset deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete preset');
    }
  };

  const handleMaster = async () => {
    if (!selectedTrack) return;
    setIsMastering(true);
    setMasteringStep(0);
    setMasteringReport(null);

    // Simulate progress for UI
    const interval = setInterval(() => {
      setMasteringStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);

    try {
      // Get AI Analysis
      const report = await aiService.analyzeMastering(selectedTrack.title, selectedTrack.genre || 'Various', selectedProfile);
      setMasteringReport(report);

      await api.tracks.master(selectedTrack.id, { profile: selectedProfile });
      toast.success('Mastering analysis complete! Your track is being processed.');
      
      // Keep simulating for a bit then reset
      setTimeout(() => {
        clearInterval(interval);
        setIsMastering(false);
        // We keep the report visible
      }, 10000);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      toast.error('Failed to start mastering');
      setIsMastering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight">AI Mastering Studio</h2>
          <p className="text-zinc-500">Professional-grade audio mastering powered by neural networks.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Track to Master</label>
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(track)}
                  disabled={isMastering}
                  className={cn(
                    "p-4 rounded-2xl border flex items-center gap-4 transition-all text-left",
                    selectedTrack?.id === track.id 
                      ? "bg-emerald-500/10 border-emerald-500/20" 
                      : "bg-zinc-900/50 border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                    <Music size={20} className={selectedTrack?.id === track.id ? "text-emerald-400" : "text-zinc-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{track.title}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{track.genre}</p>
                  </div>
                  {selectedTrack?.id === track.id && <CheckCircle2 size={20} className="text-emerald-400" />}
                </button>
              ))}
              {tracks.length === 0 && (
                <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl text-zinc-500">
                  No tracks available for mastering.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mastering Profile</label>
            <div className="grid grid-cols-2 gap-3">
              {MASTERING_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile.id)}
                  disabled={isMastering}
                  className={cn(
                    "p-4 rounded-2xl border flex items-center gap-3 transition-all text-left",
                    selectedProfile === profile.id 
                      ? "bg-white text-black border-white" 
                      : "bg-zinc-900/50 border-white/5 hover:border-white/10"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    selectedProfile === profile.id ? "bg-black text-white" : "bg-zinc-800 text-zinc-400"
                  )}>
                    <profile.icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate">{profile.name}</p>
                    <p className={cn(
                      "text-[8px] uppercase tracking-widest truncate",
                      selectedProfile === profile.id ? "text-black/60" : "text-zinc-500"
                    )}>{profile.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Custom Presets</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Preset Name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="flex-1 bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={handleSavePreset}
                disabled={isSavingPreset || !presetName}
                className="px-4 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} />
                <span className="text-xs font-bold">Save</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto no-scrollbar">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={cn(
                    "p-3 rounded-xl border flex items-center justify-between transition-all",
                    selectedProfile === preset.profile && presetName === preset.name
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-zinc-900/30 border-white/5"
                  )}
                >
                  <button
                    onClick={() => {
                      setSelectedProfile(preset.profile);
                      setPresetName(preset.name);
                    }}
                    className="flex-1 text-left flex items-center gap-3"
                  >
                    <FolderOpen size={14} className="text-zinc-500" />
                    <div>
                      <p className="text-xs font-bold">{preset.name}</p>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-widest">{preset.profile}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeletePreset(preset.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Headphones size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Target LUFS</span>
              </div>
              <p className="text-xl font-bold">-14.0</p>
            </div>
            <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <BarChart3 size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Dynamic Range</span>
              </div>
              <p className="text-xl font-bold">Optimized</p>
            </div>
          </div>

          <button
            onClick={handleMaster}
            disabled={isMastering || !selectedTrack}
            className="w-full py-6 bg-zinc-700 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isMastering ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Mastering in Progress...
              </>
            ) : (
              <>
                <Zap size={24} />
                Start AI Mastering
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="sticky top-8 bg-zinc-900/50 border border-white/5 rounded-[48px] p-10 space-y-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <Waves className="text-emerald-400 animate-pulse" size={24} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight">Studio Monitor</h3>
              <p className="text-sm text-zinc-500">Real-time processing visualization.</p>
            </div>

            <div className="aspect-video bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center relative overflow-hidden">
              {isMastering ? (
                <div className="flex items-end gap-1 h-32">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: [20, 80, 40, 100, 30],
                        opacity: [0.3, 1, 0.5]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 0.5 + Math.random(),
                        delay: i * 0.05
                      }}
                      className="w-2 bg-emerald-500 rounded-full"
                    />
                  ))}
                </div>
              ) : (
                <AudioVisualizer 
                  className="w-full h-full opacity-30" 
                  isActive={false}
                />
              )}
              
              {!isMastering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Waiting for Input</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <span>Processing Status</span>
                <span>{isMastering ? `${Math.round((masteringStep + 1) / steps.length * 100)}%` : 'Idle'}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: isMastering ? `${(masteringStep + 1) / steps.length * 100}%` : 0 }}
                  className="h-full bg-emerald-500"
                />
              </div>
              <AnimatePresence mode="wait">
                {isMastering && (
                  <motion.p 
                    key={masteringStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center text-sm font-bold text-emerald-400"
                  >
                    {steps[masteringStep]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3 text-zinc-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Neural EQ</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Smart Limiter</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Stereo Imager</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">LUFS Control</span>
              </div>
            </div>

            {masteringReport && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-zinc-900/80 border border-white/5 rounded-[32px] space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Activity size={16} className="text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight">AI Mastering Report</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Loudness</p>
                    <p className="text-sm font-bold text-white">{masteringReport["Final Loudness (LUFS) target"] || masteringReport.loudness}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Dynamic Range</p>
                    <p className="text-sm font-bold text-white">{masteringReport["Dynamic Range analysis"] || masteringReport.dynamic_range}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">EQ Adjustments</p>
                  <p className="text-xs text-zinc-400 mt-1">{JSON.stringify(masteringReport["EQ adjustments (Low, Mid, High)"] || masteringReport.eq)}</p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Compression</p>
                  <p className="text-xs text-zinc-400 mt-1">{masteringReport["Compression settings"] || masteringReport.compression}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
