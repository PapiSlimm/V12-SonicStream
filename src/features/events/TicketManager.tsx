import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  ArrowUpRight, 
  ArrowDownRight, 
  Ticket, 
  Users, 
  DollarSign, 
  Activity,
  Check,
  X,
  Clock
} from 'lucide-react';
import { cn } from '../../utils/cn';

const MOCK_SALES = [
  { id: 'T-1001', event: 'Midnight City Tour', customer: 'Alex Johnson', type: 'VIP', price: 250, status: 'Confirmed', date: '2025-05-12' },
  { id: 'T-1002', event: 'Midnight City Tour', customer: 'Sarah Miller', type: 'General', price: 85, status: 'Confirmed', date: '2025-05-12' },
  { id: 'T-1003', event: 'Acoustic Sessions', customer: 'Mike Ross', type: 'General', price: 45, status: 'Pending', date: '2025-05-13' },
  { id: 'T-1004', event: 'Summer Festival', customer: 'Emily Blunt', type: 'VIP', price: 150, status: 'Confirmed', date: '2025-05-13' },
  { id: 'T-1005', event: 'Summer Festival', customer: 'John Doe', type: 'General', price: 65, status: 'Cancelled', date: '2025-05-14' },
];

export const TicketManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-12 pb-24 font-sans">
      {/* Quick Stats Grid - Data Grid Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-white/10 rounded-[40px] overflow-hidden divide-x divide-y md:divide-y-0 divide-white/10">
        {[
          { label: 'Total Sales', value: '$124,502', trend: '+12.4%', icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Tickets Issued', value: '1,240', trend: '+8.2%', icon: Ticket, color: 'text-blue-400' },
          { label: 'Unique Buyers', value: '842', trend: '+4.5%', icon: Users, color: 'text-purple-400' },
          { label: 'Conversion Rate', value: '12.4%', trend: '+2.1%', icon: Activity, color: 'text-orange-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-10 space-y-6 group hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-between">
              <div className={cn("w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5", stat.color)}>
                <stat.icon size={20} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-black/40 border border-white/5",
                stat.trend.startsWith('+') ? "text-emerald-400" : "text-red-400"
              )}>
                {stat.trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {stat.trend}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-serif">{stat.label}</p>
              <p className="text-4xl font-black tracking-tight font-mono">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sales Ledger - Data Grid Style */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-[48px] overflow-hidden">
        <div className="p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-3xl font-black uppercase tracking-tight">Sales <span className="text-emerald-500">Ledger</span></h3>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic font-serif">Transactional audit trail and fulfillment status</p>
          </div>
          <div className="flex gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search ledger..."
                className="bg-black/40 border-2 border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-all w-64 font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all flex items-center gap-2">
              <Filter size={14} />
              Filter
            </button>
            <button className="px-6 py-3 bg-zinc-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-600 transition-all flex items-center gap-2">
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40">
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-serif">Transaction ID</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-serif">Event Identifier</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-serif">Customer Entity</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-serif">Tier</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-serif">Amount (USD)</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 italic font-serif">Status</th>
                <th className="p-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_SALES.map((sale) => (
                <tr key={sale.id} className="group hover:bg-emerald-500/[0.02] transition-colors">
                  <td className="p-8 font-mono text-xs text-zinc-400">{sale.id}</td>
                  <td className="p-8">
                    <p className="font-bold text-white tracking-tight">{sale.event}</p>
                  </td>
                  <td className="p-8">
                    <p className="text-sm font-medium text-zinc-300">{sale.customer}</p>
                  </td>
                  <td className="p-8">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      sale.type === 'VIP' ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                    )}>
                      {sale.type}
                    </span>
                  </td>
                  <td className="p-8 font-mono text-sm text-emerald-400">${sale.price}.00</td>
                  <td className="p-8">
                    <div className="flex items-center gap-2">
                      {sale.status === 'Confirmed' && <Check size={14} className="text-emerald-500" />}
                      {sale.status === 'Pending' && <Clock size={14} className="text-orange-500" />}
                      {sale.status === 'Cancelled' && <X size={14} className="text-red-500" />}
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        sale.status === 'Confirmed' ? "text-emerald-500" : 
                        sale.status === 'Pending' ? "text-orange-500" : "text-zinc-500"
                      )}>
                        {sale.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
