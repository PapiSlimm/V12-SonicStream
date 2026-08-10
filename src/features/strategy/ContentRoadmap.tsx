import { motion } from 'framer-motion';
import { Target, Rocket, Users, Zap, Globe } from 'lucide-react';

export const ContentRoadmap = () => {
  const phases = [
    {
      title: "Phase 1: Foundation & Onboarding",
      icon: Target,
      color: "emerald",
      items: [
        "Artist Identity: Verified profiles with rich metadata (ISRC, UPC).",
        "Seamless Onboarding: Multi-step wizard for artists and listeners.",
        "Secure Infrastructure: Stripe integration for print and digital sales.",
        "Mobile Optimization: iOS/Safari audio context unlock and responsive UI."
      ]
    },
    {
      title: "Phase 2: Distribution & Growth",
      icon: Rocket,
      color: "purple",
      items: [
        "Global Distribution: Automated delivery to Spotify, Apple Music, and other global stores.",
        "Monetization: Flexible pricing models for tracks and physical merchandise.",
        "AI-Powered Insights: Mood analysis, BPM detection, and smart recommendations.",
        "Community Building: Follow systems and social sharing integrations."
      ]
    },
    {
      title: "Phase 3: Engagement & Scaling",
      icon: Users,
      color: "blue",
      items: [
        "Live Events: Integrated booking system for artists and venues.",
        "Advanced Analytics: Real-time streaming data and royalty tracking.",
        "Creative Tools: AI music video generation and beat-sync visualizations.",
        "Global Expansion: Multi-currency support and localized content strategies."
      ]
    }
  ];

  return (
    <div className="space-y-16 py-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-purple-500 bg-clip-text text-transparent tracking-tighter">
          SonicStream V12 Roadmap
        </h1>
        <p className="text-xl text-zinc-400">
          A purpose-driven entertainment platform for independent artists and creators.
        </p>
      </div>

      <div className="grid gap-8">
        {phases.map((phase, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="bg-zinc-900/40 border border-white/10 rounded-[40px] p-10 flex flex-col md:flex-row gap-10 items-start"
          >
            <div className={`w-20 h-20 bg-${phase.color}-500/20 rounded-3xl flex items-center justify-center shrink-0`}>
              <phase.icon className={`w-10 h-10 text-${phase.color}-500`} />
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-white">{phase.title}</h2>
              <ul className="grid md:grid-cols-2 gap-4">
                {phase.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-zinc-400">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[48px] p-12 text-center space-y-8">
        <h2 className="text-4xl font-black text-white">Our Strategic Approach</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
              <Target className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold">Collaborative Concept</h3>
            <p className="text-sm text-zinc-500">Development rooted in strategy, aligning artist vision with market trends.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
              <Zap className="text-purple-500" />
            </div>
            <h3 className="text-xl font-bold">Creative Direction</h3>
            <p className="text-sm text-zinc-500">Bold and brand-aligned visuals that command attention across all platforms.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
              <Rocket className="text-blue-500" />
            </div>
            <h3 className="text-xl font-bold">Efficient Workflows</h3>
            <p className="text-sm text-zinc-500">Production processes designed to save time and budget without compromising quality.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center">
              <Globe className="text-pink-500" />
            </div>
            <h3 className="text-xl font-bold">Cross-Platform</h3>
            <p className="text-sm text-zinc-500">Adaptable content formats to extend lifespan and reach on social media.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-10 bg-zinc-900/50 border border-white/5 rounded-[40px] space-y-6">
          <h3 className="text-2xl font-black uppercase tracking-tight">Content Pillars</h3>
          <div className="space-y-4">
            {[
              { title: 'Artist Spotlights', desc: 'Behind-the-scenes and interviews' },
              { title: 'Sonic Sessions', desc: 'Live performances and studio takes' },
              { title: 'Educational', desc: 'Industry tips for independent creators' },
              { title: 'Community', desc: 'Fan-generated content and challenges' }
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="font-bold text-sm">{p.title}</p>
                  <p className="text-xs text-zinc-500">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-10 bg-zinc-900/50 border border-white/5 rounded-[40px] space-y-6">
          <h3 className="text-2xl font-black uppercase tracking-tight">Publishing Cadence</h3>
          <div className="space-y-4">
            {[
              { title: 'Daily', desc: 'Short-form social content (TikTok, Reels)' },
              { title: 'Weekly', desc: 'Sonic Sessions and Newsletter' },
              { title: 'Monthly', desc: 'Deep-dive artist features and webinars' },
              { title: 'Quarterly', desc: 'Major platform updates and strategy reviews' }
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <div>
                  <p className="font-bold text-sm">{p.title}</p>
                  <p className="text-xs text-zinc-500">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
