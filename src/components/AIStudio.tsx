import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Activity, 
  Settings, 
  Sliders, 
  Cpu, 
  Mic, 
  Volume2, 
  Waves, 
  Wind, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Loader2, 
  AlertTriangle,
  FileAudio,
  Download,
  Share2,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AudioFile {
  id: string;
  name: string;
  size: string;
  duration: string;
  status: 'idle' | 'processing' | 'ready' | 'error';
  enhancements: string[];
}

export function AIStudio() {
  const [activeTab, setActiveTab] = useState<'enhance' | 'analyze' | 'history'>('enhance');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [files, setFiles] = useState<AudioFile[]>([
    { id: '1', name: 'Podcast_Interview_Raw.wav', size: '45.2 MB', duration: '12:45', status: 'ready', enhancements: ['Noise Removal', 'Echo Cancellation'] },
    { id: '2', name: 'Vocal_Take_03.wav', size: '12.8 MB', duration: '03:12', status: 'idle', enhancements: [] },
    { id: '3', name: 'Outdoor_Recording.mp3', size: '8.4 MB', duration: '05:30', status: 'error', enhancements: [] }
  ]);

  const [enhancementOptions, setEnhancementOptions] = useState({
    noiseRemoval: true,
    echoCancellation: true,
    deReverb: false,
    vocalClarity: true,
    autoLevel: true
  });

  const handleProcess = () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setFiles(prev => prev.map(f => f.id === selectedFile.id ? { ...f, status: 'processing' } : f));
    
    setTimeout(() => {
      const activeEnhancements = Object.entries(enhancementOptions)
        .filter(([_, val]) => val)
        .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      
      setFiles(prev => prev.map(f => f.id === selectedFile.id ? { ...f, status: 'ready', enhancements: activeEnhancements } : f));
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div className="bg-v12-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full relative">
      {/* Header */}
      <div className="p-6 bg-v12-red/10 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-v12-red/20 rounded-xl">
            <Cpu className="text-v12-red" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter">AI Studio v2</h3>
            <p className="text-[10px] text-v12-gray-400 font-bold uppercase tracking-widest">Neural Audio Enhancement Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('enhance')}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'enhance' ? "bg-v12-red text-white shadow-lg" : "text-v12-gray-400 hover:text-white"
            )}
          >
            Enhance Speech
          </button>
          <button 
            onClick={() => setActiveTab('analyze')}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'analyze' ? "bg-v12-red text-white shadow-lg" : "text-v12-gray-400 hover:text-white"
            )}
          >
            AI Analysis
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'history' ? "bg-v12-red text-white shadow-lg" : "text-v12-gray-400 hover:text-white"
            )}
          >
            History
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File List */}
        <div className="w-80 border-r border-white/10 bg-black/20 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-v12-gray-500" size={14} />
              <input 
                type="text" 
                placeholder="SEARCH FILES..." 
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-[10px] font-black uppercase outline-none focus:border-v12-red transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all text-left group relative overflow-hidden",
                  selectedFile?.id === file.id 
                    ? "bg-v12-red/10 border-v12-red/30" 
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileAudio size={18} className={cn(selectedFile?.id === file.id ? "text-v12-red" : "text-v12-gray-500")} />
                  <span className="text-[10px] font-black uppercase tracking-widest truncate flex-1">{file.name}</span>
                </div>
                <div className="flex items-center justify-between text-[8px] font-black text-v12-gray-500 uppercase">
                  <span>{file.duration}</span>
                  <span>{file.size}</span>
                </div>
                {file.status === 'processing' && (
                  <div className="absolute bottom-0 left-0 h-1 bg-v12-red animate-progress-indefinite w-full" />
                )}
              </button>
            ))}
            <button className="w-full py-8 border-2 border-dashed border-white/5 rounded-xl text-v12-gray-500 hover:text-white hover:border-white/10 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-2">
              <Plus size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest">Upload Audio</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-black/40">
          {selectedFile ? (
            <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar">
              <div className="flex items-start justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{selectedFile.name}</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", selectedFile.status === 'ready' ? "bg-v12-red" : "bg-v12-orange")} />
                      <span className="text-[10px] font-black uppercase text-v12-gray-400 tracking-widest">Status: {selectedFile.status}</span>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <span className="text-[10px] font-black uppercase text-v12-gray-400 tracking-widest">Neural Model: V12-SONIC-X1</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"><Download size={20} /></button>
                  <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"><Share2 size={20} /></button>
                </div>
              </div>

              {activeTab === 'enhance' && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-v12-red">Enhancement Parameters</h4>
                    <div className="space-y-4">
                      {Object.entries(enhancementOptions).map(([key, val]) => (
                        <button
                          key={key}
                          onClick={() => setEnhancementOptions(prev => ({ ...prev, [key]: !val }))}
                          className={cn(
                            "w-full p-4 rounded-xl border flex items-center justify-between transition-all group",
                            val ? "bg-v12-red/10 border-v12-red/30" : "bg-white/5 border-white/5 hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", val ? "bg-v12-red/20 text-v12-red" : "bg-white/5 text-v12-gray-500")}>
                              {key === 'noiseRemoval' && <Wind size={16} />}
                              {key === 'echoCancellation' && <Waves size={16} />}
                              {key === 'deReverb' && <Activity size={16} />}
                              {key === 'vocalClarity' && <Sparkles size={16} />}
                              {key === 'autoLevel' && <Volume2 size={16} />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                          </div>
                          <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", val ? "border-v12-red bg-v12-red text-white" : "border-white/10")}>
                            {val && <Check size={12} />}
                          </div>
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={handleProcess}
                      disabled={isProcessing}
                      className="w-full py-5 bg-v12-red text-white rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] transition-all disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Processing Signal...
                        </>
                      ) : (
                        <>
                          <Zap size={20} />
                          Apply Neural Enhancement
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-v12-gray-400">Signal Preview</h4>
                    <div className="aspect-video bg-black/60 rounded-2xl border border-white/10 p-8 flex flex-col justify-center gap-8 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2)_0%,transparent_70%)]" />
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-[8px] font-black text-v12-gray-500 uppercase">Input Signal</span>
                        <div className="h-16 flex items-center gap-1">
                          {Array.from({ length: 40 }).map((_, i) => (
                            <div 
                              key={i} 
                              className="flex-1 bg-v12-gray-700 rounded-full"
                              style={{ height: `${Math.random() * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[8px] font-black text-v12-red uppercase">Enhanced Output</span>
                        <div className="h-16 flex items-center gap-1">
                          {Array.from({ length: 40 }).map((_, i) => (
                            <motion.div 
                              key={i} 
                              animate={{ height: [`${Math.random() * 60 + 20}%`, `${Math.random() * 60 + 20}%`] }}
                              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                              className="flex-1 bg-v12-red rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><RotateCcw size={20} /></button>
                        <button className="p-4 bg-v12-red text-white rounded-full shadow-lg"><Play size={24} fill="currentColor" /></button>
                        <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><Settings size={20} /></button>
                      </div>
                    </div>

                    <div className="p-6 bg-v12-orange/10 border border-v12-orange/20 rounded-2xl">
                      <div className="flex items-center gap-3 mb-3">
                        <ShieldCheck className="text-v12-orange" size={20} />
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-v12-orange">Quality Assurance</h5>
                      </div>
                      <p className="text-[10px] font-bold text-v12-gray-400 leading-relaxed uppercase">
                        V12 Neural Engine ensures 100% phase alignment and zero artifacts during enhancement. Your original signal is preserved in the history tab.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analyze' && (
                <div className="space-y-8">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 border-white/10">
                      <h5 className="text-[10px] font-black text-v12-gray-400 uppercase mb-4">Frequency Spectrum</h5>
                      <div className="h-32 flex items-end gap-1">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="flex-1 bg-v12-blue/40 rounded-t-sm"
                            style={{ height: `${Math.sin(i / 3) * 40 + 60}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="glass-card p-6 border-white/10">
                      <h5 className="text-[10px] font-black text-v12-gray-400 uppercase mb-4">Dynamic Range</h5>
                      <div className="h-32 flex items-center justify-center">
                        <Activity size={48} className="text-v12-red animate-pulse" />
                      </div>
                    </div>
                    <div className="glass-card p-6 border-white/10">
                      <h5 className="text-[10px] font-black text-v12-gray-400 uppercase mb-4">Stereo Image</h5>
                      <div className="h-32 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full border-2 border-v12-orange/20 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full border-2 border-v12-orange/40 flex items-center justify-center">
                            <div className="w-4 h-4 bg-v12-orange rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-widest">AI Technical Audit</h4>
                      <button className="text-[10px] font-black text-v12-red uppercase tracking-widest">Regenerate Report</button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                          <span className="text-[10px] font-black text-v12-gray-500 uppercase">Peak Level</span>
                          <span className="text-[10px] font-black text-white uppercase">-0.1 dBTP</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                          <span className="text-[10px] font-black text-v12-gray-500 uppercase">Integrated LUFS</span>
                          <span className="text-[10px] font-black text-white uppercase">-14.2 LUFS</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                          <span className="text-[10px] font-black text-v12-gray-500 uppercase">Sample Rate</span>
                          <span className="text-[10px] font-black text-white uppercase">48.0 kHz</span>
                        </div>
                      </div>
                      <div className="p-4 bg-v12-red/5 border border-v12-red/10 rounded-xl">
                        <h5 className="text-[10px] font-black text-v12-red uppercase mb-2">AI Recommendation</h5>
                        <p className="text-[10px] font-bold text-v12-gray-300 leading-relaxed uppercase">
                          The low-end frequencies (below 100Hz) are slightly cluttered. Recommend a high-pass filter at 85Hz. Vocal presence can be improved with a 2dB boost at 3.5kHz.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {files.filter(f => f.enhancements.length > 0).map((file) => (
                    <div key={file.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-v12-red/30 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="p-3 bg-v12-red/10 rounded-xl">
                          <FileAudio className="text-v12-red" size={24} />
                        </div>
                        <div>
                          <h4 className="font-black uppercase tracking-widest mb-1">{file.name}</h4>
                          <div className="flex items-center gap-3">
                            {file.enhancements.map((e, i) => (
                              <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-v12-gray-500 uppercase">{e}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] font-black text-white block">READY</span>
                          <span className="text-[8px] font-black text-v12-gray-500 uppercase">2 hours ago</span>
                        </div>
                        <button className="p-2 text-v12-gray-500 hover:text-v12-red transition-all"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-v12-red/10 rounded-full flex items-center justify-center mb-8">
                <FileAudio size={48} className="text-v12-red opacity-20" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Select a file to begin</h3>
              <p className="text-v12-gray-400 font-bold uppercase text-xs max-w-xs mx-auto leading-relaxed">
                Choose an audio recording from the sidebar or upload a new one to start neural processing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-black/60 border-t border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-v12-red animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest text-v12-gray-500">Neural Engine: Online</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-v12-gray-500 uppercase">GPU Acceleration</span>
              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-v12-red" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[8px] font-black text-v12-gray-500 uppercase">Powered by V12 Multimedia Excellence</span>
        </div>
      </div>
    </div>
  );
}
