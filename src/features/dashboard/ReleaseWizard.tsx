import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Image as ImageIcon, 
  Globe, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle,
  ShieldCheck,
  Disc,
  Layout
} from 'lucide-react';
import { ReleaseType } from '../../types';

interface ReleaseData {
  title: string;
  type: ReleaseType;
  artistName: string;
  genre: string;
  label: string;
  releaseDate: string;
  artwork?: File;
  tracks: Array<{
    title: string;
    file?: File;
    explicit: boolean;
    isrc?: string;
  }>;
}

export const ReleaseWizard = ({ onClose, onComplete }: { onClose: () => void, onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ReleaseData>({
    title: '',
    type: ReleaseType.SINGLE,
    artistName: '',
    genre: '',
    label: 'SonicStream Independent',
    releaseDate: new Date().toISOString().split('T')[0],
    tracks: [{ title: '', explicit: false }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 1, label: 'Details', icon: Disc, description: 'Basic campaign & storefront info' },
    { id: 2, label: 'Storefront', icon: ImageIcon, description: 'Hero banner & media list' },
    { id: 3, label: 'Channels', icon: Globe, description: 'Sync platforms & links' },
    { id: 4, label: 'Activate', icon: ShieldCheck, description: 'Final validation' }
  ];

  const handleNext = () => setStep(s => Math.min(s + 1, steps.length));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create Release
      const response = await fetch('/api/distribution/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          type: data.type,
          genre: data.genre,
          label: data.label || 'Creator OS Store',
          releaseDate: data.releaseDate
        })
      });
      const release = await response.json();

      // 2. Start Pipeline
      await fetch(`/api/distribution/releases/${release.id}/distribute`, {
        method: 'POST'
      });

      onComplete();
    } catch (err) {
      console.error(err);
      alert('Failed to launch campaign. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-[#151619] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[80vh]"
      >
        {/* Header - Technical Rail */}
        <div className="flex items-center justify-between px-8 py-6 bg-zinc-900/50 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400">Campaign Packager v1.0</h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Creator Business Multi-Channel Sync</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white">
            <Zap className="rotate-45" size={20} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar - Steps */}
          <aside className="w-64 border-r border-white/5 p-6 flex flex-col gap-8 bg-black/20">
            {steps.map(s => (
              <div 
                key={s.id}
                className={`flex gap-4 transition-all ${step === s.id ? 'opacity-100 translate-x-1' : 'opacity-40 grayscale'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step === s.id ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                  <s.icon size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{s.label}</span>
                  {step === s.id && <span className="text-[9px] font-bold text-emerald-400/60 ">{s.description}</span>}
                </div>
              </div>
            ))}

            <div className="mt-auto p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <AlertCircle size={12} />
                <span className="text-[8px] font-black uppercase tracking-widest">Compliance Check</span>
              </div>
              <p className="text-[9px] text-zinc-500 leading-relaxed font-bold font-mono">Operations will sync across the global Creator OS storefront network automatically.</p>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight italic">Campaign Details</h3>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Primary Storefront Identity</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Campaign or Store Title</label>
                      <input 
                        type="text" 
                        value={data.title}
                        onChange={e => setData({ ...data, title: e.target.value })}
                        placeholder="E-COMMERCE OR TICKET DROP TITLE"
                        className="w-full bg-[#1c1d21] border border-white/5 rounded-xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-800"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Storefront / Launch Type</label>
                      <select 
                        value={data.type}
                        onChange={e => setData({ ...data, type: e.target.value as ReleaseType })}
                        className="w-full bg-[#1c1d21] border border-white/5 rounded-xl px-6 py-4 text-sm font-bold focus:outline-none transition-all appearance-none uppercase tracking-widest"
                      >
                        <option value={ReleaseType.SINGLE}>Website Builder</option>
                        <option value={ReleaseType.EP}>Merch Drop</option>
                        <option value={ReleaseType.ALBUM}>Ticketing & Events</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Primary Theme Category</label>
                      <input 
                        type="text" 
                        value={data.genre}
                        onChange={e => setData({ ...data, genre: e.target.value })}
                        placeholder="APPAREL / DIGITAL PORTAL / SHOW TICKETS"
                        className="w-full bg-[#1c1d21] border border-white/5 rounded-xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-800"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Target Launch Date</label>
                      <input 
                        type="date" 
                        value={data.releaseDate}
                        onChange={e => setData({ ...data, releaseDate: e.target.value })}
                        className="w-full bg-[#1c1d21] border border-white/5 rounded-xl px-6 py-4 text-sm font-bold focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight italic">Storefront Elements</h3>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Brand Logo, Hero Banner & Store Items</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="aspect-square bg-[#1c1d21] border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-4 hover:border-emerald-500/30 transition-all cursor-pointer group">
                      <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center text-zinc-500 group-hover:bg-zinc-700 group-hover:text-white transition-all">
                        <ImageIcon size={32} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Upload Hero Graphic / Logo</span>
                    </div>

                    <div className="space-y-6">
                      <div className="p-8 bg-[#1c1d21] border border-white/5 rounded-[40px] flex items-center justify-between group hover:border-emerald-500/30 transition-all cursor-pointer">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-emerald-400">
                            <Layout size={24} />
                          </div>
                          <div>
                            <div className="text-xs font-black uppercase tracking-widest">Page & Checkout Theme</div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase">Interactive Grid Theme (Default)</div>
                          </div>
                        </div>
                        <Zap size={16} className="text-zinc-800 group-hover:text-emerald-500" />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Product / Ticket Lines</label>
                        {data.tracks.map((_, i) => (
                          <div key={i} className="flex gap-4 items-center">
                            <span className="text-lg font-black italic text-zinc-800 w-8">0{i+1}</span>
                            <input 
                              type="text" 
                              placeholder="Product Title or Ticket Tier Name"
                              className="flex-1 bg-[#1c1d21] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none"
                            />
                            <button className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-emerald-400 transition-colors">SKU: <span className="opacity-40 italic">AUTO</span></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight italic">Sync Channels</h3>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Activate Store, Site & Social Platforms</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['Custom Website', 'Creator Marketplace', 'Fan Email Circle', 'Ticketing Calendar', 'Print-on-Demand Merch', 'Memberships Portal', 'Affiliate Network', 'AI Ad Marketing', 'Commerce Terminal'].map(store => (
                      <div 
                        key={store}
                        className="p-6 bg-[#1c1d21] border border-white/5 rounded-3xl flex items-center justify-between group hover:border-emerald-500/30 transition-all cursor-pointer"
                      >
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{store}</span>
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-500/20 flex items-center justify-center group-hover:border-emerald-500 transition-all">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  key="step-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-12"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight italic">Launch Campaign Check</h3>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Integrations & Activation Summary</p>
                  </div>

                  <div className="p-8 bg-zinc-700 text-white rounded-[40px] flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center">
                        <CheckCircle size={32} className="text-emerald-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xl font-black uppercase tracking-tight italic">Campaign Launch Ready</div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">SonicStream Business AI has verified connected channels & inventory details.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 text-zinc-500">
                    <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase tracking-widest italic block border-b border-white/5 pb-2">Billing & Mapping Sync</span>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>STRIPE MERCH ID</span>
                          <span className="text-zinc-300">AUTO-SYNCED</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>CONTRACT SKU (x1)</span>
                          <span className="text-zinc-300">AUTO-MAPPED</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase tracking-widest italic block border-b border-white/5 pb-2">Sync Target Summary</span>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>CONNECTED CHANNELS</span>
                          <span className="text-zinc-300">9 ACTIVE PLUGINS</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>SHIPPING TIERS</span>
                          <span className="text-zinc-300">GLOBAL DELIVERY</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Footer - Navigation Rail */}
        <div className="flex items-center justify-between px-12 py-8 bg-[#1c1d21] border-t border-white/5">
          <button 
            onClick={handleBack}
            disabled={step === 1}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${step === 1 ? 'opacity-0' : 'text-zinc-500 hover:text-white'}`}
          >
            <ChevronLeft size={16} /> Back
          </button>
          
          <div className="flex items-center gap-2">
            {steps.map(s => (
              <div 
                key={s.id} 
                className={`w-12 h-1 bg-white/5 rounded-full overflow-hidden`}
              >
                {step >= s.id && <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-emerald-500" />}
              </div>
            ))}
          </div>

          {step === steps.length ? (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-zinc-700 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-600 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Launching...' : 'Launch Campaign'} <Globe size={14} />
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className="bg-white text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-600 transition-all flex items-center gap-2"
            >
              Continue <ChevronRight size={14} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
