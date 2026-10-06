import { Shield, AlertCircle, Scale, FileText, X } from 'lucide-react';

interface BookingPolicyProps {
  onClose?: () => void;
}

export const BookingPolicy = ({ onClose }: BookingPolicyProps) => {
  return (
    <div className="bg-zinc-950 text-zinc-300 p-8 rounded-[40px] border border-white/10 max-w-4xl mx-auto space-y-8 overflow-y-auto max-h-[80vh] relative">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      )}

      <header className="space-y-4">
        <div className="flex items-center gap-3 text-emerald-400">
          <Shield size={32} />
          <h1 className="text-3xl font-black tracking-tighter uppercase">Standard Booking Policy</h1>
        </div>
        <p className="text-sm text-zinc-500 font-medium">Last Updated: March 2026 • SonicStream V12 Framework</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-emerald-500" />
            1. Contractual Relationship
          </h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p>1. When a customer makes (or requests) a booking, it’s directly with the Service Provider – SonicStream is not a “contractual party.”</p>
            <p>2. SonicStream owns and operates the Platform, providing the infrastructure for artists and bookers to connect.</p>
            <p>3. Information about Service Providers (facilities, house rules, sustainability measures) and their Travel Experiences (prices, availability, and cancellation policies) is based on what they provide to us. They’re responsible for making sure it’s accurate and up to date.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle size={20} className="text-emerald-500" />
            2. Payment & Deposits
          </h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p>• A non-refundable 50% deposit is standard practice to secure the date.</p>
            <p>• The balance is typically due on the day of the show or within 30 days prior, as specified in the specific artist agreement.</p>
            <p>• Deposits ensure cash flow for preparatory expenses and protect against lost opportunity costs.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale size={20} className="text-emerald-500" />
            3. Cancellation & Refunds
          </h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p>• <strong>More than 30 days:</strong> Full refund of the rental/booking fee (excluding non-refundable deposit if applicable).</p>
            <p>• <strong>Less than 30 days:</strong> 50% refund of the total rental fee.</p>
            <p>• <strong>Less than 14 days / No-show:</strong> No refund will be issued.</p>
            <p>• <strong>Force Majeure:</strong> Cancellations due to extreme weather, sudden illness, or government mandates are handled on a case-by-case basis, typically allowing for rescheduling without penalty.</p>
            <p>• <strong>No-show Penalty:</strong> Users who fail to arrive on time or no-show can be penalized an extra 15% fee.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle size={20} className="text-emerald-500" />
            4. Overbooking & No-shows
          </h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p>• If a service provider is overbooked, they must find a suitable alternative or allow free cancellation with a full refund.</p>
            <p>• If a user overbooks or becomes a no-show, SonicStream V12 will automatically withdraw the deposit from the tier user account and refund the person booking, with an extra <strong>25% neglect fee</strong> applied to the account.</p>
            <p>• <strong>Late Arrivals:</strong> Service providers are only required to wait 30 minutes past the scheduled start time. After 30 minutes, the booking may be considered a no-show.</p>
          </div>
        </section>
      </div>

      <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-xl font-bold text-white">5. User Conduct & Responsibility</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <p>• Safe and respectful conduct is mandatory. Harassment, illegal activity, or dangerous behavior is strictly prohibited.</p>
            <p>• The person booking is responsible for the behavior of their party and for providing accurate, up-to-date information.</p>
            <p>• Users must keep contact and payment details current to ensure access to services.</p>
          </div>
          <div className="space-y-2">
            <p>• <strong>Fraud Prevention:</strong> We have the right to stop you from making bookings or cancel existing ones for fraud, abuse, non-compliance with policies, or inappropriate behavior.</p>
            <p>• <strong>Confirmation:</strong> Every valid booking includes a confirmation number, contact details, a reservation PIN, and the email address used when booking.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">6. Liability & Disclaimers</h2>
        <div className="text-sm space-y-2 leading-relaxed opacity-70">
          <p>SonicStream shall not be liable for any indirect or consequential loss, loss of profits, data, or business opportunities. We do not warrant that the platform will operate error-free or uninterrupted.</p>
          <p><strong>Arbitration Agreement:</strong> YOU AND SONICSTREAM HEREBY WAIVE ANY CONSTITUTIONAL AND STATUTORY RIGHTS TO SUE IN COURT AND HAVE A TRIAL IN FRONT OF A JUDGE OR A JURY. All disputes shall be resolved by binding arbitration.</p>
        </div>
      </div>

      <footer className="pt-8 border-t border-white/10 text-[10px] text-zinc-500 uppercase tracking-widest text-center">
        © 2026 SonicStream Multimedia V12 • All Rights Reserved
      </footer>
    </div>
  );
};
