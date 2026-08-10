import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, AlertCircle, Calendar, CreditCard, Landmark, ArrowRight, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

interface PendingPayout {
  id: number;
  user_id: number;
  user_name: string;
  email: string;
  amount: number;
  method: string;
  requested_at: string;
}

export const AdminPayouts = () => {
  const [payouts, setPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPendingPayouts();
  }, []);

  const fetchPendingPayouts = async () => {
    try {
      const res = await fetch('/api/admin/payouts/pending', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayouts(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending payouts', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchProcess = async (action: 'complete' | 'fail') => {
    if (selectedIds.length === 0) return;
    
    setProcessing(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/payouts/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ payout_ids: selectedIds, action })
      });

      if (res.ok) {
        setSuccess(true);
        setSelectedIds([]);
        fetchPendingPayouts();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to process payouts');
      }
    } catch (err) {
      console.error('Batch process error:', err);
      setError('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const totalSelected = payouts
    .filter(p => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-purple-500 bg-clip-text text-transparent tracking-tighter">
            Payout Management
          </h1>
          <p className="text-zinc-400">Review and process pending withdrawal requests.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3">
            <ShieldCheck className="text-emerald-500 w-5 h-5" />
            <span className="text-sm font-bold text-zinc-300">Admin Secure Batch</span>
          </div>
        </div>
      </div>

      {/* Batch Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky top-6 z-50 bg-zinc-700 text-white p-4 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-6 px-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black">{selectedIds.length}</span>
                <span className="text-sm font-bold uppercase tracking-widest opacity-70">Selected</span>
              </div>
              <div className="w-px h-8 bg-black/10" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black">${totalSelected.toFixed(2)}</span>
                <span className="text-sm font-bold uppercase tracking-widest opacity-70">Total Batch</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBatchProcess('fail')}
                disabled={processing}
                className="px-6 py-3 bg-black/10 hover:bg-black/20 rounded-2xl font-black text-sm transition-all flex items-center gap-2"
              >
                <XCircle size={18} />
                Reject & Refund
              </button>
              <button
                onClick={() => handleBatchProcess('complete')}
                disabled={processing}
                className="px-8 py-3 bg-black text-white hover:bg-zinc-900 rounded-2xl font-black text-sm transition-all flex items-center gap-2 shadow-xl"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle size={18} />}
                Complete Batch
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-zinc-900/40 border border-white/10 rounded-[40px] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-zinc-500 font-bold">Fetching pending requests...</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4 text-center">
            <div className="w-24 h-24 bg-zinc-800/50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-500/30" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-zinc-400">All caught up!</h3>
              <p className="text-sm text-zinc-600">There are no pending payout requests at the moment.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="p-6">
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(payouts.map(p => p.id));
                        else setSelectedIds([]);
                      }}
                      checked={selectedIds.length === payouts.length}
                      className="w-5 h-5 rounded-md border-white/10 bg-zinc-800 accent-emerald-500"
                    />
                  </th>
                  <th className="p-6 text-xs font-black text-zinc-500 uppercase tracking-widest">Artist</th>
                  <th className="p-6 text-xs font-black text-zinc-500 uppercase tracking-widest">Amount</th>
                  <th className="p-6 text-xs font-black text-zinc-500 uppercase tracking-widest">Method</th>
                  <th className="p-6 text-xs font-black text-zinc-500 uppercase tracking-widest">Requested</th>
                  <th className="p-6 text-xs font-black text-zinc-500 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr 
                    key={payout.id} 
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-all ${
                      selectedIds.includes(payout.id) ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <td className="p-6">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(payout.id)}
                        onChange={() => toggleSelection(payout.id)}
                        className="w-5 h-5 rounded-md border-white/10 bg-zinc-800 accent-emerald-500"
                      />
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-xl flex items-center justify-center font-bold text-zinc-400">
                          {payout.user_name?.[0] || 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{payout.user_name}</p>
                          <p className="text-xs text-zinc-500">{payout.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-xl font-black text-emerald-400">${payout.amount.toFixed(2)}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-zinc-400">
                        {payout.method === 'stripe' ? <CreditCard size={16} /> : <Landmark size={16} />}
                        <span className="text-xs font-bold uppercase tracking-widest">{payout.method}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-zinc-500 text-xs">
                        <Calendar size={14} />
                        {format(new Date(payout.requested_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="p-6">
                      <button 
                        onClick={() => toggleSelection(payout.id)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-all text-zinc-500 hover:text-white"
                      >
                        <ArrowRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 flex items-center gap-4">
          <AlertCircle size={24} />
          <div>
            <p className="font-bold">Processing Error</p>
            <p className="text-sm opacity-70">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-emerald-400 flex items-center gap-4">
          <CheckCircle size={24} />
          <div>
            <p className="font-bold">Batch Successful</p>
            <p className="text-sm opacity-70">The selected payouts have been processed and balances updated.</p>
          </div>
        </div>
      )}
    </div>
  );
};
