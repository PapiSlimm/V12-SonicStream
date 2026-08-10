import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Upload, Link as LinkIcon, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const VerificationForm = () => {
  const [idImage, setIdImage] = useState<string | null>(null);
  const [socialLinks] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success('Verification request submitted!');
    }, 2000);
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-[40px] p-12 text-center space-y-6"
      >
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Request Received</h2>
          <p className="text-zinc-500">Our team will review your identity and social presence. You'll be notified within 48 hours.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Artist Verification</span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter uppercase">Get Verified</h1>
        <p className="text-zinc-500 text-lg">Build trust with your fans and unlock exclusive V12 features by verifying your identity.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-zinc-900/50 border border-white/5 rounded-[40px] p-10">
        {/* ID Upload */}
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Government Issued ID</label>
          <div 
            onClick={() => setIdImage('https://picsum.photos/seed/id/800/600')}
            className="h-48 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group"
          >
            {idImage ? (
              <img src={idImage} className="w-full h-full object-cover rounded-3xl" alt="ID Preview" />
            ) : (
              <>
                <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                  <Upload size={24} className="text-zinc-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">Click to upload ID</p>
                  <p className="text-xs text-zinc-500">Passport, Driver's License, or National ID</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Social Media Presence</label>
          <div className="space-y-3">
            {socialLinks.map((_, i) => (
              <div key={i} className="relative">
                <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="url"
                  placeholder={i === 0 ? "Instagram URL" : "Twitter/X URL"}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  required
                />
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full py-5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-black uppercase tracking-widest text-sm rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-black/20"
        >
          {isSubmitting ? 'Submitting...' : (
            <>
              <Send size={18} />
              Submit for Review
            </>
          )}
        </button>
      </form>
    </div>
  );
};
