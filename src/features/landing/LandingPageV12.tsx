import { useCallback, memo, Suspense } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Music, 
  Zap, 
  ChevronRight, 
  ArrowRight, 
  Target, 
  Headphones, 
  Shield,
  Globe,
  CheckCircle2,
  Lock,
  Cloud,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  LucideIcon
} from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';

import { RBGrandBanner } from '../../components/marketing/RBGrandBanner';
import { ArtistCarousel } from '../../components/marketing/ArtistCarousel';
import { SocialProof } from '../../components/marketing/SocialProof';
import { ProductDemo } from '../../components/marketing/ProductDemo';

import { useNavigate } from 'react-router-dom';
import { useOverlayStore } from '../../core/state/overlay.store';

interface UserPath {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

interface FeatureGroup {
  title: string;
  icon: LucideIcon;
  items: string[];
}

const USER_PATHS: UserPath[] = [
  { id: 'artists', label: 'Creators', icon: Music, description: 'Sleek websites & full checkout systems' },
  { id: 'podcasters', label: 'Podcasters', icon: Headphones, description: 'Secure hosting & audience growth' },
  { id: 'businesses', label: 'Businesses', icon: Target, description: 'Internal training & niche communities' },
  { id: 'radio', label: 'Radio/Community', icon: Globe, description: 'Affordable internet radio solutions' },
];

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: "Launch",
    icon: Zap,
    items: ["Branded Streaming Site", "Custom Content Uploads", "White-Label Solution", "Mobile-Optimized Player"]
  },
  {
    title: "Grow",
    icon: TrendingUp,
    items: ["CRM & Direct Mail", "Fan Analytics", "SEO Optimization", "Marketing Hub"]
  },
  {
    title: "Monetize",
    icon: DollarSign,
    items: ["Direct-to-Fan Sales", "Ticketing & Events", "Ad Management", "Instant Payouts"]
  },
  {
    title: "Manage",
    icon: Shield,
    items: ["User Permissions", "Content Security", "Uptime Monitoring", "24/7 Support"]
  }
];

const FAQ_ITEMS = [
  { q: "How does the Business OS help?", a: "SonicStream acts as your central Business OS, uniting booking, ticketing, commerce, printing, and website building in a single dashboard." },
  { q: "Can I use my own domain?", a: "Yes, all premium plans allow you to connect your own custom domain for your streaming site." },
  { q: "What are the monetization options?", a: "You can monetize through direct-to-fan sales, ticketing, and our integrated ad network." },
  { q: "Is there a free trial?", a: "We offer a 'Start Free' path that lets you explore the platform before committing to a plan." }
];

const FOOTER_COLUMNS = [
  { title: 'Platform', links: ['Websites', 'Commerce', 'Events', 'Analytics'] },
  { title: 'Company', links: ['About', 'Careers', 'Press', 'Contact'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] }
];

const SOCIAL_LINKS = ['Twitter', 'Instagram', 'Discord'];

