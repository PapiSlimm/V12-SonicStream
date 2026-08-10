import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Layout, 
  FileText, 
  Zap, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Monitor
} from 'lucide-react';
import { useAuthStore } from '../store/useStore.ts';
import { cn } from '../lib/utils.ts';

interface StoryboardItem {
  frame: number;
  visuals: string;
  audio: string;
  mood: string;
}

interface AIConcept {
  storyboard: StoryboardItem[];
  scriptConcept: string;
  v12StyleNotes: string;
}

interface BriefIntelligenceProps {
  onSave: (concept: AIConcept) => void;
  initialGoals?: string;
}

export function BriefIntelligence({ onSave, initialGoals = '' }: BriefIntelligenceProps) {
  const [goals, setGoals] = useState(initialGoals);
  const [audience, setAudience] = useState('');
  const [reference, setReference] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [concept, setConcept] = useState<AIConcept | null>(null);
  const { token } = useAuthStore();

  const generateConcept = async () => {
    if (!goals.trim() || !token) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/intelligence/generate-concept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ goals, targetAudience: audience, visualReference: reference })
      });
      if (response.ok) {
        const data = await response.json();
        setConcept(data);
      }
    } catch (error) {
      console.error('AI Strategy generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="glass-card p-10 border-v12-red/30 bg-v12-red/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-v12-red/10 blur-[100px] -z-10" />
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="text-v12-red animate-pulse" size={24} />
          <h3 className="text-2xl font-black uppercase tracking-tighter">Strategic Intelligence</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Core Objectives</label>
            <textarea 
              rows={4}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-bold focus:border-v12-red outline-none transition-all uppercase tracking-tighter"
              placeholder="WHAT IS THE PRIMARY MISSION OF THIS PROJECT?"
            />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Target Audience</label>
              <input 
                type="text" 
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-bold focus:border-v12-red outline-none transition-all uppercase tracking-tighter"
                placeholder="WHO ARE WE CAPTURING?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Visual Reference</label>
              <input 
                type="text" 
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-bold focus:border-v12-red outline-none transition-all uppercase tracking-tighter"
                placeholder="STYLE: CYBERPUNK, BRUTALIST, MINIMAL?"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={generateConcept}
          disabled={isGenerating || !goals.trim()}
          className="btn btn-primary w-full py-5 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(239,68,68,0.2)]"
        >
          {isGenerating ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              CONSTRUCTING STRATEGY...
            </>
          ) : (
            <>
              <Zap size={20} />
              GENERATE STORYBOARD & SCRIPT
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {concept && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="space-y-12"
          >
            {/* Storyboard Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {concept.storyboard.map((frame, index) => (
                <div key={index} className="glass-card group hover:border-v12-red/50 transition-all">
                  <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
                    <span className="text-[10px] font-black text-v12-red">FRAME 0{frame.frame}</span>
                    <span className="text-[8px] font-black text-v12-gray-500 uppercase">{frame.mood}</span>
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[8px] font-black text-v12-gray-500 uppercase tracking-widest">
                        <Monitor size={10} />
                        Visual Direction
                      </div>
                      <p className="text-sm font-bold text-white uppercase leading-tight">{frame.visuals}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[8px] font-black text-v12-gray-500 uppercase tracking-widest">
                        <Zap size={10} />
                        Audio Treatment
                      </div>
                      <p className="text-xs font-bold text-v12-silver uppercase italic">{frame.audio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Script & Style */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="glass-card p-10 border-white/10">
                <h4 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                  <FileText className="text-v12-red" />
                  Script Narrative
                </h4>
                <p className="text-v12-silver font-bold uppercase text-sm leading-relaxed whitespace-pre-line">
                  {concept.scriptConcept}
                </p>
              </div>
              <div className="glass-card p-10 border-v12-orange/20 bg-v12-orange/5">
                <h4 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                  <Sparkles className="text-v12-orange" />
                  V12 Engineering Notes
                </h4>
                <p className="text-v12-silver font-bold uppercase text-sm leading-relaxed">
                  {concept.v12StyleNotes}
                </p>
                <div className="mt-8 p-6 bg-black/40 border border-v12-orange/20 rounded-xl">
                  <div className="text-[10px] font-black text-v12-orange uppercase mb-2">Automated Production Check</div>
                  <p className="text-[10px] font-black text-v12-gray-500 leading-relaxed uppercase">
                    This concept utilizes V12's signature anamorphic lens processing and neural noise textures. Estimated production complexity: TIER 2.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => onSave(concept)}
                className="btn btn-primary px-16 py-6 text-xl font-black tracking-tighter uppercase shadow-[0_0_50px_rgba(239,68,68,0.4)]"
              >
                ATTACH CONCEPT TO BRIEF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
