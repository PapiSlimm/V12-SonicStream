import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, DollarSign, Calendar, X, CreditCard, Settings, Shield, Info } from 'lucide-react';
import { format, startOfToday, eachDayOfInterval, addDays, isSameDay } from 'date-fns';
import { Artist, PaymentMethod, Booking, SonicEvent } from '../../types';
import { cn } from '../../utils/cn';
import { BookingPolicy } from './BookingPolicy';
import { BookingAgreement } from './BookingAgreement';
import { Tooltip } from '../../components/ui/Tooltip';
import { useArtists } from '../../hooks/useApi';
import { useLocation } from 'react-router-dom';

interface BookingSystemProps {
  artists?: Artist[];
}

export const BookingSystem = ({ artists: initialArtists }: BookingSystemProps) => {
  const { data: fetchedArtists = [] } = useArtists();
  const artists = initialArtists || fetchedArtists;
  const location = useLocation();
  const state = location.state as { artist?: Artist, event?: SonicEvent } | null;
  const initialArtist = state?.artist || null;
  const initialEvent = state?.event || null;

  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(initialArtist);

  useEffect(() => {
    if (artists.length > 0 && !selectedArtist) {
      if (initialEvent) {
        const artist = artists.find(a => a.id === initialEvent.artistId);
        if (artist) setSelectedArtist(artist);
      } else if (initialArtist) {
        setSelectedArtist(initialArtist);
      }
    }
  }, [artists, initialEvent, initialArtist, selectedArtist]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (initialEvent) {
      return new Date(initialEvent.date);
    }
    return startOfToday();
  });
  const [selectedTime, setSelectedTime] = useState<string | null>(() => {
    if (initialEvent) {
      return initialEvent.time || null;
    }
    return null;
  });
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [dynamicPrice, setDynamicPrice] = useState<{ dynamicPrice: number, deposit: number, commission: number } | null>(null);
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);
  const [agreedToPerformanceGuarantee, setAgreedToPerformanceGuarantee] = useState(false);
  const [agreedToNoLiability, setAgreedToNoLiability] = useState(false);
  const [mustHaves, setMustHaves] = useState(initialEvent ? `Venue: ${initialEvent.venue}, City: ${initialEvent.city}` : '');
  const [riderCosts, setRiderCosts] = useState({
    soundLight: 0,
    backline: 0,
    hotel: 0,
    flights: 0,
    meals: 0
  });

  const totalRiderCost = Object.values(riderCosts).reduce((a, b) => a + b, 0);

  // Generate confirmation details when agreement is shown
  const confirmationDetails = useMemo(() => ({
    number: `BK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    pin: Math.floor(1000 + Math.random() * 9000).toString()
  }), []); // Generate once per component mount

  const fetchPrice = useCallback(async () => {
    if (!selectedArtist || !selectedTime) return;
    const startTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    try {
      const res = await fetch('/api/bookings/price', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sonic_token')}`
        },
        body: JSON.stringify({
          artistId: selectedArtist.id,
          startTime: startTime.toISOString(),
          duration: selectedArtist.duration
        })
      });
      const data = await res.json();
      if (res.status === 403) {
        alert("Premium subscription required for booking services.");
        setSelectedArtist(null);
        return;
      }
      setDynamicPrice(data);
    } catch (err) {
      console.error(err);
    }
  }, [selectedArtist, selectedDate, selectedTime]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
  ];

  const handleBooking = async (signature?: string) => {
    if (!selectedArtist || !selectedTime || !customerInfo.name || !customerInfo.email || !agreedToPolicies || !agreedToPerformanceGuarantee || !agreedToNoLiability) return;
    
    setIsBooking(true);
    try {
      const startTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sonic_token')}`
        },
        body: JSON.stringify({
          artistId: selectedArtist.id,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          startTime: startTime.toISOString(),
          endTime: addDays(startTime, 0.1).toISOString(), // Mock end time
          paymentMethod: paymentMethod,
          totalAmount: (dynamicPrice?.dynamicPrice || selectedArtist.bookingPrice || selectedArtist.price),
          riderCosts: totalRiderCost,
          mustHaves: mustHaves.split(',').map(s => s.trim()).filter(Boolean),
          signature: signature,
          performanceGuaranteeId: `PG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          confirmationNumber: confirmationDetails.number,
          reservationPin: confirmationDetails.pin
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Booking failed');

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        setConfirmedBooking(data.booking);
        setBookingSuccess(true);
      }
    } catch (error: any) {
      alert(error.message || 'Booking failed');
    } finally {
      setIsBooking(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-10">
        <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-12 text-center space-y-6 shadow-2xl">
          <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tighter uppercase">Booking Confirmed!</h2>
            <p className="text-zinc-400">Your reservation has been successfully processed and secured.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/5">
            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confirmation #</p>
              <p className="text-xl font-black text-white">{confirmedBooking?.confirmationNumber || confirmationDetails.number}</p>
            </div>
            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Reservation PIN</p>
              <p className="text-xl font-black text-emerald-400">{confirmedBooking?.reservationPin || confirmationDetails.pin}</p>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl text-left space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-400">Artist</span>
              <span className="text-sm font-bold text-white">{selectedArtist?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-400">Date & Time</span>
              <span className="text-sm font-bold text-white">{format(selectedDate, 'MMMM d, yyyy')} at {selectedTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-400">Email Used</span>
              <span className="text-sm font-bold text-white">{customerInfo.email}</span>
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <p className="text-xs text-zinc-500 italic">
              A detailed receipt and digital agreement have been sent to your email. 
              Please keep your PIN secure for check-in and identity verification.
            </p>
            <button 
              onClick={() => {
                setBookingSuccess(false);
                setSelectedArtist(null);
                setSelectedTime(null);
                setCustomerInfo({ name: '', email: '' });
              }}
              className="w-full bg-zinc-700 text-white py-4 rounded-2xl font-bold text-lg hover:bg-zinc-600 transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <AnimatePresence>
        {showPolicy && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-4xl"
            >
              <BookingPolicy onClose={() => setShowPolicy(false)} />
            </motion.div>
          </div>
        )}

        {showAgreement && selectedArtist && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-4xl"
            >
              <BookingAgreement 
                artist={selectedArtist}
                customerName={customerInfo.name}
                customerEmail={customerInfo.email}
                bookingDate={selectedDate}
                bookingTime={selectedTime || ''}
                totalAmount={(dynamicPrice?.dynamicPrice || selectedArtist.bookingPrice || selectedArtist.price) + totalRiderCost}
                depositAmount={(dynamicPrice?.deposit || ((selectedArtist.bookingPrice || selectedArtist.price) + totalRiderCost) * 0.5)}
                riderCosts={totalRiderCost}
                confirmationNumber={confirmationDetails.number}
                reservationPin={confirmationDetails.pin}
                mustHaves={mustHaves.split(',').map(s => s.trim()).filter(Boolean)}
                onConfirm={(signature) => {
                  setShowAgreement(false);
                  handleBooking(signature);
                }}
                onCancel={() => setShowAgreement(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 text-emerald-400 mb-2">
          <Shield size={24} />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">SonicStream V12 Secure Booking</span>
        </div>
        <h2 className="text-5xl font-black tracking-tighter uppercase">Book an Experience</h2>
        <p className="text-zinc-400 font-medium">Select a professional artist and secure your date with our V12 framework.</p>
      </header>

      {!selectedArtist ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {artists.map((artist) => (
            <motion.div 
              key={artist.id}
              whileHover={{ y: -5 }}
              className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden cursor-pointer group"
              onClick={() => setSelectedArtist(artist)}
            >
              <div className="aspect-square overflow-hidden relative">
                <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <p className="text-xs text-zinc-300 line-clamp-2">{artist.bio}</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{artist.name}</h3>
                  <p className="text-emerald-400 text-sm font-medium">{artist.type}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Clock size={14} /> {artist.duration}m
                  </div>
                  <div className="flex items-center gap-1 font-bold text-white">
                    <DollarSign size={14} /> {artist.bookingPrice || artist.price}
                  </div>
                </div>
                <Tooltip content={`Book ${artist.name} for your event`}>
                  <button className="w-full bg-white text-white py-3 rounded-xl font-bold group-hover:bg-zinc-700 transition-colors">
                    Select Artist
                  </button>
                </Tooltip>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <Tooltip content="Go back to artist selection">
              <button 
                onClick={() => setSelectedArtist(null)}
                className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-medium"
              >
                <X size={16} /> Change Artist
              </button>
            </Tooltip>
            <div className="flex items-center gap-6">
              <img src={selectedArtist.imageUrl} alt={selectedArtist.name} className="w-24 h-24 rounded-2xl object-cover" referrerPolicy="no-referrer" />
              <div>
                <h3 className="text-2xl font-bold">{selectedArtist.name}</h3>
                <p className="text-emerald-400 font-medium">{selectedArtist.type}</p>
                <p className="text-sm text-zinc-400 mt-1">{selectedArtist.duration} minute session • ${selectedArtist.bookingPrice || selectedArtist.price}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold flex items-center gap-2">
                <Calendar size={18} className="text-emerald-400" />
                1. Select Date
              </h4>
              <div className="grid grid-cols-7 gap-2">
                {eachDayOfInterval({ start: startOfToday(), end: addDays(startOfToday(), 13) }).map((date) => (
                  <Tooltip key={date.toISOString()} content={format(date, 'MMMM do')}>
                    <button
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-xl border transition-all w-full",
                        isSameDay(date, selectedDate)
                          ? "bg-zinc-700 border-zinc-600 text-white font-bold"
                          : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20"
                      )}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-60">{format(date, 'EEE')}</span>
                      <span className="text-lg">{format(date, 'd')}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold flex items-center gap-2">
                <Clock size={18} className="text-emerald-400" />
                2. Select Time
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {timeSlots.map((time) => (
                  <Tooltip key={time} content={`Book at ${time}`}>
                    <button
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        "py-3 rounded-xl border text-sm font-bold transition-all w-full",
                        selectedTime === time
                          ? "bg-zinc-700 border-zinc-600 text-white"
                          : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20"
                      )}
                    >
                      {time}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold flex items-center gap-2">
                <Settings size={18} className="text-emerald-400" />
                3. Additional Requirements (Riders)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/30 p-4 rounded-2xl border border-white/5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Sound & Lighting</label>
                    <Tooltip content="Cost for audio and visual equipment">
                      <Info size={12} className="text-zinc-500" />
                    </Tooltip>
                  </div>
                  <input 
                    type="number" 
                    value={riderCosts.soundLight}
                    onChange={(e) => setRiderCosts({...riderCosts, soundLight: Number(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm"
                    placeholder="$0.00"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Backline (Gear)</label>
                    <Tooltip content="Cost for musical instruments and amplifiers">
                      <Info size={12} className="text-zinc-500" />
                    </Tooltip>
                  </div>
                  <input 
                    type="number" 
                    value={riderCosts.backline}
                    onChange={(e) => setRiderCosts({...riderCosts, backline: Number(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm"
                    placeholder="$0.00"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Hotel & Lodging</label>
                    <Tooltip content="Cost for artist accommodation">
                      <Info size={12} className="text-zinc-500" />
                    </Tooltip>
                  </div>
                  <input 
                    type="number" 
                    value={riderCosts.hotel}
                    onChange={(e) => setRiderCosts({...riderCosts, hotel: Number(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm"
                    placeholder="$0.00"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Travel (Flights/Gas)</label>
                    <Tooltip content="Cost for artist transportation">
                      <Info size={12} className="text-zinc-500" />
                    </Tooltip>
                  </div>
                  <input 
                    type="number" 
                    value={riderCosts.flights}
                    onChange={(e) => setRiderCosts({...riderCosts, flights: Number(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm"
                    placeholder="$0.00"
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Must-Haves (Comma separated)</label>
                    <Tooltip content="Crucial requirements for the performance (e.g. Specific Mic, Stage Size)">
                      <Info size={12} className="text-zinc-500" />
                    </Tooltip>
                  </div>
                  <input 
                    type="text" 
                    value={mustHaves}
                    onChange={(e) => setMustHaves(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Shure SM58, 10x10 Stage"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-400" />
                4. Payment Method
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {(['stripe', 'paypal', 'square'] as const).map((method) => (
                  <Tooltip key={method} content={`Pay via ${method}`}>
                    <button
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        "py-4 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all w-full",
                        paymentMethod === method
                          ? "bg-zinc-700 border-zinc-600 text-white"
                          : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20"
                      )}
                    >
                      {method}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-8 h-fit lg:sticky lg:top-24">
            <h4 className="text-xl font-bold">5. Finalize Booking</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  placeholder="john@example.com"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Guaranteed Fee</span>
                <span>${dynamicPrice ? dynamicPrice.dynamicPrice.toFixed(2) : (selectedArtist.bookingPrice || selectedArtist.price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Additional Rider Costs</span>
                <span>${totalRiderCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">SonicStream Commission (10%)</span>
                <span className="text-zinc-500">${dynamicPrice ? dynamicPrice.commission.toFixed(2) : ((selectedArtist.bookingPrice || selectedArtist.price) * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                <span className="text-zinc-400">Total Project Cost</span>
                <span className="font-bold">${( (dynamicPrice ? dynamicPrice.dynamicPrice : (selectedArtist.bookingPrice || selectedArtist.price)) + totalRiderCost ).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-4 border-t border-white/5 text-emerald-400">
                <span>Deposit Due Now (50%)</span>
                <span>${( (dynamicPrice ? dynamicPrice.deposit : (selectedArtist.bookingPrice || selectedArtist.price) * 0.5) + (totalRiderCost * 0.5) ).toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-zinc-500 italic">Pricing and availability are subject to change based on specific markets and events.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={agreedToPolicies}
                  onChange={(e) => setAgreedToPolicies(e.target.checked)}
                  className="mt-1 accent-emerald-500" 
                />
                <span className="text-[10px] text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                  I agree to the <button onClick={(e) => { e.preventDefault(); setShowPolicy(true); }} className="text-emerald-400 hover:underline font-bold">Standard Booking Policy</button>. I understand the 50% non-refundable deposit ensures cash flow for preparatory expenses and protects against the inability to book other clients for this time.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={agreedToPerformanceGuarantee}
                  onChange={(e) => setAgreedToPerformanceGuarantee(e.target.checked)}
                  className="mt-1 accent-emerald-500" 
                />
                <span className="text-[10px] text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                  I agree to the <strong>Performance Guarantee Policy</strong>. I commit to a legally binding bank guarantee or surety bond. I accept the <strong>15% Default Fee</strong> clause if the project is not completed or standards are not met.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={agreedToNoLiability}
                  onChange={(e) => setAgreedToNoLiability(e.target.checked)}
                  className="mt-1 accent-emerald-500" 
                />
                <span className="text-[10px] text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                  I acknowledge that <strong>V12 Multimedia SonicStream</strong> acts merely in a middle agency capacity. No partnership, joint venture, or agency agreement is constructed, and SonicStream has no liability in connection with this matter.
                </span>
              </label>

              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex gap-3 items-start">
                <Info size={16} className="text-orange-400 mt-1 flex-shrink-0" />
                <p className="text-[10px] text-orange-200 leading-relaxed">
                  <strong>Neglect Fee Warning:</strong> If you overbook or become a no-show, SonicStream V12 will automatically withdraw the deposit and apply an extra <strong>25% neglect fee</strong>.
                </p>
              </div>

              <Tooltip content="Review the final agreement before confirming your booking">
                <button 
                  onClick={() => setShowAgreement(true)}
                  disabled={isBooking || !agreedToPolicies || !agreedToPerformanceGuarantee || !agreedToNoLiability || !selectedTime || !customerInfo.name || !customerInfo.email}
                  className="w-full bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg hover:bg-zinc-600 transition-all shadow-lg shadow-black/20"
                >
                  {isBooking ? "Processing..." : `Review Agreement & Book`}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
