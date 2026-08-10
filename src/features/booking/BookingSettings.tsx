import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Shield, Clock, ClipboardList, Save, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Tooltip } from '../../components/ui/Tooltip';

export const BookingSettings = () => {
  const { token, isPaid } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    booking_price: 500,
    performance_price: 1500,
    duration: 60,
    radius_clause_km: 50,
    radius_clause_days: 7,
    deposit_percentage: 50,
    cancellation_policy: 'standard',
    technical_rider: '',
    hospitality_rider: '',
    is_booking_enabled: true,
    demand_multiplier: 1.0,
    location_fees: [] as { city: string; fee: number }[],
    peak_dates: [] as { date: string; multiplier: number }[]
  });

  const isPro = isPaid; // Any paid tier can manage bookings

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/artist/booking-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error('Failed to fetch booking settings:', err);
      }
    };
    fetchSettings();
  }, [token]);

  const handleSave = async () => {
    if (!isPro) {
      toast.error('Upgrade to SonicStar, SonicVisionary, or SonicPro to set custom booking prices.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/artist/booking-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        toast.success('Booking settings updated successfully!');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch {
      toast.error('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isPro) {
    return (
      <div className="bg-zinc-900/50 border border-white/5 p-12 rounded-[40px] text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
          <Shield size={40} />
        </div>
        <h2 className="text-3xl font-black tracking-tighter">Booking Management</h2>
        <p className="text-zinc-400 max-w-md mx-auto">
          Upgrade your account to access professional booking tools, set custom performance rates, and manage riders.
        </p>
        <button className="bg-zinc-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-600 transition-colors">
          View Subscription Tiers
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter uppercase">Booking Settings</h2>
          <p className="text-zinc-500 font-medium">Configure your professional performance standards and pricing.</p>
        </div>
        <Tooltip content="Save all changes to your booking profile">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-zinc-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-600 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </Tooltip>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-8">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-500" />
            Pricing & Financials
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Standard Booking Price ($)</label>
                <Tooltip content="Base fee for any booking request">
                  <Info size={12} className="text-zinc-500" />
                </Tooltip>
              </div>
              <input 
                type="number" 
                value={settings.booking_price}
                onChange={(e) => setSettings({ ...settings, booking_price: Number(e.target.value) })}
                className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Performance Price ($)</label>
                <Tooltip content="Base fee for a live performance set">
                  <Info size={12} className="text-zinc-500" />
                </Tooltip>
              </div>
              <input 
                type="number" 
                value={settings.performance_price}
                onChange={(e) => setSettings({ ...settings, performance_price: Number(e.target.value) })}
                className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Deposit Percentage (%)</label>
                <Tooltip content="Percentage of the total fee required upfront">
                  <Info size={12} className="text-zinc-500" />
                </Tooltip>
              </div>
              <input 
                type="number" 
                value={settings.deposit_percentage}
                onChange={(e) => setSettings({ ...settings, deposit_percentage: Number(e.target.value) })}
                className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-[10px] text-zinc-500 italic">Standard is 50% non-refundable.</p>
            </div>
          </div>
        </section>

        <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-8">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            Dynamic Pricing
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Demand Multiplier</label>
                <Tooltip content="Automatically scale prices based on popularity (1.0 = normal)">
                  <Info size={12} className="text-zinc-500" />
                </Tooltip>
              </div>
              <input 
                type="number" 
                step="0.1"
                value={settings.demand_multiplier}
                onChange={(e) => setSettings({ ...settings, demand_multiplier: Number(e.target.value) })}
                className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Location Fees</label>
                <Tooltip content="Add extra fees for specific cities or regions">
                  <Info size={12} className="text-zinc-500" />
                </Tooltip>
              </div>
              <div className="space-y-2">
                {settings.location_fees.map((loc, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      placeholder="City"
                      value={loc.city}
                      onChange={(e) => {
                        const newFees = [...settings.location_fees];
                        newFees[idx].city = e.target.value;
                        setSettings({ ...settings, location_fees: newFees });
                      }}
                      className="flex-1 bg-black border border-white/10 rounded-xl p-2 text-xs outline-none"
                    />
                    <input 
                      type="number"
                      placeholder="Fee"
                      value={loc.fee}
                      onChange={(e) => {
                        const newFees = [...settings.location_fees];
                        newFees[idx].fee = Number(e.target.value);
                        setSettings({ ...settings, location_fees: newFees });
                      }}
                      className="w-20 bg-black border border-white/10 rounded-xl p-2 text-xs outline-none"
                    />
                  </div>
                ))}
                <button 
                  onClick={() => setSettings({ ...settings, location_fees: [...settings.location_fees, { city: '', fee: 0 }] })}
                  className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  + Add Location Fee
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-8">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Clock size={20} className="text-emerald-500" />
            Availability & Rules
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Default Duration (Minutes)</label>
                <Tooltip content="Standard length of your performance">
                  <Info size={12} className="text-zinc-500" />
                </Tooltip>
              </div>
              <input 
                type="number" 
                value={settings.duration}
                onChange={(e) => setSettings({ ...settings, duration: Number(e.target.value) })}
                className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Radius (KM)</label>
                <input 
                  type="number" 
                  value={settings.radius_clause_km}
                  onChange={(e) => setSettings({ ...settings, radius_clause_km: Number(e.target.value) })}
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Radius Days</label>
                <input 
                  type="number" 
                  value={settings.radius_clause_days}
                  onChange={(e) => setSettings({ ...settings, radius_clause_days: Number(e.target.value) })}
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
              <span className="text-sm font-bold">Enable Public Bookings</span>
              <Tooltip content="Toggle whether users can request bookings through your profile">
                <button 
                  onClick={() => setSettings({ ...settings, is_booking_enabled: !settings.is_booking_enabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.is_booking_enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <motion.div 
                    animate={{ x: settings.is_booking_enabled ? 24 : 4 }}
                    className="w-4 h-4 bg-white rounded-full absolute top-1"
                  />
                </button>
              </Tooltip>
            </div>
          </div>
        </section>

        <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-8 md:col-span-1">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList size={20} className="text-emerald-500" />
            Performance Riders
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Technical Rider</label>
              <textarea 
                value={settings.technical_rider}
                onChange={(e) => setSettings({ ...settings, technical_rider: e.target.value })}
                placeholder="List sound, lighting, and stage equipment requirements..."
                className="w-full bg-black border border-white/10 rounded-2xl p-4 h-32 outline-none focus:border-emerald-500 transition-colors resize-none text-sm"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hospitality Rider</label>
              <textarea 
                value={settings.hospitality_rider}
                onChange={(e) => setSettings({ ...settings, hospitality_rider: e.target.value })}
                placeholder="List catering, dressing room, and lodging requirements..."
                className="w-full bg-black border border-white/10 rounded-2xl p-4 h-32 outline-none focus:border-emerald-500 transition-colors resize-none text-sm"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[40px] flex gap-6 items-start">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="text-lg font-bold text-emerald-400">Standard Booking Policy Active</h4>
          <p className="text-sm text-zinc-400 leading-relaxed">
            By enabling bookings, you agree to the SonicStream Standard Booking Policy. 
            This includes the 50% non-refundable deposit, 30-day cancellation window, 
            and the 25% neglect fee for no-shows or overbooking.
          </p>
        </div>
      </div>
    </div>
  );
};
