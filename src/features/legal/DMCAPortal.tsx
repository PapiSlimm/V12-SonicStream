import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Mail, FileText, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const DMCAPortal: React.FC = () => {
  const [formData, setFormData] = useState({
    trackTitle: '',
    artistName: '',
    claimantEmail: '',
    reason: '',
    declaration: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ status: string; message: string; takedownCount?: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.declaration) {
      toast.error('You must agree to the declaration.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/legal/dmca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      setResult(data);
      if (data.status === 'processed') {
        toast.success('DMCA Takedown Processed Successfully');
      }
    } catch (err) {
      console.error('DMCA submission error', err);
      toast.error('Portal connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-24 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-rose-500/20">
            <Shield size={14} />
            Legal & Compliance Hub
          </div>
          <h1 className="text-6xl font-black tracking-tighter uppercase leading-[0.85]">
            Copyright <br />
            <span className="text-rose-500">Protection.</span>
          </h1>
          <p className="text-zinc-400 text-xl max-w-2xl font-medium">
            Shielding the platform under DMCA Safe Harbor. Our automated V12 engine processes claims at high velocity to protect intellectual property.
          </p>
        </header>

        {result ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-12 rounded-[40px] border ${result.status === 'processed' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-900 border-white/5'} space-y-6`}
          >
            {result.status === 'processed' ? (
              <CheckCircle className="text-emerald-500" size={48} />
            ) : (
              <AlertTriangle className="text-zinc-500" size={48} />
            )}
            <h2 className="text-3xl font-black tracking-tight uppercase">Claim Outcome: {result.status}</h2>
            <p className="text-zinc-400 text-lg">{result.message}</p>
            {result.takedownCount && result.takedownCount > 0 && (
              <div className="inline-block px-4 py-2 bg-zinc-700 text-white text-xs font-black rounded-lg uppercase">
                {result.takedownCount} Artifacts Removed
              </div>
            )}
            <button 
              onClick={() => setResult(null)}
              className="block pt-8 text-white font-black uppercase text-xs hover:underline flex items-center gap-2"
            >
              Submit Another Claim <ArrowRight size={14} />
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8 bg-zinc-900/50 backdrop-blur-3xl p-12 rounded-[60px] border border-white/5">
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <FileText className="text-rose-500" />
                Submit Takedown Notice
              </h3>
              <p className="text-zinc-500 text-sm">Automated removal will occur if the metadata exactly matches active platform artifacts.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-2">Track Title</label>
              <input 
                required
                className="w-full h-16 bg-black border border-white/10 rounded-2xl px-6 text-white outline-none focus:border-rose-500/50 transition-colors"
                placeholder="The Artifact Name"
                value={formData.trackTitle}
                onChange={e => setFormData({...formData, trackTitle: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-2">Artist Name</label>
              <input 
                required
                className="w-full h-16 bg-black border border-white/10 rounded-2xl px-6 text-white outline-none focus:border-rose-500/50 transition-colors"
                placeholder="Attributed Creator"
                value={formData.artistName}
                onChange={e => setFormData({...formData, artistName: e.target.value})}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-2">Claimant Contact Email</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  required
                  type="email"
                  className="w-full h-16 bg-black border border-white/10 rounded-2xl pl-16 pr-6 text-white outline-none focus:border-rose-500/50 transition-colors"
                  placeholder="legal@rightscloud.com"
                  value={formData.claimantEmail}
                  onChange={e => setFormData({...formData, claimantEmail: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-2">Basis for Claim</label>
              <textarea 
                required
                className="w-full h-40 bg-black border border-white/10 rounded-3xl p-6 text-white outline-none focus:border-rose-500/50 transition-colors resize-none"
                placeholder="Detail the infringement or copyright violation..."
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
              />
            </div>

            <div className="md:col-span-2 flex items-start gap-4 p-6 bg-rose-500/5 rounded-3xl border border-rose-500/10">
              <input 
                type="checkbox" 
                className="mt-1 w-5 h-5 rounded-lg accent-rose-500"
                checked={formData.declaration}
                onChange={e => setFormData({...formData, declaration: e.target.checked})}
              />
              <p className="text-xs text-zinc-400 leading-relaxed">
                I declare under penalty of perjury that I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law. I am directed to act on behalf of the owner of an exclusive right that is allegedly infringed.
              </p>
            </div>

            <button 
              disabled={isSubmitting}
              className="md:col-span-2 h-20 bg-white text-black rounded-[28px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Shield size={20} />
                  Initiate Takedown Engine
                </>
              )}
            </button>
          </form>
        )}

        <footer className="pt-24 border-t border-white/5 flex flex-col md:flex-row justify-between gap-12">
          <div className="space-y-4">
             <div className="text-xl font-black uppercase">SonicStream Compliance</div>
             <p className="text-zinc-600 text-sm max-w-sm">
               Automated takedown requests are processed instantly by our ingestion firewall and distribution perimeter.
             </p>
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
                <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer transition-colors">GDPR</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Resources</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="hover:text-white cursor-pointer transition-colors">Appeal Process</li>
                <li className="hover:text-white cursor-pointer transition-colors">Counter-Notice</li>
                <li className="hover:text-white cursor-pointer transition-colors">Trust Center</li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
