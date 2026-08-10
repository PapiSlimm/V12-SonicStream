import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';

export const RBGrandBanner = () => {
  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 w-80 z-40 group"
    >
      <div className="relative h-[500px] rounded-4xl overflow-hidden shadow-2xl border border-white/10 glass transition-all duration-500 group-hover:scale-105 group-hover:shadow-emerald-500/20">
        <img 
          src="https://picsum.photos/seed/venue/400/600" 
          alt="R&B Grand" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        
        <div className="absolute inset-0 p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/50">
              <Calendar className="text-black" size={32} />
            </div>
            <div>
              <h4 className="text-3xl font-black text-white leading-tight">R&B GRAND</h4>
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs">
                <MapPin size={12} />
                Macon, MS
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-sm text-zinc-300 font-medium leading-relaxed">
              The premier venue for independent R&B and Hip-Hop. 500+ capacity, full production.
            </p>
            <button className="w-full py-4 bg-white text-white font-black rounded-2xl shadow-xl hover:bg-zinc-700 transition-colors">
              Book Venue
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
