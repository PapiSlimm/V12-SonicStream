import { useState, useEffect } from 'react';
import { ShoppingCart, Printer, Truck, Shield, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PRINT_PRODUCTS, PRO_PRINT_PRODUCTS, PrintProduct } from '../../types/printing';
import PrintCheckout from './PrintCheckout';
import OrderSuccess from './OrderSuccess';
import { motion, AnimatePresence } from 'framer-motion';
import { soundService } from '../../services/soundService';

const PrintingStore = ({ onNavigate }: { onNavigate?: (tab: string) => void }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [estimateVisible, setEstimateVisible] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const success = params.get('success');

    if (success === 'true' && sessionId) {
      fetchOrder(sessionId);
    }
  }, []);

  const fetchOrder = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/printing/order-by-session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const order = await response.json();
        setOrderSuccess(order);
        // Clear URL params without refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      console.error('Failed to fetch order', err);
    }
  };

  const categories = [
    'all', 'Business Cards', 'Flyers & Brochures', 
    'Postcards', 'Stickers & Labels', 'Booklets & Catalogs', 
    'Door Hangers', 'Rack Cards', 'Event Signage', 'Stationery', 'Physical Media'
  ];

  const addToCart = (product: PrintProduct, options: any) => {
    const item = { product, options, id: Date.now() };
    setCart(prev => [...prev, item]);
    soundService.play('click');
  };

  const total = cart.reduce((sum, item) => sum + item.product.our_price, 0);

  const handleOrderSuccess = (order: any) => {
    setOrderSuccess(order);
    setCart([]);
    setShowCheckout(false);
    soundService.play('success');
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-black py-16">
        <OrderSuccess 
          order={orderSuccess} 
          onClose={() => setOrderSuccess(null)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 pb-24 relative">
      <AnimatePresence>
        {showCheckout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] overflow-y-auto pt-20 pb-20"
          >
            <div className="max-w-7xl mx-auto px-4 relative">
              <button 
                onClick={() => setShowCheckout(false)}
                className="absolute top-0 right-4 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white transition-all z-[110]"
              >
                <X size={24} />
              </button>
              <PrintCheckout 
                cart={cart} 
                onSuccess={handleOrderSuccess} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/30 px-6 py-3 rounded-2xl mb-8">
            <Printer size={24} className="text-emerald-400" />
            <span className="text-lg font-bold text-emerald-300">Digital Printing Services</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            Professional 
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent ml-4">
              Printing
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Instant quotes • Premium quality • Fast turnaround
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
              <Truck size={16} /> Free shipping over $99
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
              <Shield size={16} /> 100% satisfaction guaranteed
            </div>
            <button 
              onClick={() => onNavigate?.('policies')} 
              className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl transition-all"
            >
              <Shield size={16} /> View Printing Policy
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-8 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg",
                activeCategory === cat
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-black/50"
                  : "bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 border border-white/10"
              )}
            >
              {cat === 'all' ? 'View All Products' : cat}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[...PRINT_PRODUCTS, ...PRO_PRINT_PRODUCTS]
            .filter(p => activeCategory === 'all' || p.category === activeCategory)
            .map(product => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
        </div>

        {/* Quote Calculator (ZooPrinting Style) */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-12 backdrop-blur-xl">
          <h3 className="text-3xl font-bold text-center mb-12">Get Instant Quote</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400">Product</label>
              <select className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white">
                <option>Business Cards</option>
                <option>Flyers & Brochures</option>
                <option>Postcards</option>
                <option>Stickers & Labels</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400">Size</label>
              <select className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white">
                <option>3.5" x 2"</option>
                <option>4" x 6"</option>
                <option>8.5" x 11"</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400">Quantity</label>
              <select className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white">
                <option>100</option>
                <option>250</option>
                <option>500</option>
                <option>1000</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400">Paper</label>
              <select className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white">
                <option>16pt Glossy</option>
                <option>14pt Matte</option>
                <option>100lb Gloss Text</option>
              </select>
            </div>
          </div>
          <div className="text-center mt-12">
            <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-black/50 transition-all">
              Calculate Price
            </button>
          </div>
        </div>

        {/* Cart & Order Summary */}
        {cart.length > 0 && (
          <div className="bg-gradient-to-r from-zinc-900/90 to-black/90 border border-emerald-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <ShoppingCart size={32} className="text-emerald-400" />
              <h3 className="text-3xl font-bold">Order Summary</h3>
              <div className="ml-auto text-2xl font-bold text-emerald-400">
                ${total.toFixed(2)}
              </div>
            </div>
            
            <div className="space-y-4 mb-8 max-h-96 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl">
                  <div className="flex-1">
                    <div className="font-bold">{item.product.name}</div>
                    <div className="text-sm text-zinc-400">
                      {item.options.quantity} • {item.options.paper_stock}
                    </div>
                  </div>
                  <div className="text-xl font-bold">${item.product.our_price.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/10">
              <div className="text-center p-6 bg-emerald-500/10 rounded-2xl">
                <div className="text-2xl font-bold text-emerald-400">${total.toFixed(2)}</div>
                <div className="text-sm text-zinc-400">Subtotal</div>
              </div>
              <div className="text-center p-6 bg-blue-500/10 rounded-2xl">
                <div className="text-2xl font-bold text-blue-400">${(total * 0.08).toFixed(2)}</div>
                <div className="text-sm text-zinc-400">Est. Tax (8%)</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl">
                <div className="text-3xl font-black text-white">${(total * 1.08).toFixed(2)}</div>
                <div className="text-sm text-zinc-300">Total (incl. tax)</div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <label className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-2xl border border-white/5 cursor-pointer hover:border-emerald-500/50 transition-all group">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-emerald-500"
                  onChange={() => {
                    // Logic to handle proof request
                  }}
                />
                <div className="flex-1">
                  <div className="font-bold group-hover:text-emerald-400 transition-colors">Request Digital/Hard Copy Proof</div>
                  <div className="text-xs text-zinc-400">Mandatory for SonicPro & Enterprise. Ensures accuracy before final run.</div>
                </div>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-12">
              <button 
                onClick={() => setShowCheckout(true)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-black/50 transition-all flex items-center justify-center gap-3"
              >
                <ShoppingCart size={24} />
                Proceed to Secure Checkout
              </button>
              <button 
                onClick={() => setEstimateVisible(true)}
                className="flex-1 bg-zinc-800/50 hover:bg-zinc-700 border border-white/20 py-5 rounded-2xl font-bold text-xl transition-all"
              >
                PDF Quote
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ZooPrinting Estimate Modal */}
      {estimateVisible && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-white/10 sticky top-0 bg-zinc-900/50 backdrop-blur-xl flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold mb-2">Professional Quote</h2>
                <p className="text-zinc-400">Powered by SonicStream Printing Services</p>
              </div>
              <button 
                onClick={() => setEstimateVisible(false)}
                className="text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-xl mb-4">Order Details</h3>
                  {cart.map(item => (
                    <div key={item.id} className="border-b border-white/10 pb-4 mb-4 last:border-b-0">
                      <div className="font-bold">{item.product.name}</div>
                      <div className="text-zinc-400 text-sm">Qty: {item.options.quantity}</div>
                      <div className="text-emerald-400 font-bold">${item.product.our_price.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-4">Pricing Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Tax (8%):</span>
                      <span>${(total * 0.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl border-t border-white/10 pt-2 mt-2">
                      <span>Total:</span>
                      <span>${(total * 1.08).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-white/10 space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                  <Shield size={20} className="text-emerald-400" />
                  Production & Quality Guarantee
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300">
                  <li>• Printed using premium 4-color digital process</li>
                  <li>• 100% satisfaction guaranteed or full refund</li>
                  <li>• Fastest turnaround times in industry</li>
                  <li>• Free standard shipping on orders over $99</li>
                  <li>• Powered by enterprise-grade ZooPrinting infrastructure</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ product, onAdd }: { product: PrintProduct, onAdd: (p: PrintProduct, o: any) => void }) => {
  const [options] = useState({
    size: product.sizes[0],
    paper_stock: product.paper_stock[0],
    quantity: product.quantities[0]
  });

  return (
    <div className="group bg-zinc-900/30 hover:bg-zinc-900/70 border border-white/10 hover:border-emerald-500/50 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
      <div className="h-48 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-2xl mb-6 group-hover:scale-105 transition-transform flex items-center justify-center">
        <Printer size={48} className="text-zinc-600 group-hover:text-emerald-500/50 transition-colors" />
      </div>
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold group-hover:text-emerald-400 transition-colors">{product.name}</h3>
          <div className="text-3xl font-black text-emerald-400 mt-2">${product.our_price.toFixed(2)}</div>
        </div>
        <div className="text-sm text-zinc-400 space-y-2">
          <div>Turnaround: <span className="font-semibold text-white">{product.turnaround}</span></div>
          <div className="flex gap-2 flex-wrap">
            Sizes: {product.sizes.slice(0,2).map(s => 
              <span key={s} className="px-2 py-1 bg-white/5 rounded text-xs">{s}</span>
            )}
          </div>
        </div>
        <button 
          onClick={() => onAdd(product, options)}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-black/50 transition-all group-hover:scale-[1.02]"
        >
          Add to Quote
        </button>
      </div>
    </div>
  );
};

export default PrintingStore;
