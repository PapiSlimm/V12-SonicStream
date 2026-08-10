import { X, ShoppingBag, ShieldCheck, CreditCard, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
}

export const CheckoutModal = ({ isOpen, onClose, items }: CheckoutModalProps) => {
  const subtotal = items.reduce((acc, item) => acc + item.price, 0);
  
  // Calculate fees based on item type
  const fees = items.reduce((acc, item) => {
    if (item.type === 'digital' || item.type === 'download') {
      return acc + (item.price * 0.10); // 10% for MP3 downloads
    }
    return acc + (item.price * 0.03); // 3% for merch and tickets
  }, 0);

  const total = subtotal + fees;

  const handleCheckout = async () => {
    toast.loading('Processing payment...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.dismiss();
    
    // Check for digital downloads
    const downloads = items.filter(item => item.type === 'download' || item.type === 'digital');
    if (downloads.length > 0) {
      toast.success('Payment successful! Starting your downloads...');
      downloads.forEach(item => {
        // In a real app, this would be a signed URL from the backend
        console.log(`Triggering download for: ${item.name}`);
        // Simulate download trigger
        toast(`Downloading ${item.name}...`, {
          icon: '🎵',
        });
      });
    } else {
      toast.success('Order placed successfully!');
    }
    
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-zinc-900 border border-white/10 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-8 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center text-white">
                  <ShoppingBag size={20} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Unified Checkout</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Left Side: Items */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Your Order</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 scrollbar-hide">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden">
                        {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{item.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded-full text-zinc-500">
                            {item.type}
                          </span>
                          <div className="text-xs text-emerald-400 uppercase font-black tracking-widest">${item.price}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Summary */}
              <div className="space-y-8">
                <div className="bg-black/40 p-8 rounded-3xl border border-white/5 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">V12 Processing Fees</span>
                    <span className="text-emerald-400 font-bold">${fees.toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Total</span>
                    <span className="text-3xl font-black text-white">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 justify-center">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    Secure V12 Encryption
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl shadow-black/20 transition-all"
                  >
                    <CreditCard size={20} />
                    Complete Purchase
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
