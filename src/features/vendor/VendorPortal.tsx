import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Store, Package, DollarSign, TrendingUp, Plus, Trash2, Loader2,
  ShoppingBag, BadgePercent, Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, json } from '../../api/apiFetch';
import { commerceApi } from '../../api/commerce';
import { Product } from '../../types';
import { cn } from '../../utils/cn';

/**
 * Vendor Portal — 2026-10-08.
 * One SONIC AUTH identity, role decides access: creators/artists see this,
 * buyers don't. Earnings come from the commission ledger (bst_sales rows the
 * checkout writes and the Stripe webhook completes).
 */

interface Earnings {
  sales: number;
  grossRevenue: number;
  netRevenue: number;
  publishedProducts: number;
  recent: any[];
}

const money = (n: number | string | null | undefined) =>
  `$${(Number(n) || 0).toFixed(2)}`;

export const VendorPortal = () => {
  const { user, isArtist, isCreator } = useAuth() as any;
  const [tab, setTab] = useState<'overview' | 'products' | 'sales'>('overview');
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', description: '', kind: 'digital' });
  const [rates, setRates] = useState<Record<string, number>>({ default: 0.10, physical: 0.05, digital: 0.15, service: 0.10 });

  useEffect(() => {
    apiFetch<Record<string, number>>('/api/commission-rates').then(setRates).catch(() => {});
  }, []);

  const isVendor = !!user && (isArtist || isCreator || user.userType === 'creator' || user.userType === 'artist');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [e, mine] = await Promise.all([
        apiFetch<Earnings>('/api/bst/earnings').catch(() => null),
        apiFetch<Product[]>(`/api/products/artist/${encodeURIComponent(user?.id || '')}`).catch(() => []),
      ]);
      if (e) setEarnings(e);
      setProducts(mine || []);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { if (isVendor) load(); }, [isVendor, load]);

  const createProduct = async () => {
    const price = Number(form.price);
    if (!form.name || !Number.isFinite(price) || price <= 0) {
      toast.error('Name and a price above $0 are required');
      return;
    }
    setCreating(true);
    try {
      await commerceApi.products.create({ name: form.name, price, description: form.description, kind: form.kind } as any);
      toast.success('Product published to your storefront');
      setForm(f => ({ ...f, name: '', price: '', description: '' }));
      await load();
    } catch {
      toast.error('Could not create product');
    } finally {
      setCreating(false);
    }
  };

  const removeProduct = async (id: string) => {
    try {
      await commerceApi.products.delete(id);
      toast.success('Product removed');
      await load();
    } catch {
      toast.error('Could not remove product');
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-zinc-400">
        Sign in to open your vendor portal.
      </div>
    );
  }

  if (!isVendor) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
          <Store className="text-emerald-500" size={28} />
        </div>
        <h2 className="text-2xl font-black text-white">Become a Creator to Sell</h2>
        <p className="text-zinc-500 max-w-md text-sm">
          The vendor portal is for creator accounts. Upgrade your account type in Profile Settings
          to publish products and start earning.
        </p>
      </div>
    );
  }

  const stats = [
    { label: 'Net Earnings', value: money(earnings?.netRevenue), icon: Wallet, accent: 'text-emerald-400' },
    { label: 'Gross Sales', value: money(earnings?.grossRevenue), icon: DollarSign, accent: 'text-white' },
    { label: 'Orders', value: String(earnings?.sales ?? 0), icon: ShoppingBag, accent: 'text-white' },
    { label: 'Live Products', value: String(earnings?.publishedProducts ?? products.length), icon: Package, accent: 'text-white' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
          <Store className="text-emerald-500" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Vendor Portal</h1>
          <p className="text-zinc-500 text-sm">Your storefront, sales, and earnings — one place.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {([['overview', 'Overview', TrendingUp], ['products', 'Products', Package], ['sales', 'Sales', DollarSign]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all',
              tab === id ? 'bg-emerald-500 text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            )}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : tab === 'overview' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(s => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-white/5 rounded-2xl p-5"
              >
                <s.icon size={18} className="text-zinc-600 mb-3" />
                <p className={cn('text-2xl font-black', s.accent)}>{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 flex items-start gap-3">
            <BadgePercent className="text-emerald-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-zinc-400">
              You keep <span className="text-white font-bold">85–95%</span> of every sale depending on
              product type (physical {Math.round((1 - (rates.physical ?? 0.05)) * 100)}%, service {Math.round((1 - (rates.service ?? 0.10)) * 100)}%, digital {Math.round((1 - (rates.digital ?? 0.15)) * 100)}%).
              The fee funds payments, hosting, and your storefront — no listing fees, no monthly charges.
            </p>
          </div>
        </div>
      ) : tab === 'products' ? (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="font-black text-white flex items-center gap-2"><Plus size={16} /> New Product</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Product name"
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50"
              />
              <input
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="Price (USD)"
                inputMode="decimal"
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50"
              />
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['digital', 'physical', 'service'] as const).map(k => (
                <button
                  key={k}
                  onClick={() => setForm(f => ({ ...f, kind: k }))}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                    form.kind === k ? 'bg-emerald-500 text-black' : 'bg-white/5 text-zinc-500 hover:bg-white/10'
                  )}
                >
                  {k} · {Math.round((rates[k] ?? rates.default) * 100)}%
                </button>
              ))}
            </div>
            {Number(form.price) > 0 && (
              <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 text-sm">
                {(() => {
                  const price = Number(form.price) || 0;
                  const rate = rates[form.kind] ?? rates.default;
                  const fee = Math.round(price * rate * 100) / 100;
                  const take = Math.round((price - fee) * 100) / 100;
                  return (
                    <div className="flex flex-wrap gap-x-8 gap-y-1">
                      <span className="text-zinc-500">List price <span className="text-white font-bold">{money(price)}</span></span>
                      <span className="text-zinc-500">Platform fee ({Math.round(rate * 100)}%) <span className="text-white font-bold">{money(fee)}</span></span>
                      <span className="text-zinc-500">You keep <span className="text-emerald-400 font-black">{money(take)}</span></span>
                    </div>
                  );
                })()}
              </div>
            )}
            <button
              onClick={createProduct}
              disabled={creating}
              className="px-6 py-3 bg-emerald-500 text-black rounded-xl font-black text-sm hover:bg-emerald-400 transition-all disabled:opacity-50"
            >
              {creating ? 'Publishing…' : 'Publish Product'}
            </button>
          </div>

          <div className="space-y-2">
            {products.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-10">No products yet — publish your first one above.</p>
            ) : products.map(p => (
              <div key={p.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{(p as any).name || (p as any).title}</p>
                  <p className="text-xs text-zinc-500">{money((p as any).price)}</p>
                </div>
                <button
                  onClick={() => removeProduct(String(p.id))}
                  className="text-zinc-600 hover:text-red-400 transition-colors p-2"
                  title="Remove product"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {(earnings?.recent?.length ?? 0) === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-10">No sales yet. Share your storefront link to start earning.</p>
          ) : earnings!.recent.map((s: any) => (
            <div key={s.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Order #{s.id}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">{s.createdAt || s.created_at}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-400">{money(s.sellerRevenue ?? s.seller_revenue)}</p>
                <p className="text-[10px] text-zinc-500">of {money(s.amount)} gross</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
