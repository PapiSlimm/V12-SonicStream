import { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, UserCheck, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export const ParentalControls = () => {
  const [settings, setSettings] = useState({
    explicitContent: false,
    privateProfile: true,
    dmRestricted: true,
    spendingLimit: 50,
    ageVerification: true
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-8">
      <header className="space-y-2">
        <h2 className="text-4xl font-black tracking-tighter flex items-center gap-3">
          <ShieldCheck className="text-emerald-400" size={36} />
          Parental Controls & Safety
        </h2>
        <p className="text-zinc-500">Manage safety settings and content filters for your account or linked family accounts.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-4xl space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Lock size={20} className="text-blue-400" />
            Content Restrictions
          </h3>
          <div className="space-y-4">
            {[
              { id: 'explicitContent', label: 'Filter Explicit Content', desc: 'Hide tracks and posts with explicit language or themes.', icon: EyeOff },
              { id: 'privateProfile', label: 'Private Profile Defaults', desc: 'Automatically set new profiles to private for users under 18.', icon: UserCheck },
              { id: 'dmRestricted', label: 'Restrict Direct Messages', desc: 'Only allow messages from verified artists and mutual followers.', icon: Lock },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-black border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{item.label}</div>
                    <p className="text-[10px] text-zinc-500 leading-tight">{item.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof settings] }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    settings[item.id as keyof typeof settings] ? "bg-emerald-500" : "bg-zinc-800"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    settings[item.id as keyof typeof settings] ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-zinc-900/50 border border-white/5 p-8 rounded-4xl space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-400" />
            Safety Defaults & Nudges
          </h3>
          <div className="space-y-4">
            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-2">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <ShieldCheck size={16} />
                Teen Safety Defaults Active
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Accounts for users aged 13-17 are automatically set to "Private" and have "Explicit Content" filters enabled by default.
              </p>
            </div>

            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-2">
              <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                <Eye size={16} />
                Interaction Nudges
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Users will receive a prompt before sharing personal information or interacting with unverified accounts.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Monthly Spending Limit ($)</label>
              <input 
                type="number" 
                value={settings.spendingLimit}
                onChange={(e) => setSettings(prev => ({ ...prev, spendingLimit: parseInt(e.target.value) }))}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all"
              />
              <p className="text-[10px] text-zinc-600 italic">Limits purchases of digital tracks, merchandise, and concert tickets.</p>
            </div>
          </div>
        </section>
      </div>

      <footer className="flex justify-end pt-8">
        <button className="bg-zinc-700 hover:bg-zinc-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-2xl shadow-black/20 transition-all">
          Save Safety Settings
        </button>
      </footer>
    </div>
  );
};
