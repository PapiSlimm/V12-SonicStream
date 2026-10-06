import { useState, useEffect } from 'react';
import { Users, TrendingUp, Mail, Gift, Mic, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FanAnalytics() {
  const [fans, setFans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Mock data for fans
    const mockFans = [
      { id: 1, name: 'Alex Rivera', email: 'alex@example.com', lifetimeValue: 150, streams: 1240 },
      { id: 2, name: 'Sarah Chen', email: 'sarah@example.com', lifetimeValue: 85, streams: 890 },
      { id: 3, name: 'Marcus Thorne', email: 'marcus@example.com', lifetimeValue: 210, streams: 2150 },
      { id: 4, name: 'Elena Vance', email: 'elena@example.com', lifetimeValue: 45, streams: 320 },
      { id: 5, name: 'David Kim', email: 'david@example.com', lifetimeValue: 120, streams: 1100 },
    ].sort((a, b) => b.lifetimeValue - a.lifetimeValue);
    
    setTimeout(() => {
      setFans(mockFans);
      setIsLoading(false);
    }, 800);
  }, []);
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Fans */}
        <div className="bg-zinc-900 rounded-[40px] shadow-2xl p-10 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              Top 50 Superfans
            </h3>
            <Users className="w-6 h-6 text-zinc-600" />
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-zinc-800/50 rounded-3xl animate-pulse" />
              ))
            ) : (
              fans.map((fan, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={fan.id} 
                  className="flex items-center justify-between p-6 bg-zinc-800/30 border border-white/5 rounded-3xl hover:bg-zinc-800/50 transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-zinc-700 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-black/10">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-black uppercase tracking-tight text-white">{fan.name}</div>
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{fan.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xl text-emerald-500 tracking-tighter">${fan.lifetimeValue}</div>
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{fan.streams} plays</div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
        
        {/* Heatmap */}
        <div className="bg-zinc-900 rounded-[40px] shadow-2xl p-10 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
              Stream Heatmap
            </h3>
            <MapPin className="w-6 h-6 text-zinc-600" />
          </div>
          <div className="h-[400px] bg-zinc-800/20 rounded-[32px] border border-white/5 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="text-5xl font-black text-emerald-500 mb-4 tracking-tighter">78%</div>
              <div className="text-sm font-black text-white uppercase tracking-[0.2em] mb-2">Peak Engagement</div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">2AM - 4AM Friday</div>
            </div>
            {/* Visual representation of a heatmap grid */}
            <div className="mt-10 grid grid-cols-7 gap-1 opacity-20">
              {Array(49).fill(0).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.7 ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Action Bar */}
        <div className="col-span-full bg-zinc-700 p-10 rounded-[48px] text-white flex flex-wrap items-center justify-between gap-8 shadow-2xl shadow-black/20">
          <div className="max-w-md">
            <h4 className="text-3xl font-black uppercase tracking-tighter mb-2">Engage Your Core</h4>
            <p className="font-bold opacity-80">Directly connect with your most valuable listeners through exclusive campaigns.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-900 transition-all flex items-center gap-3">
              <Mail className="w-5 h-5" />
              Email Top 100
            </button>
            <button className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-100 transition-all flex items-center gap-3">
              <Gift className="w-5 h-5" />
              Exclusive Drop
            </button>
            <button className="px-8 py-4 bg-black/10 border-2 border-black/20 text-black rounded-2xl font-black uppercase tracking-widest hover:bg-black/20 transition-all flex items-center gap-3">
              <Mic className="w-5 h-5" />
              Fan Q&A
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
