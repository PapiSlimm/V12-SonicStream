import { useState } from 'react';
import { ShoppingCart, DollarSign, Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BandcampDirectSales() {
  const [isProcessing, setIsProcessing] = useState(false);

  const tracks = [
    { id: 1, title: 'Midnight Drive', price: 1.29, artwork: 'https://picsum.photos/seed/midnight/400/400' },
    { id: 2, title: 'Neon Sunset', price: 0.99, artwork: 'https://picsum.photos/seed/neon/400/400' },
    { id: 3, title: 'Urban Echoes', price: 1.99, artwork: 'https://picsum.photos/seed/urban/400/400' },
  ];

  const handlePurchase = async (trackId: number) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/bandcamp/sell-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, price: 1.29 })
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Direct Sales Hub</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2">Keep 85% of every sale • Instant Payouts</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span className="font-black text-emerald-500">$1,240.50</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Revenue</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tracks.map((track, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={track.id} 
            className="bg-zinc-900 rounded-[40px] overflow-hidden border border-white/5 group hover:border-emerald-500/30 transition-all"
          >
            <div className="aspect-square relative overflow-hidden">
              <img src={track.artwork} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button 
                  onClick={() => handlePurchase(track.id)}
                  disabled={isProcessing}
                  className="px-8 py-4 bg-white text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Buy Now
                </button>
              </div>
              <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <span className="font-black text-white">${track.price}</span>
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">{track.title}</h3>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-500 uppercase">MP3</span>
                  <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-500 uppercase">WAV</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <button className="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-700 hover:text-white transition-all flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Share
                </button>
                <button className="flex-1 py-4 bg-zinc-700/10 text-emerald-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-700 hover:text-white transition-all flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-zinc-900 rounded-[48px] p-12 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/5 to-transparent"></div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-xl">
            <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-4">Name Your Price</h3>
            <p className="text-zinc-400 font-medium leading-relaxed">Enable fans to pay more than the suggested price. On average, fans pay 40% more when this feature is enabled.</p>
          </div>
          <button className="px-10 py-5 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20">
            Enable Feature
          </button>
        </div>
      </div>
    </div>
  );
}
