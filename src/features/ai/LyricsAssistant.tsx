import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  PenTool,
  Mic2,
  Heart,
  Zap,
  Flame,
  Cloud,
  Download,
  Sliders,
  Music,
  FileText,
  Layers
} from 'lucide-react';
import { apiFetch } from '../../api/apiFetch';
import { cn } from '../../utils/cn';
import { toast } from '../../components/ui/Toast';

// MIDI Notes Map for Common Chords
const chordToMidiNotes: Record<string, number[]> = {
  'C': [60, 64, 67], 'CM': [60, 64, 67], 'Cmaj': [60, 64, 67], 'Cmajor': [60, 64, 67],
  'Cm': [60, 63, 67], 'Cminor': [60, 63, 67], 'C7': [60, 64, 67, 70],
  'D': [62, 66, 69], 'DM': [62, 66, 69], 'Dmaj': [62, 66, 69],
  'Dm': [62, 65, 69], 'Dminor': [62, 65, 69], 'D7': [62, 66, 69, 72],
  'E': [64, 68, 71], 'EM': [64, 68, 71], 'Emaj': [64, 68, 71],
  'Em': [64, 67, 71], 'Eminor': [64, 67, 71], 'E7': [64, 68, 71, 74],
  'F': [53, 57, 60], 'FM': [53, 57, 60], 'Fmaj': [53, 57, 60],
  'Fm': [53, 56, 60], 'Fminor': [53, 56, 60], 'F7': [53, 57, 60, 63],
  'G': [55, 59, 62], 'GM': [55, 59, 62], 'Gmaj': [55, 59, 62],
  'Gm': [55, 58, 62], 'Gminor': [55, 58, 62], 'G7': [55, 59, 62, 65],
  'A': [57, 61, 64], 'AM': [57, 61, 64], 'Amaj': [57, 61, 64],
  'Am': [57, 60, 64], 'Aminor': [57, 60, 64], 'A7': [57, 61, 64, 67],
  'B': [59, 63, 66], 'BM': [59, 63, 66], 'Bmaj': [59, 63, 66],
  'Bm': [59, 62, 66], 'Bminor': [59, 62, 66], 'B7': [59, 63, 66, 69],
  'Bb': [58, 62, 65], 'Bbm': [58, 61, 65],
  'Eb': [63, 67, 70], 'Ebm': [63, 66, 70],
  'Ab': [56, 60, 63], 'Abm': [56, 59, 63],
  'Db': [61, 65, 68], 'Dbm': [61, 64, 68],
};

interface CompositionData {
  lyrics: string;
  chords: string[];
  chordsText: string;
  melody: string;
  bpm: number;
}

