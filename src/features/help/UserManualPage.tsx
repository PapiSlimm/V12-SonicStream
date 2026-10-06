import { Book, Download, ChevronRight, Sparkles, Rocket, DollarSign, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export const UserManualPage = () => {
  const sections = [
    { title: 'Getting Started', icon: Rocket, content: 'Set up your profile and brand identity.' },
    { title: 'Smart Feed', icon: Sparkles, content: 'Understand how our AI surfaces your music.' },
    { title: 'Site Builder', icon: Globe, content: 'Build your professional home on the web.' },
    { title: 'Monetization', icon: DollarSign, content: 'Sell merch, music, and memberships.' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-20 px-8">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 text-emerald-400 mb-4"
          >
            <Book size={40} />
          </motion.div>
          <h1 className="text-6xl font-black tracking-tighter uppercase">User Manual</h1>
          <p className="text-zinc-500 text-xl max-w-2xl mx-auto">
            Master the SonicStream V12 platform and unlock your full potential as a creator.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <button className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-black/20">
              <Download size={18} />
              Download PDF Manual
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-zinc-900/50 border border-white/5 rounded-[32px] hover:bg-zinc-900 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="p-3 bg-white/5 rounded-2xl text-emerald-400 w-fit">
                    <section.icon size={24} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{section.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{section.content}</p>
                </div>
                <ChevronRight className="text-zinc-700 group-hover:text-emerald-500 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed Guide Placeholder */}
        <div className="prose prose-invert max-w-none bg-zinc-900/30 p-12 rounded-[40px] border border-white/5">
          <h2 className="text-3xl font-black uppercase mb-8">Platform Strategy</h2>
          <div className="space-y-8 text-zinc-400">
            <p className="text-lg">
              SonicStream V12 isn't just a tool; it's a business ecosystem. To maximize profitability, you should focus on the **Direct-to-Fan (D2F)** model. By bypassing traditional intermediaries, you retain up to 96% of your revenue.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h4 className="text-white font-black uppercase text-sm tracking-widest">Expansion Strategy</h4>
                <ul className="space-y-2 text-sm list-disc pl-4">
                  <li>Leverage the Smart Feed for organic discovery.</li>
                  <li>Use custom domains to build brand authority.</li>
                  <li>Offer tiered memberships for recurring revenue.</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-white font-black uppercase text-sm tracking-widest">Customer Retention</h4>
                <ul className="space-y-2 text-sm list-disc pl-4">
                  <li>Engage with fans via the integrated CRM.</li>
                  <li>Host exclusive live events with direct ticketing.</li>
                  <li>Optimize release timing using AI insights.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
