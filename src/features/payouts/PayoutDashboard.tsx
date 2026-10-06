import { useState, useEffect } from 'react';
import { DollarSign, History, AlertCircle, CheckCircle, Loader2, CreditCard, Landmark, X, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Payout {
  id: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  requestedAt: string;
  processedAt?: string;
}

export const PayoutDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('stripe');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [newThreshold, setNewThreshold] = useState(user?.payoutThreshold?.toString() || '50');
  const [updatingThreshold, setUpdatingThreshold] = useState(false);

  const threshold = user?.payoutThreshold || 50.00;
  const isEligible = (user?.balance || 0) >= threshold;

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleUpdateThreshold = async () => {
    const val = parseFloat(newThreshold);
    if (isNaN(val) || val < 10) {
      toast.error('Minimum threshold is $10.00');
      return;
    }
    setUpdatingThreshold(true);
    try {
      const res = await fetch('/api/user/update-payout-threshold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ threshold: val })
      });
      if (res.ok) {
        toast.success('Threshold updated!');
        refreshUser();
        setShowThresholdModal(false);
      }
    } catch {
      toast.error('Failed to update threshold');
    } finally {
      setUpdatingThreshold(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      const res = await fetch('/api/payouts/history', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayouts(data);
      }
    } catch (err) {
      console.error('Failed to fetch payouts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const requestedAmount = parseFloat(amount);
    if (isNaN(requestedAmount) || requestedAmount < threshold) {
      setError(`Minimum payout is $${threshold.toFixed(2)}`);
      return;
    }

    if (requestedAmount > (user?.balance || 0)) {
      setError('Insufficient balance');
      return;
    }

    setRequesting(true);
    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount: requestedAmount, method })
      });

      if (res.ok) {
        setSuccess(true);
        setAmount('');
        fetchPayouts();
        refreshUser();
      } else {
        const data = await res.json();
        setError(data.error || 'Payout request failed');
      }
    } catch (err) {
      console.error('Payout request error:', err);
      setError('Network error. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-purple-500 bg-clip-text text-transparent tracking-tighter">
            Royalties & Payouts
          </h1>
          <p className="text-zinc-400">Manage your earnings and request withdrawals.</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 flex items-center gap-6 backdrop-blur-xl">
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">Available Balance</p>
            <p className="text-3xl font-black text-emerald-400">${(user?.balance || 0).toFixed(2)}</p>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="space-y-1 relative group">
            <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">Threshold</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-white">${threshold.toFixed(2)}</p>
              <button 
                onClick={() => setShowThresholdModal(true)}
                className="p-1 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-all"
              >
                <Settings size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showThresholdModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-black text-white">Payout Threshold</h3>
                <button onClick={() => setShowThresholdModal(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <p className="text-sm text-zinc-400">Set the minimum balance required to request a payout. Minimum is $10.00.</p>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl pl-10 pr-5 py-4 text-xl font-black focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <button
                  onClick={handleUpdateThreshold}
                  disabled={updatingThreshold}
                  className="w-full bg-zinc-700 text-white font-black py-4 rounded-2xl hover:bg-zinc-600 transition-all flex items-center justify-center gap-2"
                >
                  {updatingThreshold ? <Loader2 className="animate-spin" /> : 'Update Threshold'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Payout Request Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/40 border border-white/10 rounded-[32px] p-8 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold">Request Payout</h2>
            </div>

            {!isEligible ? (
              <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-500 font-bold">
                  <AlertCircle size={18} />
                  <span>Not Eligible Yet</span>
                </div>
                <p className="text-sm text-zinc-400">
                  You need at least <span className="text-white font-bold">${threshold.toFixed(2)}</span> in your balance to request a payout.
                </p>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, ((user?.balance || 0) / threshold) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400">Amount to Withdraw</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min={threshold}
                      max={user?.balance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl pl-10 pr-5 py-4 text-xl font-black focus:border-emerald-500 outline-none transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400">Payout Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMethod('stripe')}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                        method === 'stripe' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-zinc-800/30 border-white/5 text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      <CreditCard size={24} />
                      <span className="text-xs font-bold">Stripe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('bank')}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                        method === 'bank' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-zinc-800/30 border-white/5 text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      <Landmark size={24} />
                      <span className="text-xs font-bold">Bank Transfer</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex items-center gap-2">
                    <CheckCircle size={16} />
                    Payout request submitted!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={requesting}
                  className="w-full bg-zinc-700 text-white font-black py-5 rounded-2xl text-lg shadow-xl hover:bg-zinc-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {requesting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Request Withdrawal'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Payout History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/40 border border-white/10 rounded-[32px] p-8 min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-xl font-bold">Payout History</h2>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <p className="text-zinc-500">Loading history...</p>
              </div>
            ) : payouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center">
                  <DollarSign className="w-10 h-10 text-zinc-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-400">No payouts yet</h3>
                  <p className="text-sm text-zinc-600 max-w-xs">Your withdrawal history will appear here once you make your first request.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div 
                    key={payout.id}
                    className="group p-6 bg-zinc-800/20 border border-white/5 rounded-2xl hover:border-white/10 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        payout.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        payout.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                        payout.status === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {payout.method === 'stripe' ? <CreditCard size={20} /> : <Landmark size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-xl font-black text-white">${payout.amount.toFixed(2)}</p>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                            payout.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            payout.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                            payout.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {payout.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          Requested on {format(new Date(payout.requestedAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{payout.method}</p>
                      {payout.processedAt && (
                        <p className="text-[10px] text-zinc-600">Processed {format(new Date(payout.processedAt), 'MMM d')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
