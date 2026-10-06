import { Link } from 'react-router-dom';
import { Meta } from '../../components/SEO/Meta';
import { motion } from 'framer-motion';
import { Users, Star, Shield, Search, MapPin, CheckCircle } from 'lucide-react';

export const HireArtistLanding = () => {
  const steps = [
    { title: 'Search', desc: 'Browse 50,000+ verified talent by genre, location, and rating.', icon: Search },
    { title: 'Review', desc: 'Check bios, reviews, and listen to past performances.', icon: Users },
    { title: 'Book', desc: 'Secure payments and contracts in one click.', icon: Shield }
  ];

  const categories = [
    { name: 'Live Bands', count: '1.2k', slug: 'live-bands' },
    { name: 'DJs', count: '4.5k', slug: 'djs' },
    { name: 'Solo Singers', count: '3.1k', slug: 'solo-singers' },
    { name: 'Producers', count: '890', slug: 'producers' }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Meta 
        title="Hire Musical Talent | SonicStream Marketplace"
        description="Book the perfect artist, DJ, or live performance for your next event. Verified talent, secure booking, global discovery."
      />

      {/* Hero */}
      <section className="pt-40 pb-32 px-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-emerald-500/10 blur-[120px] -z-10 rounded-full" />
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400"
          >
            <Star size={12} />
            World Class Talent Marketplace
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-8xl font-black tracking-tighter uppercase leading-[0.9]"
          >
            Hire the <span className="text-emerald-500 italic">Perfect</span> Sound.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 text-xl max-w-2xl mx-auto"
          >
            Direct access to verified artists, session musicians, and producers. No agencies. Just talent.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 pt-4"
          >
            <Link to="/discovery/creators" className="bg-white text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-600 transition-all">
              Start Searching
            </Link>
            <Link to="/guides/how-to-get-booked-as-artist" className="bg-white/5 border border-white/5 px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
              List Your Talent
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 border-y border-white/5 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-12 flex justify-between items-center opacity-40">
          {['Verified Artists', 'Secure Escrow', 'Global Booking', '24/7 Support'].map(text => (
            <div key={text} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <CheckCircle size={14} />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-32 px-12">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex justify-between items-end">
            <div className="space-y-4">
              <h2 className="text-4xl font-black uppercase tracking-tight">Popular Categories</h2>
              <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Find specialists for any occasion</p>
            </div>
            <Link to="/discovery/creators" className="text-emerald-400 text-xs font-black uppercase tracking-widest hover:text-emerald-300 transition-colors">View All {">"}</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map(cat => (
              <Link 
                key={cat.slug}
                to={`/discovery/genre/${cat.slug}`}
                className="group relative h-96 bg-zinc-900 rounded-[40px] overflow-hidden border border-white/5"
              >
                <img 
                  src={`https://picsum.photos/seed/${cat.slug}/800/800`} 
                  className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                <div className="absolute bottom-8 left-8 space-y-2">
                  <div className="text-sm font-black text-emerald-400 uppercase tracking-widest">{cat.count} Artists</div>
                  <h3 className="text-2xl font-black text-white uppercase">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-12 bg-white/5 border-y border-white/5">
        <div className="max-w-7xl mx-auto space-y-16 text-center">
          <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tight">How to Book</h2>
            <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest italic">Three steps to sonic perfection</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map(step => (
              <div key={step.title} className="space-y-6">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto">
                  <step.icon size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight">{step.title}</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed max-w-[280px] mx-auto">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 px-12 text-center">
        <div className="max-w-3xl mx-auto space-y-12">
          <h2 className="text-7xl font-black uppercase tracking-tighter leading-none italic">Join the Sonic <span className="text-emerald-500">Gold Rush</span>.</h2>
          <div className="flex items-center justify-center gap-6">
            <button className="bg-zinc-700 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-600 transition-all">
              Book Your Artist
            </button>
            <Link to="/discovery/cities" className="flex items-center gap-2 text-zinc-500 font-black uppercase tracking-widest text-xs hover:text-white transition-colors">
              <MapPin size={16} /> Browse Cities
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