export const LyricsAssistant = () => {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('Pop');
  const [mood, setMood] = useState('Happy');
  const [complexity, setComplexity] = useState('Simple'); // Simple, Intermediate, Complex
  const [outputType, setOutputType] = useState('both'); // lyrics, chords_melody, both
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [composition, setComposition] = useState<CompositionData | null>(null);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'chords' | 'melody'>('lyrics');
  const [copied, setCopied] = useState(false);

  const genres = ['Pop', 'Hip Hop', 'Rock', 'R&B', 'Electronic', 'Jazz', 'Country', 'Metal', 'Reggae', 'Southern Soul'];
  
  const moods = [
    { id: 'Happy', icon: Sparkles, color: 'text-yellow-400' },
    { id: 'Sad', icon: Cloud, color: 'text-blue-400' },
    { id: 'Energetic', icon: Zap, color: 'text-emerald-400' },
    { id: 'Romantic', icon: Heart, color: 'text-pink-400' },
    { id: 'Aggressive', icon: Flame, color: 'text-red-400' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe a theme or story first!');
      return;
    }
    
    setIsGenerating(true);
    try {
      const parsed = await apiFetch<CompositionData>('/api/ai/generate-songwriting', {
        method: 'POST',
        body: JSON.stringify({ prompt, genre, mood, complexity, outputType })
      });

      setComposition(parsed);
      
      // Auto switch tabs to match output selection
      if (outputType === 'chords_melody') {
        setActiveTab('chords');
      } else {
        setActiveTab('lyrics');
      }

      toast.success('AI Songwriting Composition compiled!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!composition) return;
    let textToCopy = '';
    if (activeTab === 'lyrics') textToCopy = composition.lyrics;
    else if (activeTab === 'chords') textToCopy = composition.chordsText;
    else textToCopy = composition.melody;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  // MIDI Compiler Trigger
  const handleExportMidi = () => {
    if (!composition || !composition.chords || composition.chords.length === 0) {
      toast.error('No chord progression found to export as MIDI!');
      return;
    }

    try {
      // Create simple standard midi file with chords
      const header = [
        0x4D, 0x54, 0x68, 0x64, // "MThd"
        0x00, 0x00, 0x00, 0x06, // Block size
        0x00, 0x00,             // SMF Format 0
        0x00, 0x01,             // 1 Track
        0x00, 0x60,             // Ticks (96)
      ];

      const trackEvents: number[] = [];
      
      // Meta tempo: BPM calculation
      const useBPM = composition.bpm || 120;
      const microsPerBeat = Math.round(60000000 / useBPM);
      trackEvents.push(
        0x00, 0xFF, 0x51, 0x03,
        (microsPerBeat >> 16) & 0xFF,
        (microsPerBeat >> 8) & 0xFF,
        microsPerBeat & 0xFF
      );

      // Play chords for 2 beats (192 ticks)
      composition.chords.forEach((chordName) => {
        const cleanName = chordName.replace(/[^a-zA-Z0-9#b]/g, '').trim();
        const notes = chordToMidiNotes[cleanName] || [60, 64, 67]; // C major fallback

        // Note Ons
        notes.forEach((note) => {
          trackEvents.push(0x00); // delta-time 0
          trackEvents.push(0x90, note, 0x55); // 0x55 velocity
        });

        // Note Offs after 2 beats duration (192 ticks)
        notes.forEach((note, index) => {
          if (index === 0) {
            // Ticks count 192 variable-length code -> 0x81, 0x40
            trackEvents.push(0x81, 0x40);
          } else {
            trackEvents.push(0x00);
          }
          trackEvents.push(0x80, note, 0x00);
        });
      });

      // Meta End of Track
      trackEvents.push(0x00, 0xFF, 0x2F, 0x00);

      const trackHeader = [0x4D, 0x54, 0x72, 0x6B]; // "MTrk"
      const length = trackEvents.length;
      trackHeader.push(
        (length >> 24) & 0xFF,
        (length >> 16) & 0xFF,
        (length >> 8) & 0xFF,
        length & 0xFF
      );

      const midiBytes = new Uint8Array([...header, ...trackHeader, ...trackEvents]);
      const blob = new Blob([midiBytes], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SonicStream_${genre}_${complexity}_Progression.mid`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Successfully compiled Chord Progression to standard MIDI (.mid) file!');
    } catch (e) {
      console.error(e);
      toast.error('Could not compile MIDI file.');
    }
  };

  const handleExportChordChart = () => {
    if (!composition) return;
    const body = `SonicStream Songwriter Studio\nGenre: ${genre} | Mood: ${mood} | Complexity: ${complexity}\nTempo: ${composition.bpm} BPM\n\nCHORD PROGRESSIONS CHART\n==================================\n${composition.chordsText}\n\nLYRICS SHEET\n==================================\n${composition.lyrics}`;
    const blob = new Blob([body], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SonicStream_${genre}_Chord_Chart.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Exported styled Chord Chart as plain-text file!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Left controls side */}
      <div className="space-y-8 bg-zinc-950/30 p-8 border border-white/5 rounded-3xl backdrop-blur-xl">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <PenTool size={20} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">Co-Writer Studio Suite</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight uppercase italic leading-none">
            AI Lyrics & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Chord Engine</span>
          </h2>
          <p className="text-zinc-500 text-sm font-medium">Break through production hurdles. Synthesize fully detailed lyrics, chord maps, and melody sheets instantly.</p>
        </div>

        <div className="space-y-6">
          {/* Main Prompt */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest space-x-1 flex justify-between">
              <span>Song Theme or Concept Narrative</span>
              <span className="text-zinc-600">required</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A reflective acoustic song about driving down empty midnight highways seeking a clean break..."
              className="w-full h-32 bg-black/60 border border-white/5 rounded-2xl p-6 text-white placeholder:text-zinc-700 font-sans focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Genre selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Style Genre</label>
              <select 
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer font-bold"
              >
                {genres.map(g => <option key={g} value={g} className="bg-zinc-950 text-white">{g}</option>)}
              </select>
            </div>

            {/* Harmony Complexity selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Chords Complexity</label>
              <select 
                value={complexity}
                onChange={(e) => setComplexity(e.target.value)}
                className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer font-bold"
              >
                <option value="Simple" className="bg-zinc-950 text-white">Simple (3-4 basic triads)</option>
                <option value="Intermediate" className="bg-zinc-950 text-white">Intermediate (7ths & scale steps)</option>
                <option value="Complex" className="bg-zinc-950 text-white">Complex / Jazz (9th/11ths & modulations)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Output Type selector */}
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Generation Mode</label>
              <div className="flex bg-black/60 p-1 rounded-xl border border-white/5 gap-1">
                {[
                  { id: 'both', label: 'Lyrics + Chords & Melody' },
                  { id: 'lyrics', label: 'Lyrics Only' },
                  { id: 'chords_melody', label: 'Chords & Melody Only' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setOutputType(type.id)}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all",
                      outputType === type.id 
                        ? "bg-zinc-700 text-white shadow" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mood selection row */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mood Intensity</label>
            <div className="grid grid-cols-5 gap-2">
              {moods.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5",
                    mood === m.id 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-black/60 border-white/5 text-zinc-500 hover:border-white/10"
                  )}
                  title={m.id}
                >
                  <m.icon size={18} className={cn(mood === m.id ? "text-emerald-400" : "text-zinc-500")} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{m.id}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 transition-all shadow-xl shadow-black/10"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                AISynth is Composing Chords...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Composition
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Studio Notebook workspace */}
      <div className="bg-zinc-900/30 rounded-[40px] border border-white/5 flex flex-col relative overflow-hidden min-h-[550px] shadow-3xl">
        {/* Workspace Tab Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <Mic2 size={16} className="text-emerald-400 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300">Studio Notebook</h3>
          </div>
          
          {composition && (
            <div className="flex items-center gap-1.5 bg-black/60 p-1 border border-white/5 rounded-xl">
              <button 
                onClick={() => setActiveTab('lyrics')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1",
                  activeTab === 'lyrics' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                )}
              >
                <FileText size={10} />
                Lyrics
              </button>
              <button 
                onClick={() => setActiveTab('chords')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1",
                  activeTab === 'chords' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                )}
              >
                <Sliders size={10} />
                Chords Chart
              </button>
              <button 
                onClick={() => setActiveTab('melody')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1",
                  activeTab === 'melody' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"
                )}
              >
                <Music size={10} />
                Melody Ideas
              </button>
            </div>
          )}
        </div>

        {/* Floating actions section */}
        {composition && (
          <div className="p-4 px-6 border-b border-white/5 flex items-center justify-between bg-black/30 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
              <span className="px-2 py-0.5 border border-white/5 bg-white/5 rounded text-emerald-400 font-mono font-black">{composition.bpm} BPM</span>
              <span>• Style: {genre}</span>
              <span>• Complexity: {complexity}</span>
            </div>
            
            <div className="flex gap-2.5">
              {activeTab === 'chords' && (
                <button
                  onClick={handleExportMidi}
                  className="px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-lg"
                  title="Export raw parsed chord sequence to a standard MIDI file."
                >
                  <Download size={12} />
                  Export MIDI File
                </button>
              )}
              
              <button
                onClick={handleExportChordChart}
                className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-lg"
                title="Download whole package as styling chart file."
              >
                <Download size={12} />
                Export Chart (.txt)
              </button>

              <button 
                onClick={copyToClipboard}
                className="p-2 hover:bg-white/5 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all border border-white/5"
                title="Copy Active Tab Content"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {composition ? (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-none text-zinc-300"
              >
                {activeTab === 'lyrics' && (
                  <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-zinc-300 italic">
                    {composition.lyrics || 'No lyrics requested in this generation mode.'}
                  </div>
                )}

                {activeTab === 'chords' && (
                  <div className="space-y-6">
                    <div className="bg-black/40 border border-white/5 p-6 rounded-2xl font-mono text-emerald-400 space-y-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pb-2 border-b border-white/5">Auto-detected Progression Symbols</div>
                      <div className="flex flex-wrap gap-2">
                        {composition.chords && composition.chords.length > 0 ? (
                          composition.chords.map((chord, index) => (
                            <span key={index} className="px-3.5 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-sm font-black tracking-wider text-emerald-400">
                              {chord}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-600 italic">No exact sequence codes generated.</span>
                        )}
                      </div>
                    </div>

                    <div className="whitespace-pre-line font-mono text-sm leading-relaxed bg-black/20 p-6 rounded-2xl border border-white/5 text-zinc-400">
                      {composition.chordsText}
                    </div>
                  </div>
                )}

                {activeTab === 'melody' && (
                  <div className="space-y-6 font-sans">
                    <div className="bg-zinc-500/5 border border-white/5 p-6 rounded-2xl text-sm leading-relaxed text-zinc-400">
                      <div className="font-bold text-zinc-300 mb-2 uppercase tracking-wide">Synthesized Melody Sequence Breakdown</div>
                      <p>{composition.melody}</p>
                    </div>

                    <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-xs">
                      <div className="font-bold text-emerald-400 mb-2 uppercase tracking-wide">Producer Tip: Integration Playback</div>
                      Make sure to route the compiled MIDI file directly to an analog synth plugin (like Diva or Serum) with the rate set to <span className="font-bold underline">{composition.bpm || 115} BPM</span> under four-four timing for professional sound replication.
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16"
              >
                <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600 border border-white/5">
                  <Layers size={32} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-400">Composition Workspace Empty</p>
                  <p className="text-xs text-zinc-600">Enter a concept and select your harmonic settings on the left to start.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isGenerating && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-10">
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [12, 36, 12] }}
                    transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                    className="w-1.5 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full"
                  />
                ))}
              </div>
              <p className="text-emerald-400 font-black text-xs tracking-widest uppercase animate-pulse">Neural Synthesizer holds... composing full track sheet...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
