import { motion } from 'framer-motion';
import { Shield, Lock, Eye } from 'lucide-react';

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black text-white py-24 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <Shield size={12} />
            Data Protection
          </div>
          <h1 className="text-6xl font-black uppercase tracking-tighter">Privacy Policy</h1>
          <p className="text-zinc-400">Last updated: March 13, 2026</p>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-emerald max-w-none bg-zinc-900/50 border border-white/5 p-12 rounded-[40px] space-y-8"
        >
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Eye className="text-emerald-500" size={24} />
              1. Information We Collect
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              We collect information you provide directly to us, such as when you create an account, upload music, or contact support. This includes your name, email address, payment information (processed securely via Stripe), and identification documents for artist verification.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Lock className="text-emerald-500" size={24} />
              2. How We Use Your Information
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              We use your information to provide and improve our services, process payments, verify artist identities, and personalize your experience (including music recommendations based on your listening habits).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Shield className="text-emerald-500" size={24} />
              3. Data Sharing & Security
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              We do not sell your personal data. We share information with service providers (like Stripe for payments) only as necessary to provide our services. We implement industry-standard security measures to protect your data from unauthorized access.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Lock className="text-emerald-500" size={24} />
              4. Cookies & Tracking
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              We use cookies to maintain your session and remember your preferences. You can control cookie settings through your browser.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Shield className="text-emerald-500" size={24} />
              5. Your Rights
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              You have the right to access, correct, or delete your personal information. You can manage your data through your account settings or by contacting our support team.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
};
