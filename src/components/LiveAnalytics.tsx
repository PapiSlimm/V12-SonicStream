import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, ShieldAlert, Play } from 'lucide-react';

export const LiveAnalytics = () => {
  const [metrics, setMetrics] = useState({
    mrr: 25470,
    proUsers: 1247,
    blockerHits: 87,
    streamsToday: 247000
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        streamsToday: prev.streamsToday + Math.floor(Math.random() * 10),
        blockerHits: prev.blockerHits + (Math.random() > 0.8 ? 1 : 0)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-gradient-to-r from-emerald-500 to-emerald-600">
      <div className="max-w-7xl mx-auto px-6 text-white">
        <h2 className="text-4xl font-black text-center mb-16 uppercase tracking-tighter">
          Live Platform Stats
        </h2>
        
        <div className="grid md:grid-cols-4 gap-8">
          <MetricCard
            title="Monthly Revenue"
            value={`$${metrics.mrr.toLocaleString()}`}
            subtitle="Stripe MRR"
            trend="+12.4%"
            icon={DollarSign}
          />
          <MetricCard
            title="Pro Artists"
            value={metrics.proUsers.toLocaleString()}
            subtitle="Active"
            trend="+87"
            icon={Users}
          />
          <MetricCard
            title="Free → Pro"
            value={`${metrics.blockerHits}/hr`}
            subtitle="Blocker Hits"
            trend="87%"
            icon={ShieldAlert}
          />
          <MetricCard
            title="Streams Today"
            value={metrics.streamsToday.toLocaleString()}
            subtitle="Total"
            trend="+247k"
            icon={Play}
          />
        </div>
      </div>
    </section>
  );
};

const MetricCard = ({ title, value, subtitle, trend, icon: Icon }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white/20 backdrop-blur-xl p-8 rounded-4xl border border-white/30 hover:bg-white/30 transition-all"
  >
    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
      <Icon size={24} />
    </div>
    <div className="text-4xl font-black mb-2">{value}</div>
    <div className="text-lg opacity-80 mb-4">{title}</div>
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold opacity-60">{subtitle}</span>
      <span className="text-emerald-300 font-black">{trend}</span>
    </div>
  </motion.div>
);
