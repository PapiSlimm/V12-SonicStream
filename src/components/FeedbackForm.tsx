import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Star, Check, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '../lib/utils';

export function FeedbackForm() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    setTimeout(() => setFormState('success'), 1500);
  };

  return (
    <section id="feedback" className="py-24 px-6 bg-v12-gray-900 border-t border-white/5">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 bg-v12-red/10 border border-v12-red/20 text-v12-red text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            COMMUNITY FEEDBACK
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">
            HELP US <span className="text-chrome">EVOLVE</span>
          </h2>
          <p className="text-v12-gray-400 font-bold uppercase text-sm">
            Your insights drive our technical innovation. Tell us how we're doing.
          </p>
        </div>

        <div className="glass-card p-10 border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-v12-red" />
          
          <AnimatePresence mode="wait">
            {formState === 'success' ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-v12-red/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ThumbsUp size={40} className="text-v12-red" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">FEEDBACK LOGGED</h3>
                <p className="text-v12-gray-400 font-bold uppercase text-xs">Thank you for contributing to the V12 ecosystem.</p>
                <button 
                  onClick={() => { setFormState('idle'); setRating(0); }}
                  className="mt-8 text-v12-red font-black uppercase tracking-widest text-[10px] hover:underline"
                >
                  Submit more feedback
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-8"
              >
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400 block text-center">
                    RATE YOUR EXPERIENCE
                  </label>
                  <div className="flex justify-center gap-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-all duration-300 transform hover:scale-125"
                      >
                        <Star 
                          size={32} 
                          className={cn(
                            "transition-colors",
                            (hoveredRating || rating) >= star ? "fill-v12-red text-v12-red" : "text-white/10"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Name (Optional)</label>
                    <input type="text" className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors text-white" placeholder="ANONYMOUS" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Email (Optional)</label>
                    <input type="email" className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors text-white" placeholder="USER@V12.COM" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Your Message</label>
                  <textarea 
                    required 
                    rows={4} 
                    className="w-full bg-white/5 border-2 border-white/10 p-4 font-bold text-sm focus:border-v12-red outline-none transition-colors resize-none text-white" 
                    placeholder="WHAT CAN WE IMPROVE?"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={formState === 'submitting' || rating === 0}
                  className="btn btn-primary w-full py-5 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState === 'submitting' ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Transmit Feedback
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
