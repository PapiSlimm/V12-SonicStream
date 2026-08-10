import { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Music, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Server,
  Database,
  Printer,
  Settings
} from 'lucide-react';
import { PrintProfitDashboard } from './PrintProfitDashboard';

export const V12AdminDashboard = () => {
  const [view, setView] = useState<'main' | 'printing'>('main');
  const [canaryHealth] = useState({
    errors: 0.02,
    latency: 145,
    traffic: 5
  });

  const [settings, setSettings] = useState<Record<string, string>>({
    highlight_activity_threshold: '10'
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        await fetch('/api/admin/metrics', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            setSettings(prev => ({ ...prev, ...data }));
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();

    return () => clearInterval(interval);
  }, []);

  const handleSaveSetting = async (key: string, value: string) => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ [key]: value })
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to update setting');
      }
    } catch (err: any) {
      setError(err.message || 'Error saving setting');
    } finally {
      setSaving(false);
    }
  };

  if (view === 'printing') {
    return (
      <div className="p-10 bg-black min-h-screen text-white">
        <PrintProfitDashboard onBack={() => setView('main')} />
      </div>
    );
  }

  return (
    <div className="space-y-12 p-10 bg-black min-h-screen text-white">
      <header className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Shield className="text-black" size={24} />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">V12 Control Center</h1>
          </div>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Global Infrastructure & Revenue Monitoring</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setView('printing')}
            className="px-6 py-3 bg-zinc-900 border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-white/5 transition-colors"
          >
            <Printer size={20} className="text-emerald-400" />
            <span className="text-sm font-black">Print Profits</span>
          </button>
          <div className="px-6 py-3 bg-zinc-900 border border-white/10 rounded-2xl flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-black">Main: 95%</span>
          </div>
          <div className="px-6 py-3 bg-zinc-900 border border-white/10 rounded-2xl flex items-center gap-3">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-sm font-black">Canary: 5%</span>
          </div>
        </div>
      </header>

      {/* Canary Health Monitor */}
      <section className="bg-zinc-900/50 border border-white/5 rounded-4xl p-10 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Activity className="text-purple-500" />
            Canary Deployment Health
          </h2>
          <button className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-2xl font-black transition-all">
            Promote to Stable
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <HealthCard 
            label="Error Rate" 
            value={`${(canaryHealth.errors * 100).toFixed(1)}%`} 
            status={canaryHealth.errors < 0.05 ? 'healthy' : 'warning'}
            icon={AlertTriangle}
          />
          <HealthCard 
            label="Avg Latency" 
            value={`${canaryHealth.latency}ms`} 
            status={canaryHealth.latency < 200 ? 'healthy' : 'warning'}
            icon={Server}
          />
          <HealthCard 
            label="Traffic Share" 
            value={`${canaryHealth.traffic}%`} 
            status="healthy"
            icon={TrendingUp}
          />
        </div>
      </section>

      {/* System Settings & Configuration Panel */}
      <section className="bg-zinc-900/50 border border-white/5 rounded-4xl p-10 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Settings className="text-cyan-400" />
            System Settings & Controls
          </h2>
          {success && (
            <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
              ✓ Settings saved successfully
            </span>
          )}
          {error && (
            <span className="text-red-400 font-bold text-sm bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">
              ⚠ {error}
            </span>
          )}
        </div>

        <div className="bg-black/40 border border-white/5 p-8 rounded-3xl max-w-2xl space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white">Highlight Activity Threshold</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-medium">
              Define the sensitivity for background crowd-activity highlight clipping. 
              The system automatically creates highlights when total reaction scores exceed this value.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <input 
              type="range" 
              min="1" 
              max="50" 
              value={settings.highlight_activity_threshold || '10'} 
              onChange={(e) => setSettings(prev => ({ ...prev, highlight_activity_threshold: e.target.value }))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
            />
            <span className="text-2xl font-mono font-black text-cyan-400 bg-cyan-400/10 border border-cyan-400/25 px-4 py-1 rounded-xl min-w-[3.5rem] text-center">
              {settings.highlight_activity_threshold}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-widest font-bold">
            <span>Low Threshold (Hyper-sensitive)</span>
            <span>High Threshold (Exclusive Moments)</span>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              onClick={() => handleSaveSetting('highlight_activity_threshold', settings.highlight_activity_threshold)}
              disabled={saving}
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-3 rounded-2xl font-black transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </section>

      {/* Revenue & Platform Stats */}
      <div className="grid md:grid-cols-4 gap-8">
        <StatCard label="Total Revenue" value="$1.2M" trend="+14%" icon={DollarSign} color="emerald" />
        <StatCard label="Active Artists" value="52,847" trend="+2.4k" icon={Users} color="blue" />
        <StatCard label="Tracks Live" value="247,000" trend="+12k" icon={Music} color="purple" />
        <StatCard label="Database Load" value="14%" trend="Stable" icon={Database} color="yellow" />
      </div>

      {/* Critical Alerts */}
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-4xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="text-black" size={24} />
          </div>
          <div>
            <h4 className="text-xl font-black text-red-500">24 Pending Content Approvals</h4>
            <p className="text-red-500/60 font-medium">Approval history required for revenue payouts.</p>
          </div>
        </div>
        <button className="bg-red-500 text-black px-8 py-3 rounded-2xl font-black hover:bg-red-400 transition-all">
          Review Now
        </button>
      </div>
    </div>
  );
};

const HealthCard = ({ label, value, status, icon: Icon }: any) => (
  <div className="bg-black/40 border border-white/5 p-8 rounded-3xl space-y-4">
    <div className="flex justify-between items-center">
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400">
        <Icon size={24} />
      </div>
      <span className={cn(
        "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
        status === 'healthy' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
      )}>
        {status}
      </span>
    </div>
    <div>
      <div className="text-4xl font-black">{value}</div>
      <div className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-1">{label}</div>
    </div>
  </div>
);

const StatCard = ({ label, value, trend, icon: Icon, color }: any) => (
  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-4">
    <div className="flex justify-between items-center">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center",
        color === 'emerald' ? "bg-emerald-500/10 text-emerald-400" :
        color === 'blue' ? "bg-blue-500/10 text-blue-400" :
        color === 'purple' ? "bg-purple-500/10 text-purple-400" :
        "bg-yellow-500/10 text-yellow-400"
      )}>
        <Icon size={24} />
      </div>
      <span className="text-emerald-400 text-xs font-black">{trend}</span>
    </div>
    <div>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-1">{label}</div>
    </div>
  </div>
);

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
