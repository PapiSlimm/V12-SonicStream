import { motion } from 'framer-motion';
import { Play, Shield, Zap, BarChart3, Users, Headphones } from 'lucide-react';

export const ProductDemo = () => {
  const features = [
    { title: "Branded Streaming", icon: Headphones, color: "bg-emerald-500" },
    { title: "Monetization", icon: Zap, color: "bg-purple-500" },
    { title: "Distribution", icon: Shield, color: "bg-blue-500" },
    { title: "Live Engagement", icon: Users, color: "bg-cyan-500" }
  ];

  return (
    <div className="space-y-24">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">Show, Not Just Pitch.</h2>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Experience the power of SonicStream V12 in action. Built for the modern creator economy.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-12">
          <div className="grid grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="p-8 bg-zinc-900/50 border border-white/5 rounded-[40px] space-y-6 group cursor-pointer"
              >
                <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center text-black shadow-lg shadow-${f.color.split('-')[1]}-500/20`}>
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-bold">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">Everything you need to grow your brand and audience.</p>
              </motion.div>
            ))}
          </div>
          <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[40px] space-y-6">
            <h3 className="text-2xl font-black uppercase tracking-tight text-emerald-400 italic">Outcome-Based Value</h3>
            <p className="text-zinc-300 text-lg leading-relaxed">
              Instead of just "AI-powered streaming," we deliver **branded streaming, monetization, distribution, and live engagement.** 
              Your platform, your rules, your revenue.
            </p>
          </div>
        </div>

        <div className="relative group">
          <div className="aspect-video bg-black rounded-[48px] border border-white/10 overflow-hidden shadow-2xl relative">
            <img 
              src="https://picsum.photos/seed/product-demo/1200/800" 
              alt="Product Demo" 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                className="w-24 h-24 bg-zinc-700 rounded-full flex items-center justify-center text-white shadow-2xl shadow-black/50"
              >
                <Play size={40} fill="currentColor" />
              </motion.button>
            </div>
            {/* Animated Walkthrough Overlay */}
            <div className="absolute bottom-8 left-8 right-8 p-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Live Analytics</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Real-time tracking</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                ))}
              </div>
            </div>
          </div>
          {/* Floating Screenshots */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            className="absolute -top-10 -right-10 p-6 bg-zinc-800 border border-white/10 rounded-3xl shadow-2xl hidden xl:block max-w-[240px]"
          >
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Distribution Hub</p>
            <div className="h-32 bg-black/40 rounded-2xl border border-white/5 p-4 space-y-3">
              <div className="h-2 bg-emerald-500/20 rounded-full w-3/4" />
              <div className="h-2 bg-emerald-500/20 rounded-full w-1/2" />
              <div className="h-2 bg-emerald-500/20 rounded-full w-2/3" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
