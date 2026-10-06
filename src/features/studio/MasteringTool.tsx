import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wand2, 
  Music, 
  Activity, 
  CheckCircle2, 
  Play,
  Pause,
  Download,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

interface MasteringProfile {
  id: string;
  name: string;
  genre: string;
  mood: string;
  description: string;
  color: string;
}

const MASTERING_PROFILES: MasteringProfile[] = [
  { id: 'modern-pop', name: 'Modern Pop', genre: 'Pop', mood: 'Bright', description: 'Crystal clear highs and punchy low end.', color: 'from-pink-500 to-rose-500' },
  { id: 'deep-techno', name: 'Deep Techno', genre: 'Electronic', mood: 'Dark', description: 'Sub-heavy, wide soundstage, analog warmth.', color: 'from-blue-600 to-indigo-600' },
  { id: 'lofi-chill', name: 'Lofi Chill', genre: 'Hip Hop', mood: 'Vintage', description: 'Soft saturation, rolled off highs, cozy vibe.', color: 'from-amber-500 to-orange-500' },
  { id: 'cinematic', name: 'Cinematic', genre: 'Classical', mood: 'Epic', description: 'Dynamic range preservation, lush reverb.', color: 'from-purple-500 to-violet-500' },
  { id: 'rock-anthem', name: 'Rock Anthem', genre: 'Rock', mood: 'Aggressive', description: 'Aggressive compression, mid-range bite.', color: 'from-red-500 to-orange-500' },
];

export const MasteringTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<MasteringProfile>(MASTERING_PROFILES[0]);
  const [isMastered, setIsMastered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<'original' | 'mastered'>('mastered');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('audio/')) {
      setFile(selectedFile);
      setIsMastered(false);
      setProgress(0);
    } else {
      toast.error('Please select a valid audio file');
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
          toast.success('AI Mastering Complete!');
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">AI Mastering Engine</h2>
          <p className="text-zinc-500 text-sm">Professional grade audio optimization powered by neural networks.</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
            v2.4 Neural Core
          </div>
        </div>
      </div>

      {!file ? (
        <label className="block">
          <div className="border-2 border-dashed border-white/10 rounded-[48px] p-16 text-center space-y-6 hover:border-emerald-500/50 transition-all cursor-pointer group bg-zinc-900/30">
            <div className="w-24 h-24 bg-zinc-800 rounded-[32px] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Music className="text-zinc-500 group-hover:text-emerald-500" size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Drop your mix here</h3>
              <p className="text-zinc-500 text-sm">WAV, AIFF, or MP3 (High Quality recommended)</p>
            </div>
            <input type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
          </div>
        </label>
      ) : (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Music className="text-black" size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white truncate max-w-xs">{file.name}</h3>
                <p className="text-xs text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for processing</p>
              </div>
            </div>
            <button 
              onClick={() => setFile(null)}
              className="p-4 bg-zinc-800 text-zinc-400 rounded-2xl hover:bg-zinc-700 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Select Mastering Profile</h4>
              <div className="space-y-3">
                {MASTERING_PROFILES.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile)}
                    className={cn(
                      "w-full p-6 rounded-[32px] text-left transition-all border flex items-center justify-between group",
                      selectedProfile.id === profile.id 
                        ? "bg-zinc-800 border-white/20 shadow-xl" 
                        : "bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center", profile.color)}>
                        <Sparkles className="text-white" size={20} />
                      </div>
                      <div>
                        <h5 className="font-bold text-white">{profile.name}</h5>
                        <p className="text-xs text-zinc-500">{profile.description}</p>
                      </div>
                    </div>
                    {selectedProfile.id === profile.id && (
                      <CheckCircle2 className="text-emerald-500" size={20} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Processing Status</h4>
              <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-8 min-h-[400px] flex flex-col justify-center">
                {!isProcessing && !isMastered ? (
                  <div className="text-center space-y-8">
                    <div className="w-24 h-24 bg-zinc-800 rounded-[32px] flex items-center justify-center mx-auto border border-white/5">
                      <Zap size={40} className="text-zinc-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Ready to Master</h3>
                      <p className="text-zinc-500 text-sm px-8">Our AI will analyze your track's frequency response and dynamic range.</p>
                    </div>
                    <button
                      onClick={startMastering}
                      className="w-full py-6 bg-zinc-700 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3"
                    >
                      <Wand2 size={24} />
                      Analyze & Master
                    </button>
                  </div>
                ) : isProcessing ? (
                  <div className="text-center space-y-8">
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-zinc-800"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={377}
                          strokeDashoffset={377 - (377 * progress) / 100}
                          className="text-emerald-500 transition-all duration-300"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black">{progress}%</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold animate-pulse">
                        {progress < 30 ? 'Analyzing Spectrum...' : 
                         progress < 60 ? 'Applying EQ & Dynamics...' : 
                         'Finalizing Loudness...'}
                      </h3>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4].map(i => (
                          <motion.div
                            key={i}
                            animate={{ height: [10, 30, 10] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1 bg-emerald-500 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="text-emerald-500" size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Mastering Complete</h3>
                        <p className="text-sm text-zinc-500">Optimized for {selectedProfile.name}</p>
                      </div>
                    </div>

                    <div className="bg-black/40 rounded-3xl p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setComparisonMode('original')}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              comparisonMode === 'original' ? "bg-white text-black" : "bg-zinc-800 text-zinc-500"
                            )}
                          >
                            Original
                          </button>
                          <button 
                            onClick={() => setComparisonMode('mastered')}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              comparisonMode === 'mastered' ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-500"
                            )}
                          >
                            Mastered
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-500">
                          <Activity size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">-14.0 LUFS</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center hover:scale-105 transition-transform"
                        >
                          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                        </button>
                        <div className="flex-1 h-12 flex items-center gap-1">
                          {Array.from({ length: 40 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "flex-1 rounded-full transition-all",
                                isPlaying ? "animate-pulse" : "",
                                comparisonMode === 'mastered' ? "bg-emerald-500/40" : "bg-zinc-700"
                              )}
                              style={{ height: `${Math.random() * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-bold hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
                        <Download size={20} />
                        Download Master
                      </button>
                      <button className="flex-1 py-4 bg-zinc-700 text-white rounded-2xl font-bold hover:bg-zinc-600 transition-all flex items-center justify-center gap-2">
                        <Layers size={20} />
                        Publish to Feed
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