const LandingPageV12Base = () => {
  const navigate = useNavigate();
  const { setAuthModalOpen } = useOverlayStore();
  const prefersReducedMotion = useReducedMotion();

  const playSound = useCallback((type: 'arp' | 'chime') => {
    try {
      if (type === 'arp') {
        soundEngine.playArpeggio();
      } else {
        soundEngine.playChime();
      }
    } catch (e) {
      console.warn('Sound engine failed:', e);
    }
  }, []);

  const handleStartFree = useCallback(() => {
    playSound('arp');
    setAuthModalOpen(true);
  }, [playSound, setAuthModalOpen]);

  const handleBookNow = useCallback(() => {
    playSound('arp');
    navigate('/pricing'); // Changed from /bookings to match "Launch" label better or just more logical path
  }, [playSound, navigate]);

  const handleLaunchPlatform = useCallback(() => {
    playSound('chime');
    navigate('/pricing');
  }, [playSound, navigate]);

  const handleNavigate = useCallback((pathId: string) => {
    playSound('chime');
    navigate(`/solutions/${pathId}`);
  }, [playSound, navigate]);

  return (
    <div className="space-y-32 pb-32 relative overflow-hidden">
      <Suspense fallback={<div className="h-20" />}>
        <RBGrandBanner />
      </Suspense>

      {/* Hero Section - Redesigned for stronger hierarchy */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center text-center pt-20">
        <motion.div 
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          className="relative z-10 space-y-10 max-w-[95vw] md:max-w-5xl px-4"
        >
          <div className="space-y-8">
            <h1 className="font-display text-[12vw] md:text-[8vw] lg:text-[7vw] leading-[0.9] tracking-tight uppercase text-white">
              <motion.span 
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="block"
              >
                UNLEASH YOUR
              </motion.span>
              <motion.span 
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="block text-emerald-500 italic font-serif lowercase"
              >
                creative potential
              </motion.span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-zinc-400 font-medium leading-relaxed max-w-3xl mx-auto">
              The all-in-one operating system for creators to launch, grow, and monetize their digital empire.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-6">
            <button 
              onClick={handleStartFree}
              className="w-full sm:w-auto h-20 px-16 bg-zinc-700 text-white font-black text-2xl rounded-full hover:scale-105 transition-all shadow-xl md:shadow-2xl shadow-black/40 flex items-center justify-center gap-3"
            >
              Start Free
              <ChevronRight size={24} />
            </button>
            <button 
              onClick={handleBookNow}
              className="text-zinc-500 hover:text-white font-bold text-sm uppercase tracking-widest transition-all"
            >
              Launch Your Platform →
            </button>
          </div>
        </motion.div>
      </section>

      {/* Social Proof Section - Supporting Proof */}
      <section className="max-w-7xl mx-auto px-6">
        <Suspense fallback={<div className="h-32" />}>
          <SocialProof />
        </Suspense>
      </section>

      {/* Feature Section with Benefits - Grouped Capabilities */}
      <section className="max-w-7xl mx-auto px-6 space-y-24">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">Platform Capabilities</h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Everything you need to succeed in the digital economy, organized for clarity.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {FEATURE_GROUPS.map((group, i) => (
            <motion.div 
              key={group.title} 
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1 }}
              className="group p-8 md:p-12 bg-zinc-900/40 border border-white/5 rounded-[48px] hover:border-emerald-500/20 transition-all shadow-xl md:shadow-2xl"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
                <div className="w-16 h-16 bg-zinc-700/10 rounded-3xl flex items-center justify-center text-emerald-400 group-hover:bg-zinc-700 group-hover:text-white transition-all">
                  <group.icon size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tight">{group.title}</h3>
                  <p className="text-zinc-500 text-sm">Scale your vision with precision.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.items.map((item) => (
                  <div key={item} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl text-sm text-zinc-300 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Product Demo Section */}
      <section className="max-w-7xl mx-auto px-6">
        <Suspense fallback={<div className="h-64" />}>
          <ProductDemo />
        </Suspense>
      </section>

      {/* User Paths Section */}
      <section className="max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">Tailored Solutions</h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Specific entry points for every type of digital creator.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {USER_PATHS.map((path) => (
            <motion.button
              key={path.id}
              whileHover={prefersReducedMotion ? {} : { y: -10, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              onClick={() => handleNavigate(path.id)}
              className="p-8 bg-zinc-900/30 border border-white/5 rounded-[40px] text-left group transition-all"
            >
              <div className="w-16 h-16 bg-zinc-700/10 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-zinc-700 group-hover:text-white transition-all">
                <path.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">{path.label}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{path.description}</p>
              <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500 opacity-0 group-hover:opacity-100 transition-all">
                Explore <ArrowRight size={14} />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Featured Artist Carousel */}
      <section className="max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">Featured Artists</h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Meet the creators pushing the boundaries of sound on SonicStream.</p>
        </div>
        <Suspense fallback={<div className="h-64" />}>
          <ArtistCarousel />
        </Suspense>
      </section>

      {/* Trust Signals & Security Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-zinc-900/50 border border-white/5 rounded-[48px] p-12 md:p-20 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
              SECURE <br />
              <span className="text-zinc-500">RELIABLE.</span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              We prioritize your security and uptime. With 99.9% availability and enterprise-grade encryption, 
              your content and data are always safe and accessible.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3 text-sm font-bold text-white">
                <Lock className="text-emerald-500" size={20} />
                SSL Encryption
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-white">
                <Cloud className="text-emerald-500" size={20} />
                99.9% Uptime
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-white">
                <ShieldCheck className="text-emerald-500" size={20} />
                GDPR Compliant
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-white">
                <Zap className="text-emerald-500" size={20} />
                Fast CDN
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-black rounded-[40px] border border-white/10 flex items-center justify-center p-12">
              <Shield size={120} className="text-emerald-500 opacity-20 absolute" />
              <div className="relative z-10 space-y-8 w-full">
                <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: '99.9%' }}
                    className="h-full bg-emerald-500"
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  <span>System Uptime</span>
                  <span>99.9%</span>
                </div>
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Security Status</p>
                  <p className="text-lg font-bold text-white">All Systems Operational</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Redesigned for focus */}
      <section className="max-w-5xl mx-auto px-6 text-center space-y-16 py-32">
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          className="space-y-8"
        >
          <h2 className="text-6xl md:text-[100px] font-display uppercase leading-[0.8] tracking-tighter">
            THE FUTURE <br />
            <span className="text-emerald-500 italic font-serif lowercase">is calling.</span>
          </h2>
          <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
            Join 50,000+ creators who are already building their digital empire on SonicStream.
          </p>
        </motion.div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button 
            onClick={handleStartFree}
            className="w-full sm:w-auto h-20 px-16 bg-zinc-700 text-white font-black text-2xl rounded-full hover:scale-105 transition-all shadow-xl md:shadow-2xl shadow-black/20"
          >
            Start Free
          </button>
          <button 
            onClick={handleLaunchPlatform}
            className="w-full sm:w-auto h-20 px-12 border-2 border-white/10 hover:bg-white/5 text-white font-bold text-xl rounded-full transition-all"
          >
            Launch Your Platform
          </button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-6 space-y-12">
        <h2 className="text-4xl font-black uppercase tracking-tight text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {FAQ_ITEMS.map((faq) => (
            <div key={faq.q} className="p-8 bg-zinc-900/30 border border-white/5 rounded-3xl space-y-4 shadow-lg">
              <h3 className="text-lg font-bold text-white">{faq.q}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 pt-32 border-t border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Music size={20} className="text-black" />
              </div>
              <span className="text-xl font-bold tracking-tighter">SonicStream</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              The complete operating system for modern creators. 
              Built with passion in London, serving the world.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="space-y-6">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <button 
                      onClick={(e) => { e.preventDefault(); navigate(`/${link.toLowerCase()}`); }} 
                      className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">© 2025 SonicStream OS • All Rights Reserved</p>
          <div className="flex gap-6">
            {SOCIAL_LINKS.map((social) => (
              <a 
                key={social} 
                href="#" 
                onClick={(e) => e.preventDefault()}
                className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export const LandingPageV12 = memo(LandingPageV12Base);
