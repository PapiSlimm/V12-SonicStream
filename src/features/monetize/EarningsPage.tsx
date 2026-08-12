/**
 * EarningsPage — the "make money on V12" surface.
 *
 * Renders the personalized earning avenues, the published transaction terms
 * (with Headless Financial named as the system of record), the all-in price
 * calculator (seller sets → sees exactly what they net + the buyer price),
 * and one-click sharing to the top 20 social platforms with the price baked in.
 *
 * Pure data comes from /api/monetize/*; no business math lives in the client.
 */
import { useEffect, useState } from 'react';
import { DollarSign, Share2, TrendingUp, Radio, ShoppingBag, Ticket, Crown, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchShareLinks, shareTo, type ShareLinkDto } from './share';

interface Avenue { id: string; name: string; pitch: string; how: string; endpoint: string }
interface Breakdown { sellerSetCents: number; platformFeeCents: number; processingFeeCents: number; buyerAllInCents: number; sellerNetCents: number; tier: string; display: string }

const ICONS: Record<string, any> = {
  'sell-tracks': DollarSign, 'radio-royalties': Radio, sponsorship: TrendingUp,
  merch: ShoppingBag, events: Ticket, 'go-pro': Crown,
};

function authHeader(): Record<string, string> {
  try {
    const t = localStorage.getItem('token') ?? localStorage.getItem('authToken') ?? '';
    return t ? { authorization: `Bearer ${t}` } : {};
  } catch { return {}; }
}
const money = (c: number) => `$${(c / 100).toFixed(2)}`;

export const EarningsPage = () => {
  const [avenues, setAvenues] = useState<Avenue[]>([]);
  const [advantages, setAdvantages] = useState<string[]>([]);
  const [tier, setTier] = useState('free');
  const [priceInput, setPriceInput] = useState('12.99');
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLinkDto[]>([]);

  useEffect(() => {
    fetch('/api/monetize/opportunities', { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => { setAvenues(d.avenues ?? []); setAdvantages(d.advantages ?? []); setTier(d.tier ?? 'free'); })
      .catch(() => toast.error('Could not load earning opportunities'));
  }, []);

  const calc = async () => {
    const cents = Math.round(parseFloat(priceInput) * 100);
    if (!Number.isInteger(cents) || cents < 50) { toast.error('Enter a price of at least $0.50'); return; }
    try {
      const r = await fetch('/api/monetize/price-breakdown', {
        method: 'POST', headers: { 'content-type': 'application/json', ...authHeader() },
        body: JSON.stringify({ sellerSetCents: cents }),
      });
      const d = await r.json();
      if (d.breakdown) {
        setBreakdown(d.breakdown);
        setShareLinks(await fetchShareLinks({ title: 'My release on SonicStream', link: window.location.origin, sellerSetCents: cents, kind: 'track' }));
      } else toast.error(d.error ?? 'Pricing failed');
    } catch { toast.error('Pricing service unavailable'); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 max-w-6xl mx-auto space-y-10">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-emerald-400"><Sparkles size={18} /><span className="text-xs font-black uppercase tracking-widest">Maximize your capital</span></div>
        <h1 className="text-4xl font-black">Earn on V12</h1>
        <p className="text-zinc-400">You set the price. You net exactly what you set. Your current tier: <span className="text-emerald-400 font-bold uppercase">{tier}</span>.</p>
      </header>

      {/* Avenues */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {avenues.map((a) => {
          const Icon = ICONS[a.id] ?? DollarSign;
          return (
            <div key={a.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-2 hover:border-emerald-500/30 transition-all">
              <Icon size={20} className="text-emerald-400" />
              <h3 className="font-bold text-sm">{a.name}</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{a.pitch}</p>
              <p className="text-[10px] text-zinc-600">{a.how}</p>
            </div>
          );
        })}
      </section>

      {/* All-in price calculator */}
      <section className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-black flex items-center gap-2"><DollarSign size={18} className="text-emerald-400" /> Set your price</h2>
        <div className="flex gap-3 items-center">
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-3">
            <span className="text-zinc-500">$</span>
            <input value={priceInput} onChange={(e) => setPriceInput(e.target.value)} inputMode="decimal"
              className="w-28 bg-transparent py-3 px-1 outline-none text-white" />
          </div>
          <button onClick={calc} className="bg-emerald-600 hover:bg-emerald-500 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest">Calculate</button>
        </div>
        {breakdown && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <Stat label="You net" value={money(breakdown.sellerNetCents)} highlight />
            <Stat label="Platform fee" value={money(breakdown.platformFeeCents)} />
            <Stat label="Processing" value={money(breakdown.processingFeeCents)} />
            <Stat label="Buyer pays (all-in)" value={money(breakdown.buyerAllInCents)} highlight />
          </div>
        )}
        {breakdown && (
          <p className="text-[11px] text-zinc-500">Buyers see one all-in price everywhere — including every shared link. Settlement and payout are handled by Headless Financial, the V12 accounting system of record.</p>
        )}
      </section>

      {/* Share to top 20 — price included */}
      {shareLinks.length > 0 && (
        <section className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-black flex items-center gap-2"><Share2 size={18} className="text-emerald-400" /> Share to the top 20 — price included</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {shareLinks.map((l) => (
              <button key={l.platform} onClick={() => shareTo(l)}
                className="text-xs font-bold px-3 py-2.5 bg-white/5 hover:bg-emerald-500/15 hover:text-emerald-300 rounded-xl transition-all flex items-center justify-between">
                <span>{l.name}</span>
                {l.mode === 'copy' && <span className="text-[8px] text-zinc-600 uppercase">copy</span>}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-zinc-500">Every caption carries the all-in price. App-first platforms (Instagram, TikTok, YouTube, WeChat, Snapchat) copy a ready-made caption + link to paste.</p>
        </section>
      )}

      {/* Why V12 */}
      {advantages.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-black">Why creators earn more on V12</h2>
          <ul className="space-y-2">
            {advantages.map((w, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-300"><span className="text-emerald-400 font-black">›</span>{w}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

const Stat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`rounded-xl p-3 border ${highlight ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/30 border-white/5'}`}>
    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</div>
    <div className={`text-lg font-black ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</div>
  </div>
);

export default EarningsPage;
