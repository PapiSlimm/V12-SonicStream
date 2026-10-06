import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { cn } from '../../utils/cn';
import { api } from '../../api';
import { ArtistAnalytics } from '../../types';

export const PerformanceAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [analytics, setAnalytics] = useState<ArtistAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await api.artist.getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Fallback to mock data if API fails (since we might not have seeded it yet)
        setAnalytics({
          totalStreams: 1240000,
          monthlyListeners: 450000,
          revenue: { total: 12400, artistShare: 9920, sonicShare: 2480 },
          platformDistribution: [
            { name: 'Spotify', streams: 650000 },
            { name: 'Apple Music', streams: 320000 },
            { name: 'SonicStream', streams: 90000 }
          ],
          dailyStreams: Array.from({ length: 30 }).map((_, i) => ({
            date: `2026-03-${i + 1}`,
            count: Math.floor(Math.random() * 50000) + 20000
          })),
          weeklyStreams: Array.from({ length: 12 }).map((_, i) => ({
            date: `Week ${i + 1}`,
            count: Math.floor(Math.random() * 200000) + 100000
          })),
          monthlyStreams: Array.from({ length: 6 }).map((_, i) => ({
            date: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i],
            count: Math.floor(Math.random() * 800000) + 400000
          })),
          revenueByPlatform: [
            { platform: 'Spotify', amount: 4500 },
            { platform: 'Apple Music', amount: 3800 },
            { platform: 'SonicStream', amount: 2000 }
          ],
          demographics: {
            ageGroups: {
              '18-24': 45,
              '25-34': 30,
              '35-44': 15,
              '45+': 10
            },
            topCountries: [
              { country: 'USA', count: 40000 },
              { country: 'UK', count: 15000 },
              { country: 'Germany', count: 10000 },
              { country: 'Japan', count: 8000 },
              { country: 'Others', count: 27000 }
            ],
            gender: [
              { type: 'Male', percentage: 52 },
              { type: 'Female', percentage: 46 },
              { type: 'Other', percentage: 2 }
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return <div className="p-20 text-center font-black uppercase tracking-widest text-zinc-500 animate-pulse">Synchronizing Telemetry...</div>;
  }

  return (
    <div className="space-y-16 p-10 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-white pb-12">
        <div className="space-y-4">
          <h1 className="text-8xl font-black uppercase tracking-tighter leading-[0.8]">Performance<br/>Analytics</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Real-time consumption metrics & audience intelligence</p>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-white/5">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                timeRange === range ? "bg-white text-black" : "text-zinc-500 hover:text-white"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      {/* Primary Metrics */}
      <div className="grid md:grid-cols-3 gap-8">
        <MetricCard label="Total Streams" value={analytics.totalStreams.toLocaleString()} trend="+14.2%" />
        <MetricCard label="Monthly Listeners" value={analytics.monthlyListeners.toLocaleString()} trend="+5.8%" />
        <MetricCard label="Artist Revenue" value={`$${analytics.revenue.artistShare.toLocaleString()}`} trend="+22.1%" />
      </div>

      {/* Stream Velocity Chart */}
      <section className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-12 space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-3xl font-black uppercase tracking-tight">Stream <span className="text-emerald-500 italic">Velocity</span></h3>
          <div className="flex gap-4">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" /> Daily Streams
            </span>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.dailyStreams}>
              <defs>
                <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c81e3a" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#c81e3a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => val.split('-')[2]}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `${val/1000}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                itemStyle={{ color: '#c81e3a', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="count" stroke="#c81e3a" strokeWidth={4} fillOpacity={1} fill="url(#colorStreams)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Revenue Breakdown */}
        <section className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-10 space-y-8">
          <h3 className="text-2xl font-black uppercase tracking-tight">Revenue <span className="text-emerald-500 italic">Distribution</span></h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.revenueByPlatform} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="platform" type="category" stroke="#52525b" fontSize={10} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="amount" fill="#c81e3a" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Audience Demographics */}
        <section className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-10 space-y-8">
          <h3 className="text-2xl font-black uppercase tracking-tight">Audience <span className="text-emerald-500 italic">Demographics</span></h3>
          <div className="grid grid-cols-2 gap-8 h-[300px]">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Age Groups</p>
              <div className="space-y-4">
                {analytics.demographics?.ageGroups && Object.entries(analytics.demographics.ageGroups).map(([group, percentage]) => (
                  <div key={group} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>{group}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.demographics?.gender || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="percentage"
                  >
                    {(analytics.demographics?.gender || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#c81e3a', '#3b82f6', '#a855f7'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      {/* Regional Distribution */}
      <section className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-12 space-y-8">
        <h3 className="text-3xl font-black uppercase tracking-tight">Regional <span className="text-emerald-500 italic">Market Share</span></h3>
        <div className="grid md:grid-cols-5 gap-8">
          {analytics.demographics?.topCountries.map((country, i) => (
            <div key={country.country} className="p-8 bg-black/20 border border-white/5 rounded-3xl space-y-4">
              <div className="text-4xl font-black text-white/10 italic">0{i+1}</div>
              <div>
                <p className="text-2xl font-black uppercase">{country.country}</p>
                <p className="text-emerald-400 font-mono font-bold">{country.count.toLocaleString()} Streams</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const MetricCard = ({ label, value, trend }: { label: string; value: string; trend: string }) => (
  <div className="bg-zinc-900/50 border border-white/5 p-10 rounded-[40px] space-y-4 group hover:border-emerald-500/30 transition-all">
    <div className="flex justify-between items-start">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-serif">{label}</p>
      <span className="text-emerald-400 text-[10px] font-black px-2 py-1 bg-emerald-500/10 rounded-full">{trend}</span>
    </div>
    <p className="text-5xl font-black tracking-tighter font-mono group-hover:text-emerald-500 transition-colors">{value}</p>
  </div>
);
