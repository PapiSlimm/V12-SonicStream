import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Star, Share2, CheckCircle } from 'lucide-react';
import { Product } from '../../../types';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  getProductIcon: (type: string) => React.ReactNode;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ 
  product, 
  onClose, 
  onAddToCart,
  getProductIcon 
}) => {
  if (!product) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-zinc-950 rounded-[48px] border border-white/10 overflow-hidden shadow-2xl"
        >
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all z-10"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col md:flex-row h-full">
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-zinc-900">
              <img 
                src={product.imageUrl || 'https://picsum.photos/seed/placeholder/800/800'} 
                alt={product.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="w-full md:w-1/2 p-12 flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-500/20">
                    {getProductIcon(product.type)}
                    {product.type.replace('_', ' ')}
                  </div>
                  {product.isOfficial && (
                    <div className="px-3 py-1 bg-zinc-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle size={12} />
                      Official
                    </div>
                  )}
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">{product.name}</h2>
                <p className="text-xl text-zinc-400 font-medium">by {product.brandName || product.sellerName || 'V12 Artist'}</p>
              </div>

              <div className="text-4xl font-black text-emerald-400">${product.price.toFixed(2)}</div>

              <p className="text-zinc-500 leading-relaxed">
                {product.description || 'No description available for this product.'}
              </p>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="text-emerald-500" fill="currentColor" />)}
                  <span className="text-sm text-zinc-600 font-bold ml-2">(42 Reviews)</span>
                </div>
                <button className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                  <Share2 size={16} />
                  Share Product
                </button>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-black/20 transition-all flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={24} />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
