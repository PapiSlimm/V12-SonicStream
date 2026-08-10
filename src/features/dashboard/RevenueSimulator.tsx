import { useState } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Play, RotateCcw, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';
import { SectionCard } from '../../components/ui/SectionCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const RevenueSimulator = () => {
  const [params, setParams] = useState({
    users: 1000,
    conversionRate: 0.05,
    avgRevenuePerUser: 15,
    churnRate: 0.02,
    growthRate: 0.1,
    months: 12,
    platformFee: 0.12,
    distroCut: 0.10
  });

  const [data, setData] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch('/api/admin/revenue/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const results = await response.json();
      setData(results);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <SectionCard title="Simulation Parameters" className="lg:col-span-1">
          <div className="space-y-4">
            <Input 
              label="Starting Users"
              type="number"
              value={params.users}
              onChange={e => setParams({...params, users: parseInt(e.target.value)})}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Conv. Rate"
                type="number"
                step="0.01"
                value={params.conversionRate}
                onChange={e => setParams({...params, conversionRate: parseFloat(e.target.value)})}
              />
              <Input 
                label="Churn Rate"
                type="number"
                step="0.01"
                value={params.churnRate}
                onChange={e => setParams({...params, churnRate: parseFloat(e.target.value)})}
              />
            </div>
            <Input 
              label="Monthly Growth"
              type="number"
              step="0.01"
              value={params.growthRate}
              onChange={e => setParams({...params, growthRate: parseFloat(e.target.value)})}
            />
            <Input 
              label="Avg. Revenue ($)"
              type="number"
              value={params.avgRevenuePerUser}
              onChange={e => setParams({...params, avgRevenuePerUser: parseInt(e.target.value)})}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Platform Fee (%)"
                type="number"
                step="0.01"
                value={params.platformFee}
                onChange={e => setParams({...params, platformFee: parseFloat(e.target.value)})}
              />
              <Input 
                label="Distro Cut (%)"
                type="number"
                step="0.01"
                value={params.distroCut}
                onChange={e => setParams({...params, distroCut: parseFloat(e.target.value)})}
              />
            </div>
            
            <div className="pt-4 flex gap-2">
              <Button 
                onClick={runSimulation} 
                disabled={isSimulating}
                className="flex-1 bg-zinc-700 text-white font-black uppercase italic flex items-center justify-center gap-2"
              >
                <Play size={16} />
                Run AI Simulation
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setData([])}
                className="w-12 h-12 p-0 flex items-center justify-center"
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        </SectionCard>

        {/* Results Graph */}
        <SectionCard title="Projected ARR" className="lg:col-span-2">
          {data.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-zinc-500">
              <BarChart3 size={48} className="mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-[10px]">Adjust parameters and run simulation</p>
            </div>
          ) : (
            <div className="h-[400px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c81e3a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c81e3a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="month" stroke="#52525b" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#52525b" fontSize={10} fontWeight="bold" tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#c81e3a', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="totalRevenue" stroke="#c81e3a" fillOpacity={1} fill="url(#colorSim)" strokeWidth={3} />
                  <Area type="monotone" dataKey="monthlyRevenue" stroke="#3b82f6" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Summary Cards */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SectionCard className="border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">End User Base</p>
                <h4 className="text-xl font-black italic">{Math.round(data[data.length-1].users).toLocaleString()}</h4>
              </div>
            </div>
          </SectionCard>

          <SectionCard className="border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Monthly Run Rate</p>
                <h4 className="text-xl font-black italic">${data[data.length-1].monthlyRevenue.toLocaleString()}</h4>
              </div>
            </div>
          </SectionCard>

          <SectionCard className="border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">12-Month Total</p>
                <h4 className="text-xl font-black italic">${data[data.length-1].totalRevenue.toLocaleString()}</h4>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
};
