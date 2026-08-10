import { motion } from 'framer-motion';
import { HelpCircle, Download, ChevronRight, Play, Map, ShoppingBag, Calendar } from 'lucide-react';
import { APP_NAME } from '../../constants';

export const SupportPage = () => {
  const sections = [
    {
      title: 'Getting Started',
      icon: Play,
      items: [
        { q: 'How do I upload my first track?', a: 'Navigate to your Artist Dashboard and click the "Upload Track" button. We support MP3, WAV, and FLAC formats.' },
        { q: 'What is V12 Mastering?', a: 'Our AI-powered mastering engine that optimizes your tracks for global streaming standards automatically.' },
        { q: 'How do I set up my creator profile?', a: 'Go to Settings > Profile to customize your banner, bio, and social links.' }
      ]
    },
    {
      title: 'Monetization',
      icon: ShoppingBag,
      items: [
        { q: 'How do I sell merch?', a: 'Connect your Print-on-Demand provider in the Marketplace settings to start selling custom apparel.' },
        { q: 'When do I get paid?', a: 'Payouts are processed every 30 days once you reach the $50 minimum threshold.' },
        { q: 'Can I sell digital downloads?', a: 'Yes! You can set a price for any track, and fans can purchase high-quality MP3s directly.' }
      ]
    },
    {
      title: 'Booking & Events',
      icon: Calendar,
      items: [
        { q: 'How does the booking system work?', a: 'Venues can send you booking requests directly through your public profile. You can accept or decline in your dashboard.' },
        { q: 'Can I sell tickets?', a: 'Absolutely. Create an event in your dashboard and set ticket prices. We handle the secure checkout.' }
      ]
    }
  ];

  const handleDownloadManual = () => {
    const manualContent = `
# ${APP_NAME} - Official Creator Manual

## Introduction
Welcome to ${APP_NAME}, the all-in-one platform for indie artists.

## Features
1. Music Streaming (HLS/DASH)
2. AI Mastering (V12 Engine)
3. Print-on-Demand Marketplace
4. Unified Booking System
5. Real-time Analytics

## Sitemap
- / - Landing Page
- /dashboard - Artist Control Center
- /marketplace - Merch & Gear
- /events - Live Performances
- /settings - Profile & Account

© 2026 ${APP_NAME}
    `;
    const blob = new Blob([manualContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${APP_NAME}_Manual.txt`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-24 space-y-24">
      {/* Header */}
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-black uppercase tracking-widest"
        >
          <HelpCircle size={14} />
          Support Center
        </motion.div>
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">
          How can we
          <br />
          <span className="text-zinc-700">help you?</span>
        </h1>
        <div className="flex justify-center gap-4 pt-8">
          <button 
            onClick={handleDownloadManual}
            className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3"
          >
            <Download size={20} />
            Download Manual
          </button>
          <button className="px-8 py-4 bg-zinc-900 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
            Contact Support
          </button>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="grid md:grid-cols-3 gap-12">
        {sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                <section.icon size={24} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">{section.title}</h2>
            </div>
            <div className="space-y-6">
              {section.items.map((item, j) => (
                <div key={j} className="group cursor-pointer">
                  <h3 className="text-white font-bold group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                    {item.q}
                    <ChevronRight size={16} className="text-zinc-700 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-zinc-500 text-sm mt-2 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sitemap Section */}
      <section className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-16">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
            <Map size={24} />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">Platform Sitemap</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Core</h4>
            <ul className="space-y-2 text-sm font-bold text-zinc-400">
              <li className="hover:text-white cursor-pointer transition-colors">Landing Page</li>
              <li className="hover:text-white cursor-pointer transition-colors">Artist Dashboard</li>
              <li className="hover:text-white cursor-pointer transition-colors">Creator Tools</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Commerce</h4>
            <ul className="space-y-2 text-sm font-bold text-zinc-400">
              <li className="hover:text-white cursor-pointer transition-colors">Marketplace</li>
              <li className="hover:text-white cursor-pointer transition-colors">Digital Store</li>
              <li className="hover:text-white cursor-pointer transition-colors">Checkout Flow</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Community</h4>
            <ul className="space-y-2 text-sm font-bold text-zinc-400">
              <li className="hover:text-white cursor-pointer transition-colors">Live Rooms</li>
              <li className="hover:text-white cursor-pointer transition-colors">Artist Profiles</li>
              <li className="hover:text-white cursor-pointer transition-colors">Global Feed</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Legal</h4>
            <ul className="space-y-2 text-sm font-bold text-zinc-400">
              <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              <li className="hover:text-white cursor-pointer transition-colors">Copyright Info</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tutorial Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-white uppercase tracking-tight">Interactive Tutorials</h2>
          <p className="text-zinc-500">Master the platform with our step-by-step guides.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative aspect-video rounded-[40px] overflow-hidden group border border-white/5">
            <img src="https://picsum.photos/seed/tut1/800/450" className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" alt="" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-2xl">
                <Play size={24} fill="black" />
              </div>
            </div>
            <div className="absolute bottom-8 left-8">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Artist Onboarding</h3>
              <p className="text-zinc-400 text-sm">Learn how to set up your profile for success.</p>
            </div>
          </div>
          <div className="relative aspect-video rounded-[40px] overflow-hidden group border border-white/5">
            <img src="https://picsum.photos/seed/tut2/800/450" className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" alt="" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-2xl">
                <Play size={24} fill="black" />
              </div>
            </div>
            <div className="absolute bottom-8 left-8">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Mastering Workflow</h3>
              <p className="text-zinc-400 text-sm">Get the most out of our V12 AI mastering engine.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
