import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Globe, DollarSign, Layers, Share2 } from 'lucide-react';

const features = [
  {
    title: 'Secure Media Uploads',
    description: 'Enterprise-grade encryption for all your raw masters and project files.',
    icon: <Shield size={24} />,
  },
  {
    title: 'Adaptive Streaming',
    description: 'HLS/DASH delivery powered by FFmpeg for seamless playback on any device.',
    icon: <Zap size={24} />,
  },
  {
    title: 'DSP Distribution',
    description: 'One-click delivery to Spotify, Apple Music, YouTube, and TikTok.',
    icon: <Globe size={24} />,
  },
  {
    title: 'Monetization Tools',
    description: 'Integrated Stripe payments for direct-to-fan sales and subscriptions.',
    icon: <DollarSign size={24} />,
  },
  {
    title: 'Royalty Splits',
    description: 'Automated revenue sharing for collaborators and independent labels.',
    icon: <Layers size={24} />,
  },
  {
    title: 'Social Expansion',
    description: 'Built-in tools to maximize your reach across all digital landscapes.',
    icon: <Share2 size={24} />,
  },
];

export function PlatformFeatures() {
  return (
    <section id="platform" className="py-24 px-6 bg-v12-gray-900 text-white border-t border-white/5 relative overflow-hidden">
      {/* Tech Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px]" />
        <motion.div 
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-b from-transparent via-v12-red/20 to-transparent h-20"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-v12-red text-white text-[10px] font-black uppercase tracking-[0.3em] mb-6 logo-glow">
              SONICSTREAM™ ENGINE
            </div>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase mb-8">
              THE FUTURE OF <br /> <span className="text-v12-red">INDEPENDENT</span> <br /> STREAMING
            </h2>
            <p className="text-xl font-bold uppercase mb-12 max-w-lg leading-tight text-v12-gray-400">
              V12 SonicStream is a multimedia platform built for independent creators, artists, podcasters, and businesses. Launch a fully branded streaming experience with support for audio, video, distribution, monetization, live chat, and playback sync.
            </p>
            <p className="text-sm font-medium text-v12-gray-500 mb-12 max-w-lg leading-relaxed">
              The platform also includes AI-powered templates, marketing tools, notifications, and integrations to help you grow your audience and manage your content from one place. Designed for speed, flexibility, and deployment readiness, SonicStream makes it easy to build and run your own streaming destination.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-6 border-2 border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="w-12 h-12 bg-v12-red flex items-center justify-center text-white shrink-0">
                  <Zap size={24} />
                </div>
                <div className="font-black uppercase tracking-tighter">
                  <div className="text-xs opacity-50 text-v12-gray-400">Latency</div>
                  <div className="text-2xl">0.4s Ultra-Low</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-6 border-2 border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="w-12 h-12 bg-v12-gray-800 flex items-center justify-center text-white shrink-0">
                  <Shield size={24} />
                </div>
                <div className="font-black uppercase tracking-tighter">
                  <div className="text-xs opacity-50 text-v12-gray-400">Security</div>
                  <div className="text-2xl">AES-256 Encrypted</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-8 border-2 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-v12-red hover:border-v12-red hover:text-white transition-all duration-300 group"
              >
                <div className="mb-4 text-v12-red group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-black uppercase tracking-tighter mb-2">{feature.title}</h4>
                <p className="text-sm font-bold text-v12-gray-400 group-hover:text-white/80 leading-tight uppercase">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
