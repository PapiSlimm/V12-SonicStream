import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Scissors, Download, Loader2, CheckCircle2, Mic2, Drum, Guitar, Layers } from 'lucide-react';
import { api } from '../../api';
import { Track } from '../../types';
import { toast } from '../../components/ui/Toast';
import { cn } from '../../utils/cn';

export const TrackSeparator = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isSeparating, setIsSeparating] = useState(false);
  const [separationStep, setSeparationStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stems, setStems] = useState<{ name: string; icon: any; url: string; color: string }[] | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const steps = [
    "Loading audio buffer...",
    "Isolating vocal frequencies...",
    "Extracting rhythmic patterns...",
    "Synthesizing bass harmonics...",
    "Finalizing stem extraction..."
  ];

  const stemTypes = [
    { name: 'Vocals', icon: Mic2, color: 'text-pink-400' },
    { name: 'Drums', icon: Drum, color: 'text-amber-400' },
    { name: 'Bass', icon: Guitar, color: 'text-blue-400' },
    { name: 'Other', icon: Music, color: 'text-emerald-400' },
  ];

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const data = await api.tracks.getArtistTracks();
        setTracks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTracks();
  }, []);

  const handleSeparate = async (bypassConfirm = false) => {
    if (!selectedTrack) return;
    if (!bypassConfirm) {
      setShowConfirm(true);
      return;
    }
    setIsSeparating(true);
    setStems(null);
    setSeparationStep(0);

    // Simulate progress
    const interval = setInterval(() => {
      setSeparationStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2500);

    try {
      // Mocking the separation result for now as it's a heavy AI task
      // In a real app, this would call a backend service that uses Spleeter or similar
      await new Promise(resolve => setTimeout(resolve, 12000));
      
      const mockStems = stemTypes.map(s => ({
        ...s,
        url: '#' // Mock URL
      }));
      
      setStems(mockStems);
      toast.success('Track separation complete!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to separate track');
    } finally {
      clearInterval(interval);
      setIsSeparating(false);
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
          <h2 className="text-3xl font-black uppercase tracking-tight">AI Track Separator</h2>
          <p className="text-zinc-500">Extract high-quality stems from any mixed track using deep learning.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Track to Separate</label>
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(track)}
                  disabled={isSeparating}
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
            </div>
          </div>

          <button
            onClick={() => handleSeparate()}
            disabled={isSeparating || !selectedTrack}
            className="w-full py-6 bg-zinc-700 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSeparating ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Separating Stems...
              </>
            ) : (
              <>
                <Scissors size={24} />
                Extract Stems
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="sticky top-8 bg-zinc-900/50 border border-white/5 rounded-[48px] p-10 space-y-8 shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-tight">Stem Preview</h3>
                <p className="text-xs text-zinc-500">Download individual components.</p>
              </div>
              <Layers className="text-zinc-700" size={32} />
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {isSeparating ? (
                  <motion.div 
                    key="separating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6 py-12"
                  >
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="w-24 h-24 border-4 border-emerald-500/20 rounded-full animate-spin border-t-emerald-500" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Scissors className="text-emerald-400" size={32} />
                        </div>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm font-bold text-white uppercase tracking-widest">{steps[separationStep]}</p>
                      <div className="w-48 h-1 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                        <motion.div 
                          className="h-full bg-emerald-500"
                          animate={{ width: `${(separationStep + 1) / steps.length * 100}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : stems ? (
                  <motion.div 
                    key="stems"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-1 gap-4"
                  >
                    {stems.map((stem) => (
                      <div key={stem.name} className="p-6 bg-black/40 border border-white/5 rounded-3xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center", stem.color)}>
                            <stem.icon size={24} />
                          </div>
                          <div>
                            <p className="font-bold">{stem.name}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">High Quality WAV</p>
                          </div>
                        </div>
                        <button className="p-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 hover:text-white transition-all">
                          <Download size={20} />
                        </button>
                      </div>
                    ))}
                    <button className="w-full py-4 border border-emerald-500/20 text-emerald-400 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-500/5 transition-all">
                      Download All Stems (.zip)
                    </button>
                  </motion.div>
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto opacity-20">
                      <Layers size={32} />
                    </div>
                    <p className="text-sm text-zinc-600 font-medium">Select a track and click "Extract Stems" to begin.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
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
                <Scissors size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase text-white tracking-tight">Confirm AI processing</h3>
                <p className="text-sm text-zinc-400">
                  Splitting human voices and instruments of tracks requires GPU spectrogram filtering and will consume <span className="text-emerald-400 font-bold font-mono">1 AI Generation Credit</span> from your monthly allotment.
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
                    handleSeparate(true);
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
