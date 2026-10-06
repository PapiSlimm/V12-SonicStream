import { Mail, Globe } from 'lucide-react';

export const ContactPage = () => (
  <div className="max-w-4xl mx-auto space-y-12">
    <header className="text-center space-y-4">
      <h2 className="text-4xl font-bold tracking-tight">Get in Touch</h2>
      <p className="text-zinc-400">Have a specific vision? Let's discuss your next big event.</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">First Name</label>
            <input type="text" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">Last Name</label>
            <input type="text" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase">Email Address</label>
          <input type="email" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase">Message</label>
          <textarea rows={4} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors resize-none" />
        </div>
        <button className="w-full bg-zinc-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-zinc-600 transition-all">
          Send Message
        </button>
      </div>
      <div className="space-y-6">
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-4">
          <h4 className="font-bold text-lg">Direct Contact</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-400 text-sm">
              <Mail size={18} className="text-emerald-400" />
              hello@sonicstream.com
            </div>
            <div className="flex items-center gap-3 text-zinc-400 text-sm">
              <Globe size={18} className="text-emerald-400" />
              Los Angeles, CA
            </div>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl">
          <h4 className="font-bold text-emerald-400 mb-2">Office Hours</h4>
          <p className="text-xs text-emerald-400/70 leading-relaxed">
            Mon - Fri: 9am - 6pm PST<br />
            Sat: 10am - 4pm PST<br />
            Sun: Closed
          </p>
        </div>
      </div>
    </div>
  </div>
);
