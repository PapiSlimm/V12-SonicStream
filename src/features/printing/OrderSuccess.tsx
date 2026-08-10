import { CheckCircle, ArrowRight, Package, Truck, FileText, Mail } from 'lucide-react';
import { generateInvoicePDF, emailInvoicePDF } from '../../hooks/usePrintInvoice';

interface OrderSuccessProps {
  order: {
    id: string;
    total: number;
    customerEmail: string;
    // Add other fields if needed for PDF generation
    date: Date;
    customer: any;
    cart: any;
    totals: any;
    paymentIntentId: string;
  };
  onClose: () => void;
}

const OrderSuccess = ({ order, onClose }: OrderSuccessProps) => (
  <div className="min-h-[60vh] flex items-center justify-center p-4">
    <div className="max-w-2xl w-full text-center space-y-8 bg-zinc-900/50 border border-emerald-500/30 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
      
      <div className="relative">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <CheckCircle size={64} className="text-emerald-400" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent mb-4">
          Order Confirmed!
        </h1>
        
        <p className="text-zinc-400 text-lg max-w-md mx-auto">
          Your professional print order has been received and is now in production.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-left">
          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Order Number</div>
          <div className="text-lg font-mono font-bold text-white">#{order.id.slice(-8).toUpperCase()}</div>
        </div>
        <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-left">
          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Total Paid</div>
          <div className="text-lg font-bold text-emerald-400">${order.total.toFixed(2)}</div>
        </div>
      </div>

      {/* Invoice Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <button
          onClick={() => generateInvoicePDF(order)}
          className="flex items-center justify-center gap-2 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all text-sm"
        >
          <FileText size={18} className="text-emerald-400" />
          Download Invoice PDF
        </button>
        <button
          onClick={() => emailInvoicePDF(order.id, order.customerEmail)}
          className="flex items-center justify-center gap-2 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all text-sm"
        >
          <Mail size={18} className="text-blue-400" />
          Email Invoice
        </button>
      </div>

      <div className="space-y-6 pt-8 border-t border-white/10">
        <div className="flex items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
              <Package size={20} className="text-zinc-400" />
            </div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold">In Production</span>
          </div>
          <div className="w-12 h-px bg-zinc-800" />
          <div className="flex flex-col items-center gap-2 opacity-40">
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
              <Truck size={20} className="text-zinc-400" />
            </div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Shipping</span>
          </div>
        </div>
        
        <p className="text-xs text-zinc-500">
          Estimated delivery: 2-4 business days. A tracking number will be sent to your email once shipped.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button 
          onClick={onClose}
          className="flex-1 p-5 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group"
        >
          Back to Store
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
        <button className="flex-1 p-5 bg-zinc-700 text-white rounded-2xl font-bold shadow-lg shadow-black/20 hover:bg-zinc-600 transition-all">
          Track Status
        </button>
      </div>
    </div>
  </div>
);

export default OrderSuccess;
