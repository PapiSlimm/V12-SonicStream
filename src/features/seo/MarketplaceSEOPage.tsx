import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Meta } from '../../components/SEO/Meta';
import { ProductSchema } from '../../components/SEO/JsonLd';
import { motion } from 'framer-motion';
import { ShoppingBag, User, ArrowLeft } from 'lucide-react';
import { ShareButtons } from '../../components/social/ShareButtons';
import { api } from '../../api';
import { Product } from '../../types';

export const MarketplaceSEOPage = () => {
  const { product: productParam } = useParams();
  const [item, setItem] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!productParam) { setLoading(false); return; }
      try {
        // The shareable URL param is the Firestore product ID. Try a direct lookup first;
        // fall back to matching by slugified name so older shared links keep working.
        let found = await api.commerce.products.getById(productParam).catch(() => null);

        const all = await api.commerce.products.getAll().catch(() => [] as Product[]);
        if (!found) {
          const slugOf = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          found = (all as Product[]).find(p => slugOf(p.name) === productParam) || null;
        }

        if (!cancelled) {
          setItem(found);
          if (found) {
            setRelated((all as Product[]).filter(p => p.id !== found!.id).slice(0, 2));
          }
        }
      } catch {
        if (!cancelled) setItem(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [productParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">
          Loading product…
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
        <Meta title="Product Not Found" noIndex />
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-4xl font-black tracking-tighter uppercase">Product Not Found</h1>
          <p className="text-zinc-400">This item may have been removed or the link is incorrect.</p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-2xl font-bold uppercase tracking-wider text-sm transition-all"
          >
            <ArrowLeft size={16} />
            Browse the Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://sonicstream.com/marketplace/${item.id}`;
  const imageUrl = item.imageUrl || 'https://sonicstream.com/og-image.jpg';
  const price = item.price ?? (item.priceCents ? item.priceCents / 100 : 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Meta
        title={`${item.name} | Marketplace`}
        description={item.description}
        image={imageUrl}
        url={shareUrl}
        type="website"
      />

      <ProductSchema
        name={item.name}
        image={imageUrl}
        description={item.description}
        brand={item.sellerName || item.brandName || 'SonicStream Creator'}
        price={price}
        url={shareUrl}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="aspect-square bg-zinc-900 rounded-[60px] overflow-hidden border border-white/5"
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700">
              <ShoppingBag size={80} />
            </div>
          )}
        </motion.div>

        <div className="space-y-12">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-widest">
              {item.type?.replace(/_/g, ' ') || 'Product'}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">{item.name}</h1>
            {item.sellerName && (
              <div className="flex items-center gap-2 text-xl font-bold text-zinc-400">
                <User size={20} />
                {item.sellerName}
              </div>
            )}
            <p className="text-3xl font-black text-white">${price.toFixed(2)}</p>
            <div className="flex items-start gap-4">
              <p className="text-zinc-400 text-lg leading-relaxed flex-1">{item.description}</p>
              <ShareButtons url={shareUrl} title={`Check out ${item.name} on SonicStream!`} />
            </div>
            {item.status === 'sold_out' && (
              <div className="inline-block px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold uppercase tracking-widest">
                Sold Out
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Link
              to="/marketplace"
              className="bg-zinc-700 hover:bg-zinc-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl shadow-black/20 transition-all"
            >
              <ShoppingBag size={20} />
              View in Marketplace
            </Link>
          </div>

          {related.length > 0 && (
            <div className="pt-12 border-t border-white/5 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">More From the Marketplace</h3>
              <div className="grid grid-cols-2 gap-4">
                {related.map((rel) => (
                  <Link
                    key={rel.id}
                    to={`/marketplace/${rel.id}`}
                    className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
                  >
                    <div className="aspect-square bg-zinc-800 rounded-xl mb-3 overflow-hidden">
                      {rel.imageUrl && (
                        <img src={rel.imageUrl} alt={rel.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{rel.name}</div>
                    <div className="text-[10px] font-black text-emerald-400 mt-1">
                      ${(rel.price ?? (rel.priceCents ? rel.priceCents / 100 : 0)).toFixed(2)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
