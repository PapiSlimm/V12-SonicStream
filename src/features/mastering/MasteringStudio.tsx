import React, { useState } from 'react';
import { Sparkles, Sliders, Volume2, Save, RefreshCw, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { aiService } from '../../services/aiService';
import toast from 'react-hot-toast';
import { Track } from '../../types';

interface MasteringStudioProps {
  track: Track;
  onClose: () => void;
}

export const MasteringStudio: React.FC<MasteringStudioProps> = ({ track, onClose }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMastering, setIsMastering] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState('balanced');
  const [settings, setSettings] = useState({
    targetLoudness: -14,
    bassBoost: 0,
    trebleBoost: 0,
    compressionThreshold: -20
  });

  // Custom presets state
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('v12_custom_presets');
      if (saved) {
        setPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleApplyPreset = (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;
    setSelectedPresetId(id);
    setSelectedProfile(preset.profile || 'balanced');
    
    // Convert 0-100% preset settings to actual DB/LUFS values
    const loudness = Math.round(-24 + (preset.intensity / 100) * 18);
    const bass = parseFloat((-6 + (preset.bass / 100) * 18).toFixed(1));
    const treble = parseFloat((-6 + (preset.clarity / 100) * 18).toFixed(1));
    const compression = Math.round(-40 + (preset.width / 100) * 40);

    setSettings({
      targetLoudness: loudness,
      bassBoost: bass,
      trebleBoost: treble,
      compressionThreshold: compression
    });
    toast.success(`Applied preset: ${preset.name}`);
  };

  const analyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const aiSettings = await aiService.analyzeMastering(track.title, track.genre, selectedProfile);
      setSettings({
        targetLoudness: aiSettings.targetLoudness,
        bassBoost: aiSettings.bassBoost,
        trebleBoost: aiSettings.trebleBoost,
        compressionThreshold: aiSettings.compressionThreshold
      });
      toast.success(`AI Analysis Complete: ${aiSettings.reasoning}`);
    } catch (error) {
      console.error('AI Analysis failed:', error);
      toast.error('AI Analysis failed. Using default settings.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startMastering = async () => {
    setIsMastering(true);
    try {
      const response = await fetch(`/api/tracks/${track.id}/master`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ settings, profile: selectedProfile })
      });

      if (response.ok) {
        toast.success('Mastering job queued! Check catalog for progress.');
        onClose();
      } else {
        throw new Error('Failed to queue mastering job');
      }
    } catch (error) {
      console.error('Mastering failed:', error);
      toast.error('Mastering failed to start.');
    } finally {
      setIsMastering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
      <div className="bg-zinc-900 border border-white/10 rounded-[3rem] p-12 max-w-2xl w-full space-y-12 shadow-2xl relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] -z-10" />

        <header className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <Zap size={12} />
              V12 AI Mastering Studio
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tight">Mastering: {track.title}</h2>
            <p className="text-zinc-500 font-medium">Professional grade audio enhancement powered by Gemini AI.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-colors">
            <RefreshCw className="rotate-45" />
          </button>
        </header>

        {presets.length > 0 && (
          <div className="space-y-3 bg-white/5 border border-white/5 p-5 rounded-3xl">
            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Apply Saved Presets</label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`
                    px-4 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5
                    ${selectedPresetId === preset.id
                      ? 'bg-emerald-500/10 border-emerald-500/45 text-emerald-400 shadow-md shadow-emerald-500/5'
                      : 'bg-black/60 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200'}
                  `}
                >
                  <Sliders size={12} className="text-emerald-500" />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Mastering Profile</label>
          <div className="grid grid-cols-4 gap-4">
            {['balanced', 'warm', 'bright', 'club'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedProfile(p)}
                className={`
                  py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all
                  ${selectedProfile === p 
                    ? 'bg-zinc-700 text-white border-emerald-500' 
                    : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20'}
                `}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                <Volume2 size={14} />
                Target Loudness (LUFS)
              </label>
              <input 
                type="range" min="-24" max="-6" step="1"
                value={settings.targetLoudness}
                onChange={e => setSettings({...settings, targetLoudness: parseInt(e.target.value)})}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                <span>-24 LUFS</span>
                <span className="text-emerald-400 font-bold">{settings.targetLoudness} LUFS</span>
                <span>-6 LUFS</span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                <Sliders size={14} />
                Bass Boost (dB)
              </label>
              <input 
                type="range" min="-6" max="12" step="0.5"
                value={settings.bassBoost}
                onChange={e => setSettings({...settings, bassBoost: parseFloat(e.target.value)})}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                <span>-6 dB</span>
                <span className="text-purple-400 font-bold">{settings.bassBoost} dB</span>
                <span>12 dB</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                <Sliders size={14} />
                Treble Boost (dB)
              </label>
              <input 
                type="range" min="-6" max="12" step="0.5"
                value={settings.trebleBoost}
                onChange={e => setSettings({...settings, trebleBoost: parseFloat(e.target.value)})}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                <span>-6 dB</span>
                <span className="text-emerald-400 font-bold">{settings.trebleBoost} dB</span>
                <span>12 dB</span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                <Volume2 size={14} />
                Compression Threshold
              </label>
              <input 
                type="range" min="-40" max="0" step="1"
                value={settings.compressionThreshold}
                onChange={e => setSettings({...settings, compressionThreshold: parseInt(e.target.value)})}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                <span>-40 dB</span>
                <span className="text-purple-400 font-bold">{settings.compressionThreshold} dB</span>
                <span>0 dB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-8">
          <Button 
            onClick={analyzeWithAI} 
            disabled={isAnalyzing || isMastering}
            className="flex-1 bg-zinc-800 text-white hover:bg-zinc-700 h-16 rounded-3xl"
          >
            {isAnalyzing ? <RefreshCw className="animate-spin mr-2" /> : <Sparkles className="mr-2 text-emerald-400" />}
            AI Auto-Analyze
          </Button>
          <Button 
            onClick={startMastering} 
            disabled={isMastering || isAnalyzing}
            className="flex-1 bg-zinc-700 text-white hover:bg-zinc-600 h-16 rounded-3xl font-black text-lg"
          >
            {isMastering ? <RefreshCw className="animate-spin mr-2" /> : <Save className="mr-2" />}
            Apply Mastering
          </Button>
        </div>
      </div>
    </div>
  );
};
