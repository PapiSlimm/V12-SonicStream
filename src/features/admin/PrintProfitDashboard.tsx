import { useState, useEffect } from 'react';
import { DollarSign, Package, TrendingUp, ShoppingCart, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface PrintStats {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalOrders: number;
}

interface PrintOrder {
  id: string;
  userName: string;
  customeremail: string;
  amountcharged: number;
  profitestimate: number;
  status: string;
  created_at: string;
}

export const PrintProfitDashboard = ({ onBack }: { onBack?: () => void }) => {
  const [stats, setStats] = useState<PrintStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/printing/admin/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentOrders(data.recentOrders);
        }
      } catch (err) {
        console.error('Failed to fetch print stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h2 className="text-3xl font-black uppercase tracking-tight">Print Profits</h2>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
          <span className="text-emerald-400 font-bold text-sm">ZooPrinting Integration Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${stats?.totalRevenue.toFixed(2)}`} 
          icon={DollarSign} 
          color="emerald" 
        />
        <StatCard 
          title="ZooPrinting Cost" 
          value={`$${stats?.totalCost.toFixed(2)}`} 
          icon={Package} 
          color="blue" 
        />
        <StatCard 
          title="Net Profit" 
          value={`$${stats?.totalProfit.toFixed(2)}`} 
          icon={TrendingUp} 
          color="purple" 
        />
        <StatCard 
          title="Total Orders" 
          value={stats?.totalOrders.toString() || '0'} 
          icon={ShoppingCart} 
          color="orange" 
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/5">
          <h3 className="font-bold flex items-center gap-2">
            <Package size={20} className="text-emerald-400" />
            Recent Print Orders
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest border-b border-white/5">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Profit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold">{order.userName}</div>
                    <div className="text-xs text-zinc-500">{order.customeremail}</div>
                  </td>
                  <td className="px-6 py-4 font-bold">${order.amountcharged.toFixed(2)}</td>
                  <td className="px-6 py-4 text-emerald-400 font-bold">+${order.profitestimate.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      order.status === 'pending' ? 'bg-orange-500/10 text-orange-400' :
                      order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500">
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">
                    No print orders found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
  const colors: any = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`p-6 rounded-3xl border ${colors[color]} backdrop-blur-xl`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/5 rounded-2xl">
          <Icon size={24} />
        </div>
      </div>
      <div className="text-3xl font-black tracking-tight mb-1">{value}</div>
      <div className="text-xs font-bold uppercase tracking-widest opacity-60">{title}</div>
    </motion.div>
  );
};
