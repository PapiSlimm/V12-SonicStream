import { motion } from 'framer-motion';
import { Star, ShieldCheck, Zap, Users, Globe } from 'lucide-react';

export const SocialProof = () => {
  const testimonials = [
    {
      name: "Alex Rivera",
      role: "Electronic Producer",
      text: "SonicStream changed how I release music. The AI mastering is a game-changer for my workflow.",
      avatar: "https://picsum.photos/seed/alex/100/100"
    },
    {
      name: "Sarah Chen",
      role: "Podcast Host",
      text: "The distribution hub is so intuitive. I can reach all platforms with one click and track everything.",
      avatar: "https://picsum.photos/seed/sarah/100/100"
    },
    {
      name: "Marcus Thorne",
      role: "Label Manager",
      text: "V12 is the most robust platform we've used. The analytics are deep and the support is top-notch.",
      avatar: "https://picsum.photos/seed/marcus/100/100"
    }
  ];

  const logos = [
    { name: "Spotify", icon: <Globe size={24} /> },
    { name: "Apple Music", icon: <Zap size={24} /> },
    { name: "Tidal", icon: <Star size={24} /> },
    { name: "Deezer", icon: <ShieldCheck size={24} /> },
    { name: "Amazon Music", icon: <Users size={24} /> }
  ];

  return (
    <div className="space-y-24">
      {/* Logos */}
      <div className="flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all">
        {logos.map((logo, i) => (
          <div key={i} className="flex items-center gap-3 font-black text-xl tracking-tighter">
            {logo.icon}
            {logo.name}
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -10 }}
            className="p-8 bg-zinc-900/50 border border-white/5 rounded-[40px] space-y-6 relative group"
          >
            <div className="flex gap-1 text-emerald-500">
              {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
            </div>
            <p className="text-lg text-zinc-300 italic leading-relaxed">"{t.text}"</p>
            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
              <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full border border-white/10" referrerPolicy="no-referrer" />
              <div>
                <p className="font-bold text-white">{t.name}</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-12 border-y border-white/5">
        {[
          { label: "Active Creators", val: "50K+" },
          { label: "Total Streams", val: "1.2B" },
          { label: "Countries", val: "150+" },
          { label: "Uptime", val: "99.9%" }
        ].map((m, i) => (
          <div key={i} className="text-center space-y-2">
            <p className="text-5xl font-black tracking-tighter text-white">{m.val}</p>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
