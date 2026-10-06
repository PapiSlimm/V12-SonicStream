import { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Link as LinkIcon, 
  Copy, 
  CheckCircle2, 
  ArrowUpRight,
  Gift,
  ShieldCheck,
  BarChart3,
  Trophy,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Meta } from '../../components/SEO/Meta';
import { apiFetch } from '../../api/apiFetch';
import { Affiliate, AffiliateCommission } from '../../types';

interface AffiliateAccountDetails {
  registered: boolean;
  id?: string;
  code?: string;
  referralCount?: number;
  earningsCents?: number;
  payoutAddress?: string;
  currentRate?: number;
  createdAt?: string;
}

export const AffiliateDashboard: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [registering, setRegistering] = useState<boolean>(false);
  const [account, setAccount] = useState<AffiliateAccountDetails>({ registered: false });
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  
  // Registration Form
  const [customCode, setCustomCode] = useState<string>('');
  const [payoutAddress, setPayoutAddress] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadAffiliateData = async () => {
    setLoading(true);
    try {
      const acc = await apiFetch<AffiliateAccountDetails>('/api/affiliates/account');
      setAccount(acc);

      if (acc.registered) {
        const comms = await apiFetch<AffiliateCommission[]>('/api/affiliates/commissions');
        setCommissions(comms);
      }
    } catch (err: unknown) {
      console.error('Failed to load affiliate details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim()) {
      setErrorMsg('Referral code is required.');
      return;
    }
    setErrorMsg('');
    setRegistering(true);
    try {
      await apiFetch<Affiliate>('/api/affiliates/register', {
        method: 'POST',
        body: JSON.stringify({
          code: customCode.trim().toLowerCase(),
          payoutAddress: payoutAddress.trim() || undefined
        })
      });
      toast.success('Successfully registered as an Affiliate partner!');
      await loadAffiliateData();
    } catch (err: any) {
      const message = err.message || 'Failed to register. Code might already be taken.';
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setRegistering(false);
    }
  };

  const referralCode = account.code || 'YOURCODE';
  const referralLink = `${window.location.origin}/signup?ref=${referralCode.toUpperCase()}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Stats calculation
  const totalEarningsFloat = (account.earningsCents || 0) / 100;
  const activeReferralsCount = account.referralCount || 0;
  
  // Calculate potential MRC: assume active premium users give steady income
  const mrrEstimationCents = commissions
    .filter(c => c.payoutStatus !== 'cancelled')
    .reduce((sum, item) => sum + item.amountCents, 0);
  const mrrEstimationFloat = mrrEstimationCents / 100;

  const stats = [
    { label: 'Total Earnings', value: `$${totalEarningsFloat.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Monthly Commission', value: `$${mrrEstimationFloat.toFixed(2)}`, icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Active Referrals', value: String(activeReferralsCount), icon: Users, color: 'text-purple-400' },
    { label: 'Current Rate', value: `${((account.currentRate || 0.20) * 100).toFixed(0)}%`, icon: BarChart3, color: 'text-orange-400' },
  ];

  // Specific user instruction tiers:
  // "affilates can earn 20% from subscription based on users, after 200 users SonicStream will offer 30%, after per 500 users & 40% after per users."
  const tiers = [
    { range: '0 - 200 Users', rate: '20% Commission', desc: 'Standard Tier', limit: 200, active: activeReferralsCount <= 200 },
    { range: '201 - 500 Users', rate: '30% Commission', desc: 'Pro Tier', limit: 500, active: activeReferralsCount > 200 && activeReferralsCount <= 500 },
    { range: '501+ Users', rate: '40% Commission', desc: 'Visionary Tier', limit: Infinity, active: activeReferralsCount > 500 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-emerald-400" size={48} />
          <p className="text-zinc-400 font-medium">Loading Affiliate Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 lg:p-12">
      <Meta 
        title="Affiliate Partner Dashboard | SonicStream"
        description="Join the SonicStream affiliate program and earn up to 40% recurring subscription commissions."
      />
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <Gift size={24} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Affiliate Program</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">Partner Dashboard</h1>
            <p className="text-zinc-500 text-xl max-w-2xl">
              Refer writers, designers, artists and creators to SonicStream. Enjoy tiered commission rates up to 40%.
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-[32px] flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
              <Trophy size={32} />
            </div>
            <div>
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Commission Tier</div>
              <div className="text-2xl font-black text-white uppercase">
                {activeReferralsCount > 500 ? 'Visionary (40%)' : activeReferralsCount > 200 ? 'Pro (30%)' : 'Standard (20%)'}
              </div>
            </div>
          </div>
        </div>

        {!account.registered ? (
          /* REGISTRATION BOARD */
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-white/5 rounded-[40px] p-8 lg:p-12 max-w-2xl mx-auto space-y-8"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-black uppercase tracking-tight">Become an Affiliate Partner</h2>
              <p className="text-zinc-400">Enter your custom promotional referral code and payment details to begin earning.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 text-sm">
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Desired Referral Code</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">@</span>
                  <input 
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="mybrand"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-10 pr-6 py-4 focus:outline-none focus:border-emerald-500 text-white font-mono"
                    maxLength={30}
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-500">Only letters, numbers, hyphens and underscores are supported.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Payout Email or Stripe Address (Optional)</label>
                <input 
                  type="email"
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  placeholder="payout@example.com"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>

              <button 
                type="submit"
                disabled={registering}
                className="w-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/20"
              >
                {registering ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Registering Account...
                  </>
                ) : (
                  'Activate My Affiliate Link'
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          /* ACTIVE PARTNER WORKSPACE */
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-zinc-900/50 border border-white/5 p-8 rounded-[40px] space-y-4"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-zinc-500 uppercase tracking-widest">{stat.label}</div>
                    <div className="text-3xl font-black text-white mt-1">{stat.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Referral Link Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-zinc-900 border border-white/5 rounded-[40px] p-10 space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black uppercase tracking-tight">Your Referral Link</h2>
                  <p className="text-zinc-500">Every sign up through this link awards you passive recurring income.</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-6 py-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <LinkIcon size={18} className="text-zinc-500 shrink-0" />
                      <span className="text-zinc-300 font-mono text-sm truncate">{referralLink}</span>
                    </div>
                    <button 
                      onClick={copyLink}
                      className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors"
                    >
                      {copied ? <CheckCircle2 size={20} className="text-emerald-400" /> : <Copy size={20} />}
                    </button>
                  </div>
                  <button 
                    onClick={copyLink}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/20"
                  >
                    <ArrowUpRight size={18} />
                    Copy Code
                  </button>
                </div>

                <div className="pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">30-Day Holding Clear</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Direct Deposit payout</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400">
                      <Users size={20} />
                    </div>
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Standard Cookie Policy</div>
                  </div>
                </div>
              </div>

              {/* Commission Tiers */}
              <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-10 space-y-8">
                <h2 className="text-2xl font-black uppercase tracking-tight">Commission Tiers</h2>
                <div className="space-y-4">
                  {tiers.map((tier, i) => (
                    <div 
                      key={i}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        tier.active 
                          ? "bg-emerald-500/10 border-emerald-500/30" 
                          : "bg-white/5 border-white/5 opacity-50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{tier.range}</div>
                        <div className={`text-lg font-black ${tier.active ? "text-emerald-400" : "text-white"}`}>{tier.rate}</div>
                        <div className="text-xs text-zinc-400">{tier.desc}</div>
                      </div>
                      {tier.active && (
                        <div className="bg-zinc-700 text-white p-1 rounded-full">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Referral Transactions Table */}
            <div className="grid grid-cols-1 gap-8">
              <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black uppercase tracking-tight">Referrals &amp; Payout Commissions</h2>
                  <div className="text-xs font-black text-zinc-500 uppercase tracking-widest">Live Updates</div>
                </div>
                
                {commissions.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/5 rounded-3xl">
                    <Users size={48} className="mx-auto text-zinc-600 mb-4" />
                    <p className="text-zinc-400 font-medium">No referral payouts recorded yet</p>
                    <p className="text-zinc-500 text-sm mt-1">Refer users to starts accumulating continuous passive commission splits.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5">
                          <th className="pb-6 px-4">User</th>
                          <th className="pb-6 px-4">Commission Type</th>
                          <th className="pb-6 px-4">Date</th>
                          <th className="pb-6 px-4">Amount Earned</th>
                          <th className="pb-6 px-4">Payout status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {commissions.map((comm) => (
                          <tr key={comm.id} className="group hover:bg-white/5 transition-colors">
                            <td className="py-6 px-4 font-bold text-white">
                              {comm.referredUserId ? `User_${comm.referredUserId.slice(-5)}` : 'Anonymous Referrer'}
                            </td>
                            <td className="py-6 px-4 text-zinc-400 text-sm">
                              Subscription Commission Split
                            </td>
                            <td className="py-6 px-4 text-zinc-500 text-sm">
                              {new Date(comm.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-6 px-4 font-black text-emerald-400">
                              ${(comm.amountCents / 100).toFixed(2)}
                            </td>
                            <td className="py-6 px-4">
                              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                                comm.payoutStatus === 'paid' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                              }`}>
                                {comm.payoutStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
