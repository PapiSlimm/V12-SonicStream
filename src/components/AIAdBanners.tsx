import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, DollarSign, Music } from 'lucide-react';

const adCategories = [
  { type: 'pro', title: 'Go Pro Unlimited', desc: 'Unlimited uploads & 80/20 splits', icon: Zap, color: 'from-emerald-500 to-emerald-600' },
  { type: 'marketing', title: 'TikTok Campaign', desc: 'Boost your reach by 400%', icon: TrendingUp, color: 'from-purple-600 to-pink-600' },
  { type: 'payout', title: 'Instant Payouts', desc: 'Get paid within 24 hours', icon: DollarSign, color: 'from-blue-500 to-indigo-600' },
  { type: 'distribution', title: 'Global Distribution', desc: '150+ platforms in 1-click', icon: Music, color: 'from-orange-500 to-red-500' }
];

export const AIAdBanners = () => {
  const [currentAd, setCurrentAd] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd(prev => (prev + 1) % adCategories.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const ad = adCategories[currentAd];

  return (
    <div className="relative h-32 rounded-4xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAd}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={`absolute inset-0 bg-gradient-to-r ${ad.color} p-8 flex items-center justify-between`}
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <ad.icon className="text-white" size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-white">{ad.title}</h4>
              <p className="text-white/80 font-medium">{ad.desc}</p>
            </div>
          </div>
          <button className="bg-white text-black px-8 py-3 rounded-2xl font-black hover:scale-105 transition-all">
            Learn More
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
