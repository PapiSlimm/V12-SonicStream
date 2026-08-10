import { useState } from 'react';
import { RefreshCw, DollarSign, CheckCircle2, Calendar, Users, MoreVertical, Mail, ShieldCheck, CreditCard, Globe, AlertCircle, Instagram, Twitter, Facebook, Share2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Stats, Booking, EmailLog } from '../../types';
import { api } from '../../api';
import { cn } from '../../utils/cn';
import { StatCard } from '../../components/ui/StatCard';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  stats: Stats | null;
  bookings: Booking[];
  emailLogs: EmailLog[];
  onRunReminders: () => Promise<void>;
}

export const AdminDashboard = ({ 
  stats, 
  bookings, 
  emailLogs, 
  onRunReminders 
}: AdminDashboardProps) => {
  const [isRunningJob, setIsRunningJob] = useState(false);
  const [isProcessingDelivery, setIsProcessingDelivery] = useState(false);
  const [isPrecomputing, setIsPrecomputing] = useState(false);

  const handleRunJob = async () => {
    setIsRunningJob(true);
    await onRunReminders();
    setIsRunningJob(false);
  };

  const handlePrecompute = async () => {
    setIsPrecomputing(true);
    try {
      const data = await api.admin.precomputeSimilar();
      toast.success(`Precomputed ${data.precomputedCount} similarities.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPrecomputing(false);
    }
  };

  const handleProcessDelivery = async () => {
    setIsProcessingDelivery(true);
    try {
      const data = await api.admin.processDelivery();
      toast.success(`Processed ${data.processedCount} delivery jobs.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingDelivery(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Executive Overview</h2>
          <p className="text-zinc-400">Real-time performance metrics for your booking platform.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handlePrecompute}
            disabled={isPrecomputing}
            className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/5 flex items-center gap-2"
          >
            <RefreshCw size={16} className={isPrecomputing ? "animate-spin" : ""} />
            {isPrecomputing ? "Precomputing..." : "Precompute Similarities"}
          </button>
          <button 
            onClick={handleProcessDelivery}
            disabled={isProcessingDelivery}
            className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/5 flex items-center gap-2"
          >
            <RefreshCw size={16} className={isProcessingDelivery ? "animate-spin" : ""} />
            {isProcessingDelivery ? "Processing..." : "Process Delivery Jobs"}
          </button>
          <button 
            onClick={handleRunJob}
            disabled={isRunningJob}
            className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/5 flex items-center gap-2"
          >
            <RefreshCw size={16} className={isRunningJob ? "animate-spin" : ""} />
            {isRunningJob ? "Running Job..." : "Run Reminder Job"}
          </button>
          <button className="flex-1 md:flex-none bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Configure System
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Revenue" value={`$${stats?.totalRevenue.toLocaleString()}`} trend="+12.5%" icon={DollarSign} />
        <StatCard label="Total Bookings" value={stats?.totalBookings || 0} trend="+8.2%" icon={CheckCircle2} />
        <StatCard label="Upcoming Events" value={stats?.upcomingBookings || 0} trend="+15.1%" icon={Calendar} color="blue" />
        <StatCard label="Active Artists" value={stats?.activeArtists || 0} trend="+3" icon={Users} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Recent Bookings</h3>
              <button className="text-emerald-400 text-sm font-medium hover:underline">View All</button>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-zinc-500 uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Artist</th>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Payment</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-emerald-400">
                            {booking.artistName?.[0]}
                          </div>
                          <span className="font-medium">{booking.artistName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium">{booking.customerName}</p>
                          <p className="text-zinc-500 text-xs">{booking.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p>{format(parseISO(booking.startTime), 'MMM d, yyyy')}</p>
                          <p className="text-zinc-500 text-xs">{format(parseISO(booking.startTime), 'h:mm a')}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="capitalize">{booking.paymentMethod || 'N/A'}</p>
                          <p className="text-emerald-400 text-xs font-bold">Dep: ${booking.depositAmount?.toFixed(2)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                          booking.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        )}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 hover:bg-white/10 rounded-lg transition-colors text-zinc-500 group-hover:text-white">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Automated Email Logs</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Live Feed
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
              <div className="divide-y divide-white/5">
                {emailLogs.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500">
                    <Mail size={32} className="mx-auto mb-4 opacity-20" />
                    <p>No automated emails sent yet.</p>
                  </div>
                ) : (
                  emailLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-white/5 transition-colors flex items-start gap-4">
                      <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                        <Mail size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold truncate">{log.subject}</p>
                          <span className="text-[10px] text-zinc-500 uppercase font-bold">{format(parseISO(log.sentAt), 'MMM d, h:mm a')}</span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate mb-1">To: {log.recipient}</p>
                        <p className="text-xs text-zinc-500 line-clamp-1 italic">"{log.body}"</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase">
                        <CheckCircle2 size={12} />
                        Sent
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold">System Health</h3>
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">Calendar Sync</p>
                  <p className="text-xs text-zinc-500">Google & Outlook Active</p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">Payments</p>
                  <p className="text-xs text-zinc-500">Stripe Gateway Online</p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <Globe size={18} />
              </div>
              <div>
                <p className="text-sm font-medium">Global Availability</p>
                <p className="text-xs text-zinc-500">142 Active Markets</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-emerald-400" size={20} />
              <h4 className="font-bold text-emerald-400">Optimization Tip</h4>
            </div>
            <p className="text-sm text-emerald-400/80 leading-relaxed">
              The 50% deposit requirement has reduced last-minute cancellations by 68%. Automated reminders are further ensuring a 98% attendance rate.
            </p>
            <button className="mt-4 text-sm font-bold text-emerald-400 hover:underline">
              Enable SMS (Beta)
            </button>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-zinc-500">Promotion Hub</h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl text-xs font-bold transition-colors">
                <Instagram size={14} /> Story
              </button>
              <button className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl text-xs font-bold transition-colors">
                <Twitter size={14} /> Tweet
              </button>
              <button className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl text-xs font-bold transition-colors">
                <Facebook size={14} /> Post
              </button>
              <button className="flex items-center justify-center gap-2 bg-zinc-700 text-white p-3 rounded-xl text-xs font-bold transition-colors">
                <Share2 size={14} /> Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
