import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import { motion } from 'framer-motion';
import { Calendar, Clock, DollarSign, CheckCircle2, XCircle, AlertCircle, ShieldAlert, Info } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { Booking } from '../../types';
import { Tooltip } from '../../components/ui/Tooltip';
import { toast } from 'react-hot-toast';

export const MyBookings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.bookings.getAll(),
  });

  const reportMutation = useMutation({
    mutationFn: async ({ bookingId, type }: { bookingId: string, type: 'overbooking' | 'no-show' }) => {
      // Mock API call
      console.log(`Reporting ${type} for booking ${bookingId}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, type };
    },
    onSuccess: (data) => {
      toast.success(`Reported ${data.type} successfully. SonicStream V12 is investigating.`);
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: () => {
      toast.error('Failed to submit report. Please try again.');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        <AlertCircle className="mx-auto mb-4" size={48} />
        <p>Failed to load bookings. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-4xl font-black uppercase tracking-tight">My Bookings</h2>
        <p className="text-zinc-400">Track your booking inquiries and confirmed sessions.</p>
      </header>

      {bookings.length === 0 ? (
        <div className="bg-zinc-900/50 border border-dashed border-white/10 rounded-[40px] p-20 text-center space-y-6">
          <Calendar className="mx-auto text-zinc-800" size={64} />
          <div className="space-y-2">
            <h3 className="text-xl font-bold">No bookings found</h3>
            <p className="text-zinc-500">You haven't made any booking inquiries yet.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking: Booking) => {
            const bookingDate = parseISO(booking.startTime);
            const canReport = booking.status === 'confirmed' && isPast(bookingDate);

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-white/5 rounded-[32px] p-8 flex flex-col space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                      <Calendar size={32} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold">Booking #{booking.id}</h3>
                        {booking.confirmationNumber && (
                          <span className="bg-white/5 px-2 py-1 rounded text-[10px] font-mono text-zinc-400">
                            {booking.confirmationNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {format(bookingDate, 'PPP p')}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          Total: ${booking.totalAmount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</div>
                      <div className="flex items-center gap-2">
                        {booking.status === 'confirmed' ? (
                          <span className="flex items-center gap-1 text-emerald-500 font-bold">
                            <CheckCircle2 size={16} />
                            Confirmed
                          </span>
                        ) : booking.status === 'cancelled' ? (
                          <span className="flex items-center gap-1 text-red-500 font-bold">
                            <XCircle size={16} />
                            Cancelled
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-500 font-bold">
                            <Clock size={16} />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Payment</div>
                      <div className="font-bold">
                        {booking.paymentStatus === 'paid' ? (
                          <span className="text-emerald-500">Paid</span>
                        ) : booking.paymentStatus === 'deposit_paid' ? (
                          <span className="text-amber-500">Deposit Paid</span>
                        ) : (
                          <span className="text-zinc-400">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {booking.status === 'confirmed' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-white/5">
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-1">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Reservation PIN</p>
                      <p className="text-lg font-black text-emerald-400">{booking.reservationPin || '----'}</p>
                    </div>
                    
                    {canReport && (
                      <>
                        <Tooltip content="Report if the artist did not show up. SonicStream will investigate and apply neglect fees if applicable.">
                          <button 
                            onClick={() => reportMutation.mutate({ bookingId: booking.id, type: 'no-show' })}
                            disabled={reportMutation.isPending}
                            className="flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 py-4 rounded-2xl font-bold text-sm hover:bg-red-500/20 transition-all"
                          >
                            <ShieldAlert size={16} />
                            Report No-Show
                          </button>
                        </Tooltip>
                        <Tooltip content="Report if the artist overbooked or was unable to perform due to scheduling conflicts.">
                          <button 
                            onClick={() => reportMutation.mutate({ bookingId: booking.id, type: 'overbooking' })}
                            disabled={reportMutation.isPending}
                            className="flex items-center justify-center gap-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 py-4 rounded-2xl font-bold text-sm hover:bg-orange-500/20 transition-all"
                          >
                            <AlertCircle size={16} />
                            Report Overbooking
                          </button>
                        </Tooltip>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl flex gap-4 items-start">
        <Info size={20} className="text-emerald-400 mt-1 flex-shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold text-sm">SonicStream V12 Protection</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            All bookings are protected by our V12 framework. If an artist fails to appear or overbooks, 
            you are entitled to a full refund of your deposit plus a 25% neglect fee credit. 
            Reports are investigated within 24-48 hours.
          </p>
        </div>
      </div>
    </div>
  );
};
