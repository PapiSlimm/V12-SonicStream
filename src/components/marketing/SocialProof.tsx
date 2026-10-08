/**
 * 2026-10-08 REPOSITION — Creator Economic Operating System.
 * Replaced pre-launch placeholder content (invented testimonials, fabricated
 * platform metrics, DSP logo wall) with an honest capability showcase.
 * Real testimonials and real numbers get wired in here after launch.
 */
import { motion } from 'framer-motion';
import { Globe, ShoppingBag, Bot, Ticket, Users, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export const SocialProof = () => {
  const pillars = [
    {
      icon: <Globe size={22} />,
      title: 'Website Builder',
      text: 'A Framer-class site studio with CMS, forms, SEO and one-click publishing — your storefront on your own subdomain.',
    },
    {
      icon: <Bot size={22} />,
      title: 'BST Agents',
      text: 'AI agents that scan your catalog and stock your store with licenses, bundles and merch drafts — you approve, they sell.',
    },
    {
      icon: <ShoppingBag size={22} />,
      title: 'Integrated Commerce',
      text: 'Checkout, memberships, ticketing and printing under one roof — no plugin tax, no stitched-together tools.',
    },
    {
      icon: <Users size={22} />,
      title: 'Fan CRM + Affiliates',
      text: 'Own your audience. Track every fan, reward every referral, and keep the relationship — not rent it.',
    },
    {
      icon: <Sparkles size={22} />,
      title: 'AI Studio',
      text: 'Mastering, artwork, marketing copy and release strategy — a creative department on demand.',
    },
    {
      icon: <Ticket size={22} />,
      title: 'Bookings & Events',
      text: 'Venues, gigs and ticket sales managed next to the catalog they promote.',
    },
  ];

  const commitments = [
    { icon: <ShieldCheck size={18} />, label: 'You keep 100% ownership of your work' },
    { icon: <Zap size={18} />, label: 'Every feature works the day you sign up' },
    { icon: <Users size={18} />, label: 'Built by creators, for creator businesses' },
  ];

  return (
    <div className="space-y-24">
      {/* What's inside — the economic engine */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {pillars.map((p, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -10 }}
            className="p-8 bg-zinc-900/50 border border-white/5 rounded-[40px] space-y-4 relative group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              {p.icon}
            </div>
            <p className="font-bold text-white text-lg">{p.title}</p>
            <p className="text-zinc-400 leading-relaxed text-sm">{p.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Commitments — honest, verifiable claims only */}
      <div className="flex flex-wrap justify-center gap-6 py-12 border-y border-white/5">
        {commitments.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-6 py-3 bg-zinc-900/60 border border-white/5 rounded-full text-sm font-bold text-zinc-300"
          >
            <span className="text-emerald-400">{c.icon}</span>
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
};
