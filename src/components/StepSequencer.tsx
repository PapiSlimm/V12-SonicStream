import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Save, 
  Volume2, 
  Activity, 
  Settings, 
  Trash2, 
  Music, 
  Sliders, 
  Zap,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Instrument {
  id: string;
  name: string;
  type: 'synth' | 'sampler' | 'drum';
  steps: boolean[];
  volume: number;
  pan: number;
  velocity: number[];
  color: string;
  isMuted: boolean;
  isSolo: boolean;
  automation: {
    volume: number[];
    pan: number[];
  };
}

interface Pattern {
  id: string;
  name: string;
  instruments: Instrument[];
  bpm: number;
  stepsCount: number;
}

export function StepSequencer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(128);
  const [stepsCount, setStepsCount] = useState(16);
  const [instruments, setInstruments] = useState<Instrument[]>([
    {
      id: '1',
      name: 'Kick',
      type: 'drum',
      steps: Array(16).fill(false),
      volume: 0.8,
      pan: 0,
      velocity: Array(16).fill(100),
      color: '#ef4444',
      isMuted: false,
      isSolo: false,
      automation: { volume: Array(16).fill(0.8), pan: Array(16).fill(0) }
    },
    {
      id: '2',
      name: 'Snare',
      type: 'drum',
      steps: Array(16).fill(false),
      volume: 0.7,
      pan: 0,
      velocity: Array(16).fill(100),
      color: '#f97316',
      isMuted: false,
      isSolo: false,
      automation: { volume: Array(16).fill(0.7), pan: Array(16).fill(0) }
    },
    {
      id: '3',
      name: 'Hi-Hat',
      type: 'drum',
      steps: Array(16).fill(false),
      volume: 0.6,
      pan: 0.2,
      velocity: Array(16).fill(100),
      color: '#eab308',
      isMuted: false,
      isSolo: false,
      automation: { volume: Array(16).fill(0.6), pan: Array(16).fill(0.2) }
    },
    {
      id: '4',
      name: 'Synth Bass',
      type: 'synth',
      steps: Array(16).fill(false),
      volume: 0.75,
      pan: -0.1,
      velocity: Array(16).fill(100),
      color: '#06b6d4',
      isMuted: false,
      isSolo: false,
      automation: { volume: Array(16).fill(0.75), pan: Array(16).fill(-0.1) }
    }
  ]);

  const [activeAutomation, setActiveAutomation] = useState<{ instId: string, type: 'volume' | 'pan' } | null>(null);
  const [isMidiLearning, setIsMidiLearning] = useState<{ instId: string, stepIdx: number } | null>(null);
  const [savedPatterns, setSavedPatterns] = useState<Pattern[]>([]);
  const [showPatterns, setShowPatterns] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm / 4) * 1000;
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % stepsCount);
      }, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, stepsCount]);

  const toggleStep = (instId: string, stepIdx: number) => {
    setInstruments(prev => prev.map(inst => {
      if (inst.id === instId) {
        const newSteps = [...inst.steps];
        newSteps[stepIdx] = !newSteps[stepIdx];
        return { ...inst, steps: newSteps };
      }
      return inst;
    }));
  };

  const addInstrument = () => {
    const newInst: Instrument = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Synth ${instruments.length + 1}`,
      type: 'synth',
      steps: Array(stepsCount).fill(false),
      volume: 0.7,
      pan: 0,
      velocity: Array(stepsCount).fill(100),
      color: '#8b5cf6',
      isMuted: false,
      isSolo: false,
      automation: { volume: Array(stepsCount).fill(0.7), pan: Array(stepsCount).fill(0) }
    };
    setInstruments([...instruments, newInst]);
  };

  const removeInstrument = (id: string) => {
    setInstruments(instruments.filter(inst => inst.id !== id));
  };

  const savePattern = () => {
    const newPattern: Pattern = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Pattern ${savedPatterns.length + 1}`,
      instruments: JSON.parse(JSON.stringify(instruments)),
      bpm,
      stepsCount
    };
    setSavedPatterns([...savedPatterns, newPattern]);
    alert('Pattern saved successfully!');
  };

  const loadPattern = (pattern: Pattern) => {
    setInstruments(pattern.instruments);
    setBpm(pattern.bpm);
    setStepsCount(pattern.stepsCount);
    setShowPatterns(false);
  };

  const handleMidiLearn = (instId: string, stepIdx: number) => {
    setIsMidiLearning({ instId, stepIdx });
    // Simulate MIDI input after 2 seconds
    setTimeout(() => {
      setInstruments(prev => prev.map(inst => {
        if (inst.id === instId) {
          const newVelocity = [...inst.velocity];
          newVelocity[stepIdx] = Math.floor(Math.random() * 127);
          return { ...inst, velocity: newVelocity };
        }
        return inst;
      }));
      setIsMidiLearning(null);
    }, 2000);
  };

  return (
    <div className="bg-v12-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-v12-blue/40 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-v12-red/20 rounded-lg">
            <Music className="text-v12-red" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">Step Sequencer</h3>
            <p className="text-[10px] text-v12-gray-400 font-bold uppercase tracking-tighter">V12 SonicStream Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="text-[10px] font-black text-v12-gray-400 uppercase">BPM</span>
            <input 
              type="number" 
              value={bpm} 
              onChange={(e) => setBpm(Number(e.target.value))}
              className="bg-transparent w-12 text-center text-sm font-black text-v12-red outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                "p-2 rounded-full transition-all",
                isPlaying ? "bg-v12-red text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-white/10 text-v12-gray-400 hover:bg-white/20"
              )}
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <button 
              onClick={() => setCurrentStep(0)}
              className="p-2 bg-white/10 text-v12-gray-400 rounded-full hover:bg-white/20 transition-all"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <button 
              onClick={savePattern}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Save size={14} />
              Save
            </button>
            <button 
              onClick={() => setShowPatterns(!showPatterns)}
              className="flex items-center gap-2 px-3 py-1.5 bg-v12-red/10 hover:bg-v12-red/20 border border-v12-red/20 rounded-lg text-[10px] font-black text-v12-red uppercase tracking-widest transition-all"
            >
              <Activity size={14} />
              Patterns
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {instruments.map((inst) => (
          <div key={inst.id} className="space-y-2">
            <div className="flex items-center gap-4 group">
              {/* Inst Info */}
              <div className="w-40 flex items-center gap-3">
                <div 
                  className="w-2 h-8 rounded-full" 
                  style={{ backgroundColor: inst.color }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black uppercase tracking-widest truncate">{inst.name}</h4>
                  <div className="flex items-center gap-1">
                    <button className="text-[8px] font-black text-v12-gray-500 hover:text-v12-red uppercase">M</button>
                    <button className="text-[8px] font-black text-v12-gray-500 hover:text-v12-orange uppercase">S</button>
                  </div>
                </div>
                <button 
                  onClick={() => removeInstrument(inst.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-v12-gray-500 hover:text-v12-red transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Steps */}
              <div className="flex-1 grid grid-cols-16 gap-1">
                {inst.steps.map((active, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleStep(inst.id, idx)}
                    className={cn(
                      "h-10 rounded-md border transition-all relative overflow-hidden",
                      active 
                        ? "border-v12-red/50 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]" 
                        : "bg-white/5 border-white/5 hover:bg-white/10",
                      currentStep === idx && "ring-2 ring-white/30 z-10",
                      idx % 4 === 0 && !active && "bg-white/10"
                    )}
                  >
                    {active && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-1 rounded-sm"
                        style={{ backgroundColor: inst.color }}
                      />
                    )}
                    {currentStep === idx && isPlaying && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    )}
                    
                    {/* Velocity Indicator */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-white/10" 
                      style={{ height: `${(inst.velocity[idx] / 127) * 100}%` }}
                    />

                    {/* MIDI Learn Overlay */}
                    {isMidiLearning?.instId === inst.id && isMidiLearning?.stepIdx === idx && (
                      <div className="absolute inset-0 bg-v12-orange/80 flex items-center justify-center">
                        <Zap size={12} className="text-white animate-bounce" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveAutomation(activeAutomation?.instId === inst.id ? null : { instId: inst.id, type: 'volume' })}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    activeAutomation?.instId === inst.id ? "bg-v12-red/20 text-v12-red" : "bg-white/5 text-v12-gray-400 hover:bg-white/10"
                  )}
                >
                  <Sliders size={14} />
                </button>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Volume2 size={10} className="text-v12-gray-500" />
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-v12-red" style={{ width: `${inst.volume * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={10} className="text-v12-gray-500" />
                    <div className="w-16 h-1 bg-white/10 rounded-full relative">
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-v12-orange" 
                        style={{ left: `${(inst.pan + 1) * 50}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Automation Lane */}
            <AnimatePresence>
              {activeAutomation?.instId === inst.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="ml-44 mr-12 p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setActiveAutomation({ instId: inst.id, type: 'volume' })}
                          className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded",
                            activeAutomation.type === 'volume' ? "bg-v12-red text-white" : "text-v12-gray-400 hover:text-white"
                          )}
                        >
                          Volume Automation
                        </button>
                        <button 
                          onClick={() => setActiveAutomation({ instId: inst.id, type: 'pan' })}
                          className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded",
                            activeAutomation.type === 'pan' ? "bg-v12-orange text-white" : "text-v12-gray-400 hover:text-white"
                          )}
                        >
                          Pan Automation
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Cpu size={10} className="text-v12-red" />
                        <span className="text-[8px] font-black text-v12-gray-500 uppercase">AI Optimized Lane</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-16 gap-1 h-12 items-end">
                      {inst.automation[activeAutomation.type].map((val, idx) => (
                        <div key={idx} className="relative group/lane h-full">
                          <input 
                            type="range"
                            min={activeAutomation.type === 'pan' ? -1 : 0}
                            max={1}
                            step={0.01}
                            value={val}
                            onChange={(e) => {
                              const newVal = parseFloat(e.target.value);
                              setInstruments(prev => prev.map(i => {
                                if (i.id === inst.id) {
                                  const newAuto = { ...i.automation };
                                  newAuto[activeAutomation.type][idx] = newVal;
                                  return { ...i, automation: newAuto };
                                }
                                return i;
                              }));
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize z-10"
                          />
                          <div 
                            className={cn(
                              "w-full rounded-t-sm transition-all",
                              activeAutomation.type === 'volume' ? "bg-v12-red/30 group-hover/lane:bg-v12-red/50" : "bg-v12-orange/30 group-hover/lane:bg-v12-orange/50"
                            )}
                            style={{ 
                              height: activeAutomation.type === 'pan' 
                                ? `${((val + 1) / 2) * 100}%` 
                                : `${val * 100}%` 
                            }}
                          />
                          <button 
                            onClick={() => handleMidiLearn(inst.id, idx)}
                            className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/lane:opacity-100 text-[6px] font-black text-v12-gray-500 hover:text-v12-red uppercase"
                          >
                            MIDI
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        <button 
          onClick={addInstrument}
          className="w-full py-4 border-2 border-dashed border-white/5 rounded-xl text-v12-gray-500 hover:text-white hover:border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Add Instrument Slot</span>
        </button>
      </div>

      {/* Pattern Browser Overlay */}
      <AnimatePresence>
        {showPatterns && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 p-8"
          >
            <div className="max-w-2xl mx-auto bg-v12-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tighter">Pattern Library</h3>
                <button onClick={() => setShowPatterns(false)} className="text-v12-gray-400 hover:text-white">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {savedPatterns.length === 0 ? (
                  <div className="col-span-2 py-12 text-center">
                    <Activity size={48} className="text-white/10 mx-auto mb-4" />
                    <p className="text-v12-gray-500 font-bold uppercase text-xs">No patterns saved yet</p>
                  </div>
                ) : (
                  savedPatterns.map((pattern) => (
                    <button
                      key={pattern.id}
                      onClick={() => loadPattern(pattern)}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-v12-red transition-all text-left group"
                    >
                      <h4 className="font-black uppercase tracking-widest mb-1 group-hover:text-v12-red">{pattern.name}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-v12-gray-500 font-bold uppercase">
                        <span>{pattern.instruments.length} Tracks</span>
                        <span>{pattern.bpm} BPM</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Transport */}
      <div className="p-3 bg-black/60 border-t border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-v12-red animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Engine Online</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-v12-gray-500 uppercase">CPU Load</span>
              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-v12-orange" style={{ width: '12%' }} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-v12-gray-500 uppercase">Memory</span>
              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-v12-red" style={{ width: '45%' }} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] font-black text-white block leading-none">{currentStep + 1} / {stepsCount}</span>
            <span className="text-[8px] font-black text-v12-gray-500 uppercase tracking-widest">Current Step</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-v12-gray-500 hover:text-white transition-all">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
