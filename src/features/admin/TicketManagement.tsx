import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { api } from '../../api';
import { cn } from '../../utils/cn';
import { SupportTicket } from '../../types';
import { toast } from '../../components/ui/Toast';

export const TicketManagement = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [response, setResponse] = useState('');

  const fetchTickets = async () => {
    try {
      const d = await api.support.getTickets(); // Admin should probably have a different endpoint or this one returns all for admins
      setTickets(d);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const resolveTicket = async (id: string) => {
    if (!response) {
      toast.error('Please enter a response');
      return;
    }
    try {
      await api.admin.resolveTicket(id, response);
      setResponse('');
      await fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse">Loading tickets...</div>;

  return (
    <div className="space-y-6">
      <h3 className="font-bold px-2">Support Tickets ({tickets.length})</h3>
      <div className="space-y-4">
        {tickets.map((t) => (
          <div key={t.id} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="font-bold">{t.subject}</p>
                <p className="text-xs text-zinc-500">From User ID: {t.userId} • {format(parseISO(t.createdAt), 'MMM d, yyyy')}</p>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                t.status === 'open' ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
              )}>
                {t.status}
              </div>
            </div>
            <p className="text-sm text-zinc-400 bg-black/40 p-4 rounded-xl border border-white/5">{t.message}</p>
            {t.status === 'open' && (
              <div className="space-y-3">
                <textarea 
                  placeholder="Enter resolution notes..."
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-colors resize-none"
                  rows={2}
                />
                <button 
                  onClick={() => resolveTicket(t.id)}
                  className="bg-zinc-700 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-zinc-600 transition-all"
                >
                  Resolve Ticket
                </button>
              </div>
            )}
          </div>
        ))}
        {tickets.length === 0 && <div className="p-12 text-center text-zinc-500 italic">No tickets found.</div>}
      </div>
    </div>
  );
};
