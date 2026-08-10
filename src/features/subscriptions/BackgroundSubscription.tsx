import { Zap, Music, Globe, CheckCircle, Star } from 'lucide-react';

export const BackgroundSubscription = () => {
  const plans = [
    {
      name: 'Premium Backgrounds',
      price: 599,
      yearly: true,
      features: [
        'AI-generated custom backgrounds',
        'Live concert video backgrounds',
        'Soundwave animations',
        'R&B/Hip-Hop instrumentals',
        'Priority rendering',
        '4K quality'
      ]
    }
  ];

  const subscribe = async (plan: any) => {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan: 'premium-backgrounds',
          price: plan.price * 100, // cents
          successUrl: `${window.location.origin}/dashboard?backgrounds=activated`
        })
      });
      
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-20 px-6">
      <div className="text-center mb-20 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/20">
          <Star size={16} />
          Artist Experience Upgrade
        </div>
        <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-500 bg-clip-text text-transparent mb-6 tracking-tighter">
          Premium Backgrounds
        </h1>
        <p className="text-2xl text-zinc-400 max-w-2xl mx-auto font-medium">
          Unlock AI-generated live concert backgrounds for your artist page and immersive soundwave experiences.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="relative p-8 bg-zinc-900/30 border border-white/5 rounded-[40px] group transition-all">
          <div className="relative p-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 text-2xl">
              🆓
            </div>
            <h3 className="text-3xl font-bold mb-6 text-white">Standard</h3>
            <div className="text-4xl font-black text-white mb-8">$0</div>
            <ul className="space-y-4 mb-8 text-zinc-500">
              <li className="flex items-center gap-2"><CheckCircle size={16} className="text-zinc-700" /> Default concert backgrounds</li>
              <li className="flex items-center gap-2 opacity-50"><Zap size={16} /> No custom AI backgrounds</li>
              <li className="flex items-center gap-2 opacity-50"><Music size={16} /> Standard audio quality</li>
            </ul>
            <button className="w-full py-4 rounded-2xl border border-white/10 text-zinc-400 font-bold cursor-not-allowed">
              Current Plan
            </button>
          </div>
        </div>

        {/* Premium Plan */}
        <div className="relative p-8 bg-gradient-to-br from-emerald-500/10 via-purple-500/5 to-blue-500/10 border-2 border-emerald-400/30 rounded-[40px] shadow-2xl shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all group overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="bg-zinc-700 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Best Value</span>
          </div>
          <div className="relative p-4">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-purple-400 rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-xl">
              🎵
            </div>
            <h3 className="text-3xl font-bold mb-6 text-white">Premium</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-5xl font-black text-emerald-400">$599</div>
              <div className="text-zinc-500 font-bold">/ year</div>
            </div>
            <div className="text-xs text-emerald-300 uppercase tracking-wider mb-8 font-bold">Billed annually ($49.91/mo)</div>
            <ul className="space-y-4 mb-12 text-white">
              <li className="flex items-center gap-2"><Globe size={18} className="text-emerald-400" /> AI-generated custom backgrounds</li>
              <li className="flex items-center gap-2"><Zap size={18} className="text-emerald-400" /> Live concert video backgrounds</li>
              <li className="flex items-center gap-2"><Music size={18} className="text-emerald-400" /> Soundwave animations</li>
              <li className="flex items-center gap-2"><Star size={18} className="text-emerald-400" /> R&B/Hip-Hop instrumentals</li>
            </ul>
            <button
              onClick={() => subscribe(plans[0])}
              className="w-full bg-gradient-to-r from-emerald-500 to-purple-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] transition-all"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>

      {/* Payment Options */}
      <div className="grid md:grid-cols-3 gap-6 text-center p-12 bg-zinc-900/30 border border-white/5 rounded-[40px]">
        <div>
          <div className="text-2xl font-bold mb-2 text-white">$49.92/month</div>
          <div className="text-zinc-500 text-sm">Billed yearly (save 17%)</div>
        </div>
        <div>
          <div className="text-2xl font-bold mb-2 text-white">$74.92/quarter</div>
          <div className="text-zinc-500 text-sm">Billed quarterly</div>
        </div>
        <div>
          <div className="text-2xl font-bold mb-2 text-white">$599/year</div>
          <div className="text-zinc-500 text-sm">One-time annual payment</div>
        </div>
      </div>
    </div>
  );
};
