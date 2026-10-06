import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Payout } from '../../types';
import { Check, X, DollarSign } from 'lucide-react';

export const PayoutManagement = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayouts = async () => {
    try {
      const data = await api.admin.getPayoutRequests();
      setPayouts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleAction = async (id: string, action: 'complete' | 'reject') => {
    try {
      await api.admin.processPayout(id, action);
      await fetchPayouts();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse">Loading payout requests...</div>;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold">Payout Requests</h2>
        <p className="text-zinc-500">Review and process artist withdrawal requests.</p>
      </header>

      <div className="space-y-4">
        <h3 className="font-bold px-2">Pending Payouts ({payouts.length})</h3>
        {payouts.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/30 border border-white/5 rounded-3xl text-zinc-500">
            No pending payout requests.
          </div>
        ) : (
          payouts.map((p) => (
            <div key={p.id} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <DollarSign size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold">${(p.amountCents / 100).toFixed(2)}</p>
                  <p className="text-xs text-zinc-500">Method: {p.method} • Requested on {new Date(p.requestedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction(p.id, 'reject')}
                  className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  title="Reject Payout"
                >
                  <X size={18} />
                </button>
                <button 
                  onClick={() => handleAction(p.id, 'complete')}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-xl text-xs font-bold hover:bg-zinc-600 transition-all flex items-center gap-2"
                >
                  <Check size={16} />
                  Mark as Completed
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
