import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Pricing() {
  const { user, getIdToken } = useAuth();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      alert('Please sign in to upgrade.');
      return;
    }

    setLoading(prev => ({ ...prev, [priceId]: true }));
    
    try {
      const token = await getIdToken();
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          priceId, 
          userId: user.id
        }),
      });
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(prev => ({ ...prev, [priceId]: false }));
    }
  };

  const plans = [
    { 
      name: "Free", 
      price: "$0/mo", 
      priceId: "price_xxx_free",
      features: ["Artist profile", "AI tools", "Social sharing"],
      cta: "Get started"
    },
    { 
      name: "Pro", 
      price: "$29/mo", 
      priceId: "price_xxx_pro",
      features: ["Unlimited uploads", "HLS streaming", "Merch", "Bookings"],
      cta: "Upgrade now",
      popular: true
    }
  ];

  return (
    <div className="py-20 bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-black text-center mb-12 uppercase tracking-tighter">Simple pricing for artists</h1>
        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`p-8 rounded-[32px] border-4 transition-all ${
              plan.popular 
                ? 'border-emerald-500 bg-zinc-900 shadow-2xl scale-105' 
                : 'border-white/5 bg-zinc-900/50 hover:border-emerald-500/30'
            }`}>
              {plan.popular && (
                <div className="mb-6 bg-zinc-700 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest w-fit mx-auto">
                  Most popular
                </div>
              )}
              <h2 className="text-3xl font-black mb-4 uppercase">{plan.name}</h2>
              <div className="text-4xl font-black text-emerald-500 mb-8">{plan.price}</div>
              <ul className="space-y-4 mb-8 text-zinc-400 font-medium">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleCheckout(plan.priceId)}
                disabled={loading[plan.priceId]}
                className="w-full py-5 px-6 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
              >
                {loading[plan.priceId] ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
