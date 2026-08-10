import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ShoppingCart, Truck, Shield, CreditCard, CheckCircle, FileUp, AlertCircle } from 'lucide-react';
import { calculatePrintOrderTotal, type ShippingAddress, type PrintOrderLineItem } from '../../utils/printPricing';
import { validatePDF } from '../../utils/pdfValidation';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51P...dummy');

interface PrintCheckoutProps {
  cart: PrintOrderLineItem[];
  onSuccess: (orderId: string) => void;
}

const PrintCheckout = ({ cart, onSuccess }: PrintCheckoutProps) => {
  const [address, setAddress] = useState<ShippingAddress>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    weight: 0,
    orderValue: 0
  });
  const [totals, setTotals] = useState<any>(null);
  const [printFile, setPrintFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Calculate total weight from cart
  const totalWeight = cart.reduce((sum, item) => {
    return sum + (item.options.quantity * 0.02); // 0.02lbs per item estimate
  }, 0);

  useEffect(() => {
    if (address.zip.length === 5) {
      const newTotals = calculatePrintOrderTotal(cart, {
        ...address,
        weight: totalWeight,
        orderValue: cart.reduce((sum, item) => sum + item.product.our_price, 0)
      });
      setTotals(newTotals);
    }
  }, [cart, address, totalWeight]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validatePDF(file);
      if (validation.valid) {
        setPrintFile(file);
        setFileError(null);
      } else {
        setPrintFile(null);
        setFileError(validation.error || 'Invalid file');
      }
    }
  };

  return (
    <Elements stripe={stripePromise}>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="bg-gradient-to-r from-zinc-900/90 to-black/90 border border-emerald-500/30 rounded-3xl p-6 md:p-12 backdrop-blur-xl shadow-2xl">
          
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column: Order Summary & Totals */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <ShoppingCart size={32} className="text-emerald-400" />
                  Order Summary
                </h2>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-4 border-b border-white/10">
                      <div>
                        <div className="font-bold">{item.product.name}</div>
                        <div className="text-zinc-400 text-sm">{item.options.quantity} • {item.options.paper_stock}</div>
                      </div>
                      <div className="text-xl font-bold text-emerald-400">
                        ${item.product.our_price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Print File Upload */}
              <div className="bg-zinc-800/30 border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <FileUp size={24} className="text-blue-400" />
                  Upload Print-Ready File
                </h3>
                <p className="text-xs text-zinc-500 mb-6">
                  Please upload a high-resolution PDF with 0.125" bleed. 
                  Max file size: 100MB.
                </p>
                
                <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${printFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-white/20'}`}>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {printFile ? (
                    <div className="space-y-2">
                      <CheckCircle size={32} className="mx-auto text-emerald-400" />
                      <p className="font-bold text-sm">{printFile.name}</p>
                      <p className="text-[10px] text-zinc-500">{(printFile.size / (1024 * 1024)).toFixed(2)} MB • Ready</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileUp size={32} className="mx-auto text-zinc-500" />
                      <p className="text-sm text-zinc-400 font-medium">Click or drag PDF here</p>
                    </div>
                  )}
                </div>
                
                {fileError && (
                  <div className="mt-4 flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle size={14} />
                    {fileError}
                  </div>
                )}
              </div>

              {/* Live Quote Calculator */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  Live Quote Calculator
                </h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-bold text-zinc-300 mb-2">
                    Enter ZIP Code for Accurate Quote
                  </label>
                  <input
                    type="text"
                    placeholder="90210"
                    maxLength={5}
                    value={address.zip}
                    onChange={(e) => setAddress(prev => ({ ...prev, zip: e.target.value }))}
                    className="w-full bg-zinc-800/50 border border-white/20 rounded-2xl px-5 py-4 text-lg font-mono tracking-wider focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                {totals ? (
                  <div className="space-y-4 text-lg">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-zinc-400 text-sm">Subtotal (70% markup)</span>
                      <span className="font-bold">${totals.subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-zinc-400 text-sm">
                        Sales Tax ({totals.taxRate.toFixed(1)}%)
                      </span>
                      <span className="font-bold">${totals.tax.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-zinc-400 text-sm">Shipping</span>
                      <span className="font-bold">
                        {totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="pt-6">
                      <div className="flex justify-between items-end text-3xl font-black text-emerald-400">
                        <span>Total</span>
                        <span>${totals.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500 italic text-sm">
                    Enter your ZIP code to see final totals including tax and shipping.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Payment Form */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <CreditCard size={32} className="text-blue-400" />
                Payment & Shipping
              </h2>
              <PaymentForm 
                totals={totals} 
                cart={cart} 
                address={address} 
                setAddress={setAddress} 
                onSuccess={onSuccess}
                printFile={printFile}
              />
              
              {/* Security Badges */}
              <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-emerald-500/50" />
                  PCI Compliant
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-blue-500/50" />
                  Fast Turnaround
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-purple-500/50" />
                  Secure Encryption
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Elements>
  );
};

const PaymentForm = ({ totals, cart, address, setAddress, printFile }: any) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totals) return;
    if (!printFile) {
      setError('Please upload your print-ready PDF file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/printing/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          items: cart.map((item: any) => ({
            name: item.product.name,
            price: item.product.our_price,
            format: item.options.paper_stock,
            quantity: item.options.quantity
          })),
          shipping_address: address,
          print_file_name: printFile.name
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Shipping Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            required
            placeholder="Full Name"
            value={address.name}
            onChange={e => setAddress({...address, name: e.target.value})}
            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all"
          />
          <input
            required
            placeholder="Street Address"
            value={address.address}
            onChange={e => setAddress({...address, address: e.target.value})}
            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all"
          />
          <input
            required
            placeholder="City"
            value={address.city}
            onChange={e => setAddress({...address, city: e.target.value})}
            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              required
              placeholder="State"
              value={address.state}
              onChange={e => setAddress({...address, state: e.target.value})}
              className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all"
            />
            <input
              required
              placeholder="ZIP"
              maxLength={5}
              value={address.zip}
              onChange={e => setAddress({...address, zip: e.target.value})}
              className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Payment Information</h4>
        <div className="bg-zinc-800/50 border border-white/10 rounded-2xl p-6 text-center">
          <p className="text-sm text-zinc-400">
            You will be redirected to Stripe's secure checkout page to complete your payment.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3">
          <Shield size={18} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !totals}
        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 disabled:from-zinc-800 disabled:to-zinc-700 disabled:text-zinc-500 text-white py-6 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-black/50 transition-all flex items-center justify-center gap-3 group"
      >
        {loading ? (
          <>
            <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard size={24} className="group-hover:scale-110 transition-transform" />
            Pay ${totals?.grandTotal.toFixed(2) || '0.00'} Securely
            <CheckCircle size={24} className="group-hover:scale-110 transition-transform" />
          </>
        )}
      </button>
      
      <p className="text-center text-[10px] text-zinc-500">
        By clicking "Pay Securely", you agree to our Terms of Service and Privacy Policy.
        Your payment information is processed securely by Stripe.
      </p>
    </form>
  );
};

export default PrintCheckout;
