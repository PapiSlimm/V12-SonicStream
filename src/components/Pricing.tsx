import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shield, Zap, Star, AlertCircle, Send, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Pricing() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    setTimeout(() => setFormState('success'), 1500);
  };

  return (
    <section id="pricing" className="py-24 px-6 bg-v12-blue">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-v12-orange font-bold uppercase tracking-widest text-sm mb-4">Pricing & Rates</h2>
          <h3 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6">
            CUSTOM SOLUTIONS <br /> FOR <span className="text-chrome">ELITE BRANDS</span>
          </h3>
          <p className="text-v12-silver max-w-2xl mx-auto font-bold uppercase text-sm">
            We've moved away from standard subscription models to provide bespoke, high-impact multimedia strategies tailored to your specific project needs.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="glass-card p-8 border-v12-orange/20">
              <h4 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                <Zap className="text-v12-orange" />
                Why Custom?
              </h4>
              <ul className="space-y-4">
                {[
                  'Bespoke production workflows tailored to your brand identity',
                  'Scalable resources for large-scale multimedia campaigns',
                  'Direct access to our senior creative engineering team',
                  'Flexible billing based on project milestones and deliverables',
                  'Full intellectual property ownership and white-label rights'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-sm font-bold uppercase tracking-tighter text-v12-silver">
                    <Check size={18} className="text-v12-orange shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-8 border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-v12-orange/20 p-3 rounded-full">
                  <AlertCircle className="text-v12-orange" size={24} />
                </div>
                <div>
                  <h5 className="font-black uppercase tracking-tighter text-lg">Volume Discounts</h5>
                  <p className="text-v12-silver text-xs font-bold uppercase">Retainer agreements and multi-project bundles available.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-10 border-v12-red/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-v12-red/10 blur-3xl -z-10" />
            
            <h4 className="text-3xl font-black uppercase tracking-tighter mb-8">Request a Quote</h4>
            
            {formState === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-v12-red/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check size={40} className="text-v12-red" />
                </div>
                <h5 className="text-2xl font-black uppercase tracking-tighter mb-2">Request Received</h5>
                <p className="text-v12-silver font-bold uppercase text-xs">Our engineers will contact you within 4 hours.</p>
                <button 
                  onClick={() => setFormState('idle')}
                  className="mt-8 text-v12-red font-black uppercase tracking-widest text-[10px] hover:underline"
                >
                  Send another request
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Full Name</label>
                    <input required type="text" className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors" placeholder="JOHN DOE" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Email Address</label>
                    <input required type="email" className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors" placeholder="JOHN@COMPANY.COM" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Project Type</label>
                  <select required className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors appearance-none">
                    <option value="" className="bg-v12-gray-900">SELECT PROJECT TYPE</option>
                    <option value="audio" className="bg-v12-gray-900">AUDIO PRODUCTION</option>
                    <option value="video" className="bg-v12-gray-900">VIDEO EDITING</option>
                    <option value="design" className="bg-v12-gray-900">GRAPHIC DESIGN</option>
                    <option value="marketing" className="bg-v12-gray-900">MARKETING RESEARCH</option>
                    <option value="full" className="bg-v12-gray-900">FULL-STACK CAMPAIGN</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Project Details</label>
                  <textarea required rows={4} className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors resize-none" placeholder="DESCRIBE YOUR VISION..."></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={formState === 'submitting'}
                  className="btn btn-primary w-full py-5 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm"
                >
                  {formState === 'submitting' ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Request
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
