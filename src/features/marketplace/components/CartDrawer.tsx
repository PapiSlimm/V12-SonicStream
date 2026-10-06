import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../../context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const { items, removeFromCart, total, itemCount, updateQuantity } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-zinc-950 border-l border-white/10 z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter">Your V12 Cart</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{itemCount} Items Selected</p>
              </div>
              <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
                    <ShoppingCart size={32} />
                  </div>
                  <p className="text-zinc-500 font-medium">Your cart is empty.</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex items-center gap-6 p-4 bg-white/5 rounded-[24px] group border border-white/5">
                    <div className="w-20 h-20 bg-zinc-800 rounded-2xl overflow-hidden shrink-0">
                      <img 
                        src={item.imageUrl || 'https://picsum.photos/seed/placeholder/100/100'} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/100/100';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate">{item.name}</div>
                      <div className="text-xs text-zinc-500 mb-2">{item.brandName || 'V12 Artist'}</div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 bg-white/5 hover:bg-white/10 rounded-md flex items-center justify-center text-zinc-400"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 bg-white/5 hover:bg-white/10 rounded-md flex items-center justify-center text-zinc-400"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-400 mb-1">${(item.price * item.quantity).toFixed(2)}</div>
                      <button onClick={() => removeFromCart(item.id)} className="text-[10px] text-zinc-600 hover:text-red-400 font-black uppercase tracking-widest">Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-8 bg-zinc-900/80 backdrop-blur-xl border-t border-white/10 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest">Subtotal</span>
                    <span className="text-white font-bold">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest">Processing Fee</span>
                    <span className="text-white font-bold">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-2xl font-black pt-2">
                    <span className="text-white tracking-tighter">Total</span>
                    <span className="text-emerald-400 tracking-tighter">${total.toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={onCheckout}
                  className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-black/20 transition-all flex items-center justify-center gap-3"
                >
                  Secure Checkout
                  <ArrowRight size={20} />
                </button>
                <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                  <ShieldCheck size={14} />
                  Secured by V12 Payments
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
