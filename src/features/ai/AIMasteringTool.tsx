import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Save, Play, Pause, Download, Volume2, Settings2, Sparkles, Activity, CheckCircle2 } from 'lucide-react';
import { toast } from '../../components/ui/Toast';

type MasteringProfile = 'balanced' | 'warm' | 'bright' | 'club';

interface Preset {
  id: string;
  name: string;
  profile: MasteringProfile;
  settings: {
    intensity: number;
    bass: number;
    clarity: number;
    width: number;
  };
}

export const AIMasteringTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<MasteringProfile>('balanced');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMastered, setIsMastered] = useState(false);
  
  const [settings, setSettings] = useState({
    intensity: 75,
    bass: 50,
    clarity: 65,
    width: 60
  });

  const [presets, setPresets] = useState<Preset[]>([
    {
      id: '1',
      name: 'Studio Standard',
      profile: 'balanced',
      settings: { intensity: 75, bass: 50, clarity: 65, width: 60 }
    },
    {
      id: '2',
      name: 'Deep Club',
      profile: 'club',
      settings: { intensity: 90, bass: 85, clarity: 40, width: 80 }
    },
    {
      id: '3',
      name: 'Analog Warmth',
      profile: 'warm',
      settings: { intensity: 65, bass: 70, clarity: 45, width: 55 }
    },
    {
      id: '4',
      name: 'Crystal Bright',
      profile: 'bright',
      settings: { intensity: 70, bass: 35, clarity: 85, width: 70 }
    }
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isPlaying && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrameId: number;
      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#c81e3a';
        
        for (let i = 0; i < 50; i++) {
          const height = Math.random() * canvas.height * 0.8;
          const x = (canvas.width / 50) * i;
          ctx.fillRect(x, canvas.height - height, (canvas.width / 50) - 2, height);
        }
        
        animationFrameId = requestAnimationFrame(render);
      };
      render();
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [isPlaying]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('audio/')) {
        setFile(selectedFile);
        setIsMastered(false);
        setProgress(0);
      } else {
        toast.error('Please upload an audio file');
      }
    }
  };

  const startMastering = () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setIsMastered(true);
          toast.success('Mastering complete!');
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const savePreset = () => {
    const name = prompt('Enter preset name:');
    if (name) {
      const newPreset: Preset = {
        id: Date.now().toString(),
        name,
        profile: selectedProfile,
        settings: { ...settings }
      };
      setPresets(prev => [...prev, newPreset]);
      toast.success('Preset saved!');
    }
  };

  const applyPreset = (preset: Preset) => {
    setSelectedProfile(preset.profile);
    setSettings(preset.settings);
    toast.success(`Applied preset: ${preset.name}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Wand2 className="text-emerald-500" size={36} />
            AI Mastering
          </h1>
          <p className="text-zinc-400 mt-2">Professional-grade audio finishing powered by neural networks.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-xl border transition-all ${showSettings ? 'bg-zinc-700 border-emerald-500 text-white' : 'bg-zinc-900 border-white/10 text-white hover:border-white/20'}`}
          >
            <Settings2 size={20} />
          </button>
          <button 
            onClick={savePreset}
            className="flex items-center gap-2 bg-zinc-900 border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            <Save size={18} /> Save Preset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Controls */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-8">
            {!file ? (
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center space-y-4 hover:border-emerald-500/50 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Volume2 className="mx-auto text-zinc-700" size={48} />
                <div>
                  <h3 className="text-xl font-bold">Upload your track</h3>
                  <p className="text-zinc-500">WAV, MP3, or AIFF (Max 100MB)</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                      <Activity size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold truncate max-w-[200px]">{file.name}</h3>
                      <p className="text-xs text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                </div>

                <div className="h-48 bg-black/60 rounded-2xl overflow-hidden relative">
                  <canvas ref={canvasRef} width={800} height={200} className="w-full h-full" />
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                      <button 
                        onClick={() => setIsPlaying(true)}
                        className="w-16 h-16 bg-zinc-700 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-black/20"
                      >
                        <Play size={32} className="ml-1" />
                      </button>
                    </div>
                  )}
                  {isPlaying && (
                    <button 
                      onClick={() => setIsPlaying(false)}
                      className="absolute bottom-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <Pause size={20} />
                    </button>
                  )}
                </div>

                {isProcessing ? (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-zinc-500">
                      <span>Analyzing & Processing</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : isMastered ? (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '#'; // In a real app, this would be the mastered file URL
                        link.download = `mastered-${file.name}`;
                        link.click();
                        toast.success('Download started!');
                      }}
                      className="flex-grow bg-zinc-700 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-600 transition-colors"
                    >
                      <Download size={20} /> Download Mastered Track
                    </button>
                    <button 
                      onClick={() => setIsMastered(false)}
                      className="px-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-colors"
                    >
                      Remaster
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={startMastering}
                    className="w-full bg-zinc-700 text-white h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-zinc-600 transition-all shadow-lg shadow-black/20"
                  >
                    <Sparkles size={24} /> Master Track
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['balanced', 'warm', 'bright', 'club'] as MasteringProfile[]).map((profile) => (
              <button
                key={profile}
                onClick={() => setSelectedProfile(profile)}
                className={`p-6 rounded-3xl border transition-all text-center space-y-2 ${
                  selectedProfile === profile 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                    : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10'
                }`}
              >
                <div className="text-lg font-bold capitalize">{profile}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-60">Profile</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar / Settings */}
        <div className="space-y-8">
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-8"
              >
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Settings2 size={20} className="text-emerald-500" />
                  Fine Tuning
                </h3>
                
                <div className="space-y-6">
                  {Object.entries(settings).map(([key, value]) => (
                    <div key={key} className="space-y-3">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                        <span>{key}</span>
                        <span>{value}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => setSettings({...settings, [key]: parseInt(e.target.value)})}
                        className="w-full accent-emerald-500 bg-white/5 rounded-lg h-1.5 appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Save size={20} className="text-emerald-500" />
              Your Presets
            </h3>
            <div className="space-y-3">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="w-full flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-emerald-500/50 transition-all group"
                >
                  <div className="text-left">
                    <div className="font-bold group-hover:text-emerald-500 transition-colors">{preset.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">{preset.profile}</div>
                  </div>
                  <CheckCircle2 size={18} className="text-zinc-800 group-hover:text-emerald-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const XCircle = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);
