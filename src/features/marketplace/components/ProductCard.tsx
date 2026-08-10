import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Share2, CheckCircle, Eye, Heart } from 'lucide-react';
import { Product } from '../../../types';
import { cn } from '../../../utils/cn';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  getProductIcon: (type: string) => React.ReactNode;
  onShare: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onQuickView,
  isWishlisted,
  onToggleWishlist,
  getProductIcon,
  onShare
}) => {
  // Simulated inventory
  const inventoryCount = Math.floor(Math.random() * 10) + 1;
  const isLowStock = inventoryCount <= 3;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-zinc-900/50 border border-white/5 rounded-[32px] overflow-hidden hover:bg-zinc-900 transition-all hover:shadow-2xl hover:shadow-emerald-500/5"
    >
      <div className="aspect-square bg-zinc-800 relative overflow-hidden">
        <img 
          src={product.imageUrl || 'https://picsum.photos/seed/placeholder/400/400'} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/400/400';
          }}
        />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/10">
            {getProductIcon(product.type)}
            {product.type.replace('_', ' ')}
          </div>
          {product.isOfficial && (
            <div className="px-3 py-1 bg-zinc-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle size={12} />
              Official
            </div>
          )}
          {isLowStock && (
            <div className="px-3 py-1 bg-amber-500 text-black rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
              Only {inventoryCount} left
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onToggleWishlist(product.id)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all",
              isWishlisted ? "bg-red-500 text-white" : "bg-black/40 text-white hover:bg-black/60"
            )}
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={() => onQuickView(product)}
            className="w-10 h-10 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition-all"
          >
            <Eye size={18} />
          </button>
        </div>

        <button 
          onClick={() => onAddToCart(product)}
          className="absolute bottom-4 right-4 w-12 h-12 bg-zinc-700 text-white rounded-full flex items-center justify-center shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all"
        >
          <ShoppingCart size={20} />
        </button>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{product.name}</h3>
            {product.sellerId ? (
              <a 
                href={`/artist/${product.sellerId}`} 
                className="text-sm text-zinc-400 font-medium hover:text-emerald-400 hover:underline transition-all block truncate"
                onClick={(e) => e.stopPropagation()}
              >
                by {product.brandName || product.sellerName || 'V12 Artist'}
              </a>
            ) : (
              <p className="text-sm text-zinc-500 font-medium truncate">by {product.brandName || product.sellerName || 'V12 Artist'}</p>
            )}
          </div>
          <div className="text-lg font-black text-emerald-400">${product.price.toFixed(2)}</div>
        </div>
        
        <p className="text-xs text-zinc-500 line-clamp-2 h-8">
          {(product.description || '').toLowerCase().includes('http') ? 'Description unavailable' : (product.description || 'No description provided')}
        </p>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={10} className="text-emerald-500" fill="currentColor" />)}
            <span className="text-[10px] text-zinc-600 font-bold ml-1">(42)</span>
          </div>
          <button 
            onClick={() => onShare(product)}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Share2 size={12} />
            Share
          </button>
        </div>
      </div>
    </motion.div>
  );
};
