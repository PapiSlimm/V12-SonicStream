import { 
  BarChart3, 
  Users, 
  Music, 
  ShoppingBag, 
  Ticket, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const data = [
  { name: 'Mon', streams: 4000, sales: 2400, tickets: 2400 },
  { name: 'Tue', streams: 3000, sales: 1398, tickets: 2210 },
  { name: 'Wed', streams: 2000, sales: 9800, tickets: 2290 },
  { name: 'Thu', streams: 2780, sales: 3908, tickets: 2000 },
  { name: 'Fri', streams: 1890, sales: 4800, tickets: 2181 },
  { name: 'Sat', streams: 2390, sales: 3800, tickets: 2500 },
  { name: 'Sun', streams: 3490, sales: 4300, tickets: 2100 },
];

const revenueSources = [
  { name: 'Streams', value: 4500, color: '#c81e3a' },
  { name: 'Merch', value: 3200, color: '#3b82f6' },
  { name: 'Tickets', value: 2800, color: '#f59e0b' },
  { name: 'Subscriptions', value: 1500, color: '#8b5cf6' },
];

export const UnifiedAnalytics = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <BarChart3 size={24} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">V12 Intelligence</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">Unified Analytics</h1>
            <p className="text-zinc-500 text-xl max-w-2xl">A single view of your entire creative business. Streams, sales, and fan growth combined.</p>
          </div>
          
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
              Last 30 Days
            </button>
            <button className="px-6 py-3 bg-zinc-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-black/20">
              Export Report
            </button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Revenue', value: '$12,450', change: '+12.5%', icon: DollarSign, color: 'text-emerald-400' },
            { label: 'Total Streams', value: '1.2M', change: '+8.2%', icon: Music, color: 'text-blue-400' },
            { label: 'Product Sales', value: '452', change: '+15.1%', icon: ShoppingBag, color: 'text-purple-400' },
            { label: 'Tickets Sold', value: '890', change: '-2.4%', icon: Ticket, color: 'text-orange-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-4">
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-black ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.change.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </div>
              </div>
              <div>
                <div className="text-xs font-black text-zinc-500 uppercase tracking-widest">{stat.label}</div>
                <div className="text-3xl font-black text-white mt-1">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Revenue Chart */}
          <div className="lg:col-span-2 bg-zinc-900 border border-white/5 rounded-[40px] p-10 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase tracking-tight">Performance Overview</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase">Streams</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase">Sales</span>
                </div>
              </div>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c81e3a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c81e3a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="streams" stroke="#c81e3a" strokeWidth={4} fillOpacity={1} fill="url(#colorStreams)" />
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-10 space-y-8">
            <h2 className="text-2xl font-black uppercase tracking-tight">Revenue Mix</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueSources}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }} 
                    dy={10}
                  />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px' }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {revenueSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {revenueSources.map((source, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{source.name}</span>
                  </div>
                  <span className="text-sm font-black text-white">${source.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fan Growth Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                <Users size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">New Fans</div>
                <div className="text-2xl font-black text-white">+2,450</div>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[75%]" />
            </div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">75% of monthly goal reached</p>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                <Zap size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Engagement</div>
                <div className="text-2xl font-black text-white">84.2%</div>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[84%]" />
            </div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Active fan interaction rate</p>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400">
                <Calendar size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Retention</div>
                <div className="text-2xl font-black text-white">92.1%</div>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-[92%]" />
            </div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Monthly subscriber retention</p>
          </div>
        </div>
      </div>
    </div>
  );
};
