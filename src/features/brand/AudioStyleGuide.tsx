import React from 'react';
import { 
  Volume2, 
  Zap, 
  Waves, 
  Play, 
  CheckCircle2, 
  Info
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const AudioStyleGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16 space-y-24">
      <header className="max-w-4xl space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-black uppercase tracking-widest">
          <Zap size={14} fill="currentColor" />
          Brand Identity
        </div>
        <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-none">
          Audio <br />
          <span className="text-emerald-500">Style Guide</span>
        </h1>
        <p className="text-zinc-400 text-xl max-w-2xl leading-relaxed">
          The SonicStream sonic identity is defined by precision, energy, and high-fidelity resonance. Every sound we produce must reflect our commitment to the future of music.
        </p>
      </header>

      {/* Core Principles */}
      <section className="grid md:grid-cols-3 gap-12">
        {[
          { title: 'Clarity', desc: 'Transparent, high-frequency focus with zero distortion.', icon: Volume2, color: 'text-emerald-400' },
          { title: 'Impact', desc: 'Deep, controlled sub-frequencies that command attention.', icon: Zap, color: 'text-purple-400' },
          { title: 'Flow', desc: 'Seamless transitions and organic rhythmic structures.', icon: Waves, color: 'text-blue-400' }
        ].map((p, i) => (
          <div key={i} className="space-y-4 p-8 bg-zinc-900/50 border border-white/5 rounded-[32px]">
            <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center", p.color)}>
              <p.icon size={24} />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">{p.title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </section>

      {/* UI Sound Palette */}
      <section className="space-y-12">
        <div className="space-y-2">
          <h2 className="text-4xl font-black uppercase tracking-tight">UI Sound Palette</h2>
          <p className="text-zinc-500">Functional audio cues for the SonicStream ecosystem.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            { name: 'Success Chime', type: 'Functional', frequency: '2.4kHz', duration: '0.8s', desc: 'A bright, ascending major triad used for completed actions.' },
            { name: 'Error Pulse', type: 'Warning', frequency: '440Hz', duration: '0.4s', desc: 'A muted, low-pass filtered pulse for invalid interactions.' },
            { name: 'Navigation Click', type: 'UI', frequency: '8.2kHz', duration: '0.1s', desc: 'A sharp, transient-heavy "tick" for menu navigation.' },
            { name: 'Notification Bloom', type: 'Alert', frequency: '1.2kHz', duration: '1.5s', desc: 'A soft, evolving pad that fades in to signal new messages.' }
          ].map((s, i) => (
            <div key={i} className="p-8 bg-zinc-900/30 border border-white/5 rounded-[32px] flex items-center justify-between group hover:bg-zinc-900/50 transition-all">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h4 className="text-xl font-bold">{s.name}</h4>
                  <span className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-black uppercase tracking-widest text-zinc-500">{s.type}</span>
                </div>
                <p className="text-xs text-zinc-500 max-w-xs">{s.desc}</p>
                <div className="flex gap-4 pt-2">
                  <div className="text-[10px] font-mono text-emerald-500/60 uppercase">Freq: {s.frequency}</div>
                  <div className="text-[10px] font-mono text-purple-500/60 uppercase">Dur: {s.duration}</div>
                </div>
              </div>
              <button className="w-16 h-16 bg-zinc-700 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-black/20">
                <Play size={24} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Mastering Standards */}
      <section className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <h2 className="text-5xl font-black uppercase tracking-tight leading-none">Mastering <br /> Standards</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="shrink-0 w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mt-1">
                <CheckCircle2 size={14} />
              </div>
              <div className="space-y-1">
                <p className="font-bold">Loudness Target</p>
                <p className="text-sm text-zinc-500">-14 LUFS integrated with a true peak of -1.0 dBTP.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mt-1">
                <CheckCircle2 size={14} />
              </div>
              <div className="space-y-1">
                <p className="font-bold">Sample Rate</p>
                <p className="text-sm text-zinc-500">Minimum 48kHz / 24-bit for all platform assets.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mt-1">
                <CheckCircle2 size={14} />
              </div>
              <div className="space-y-1">
                <p className="font-bold">Stereo Width</p>
                <p className="text-sm text-zinc-500">Phase-coherent mono compatibility required for mobile playback.</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex gap-4">
            <Info className="text-zinc-500 shrink-0" size={20} />
            <p className="text-xs text-zinc-500 leading-relaxed">
              All user-uploaded content is automatically normalized to these standards using our V12 Mastering Engine.
            </p>
          </div>
        </div>
        <div className="aspect-square bg-zinc-900 rounded-[64px] border border-white/5 p-12 flex flex-col justify-center gap-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
          </div>
          <div className="space-y-2 relative">
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <span>Dynamic Range</span>
              <span>12dB</span>
            </div>
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-emerald-500 to-emerald-300" />
            </div>
          </div>
          <div className="space-y-2 relative">
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <span>Frequency Response</span>
              <span>20Hz - 22kHz</span>
            </div>
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-purple-500 to-blue-500" />
            </div>
          </div>
          <div className="space-y-2 relative">
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <span>Phase Correlation</span>
              <span>+0.85</span>
            </div>
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-gradient-to-r from-blue-500 to-cyan-500" />
            </div>
          </div>
        </div>
      </section>

      <footer className="pt-12 border-t border-white/5 text-center">
        <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">© 2026 SonicStream Audio Engineering Division</p>
      </footer>
    </div>
  );
};
