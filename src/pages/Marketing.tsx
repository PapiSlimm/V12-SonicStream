import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { ServicesGrid } from '../components/ServicesGrid';
import { PlatformFeatures } from '../components/PlatformFeatures';
import { BlogSection } from '../components/BlogSection';
import { FeedbackForm } from '../components/FeedbackForm';
import { Pricing } from '../components/Pricing';
import { CinematicCredits } from '../components/CinematicCredits';
import { Footer } from '../components/Footer';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { MarketingSkeleton } from '../components/Skeleton';
import { analytics } from '../lib/analytics';

const AIAssistant = lazy(() => import('../components/AIAssistant').then(m => ({ default: m.AIAssistant })));
const ChatRoom = lazy(() => import('../components/ChatRoom').then(m => ({ default: m.ChatRoom })));
const VisualShowcase = lazy(() => import('../components/VisualShowcase').then(m => ({ default: m.VisualShowcase })));

export default function Marketing() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    analytics.track('page_view', 'marketing_page');
    const timer = setTimeout(() => setIsReady(true), 1000); // Simulate initial load
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) return <MarketingSkeleton />;

  return (
    <div className="min-h-screen bg-v12-gray-900 text-white selection:bg-v12-red selection:text-white">
      <Helmet>
        <title>V12 SonicStream | High-Tech Multimedia Expansion</title>
        <meta name="description" content="Accelerate your vision with V12 SonicStream. AI-powered multimedia production, global distribution, and urban brutalist design." />
        <meta property="og:title" content="V12 SonicStream | High-Tech Multimedia Expansion" />
        <meta property="og:description" content="Accelerate your vision with V12 SonicStream. AI-powered multimedia production, global distribution, and urban brutalist design." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "V12 SonicStream",
              "url": "https://v12sonicstream.com",
              "logo": "https://v12sonicstream.com/logo.png",
              "description": "High-tech multimedia expansion and AI-powered production."
            }
          `}
        </script>
      </Helmet>

      <Navbar />
      <Hero />
      
      <Suspense fallback={<div className="h-96 flex items-center justify-center bg-v12-gray-900"><Loader2 className="animate-spin text-v12-red" /></div>}>
        <VisualShowcase />
      </Suspense>
      
      <section className="py-24 px-6 border-y border-white/5 bg-v12-gray-900/50 relative">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          {[
            { title: 'Technical Excellence', desc: 'High-performance multimedia solutions engineered for the modern digital landscape.' },
            { title: 'Creative Innovation', desc: 'Pushing the boundaries of visual and auditory storytelling through advanced technology.' },
            { title: 'Global Distribution', desc: 'Seamlessly distribute your content across all major platforms with integrated DSP solutions.' }
          ].map((item, i) => (
            <div key={i} className="space-y-4">
              <div className="w-8 h-[1px] bg-v12-red" />
              <h4 className="text-lg font-bold uppercase tracking-widest">{item.title}</h4>
              <p className="text-v12-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <ServicesGrid />
      <CinematicCredits />
      <PlatformFeatures />
      <BlogSection />
      <Pricing />
      <FeedbackForm />

      <Suspense fallback={<div className="fixed bottom-6 right-6 p-4 bg-v12-gray-800 rounded-full border border-white/10"><Loader2 className="animate-spin text-v12-red" /></div>}>
        <AIAssistant />
        <ChatRoom roomId="global-stream" title="Global Stream Chat" />
      </Suspense>
      
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Ready to <span className="text-v12-red">Accelerate?</span>
          </h2>
          <p className="text-v12-gray-400 text-xl mb-12">
            Join the next generation of independent artists and brands.
          </p>
          <button 
            onClick={() => {
              analytics.track('click', 'get_started_footer');
              window.scrollTo({ top: document.getElementById('pricing')?.offsetTop, behavior: 'smooth' });
            }}
            className="btn btn-primary px-12 py-4 text-lg"
          >
            Get Started Now
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
