import React, { useState } from 'react';
import { 
  Ticket, 
  MapPin, 
  Users, 
  Zap, 
  ChevronRight,
  Info,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SonicEvent } from '../../types';
import { cn } from '../../utils/cn';

interface TicketingSystemProps {
  events: SonicEvent[];
  initialEvent?: SonicEvent | null;
}

export const TicketingSystem: React.FC<TicketingSystemProps> = ({ events, initialEvent }) => {
  const [selectedEvent, setSelectedEvent] = useState<SonicEvent | null>(initialEvent || null);
  const [ticketCount, setTicketCount] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const handlePurchase = async () => {
    if (!selectedEvent) return;
    setIsPurchasing(true);
    // Mock purchase
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPurchasing(false);
    setPurchaseSuccess(true);
  };

  if (purchaseSuccess) {
    return (
      <div className="p-12 text-center space-y-8">
        <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black uppercase tracking-tight">Tickets Secured!</h2>
          <p className="text-zinc-400 max-w-md mx-auto">
            Your tickets for <span className="text-white font-bold">{selectedEvent?.title}</span> have been sent to your email. Get ready for an immersive experience.
          </p>
        </div>
        <button 
          onClick={() => {
            setPurchaseSuccess(false);
            setSelectedEvent(null);
            setTicketCount(1);
          }}
          className="px-12 py-4 bg-zinc-700 text-white rounded-2xl font-black text-lg hover:scale-105 transition-all"
        >
          View More Events
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <h2 className="text-4xl font-black uppercase tracking-tight">Live Experiences</h2>
          <p className="text-zinc-400">Secure your spot at the next SonicStream event.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-zinc-900/50 border border-white/5 p-1 rounded-2xl flex">
            <button className="px-6 py-2 bg-zinc-700 text-white rounded-xl text-sm font-bold">Upcoming</button>
            <button className="px-6 py-2 text-zinc-500 hover:text-white rounded-xl text-sm font-bold">Past</button>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Event List */}
        <div className="lg:col-span-2 space-y-6">
          {events.map((event) => (
            <motion.div 
              key={event.id}
              whileHover={{ x: 10 }}
              onClick={() => setSelectedEvent(event)}
              className={cn(
                "p-8 rounded-[32px] border transition-all cursor-pointer group flex flex-col md:flex-row gap-8",
                selectedEvent?.id === event.id 
                  ? "bg-emerald-500/10 border-emerald-500/50" 
                  : "bg-zinc-900/30 border-white/5 hover:border-white/20"
              )}
            >
              <div className="w-full md:w-48 aspect-video md:aspect-square rounded-2xl overflow-hidden shrink-0 relative">
                <img 
                  src={event.imageUrl || `https://picsum.photos/seed/${event.id}/400/400`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt={event.title} 
                />
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{event.title}</h3>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{event.artistName}</p>
                </div>
                
                <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-500" />
                    {event.venue}, {event.city}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-purple-500" />
                    {event.ticketsAvailable} Tickets Left
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="text-2xl font-black text-white">
                    ${event.price}
                    <span className="text-xs text-zinc-500 font-normal ml-2">/ ticket</span>
                  </div>
                  <button className="p-3 bg-white/5 rounded-xl group-hover:bg-zinc-700 group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Checkout Sidebar */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {selectedEvent ? (
              <motion.div 
                key="checkout"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-8 space-y-8 sticky top-24"
              >
                <div className="space-y-4">
                  <h3 className="text-xl font-black uppercase tracking-tight">Checkout</h3>
                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden">
                      <img src={selectedEvent.imageUrl || `https://picsum.photos/seed/${selectedEvent.id}/100/100`} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <p className="font-bold text-sm truncate">{selectedEvent.title}</p>
                      <p className="text-[10px] text-zinc-500 uppercase font-black">{selectedEvent.venue}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Quantity</label>
                  <div className="flex items-center justify-between bg-black rounded-2xl p-2 border border-white/10">
                    <button 
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      className="w-12 h-12 flex items-center justify-center text-xl font-bold hover:bg-white/5 rounded-xl transition-colors"
                    >
                      -
                    </button>
                    <span className="text-xl font-black">{ticketCount}</span>
                    <button 
                      onClick={() => setTicketCount(Math.min(10, ticketCount + 1))}
                      className="w-12 h-12 flex items-center justify-center text-xl font-bold hover:bg-white/5 rounded-xl transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="font-bold">${(selectedEvent.price * ticketCount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Service Fee</span>
                    <span className="font-bold">${(selectedEvent.price * ticketCount * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-black pt-4 border-t border-white/10 text-emerald-400">
                    <span>Total</span>
                    <span>${(selectedEvent.price * ticketCount * 1.1).toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex gap-3">
                  <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-400/80 leading-relaxed">
                    Tickets are non-refundable but can be transferred to other SonicStream users.
                  </p>
                </div>

                <button 
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="w-full h-16 bg-zinc-700 text-white rounded-2xl font-black text-lg hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3"
                >
                  {isPurchasing ? (
                    <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap size={20} fill="currentColor" />
                      Buy Tickets
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <div className="h-[400px] bg-zinc-900/20 border border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center text-center p-8 space-y-4">
                <Ticket size={48} className="text-zinc-800" />
                <div>
                  <h3 className="font-bold text-zinc-500 uppercase tracking-widest text-xs">No Event Selected</h3>
                  <p className="text-zinc-600 text-xs mt-2">Select an event from the list to view details and purchase tickets.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
