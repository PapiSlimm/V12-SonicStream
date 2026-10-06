import { useState } from 'react';
import { User, Calendar, DollarSign, ShieldCheck, ClipboardList, AlertTriangle, PenTool } from 'lucide-react';
import { Artist } from '../../types';

interface BookingAgreementProps {
  artist: Artist;
  customerName: string;
  customerEmail: string;
  bookingDate: Date;
  bookingTime: string;
  totalAmount: number;
  depositAmount: number;
  riderCosts: number;
  confirmationNumber: string;
  reservationPin: string;
  mustHaves?: string[];
  onConfirm?: (signature: string) => void;
  onCancel?: () => void;
}

export const BookingAgreement = ({
  artist,
  customerName,
  customerEmail,
  bookingDate,
  bookingTime,
  totalAmount,
  depositAmount,
  riderCosts,
  confirmationNumber,
  reservationPin,
  mustHaves = [],
  onConfirm,
  onCancel
}: BookingAgreementProps) => {
  const [signature, setSignature] = useState('');

  return (
    <div className="bg-white text-black p-12 rounded-[40px] shadow-2xl max-w-4xl mx-auto space-y-12 font-serif overflow-y-auto max-h-[90vh]">
      <header className="text-center space-y-4 border-b-2 border-black pb-8">
        <h1 className="text-4xl font-black uppercase tracking-tighter">Booking Agreement</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">SonicStream Multimedia V12 Standard Form</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-black pb-2 flex items-center gap-2">
            <User size={20} />
            1. Parties & Relationship
          </h2>
          <div className="space-y-2 text-sm">
            <p><strong>Artist (Service Provider):</strong> {artist.name} ({artist.type})</p>
            <p><strong>Booker (User):</strong> {customerName}</p>
            <p><strong>Booker Email:</strong> {customerEmail}</p>
            <div className="mt-4 p-3 bg-zinc-100 rounded-lg border border-zinc-200 text-[10px] leading-relaxed">
              <strong>NOTICE:</strong> This agreement is directly between the Artist and the Booker. 
              SonicStream acts solely as a platform provider and is NOT a party to this contract. 
              SonicStream is not responsible for the performance, quality, or conduct of either party.
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-black pb-2 flex items-center gap-2">
            <Calendar size={20} />
            2. Event Details
          </h2>
          <div className="space-y-2 text-sm">
            <p><strong>Date:</strong> {bookingDate.toLocaleDateString()}</p>
            <p><strong>Time:</strong> {bookingTime}</p>
            <p><strong>Duration:</strong> {artist.duration} Minutes</p>
            <p><strong>Confirmation #:</strong> {confirmationNumber}</p>
            <p><strong>Reservation PIN:</strong> {reservationPin}</p>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-black pb-2 flex items-center gap-2">
          <DollarSign size={20} />
          3. Financial Terms & Payments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          <div className="space-y-2">
            <p><strong>Performance Fee:</strong> ${artist.price.toFixed(2)}</p>
            <p><strong>Rider Costs:</strong> ${riderCosts.toFixed(2)}</p>
            <p><strong>Total Amount:</strong> ${totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-zinc-100 p-4 rounded-xl space-y-2 border-2 border-black">
            <p className="font-bold text-emerald-700">Deposit Due ({artist.depositPercentage || 50}%): ${depositAmount.toFixed(2)}</p>
            <p className="text-[10px] italic">Deposits are non-refundable to secure the date. The remaining balance is due 24 hours prior to the event.</p>
            <p className="text-[10px] font-bold text-orange-600 mt-2">NOTICE: High-value payments (&gt; $5,000) are held for 30 days for security verification.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-black pb-2 flex items-center gap-2">
            <ShieldCheck size={20} />
            4. Artist Obligations
          </h2>
          <ul className="text-sm space-y-2 list-disc pl-5">
            <li><strong>Performance Quality:</strong> Artist will perform to professional standards consistent with their profile.</li>
            <li><strong>Arrival:</strong> Artist will arrive at least 60 minutes prior to start time.</li>
            <li><strong>Professionalism:</strong> Artist will maintain a professional demeanor and adhere to safety protocols.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-black pb-2 flex items-center gap-2">
            <ClipboardList size={20} />
            5. Venue Responsibilities
          </h2>
          <ul className="text-sm space-y-2 list-disc pl-5">
            <li><strong>Safe Environment:</strong> Venue/Booker must provide a safe, secure area for performance and equipment.</li>
            <li><strong>Technical Support:</strong> Venue must meet the requirements specified in the Technical Rider.</li>
            <li><strong>Access:</strong> Venue must provide clear access for load-in and load-out.</li>
            {mustHaves.length > 0 && (
              <li className="font-bold text-red-600 uppercase">Must-Haves: {mustHaves.join(', ')}</li>
            )}
          </ul>
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-black pb-2 flex items-center gap-2">
          <AlertTriangle size={20} />
          6. Graduated Cancellation Scale
        </h2>
        <div className="text-sm space-y-4">
          <div className="grid grid-cols-2 gap-4 border border-black/10 p-4 rounded-xl bg-zinc-50">
            <div>
              <p className="font-bold">Cancellation Period</p>
              <p className="text-xs text-zinc-500">Time before event</p>
            </div>
            <div>
              <p className="font-bold">Refund Amount</p>
              <p className="text-xs text-zinc-500">% of Total Fee</p>
            </div>
            <div className="border-t border-black/5 pt-2">30+ Days</div>
            <div className="border-t border-black/5 pt-2">50% (Deposit Forfeit)</div>
            <div className="border-t border-black/5 pt-2">14-29 Days</div>
            <div className="border-t border-black/5 pt-2">25% Refund</div>
            <div className="border-t border-black/5 pt-2">Less than 14 Days</div>
            <div className="border-t border-black/5 pt-2">0% (Full Forfeit)</div>
          </div>
          <div className="text-xs space-y-2 italic text-zinc-600">
            <p>• <strong>Force Majeure:</strong> Neither party is liable for failure to perform due to acts of God, war, or government orders.</p>
            <p>• <strong>Late Arrivals:</strong> If the Booker is more than 30 minutes late, the Artist may consider it a no-show.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-8 border-t-2 border-black">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <PenTool size={20} />
          7. E-Signature
        </h2>
        <div className="space-y-4">
          <p className="text-xs text-zinc-500">By typing your name below, you agree that this constitutes a legally binding digital signature under the Electronic Signatures in Global and National Commerce (ESIGN) Act.</p>
          <input 
            type="text"
            placeholder="Type your full name to sign"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className="w-full border-b-2 border-black py-4 text-2xl font-serif italic outline-none placeholder:text-zinc-200"
          />
        </div>
      </section>

      <div className="pt-12 flex gap-6">
        {onCancel && (
          <button 
            onClick={onCancel}
            className="flex-1 py-4 border-2 border-black font-bold uppercase tracking-widest hover:bg-zinc-100 transition-colors"
          >
            Cancel
          </button>
        )}
        {onConfirm && (
          <button 
            onClick={() => onConfirm(signature)}
            disabled={!signature || signature.toLowerCase() !== customerName.toLowerCase()}
            className="flex-1 py-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm & Sign
          </button>
        )}
      </div>

      <footer className="text-center pt-8 text-[10px] text-zinc-400 uppercase tracking-widest">
        SonicStream Multimedia V12 • Booking Agreement {confirmationNumber}
      </footer>
    </div>
  );
};
