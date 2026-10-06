import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { api } from '../../api';
import { cn } from '../../utils/cn';

export const EarningsPage = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const fetchEarnings = async () => {
    try {
      const d = await api.artist.getEarnings();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 10) return alert('Minimum withdrawal is $10');
    
    try {
      await api.artist.withdraw(amount, 'stripe');
      alert('Withdrawal request submitted!');
      setWithdrawAmount('');
      fetchEarnings();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Withdrawal failed');
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse">Loading earnings report...</div>;
  if (!data) return <div className="p-20 text-center text-zinc-500">Failed to load earnings.</div>;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold">Earnings & Payouts</h2>
        <p className="text-zinc-500">Track your royalties and manage your balance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl flex justify-between items-center">
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-500 uppercase">Available Balance</p>
              <p className="text-5xl font-bold text-emerald-400">${data.balance.toFixed(2)}</p>
            </div>
            <div className="space-y-4 text-right">
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Withdrawal Method</p>
                <p className="text-sm font-bold">Stripe Connect</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Amount"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className="w-24 bg-black border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={handleWithdraw}
                  className="bg-zinc-700 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-zinc-600 transition-all"
                >
                  Withdraw
                </button>
              </div>
              <p className="text-[10px] text-zinc-600">Threshold: ${data.threshold} • Auto-payout: {data.auto_payout ? 'On' : 'Off'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold px-2">Royalty Statements</h3>
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px]">Period</th>
                    <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px]">Streams</th>
                    <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.royalties.map((r: any) => (
                    <tr key={r.id}>
                      <td className="px-6 py-4 text-zinc-400">{r.period_start} - {r.period_end}</td>
                      <td className="px-6 py-4 font-mono">{r.streams?.toLocaleString() || 'N/A'}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">${r.amount.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.royalties.length === 0 && <div className="p-12 text-center text-zinc-500">No statements yet.</div>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
            <h4 className="font-bold">Payout History</h4>
            <div className="space-y-4">
              {data.payouts.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-black/40 border border-white/5 rounded-2xl">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">${p.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-zinc-500">{format(parseISO(p.requested_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest",
                    p.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                  )}>
                    {p.status}
                  </div>
                </div>
              ))}
              {data.payouts.length === 0 && <p className="text-center text-zinc-500 text-xs py-4">No payout history.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
