import { motion } from 'framer-motion';
import { Shield, Scale, FileText } from 'lucide-react';

export const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-black text-white py-24 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <Scale size={12} />
            Legal Agreement
          </div>
          <h1 className="text-6xl font-black uppercase tracking-tighter">Terms of Service</h1>
          <p className="text-zinc-400">Last updated: March 13, 2026</p>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-emerald max-w-none bg-zinc-900/50 border border-white/5 p-12 rounded-[40px] space-y-8"
        >
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <FileText className="text-emerald-500" size={24} />
              1. Acceptance of Terms
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              By accessing or using SonicStream, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. SonicStream provides a platform for music streaming, artist management, and event booking.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Shield className="text-emerald-500" size={24} />
              2. User Accounts & Verification
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              To access certain features, you must register for an account. Artists are required to undergo a verification process, which may include providing government-issued identification and linking social media accounts to ensure copyright protection and platform integrity.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Scale className="text-emerald-500" size={24} />
              3. Intellectual Property
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Artists retain ownership of the music they upload. By uploading content, you grant SonicStream a non-exclusive, worldwide license to stream and distribute your content as part of our service. You represent and warrant that you own or have the necessary rights to all content you upload.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Scale className="text-emerald-500" size={24} />
              4. Payments & Royalties
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              SonicStream processes payments through third-party providers like Stripe. Royalties are calculated based on stream counts and subscription revenue. We reserve the right to withhold payments in cases of suspected fraud or copyright infringement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Scale className="text-emerald-500" size={24} />
              5. Prohibited Conduct
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Users may not upload copyrighted material they do not own, use automated systems to inflate stream counts, or engage in any activity that harms the platform or other users.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
};
