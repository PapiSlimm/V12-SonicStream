import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Mic, 
  Flame, 
  Compass, 
  HeartHandshake, 
  Calendar, 
  CheckCircle, 
  ArrowRight,
  TrendingUp, 
  Globe, 
  Radio, 
  Sparkles, 
  Volume2,
  Users
} from 'lucide-react';

interface SegmentContent {
  title: string;
  tagline: string;
  description: string;
  primaryMetric: { value: string; label: string };
  metrics: { value: string; label: string }[];
  keyFeatures: { title: string; desc: string; icon: any }[];
  useCaseQuote: { quote: string; author: string; role: string; avatar: string };
  ctaText: string;
  benefits: string[];
}

const SEGMENTS: Record<string, SegmentContent> = {
  artists: {
    title: "SonicStream for Independent Artists",
    tagline: "Distribute your music, sell your stems, and connect directly with your fanbase.",
    description: "Launch your own custom artist portal. Sell merchandise, ticketed virtual listening sessions, stem packages, and exclusive access without middleman platforms capping your success.",
    primaryMetric: { value: "3.2x", label: "Average Income Increase vs. Traditional Streaming" },
    metrics: [
      { value: "0ms", label: "Latency Listening Rooms" },
      { value: "100%", label: "Rights Splits Clarity" },
      { value: "12min", label: "Average Release Speed" }
    ],
    keyFeatures: [
      { title: "Direct Stem Storefront", desc: "Package and sell live stems, preset lists, and audio loops to other creators directly.", icon: Flame },
      { title: "Lossless Audio Streaming", desc: "Exquisite 24-bit audio playback built natively for high-fidelity listeners.", icon: Volume2 },
      { title: "Automated Rights Splitting", desc: "No-fuss joint contract structures automatically dividing album revenue right at checkout.", icon: HeartHandshake }
    ],
    useCaseQuote: {
      quote: "SonicStream allowed me to bypass traditional label pipelines. I sold my live concert stems directly to other creators and doubled my monthly income.",
      author: "Aria Sterling",
      role: "Cinematic Electronic Producer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200"
    },
    ctaText: "Go Live & Claim Your Storefront",
    benefits: [
      "Keep 95% of direct sales & ticket revenues",
      "Dynamic listening rooms with integrated live-chat",
      "One-click release distribution to All DSP networks (Spotify, Apple, etc.)"
    ]
  },
  podcasters: {
    title: "SonicStream for Podcasters & Broadcasters",
    tagline: "Host premium audio, syndicate effortlessly, and launch interactive live call-ins.",
    description: "Monetize your voice on a platform built for premium audio. Introduce gated VIP feeds, live listener call-ins, affiliate-supported ad scripts, and dynamic audio clipping helper dashboards.",
    primaryMetric: { value: "88%", label: "Listener Engagement Uplift via Live Calls" },
    metrics: [
      { value: "100%", label: "RSS Feed Autonomy" },
      { value: "$4.5K", label: "Avg. Monthly VIP Recurring Revenue" },
      { value: "1-Click", label: "Video Reel Conversion" }
    ],
    keyFeatures: [
      { title: "Interactive Listener Call-Ins", desc: "Take live listener audio feed with absolute low-latency routing directly on stream.", icon: Radio },
      { title: "VIP Gated Subscription Feeds", desc: "Create private fee structures for premium series, uncut interviews, and soundboards.", icon: Sparkles },
      { title: "AI Script & Ad Toolkits", desc: "Draft localized sponsorship scripts and track affiliate performance from one screen.", icon: Mic }
    ],
    useCaseQuote: {
      quote: "Our premium private feed generated over $8,000 in the first month. The live-mic call-in component turned regular listeners into active community hosts.",
      author: "Marcus Croft",
      role: "Host of 'The Infinite Stack'",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200"
    },
    ctaText: "Launch Your Premium Podcast Feed",
    benefits: [
      "Custom branded dynamic player matching your brand style guidelines",
      "Instant SEO optimization pages for every episode with AI scripts",
      "Multi-destination broadcast scaling with lossless background streams"
    ]
  },
  churches: {
    title: "SonicStream for Modern Congregations",
    tagline: "Broadcast worship services, simplify online contributions, and connect the flock.",
    description: "Deliver sacred services in absolute clarity. Our custom streaming channels ensure grandparents, distant members, and families on travel stay spiritually unified without distracting social media noise.",
    primaryMetric: { value: "99.99%", label: "Stream Uptime during Major Holy Events" },
    metrics: [
      { value: "Secure", label: "Encrypted Contributions Gateway" },
      { value: "100+", label: "Integrated Worship Guides" },
      { value: "Low-Band", label: "High Compression Smart Quality" }
    ],
    keyFeatures: [
      { title: "Clean Interactive Streams", desc: "Zero distracting comments, unrelated visual clutter, or pre-roll commercial ads.", icon: Compass },
      { title: "Giving & Contribution Portal", desc: "Easily accept recurring offerings, community donations, and project tithes.", icon: HeartHandshake },
      { title: "Bulletins & Guided Playlists", desc: "Host music charts, reading passages, and historic sermons side-by-side with stream.", icon: Calendar }
    ],
    useCaseQuote: {
      quote: "By moving away from general video grids into our custom SonicStream space, our seniors found the interface instantly usable, and virtual attendance surged.",
      author: "Pastor Thomas Vance",
      role: "Grace Community Worship Coordinator",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200"
    },
    ctaText: "Get Church Streaming Trial Setup",
    benefits: [
      "Encrypted cloud recording archives with automatic segment tagging",
      "Integrated live bulletin view with dynamic translation options",
      "Support for multi-camera live integrations on low bandwidth"
    ]
  },
  coaches: {
    title: "SonicStream for Elite Coaches & Instructors",
    tagline: "Run members-only masterclasses, handle booking lists, and sell guides.",
    description: "Whether you run executive, fitness, or creative consultations, SonicStream unites modern live digital boards, fast bookings, custom client hubs, and audio guides into a single business hub.",
    primaryMetric: { value: "15hrs", label: "Admin Work Saved Weekly per Consultant" },
    metrics: [
      { value: "Instant", label: "Stripe Connect Balance Settlement" },
      { value: "24/7", label: "Automatic Booking Calendar Bot" },
      { value: "98.2%", label: "Booking Retention Rate Increase" }
    ],
    keyFeatures: [
      { title: "Interactive Consultation Rooms", desc: "Sleek low-latency audio/video rooms with shared whiteboard capabilities.", icon: Users },
      { title: "Integrated Booking Bot", desc: "Automatic availability charts allowing prospective students to reserve sessions inside seconds.", icon: Calendar },
      { title: "PDF Guides & Resources Store", desc: "Easily charge for premium templates, custom workout routines, and PDF syllabi.", icon: Sparkles }
    ],
    useCaseQuote: {
      quote: "Tying my booking sheets, video consultations, and digital guide storefronts into a single subscription doubled my student sign-on speed.",
      author: "Samantha Torres",
      role: "Corporate Executive Development Coach",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200"
    },
    ctaText: "Unify Your Coaching Business Today",
    benefits: [
      "Interactive feedback systems built specifically for progress-tracking",
      "Dynamic reminder channels via integrated SMS alerts so clients never miss a call",
      "Tiered membership portals with targeted client access levels"
    ]
  },
  creators: {
    title: "SonicStream: The All-In-One Creator Business OS",
    tagline: "Build websites, sell products, manage bookings, and grow your audience.",
    description: "The holistic solution to fragmenting creator businesses across multiple disjointed subscriptions. Everything from newsletters and digital goods storefronts, to ticketing systems is integrated here.",
    primaryMetric: { value: "$620/mo", label: "Saved in Combined App Subscription Costs" },
    metrics: [
      { value: "1-Click", label: "Site Layout Generator" },
      { value: "10x", label: "Smarter Fan Analytics Engine" },
      { value: "Zero", label: "Platform Intermediaries Required" }
    ],
    keyFeatures: [
      { title: "Unified Business Portal", desc: "One central hub for your brand domains, digital products, newsletters, and tickets.", icon: Globe },
      { title: "Dynamic Merch Builder", desc: "Design custom print items on-demand and list them on your beautiful portal storefront.", icon: Flame },
      { title: "Frictionless AI Marketing", desc: "Generate SEO metadata, social caption guidelines, and newsletter campaigns instantly.", icon: Sparkles }
    ],
    useCaseQuote: {
      quote: "Instead of paying Linktree, Mailchimp, Substack, Shopify, and Calendly separately, SonicStream gives me all of them inside one ultra-responsive dashboard.",
      author: "Dorian Blake",
      role: "Lifestyle Vlogger & Host",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200&h=200"
    },
    ctaText: "Get Started Free on SonicStream",
    benefits: [
      "Custom brand subdomains or connect your external domain for free",
      "Advanced engagement heatmaps and audience conversion visualizers",
      "Integrated affiliate engine tracking recommendations"
    ]
  }
};

interface SegmentLandingPageProps {
  segment: 'artists' | 'podcasters' | 'churches' | 'coaches' | 'creators';
}

export const SegmentLandingPage = ({ segment }: SegmentLandingPageProps) => {
  const content = SEGMENTS[segment];
  
  // Interactive audience simulator calculator state
  const [audienceSize, setAudienceSize] = useState<number>(5000);
  const [supportConversionRate, setSupportConversionRate] = useState<number>(3); // 3%
  const [averageMonthlyGifting, setAverageMonthlyGifting] = useState<number>(15); // $15

  if (!content) {
    return (
      <div className="min-h-screen bg-[#070a13] text-gray-100 flex flex-col items-center justify-center p-8 font-sans">
        <h2 className="text-xl font-extrabold text-red-400">Target Segment Not Found</h2>
        <p className="text-zinc-500 mt-2">The requested creator vertical landing page is not configured.</p>
        <a href="/" className="mt-4 text-violet-400 hover:underline">Return to Home</a>
      </div>
    );
  }

  // Calculator Math
  const estimatedActiveFans = Math.round((audienceSize * supportConversionRate) / 100);
  const estimatedMonthlyRevenue = estimatedActiveFans * averageMonthlyGifting;
  const legacyPlatformCut = Math.round(estimatedMonthlyRevenue * 0.30); // 30% App Store / Youtube cuts
  const sonicStreamMonthlyRevenue = Math.round(estimatedMonthlyRevenue * 0.95);

  return (
    <div className="min-h-screen bg-[#070a13] text-gray-100 selection:bg-violet-500/30 selection:text-violet-300 font-sans overflow-x-hidden pt-12">
      <Helmet>
        <title>{`SonicStream | ${content.title}`}</title>
        <meta name="description" content={content.description} />
        <link rel="canonical" href={`https://sonicstream.io/for-${segment}`} />
        <meta property="og:title" content={`SonicStream | ${content.title}`} />
        <meta property="og:description" content={content.tagline} />
        <meta property="og:url" content={`https://sonicstream.io/for-${segment}`} />
        <meta name="twitter:title" content={`SonicStream | ${content.title}`} />
        <meta name="twitter:description" content={content.tagline} />
        
        {/* Schema markup specifically structured for this segment application page */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "${content.title}",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "description": "${content.description}",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            }
          `}
        </script>
      </Helmet>

      {/* Hero Accent Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-fuchsia-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        
        {/* Segment Breadcrumb / Active Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-violet-400 bg-violet-950/40 border border-violet-500/20 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Designed Especially For {segment}
          </span>
        </div>

        {/* Catchy Segment Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
            {content.title}
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 font-semibold mb-6">
            {content.tagline}
          </p>
          <p className="text-zinc-400 text-sm md:text-[15px] leading-relaxed mb-8">
            {content.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              id={`segment-${segment}-hero-cta-btn`}
              onClick={() => window.location.href = '#calculator'} 
              className="w-full sm:w-auto text-center px-8 py-4 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-violet-950/50 flex items-center justify-center gap-2"
            >
              Estimate Your Revenue
              <ArrowRight className="w-4 h-4" />
            </button>
            <a 
              id={`segment-${segment}-home-link`}
              href="/" 
              className="w-full sm:w-auto text-center px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/5 font-semibold text-sm rounded-xl transition-all"
            >
              Explore Full Features list
            </a>
          </div>
        </div>

        {/* Broad Metric highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20 bg-zinc-950/30 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
          <div className="md:col-span-2 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-8">
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-1">Key Performance Uplift</span>
            <span className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300 block mb-2">{content.primaryMetric.value}</span>
            <span className="text-zinc-300 font-medium text-sm leading-snug">{content.primaryMetric.label}</span>
          </div>

          {content.metrics.map((m, idx) => (
            <div key={idx} className="flex flex-col justify-center py-2 md:pl-4">
              <span className="text-3xl font-black text-white block mb-1">{m.value}</span>
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{m.label}</span>
            </div>
          ))}
        </div>

        {/* Feature Deep Dive Grid */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-black text-center text-white mb-12">
            Why {segment} are switching to SonicStream
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.keyFeatures.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-zinc-900/40 border border-white/5 p-8 rounded-2xl hover:border-violet-500/20 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-violet-950/50 rounded-xl border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:bg-violet-600 group-hover:text-white transition-all">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Audience Revenue Calculator Simulation Tool */}
        <section id="calculator" className="mb-24 bg-gradient-to-b from-[#0b0f1d] to-[#080c16] border border-white/5 p-8 md:p-12 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Input Config side */}
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 rounded-full uppercase tracking-wider mb-4">
                Interactive Revenue Tool
              </span>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">
                Calculate your direct earnings
              </h2>
              <p className="text-zinc-400 text-sm mb-8">
                Typical subscription models take 30% of your earnings. With SonicStream, you own your custom storefront directly. Drag below to calculate your estimated take-home revenue.
              </p>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-zinc-300">Audience / Mailing List Size</span>
                    <span className="text-violet-400 font-extrabold text-lg">{audienceSize.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1000" 
                    max="100000" 
                    step="500"
                    value={audienceSize}
                    onChange={(e) => setAudienceSize(Number(e.target.value))}
                    className="w-full accent-violet-500 bg-zinc-850 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                    <span>1,000</span>
                    <span>50K</span>
                    <span>100,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-zinc-300">Supporter Conv. Rate (%)</span>
                    <span className="text-violet-400 font-extrabold text-lg">{supportConversionRate}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="15" 
                    step="1"
                    value={supportConversionRate}
                    onChange={(e) => setSupportConversionRate(Number(e.target.value))}
                    className="w-full accent-violet-500 bg-zinc-850 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                    <span>1%</span>
                    <span>8%</span>
                    <span>15%</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-zinc-300">Average Monthly Support Spend</span>
                    <span className="text-violet-400 font-extrabold text-lg">${averageMonthlyGifting}/mo</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="100" 
                    step="5"
                    value={averageMonthlyGifting}
                    onChange={(e) => setAverageMonthlyGifting(Number(e.target.value))}
                    className="w-full accent-violet-500 bg-zinc-850 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                    <span>$5</span>
                    <span>$50</span>
                    <span>$100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations Outcome Display side */}
            <div className="bg-zinc-950/60 p-8 rounded-2xl border border-white/5 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Active Backing Fans</span>
                <span className="text-lg font-bold text-white">{estimatedActiveFans} supporters</span>
              </div>

              <div>
                <span className="text-zinc-400 text-xs uppercase font-bold tracking-wider block mb-1">Traditional App Store / Video Cut (30%)</span>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-mono text-sm">-$ {legacyPlatformCut.toLocaleString()}</span>
                  <span className="text-xs text-red-400 font-semibold bg-red-950/30 border border-red-500/20 px-2 py-0.5 rounded-full">Billed Middleman</span>
                </div>
              </div>

              <div className="bg-emerald-950/10 border border-emerald-500/20 p-6 rounded-xl relative">
                <div className="absolute top-3 right-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-emerald-400 text-xs uppercase font-extrabold tracking-widest block mb-2">SonicStream Direct Share Payout (95%)</span>
                <div className="text-3xl md:text-4xl font-black text-white font-mono">
                  ${sonicStreamMonthlyRevenue.toLocaleString()}<span className="text-xs text-zinc-400 font-sans font-medium"> / month</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  That's <span className="text-emerald-400 font-bold">${(sonicStreamMonthlyRevenue - (estimatedMonthlyRevenue - legacyPlatformCut)).toLocaleString()} more</span> in your pocket every month!
                </p>
              </div>

              <div className="pt-2">
                <button
                  id={`segment-${segment}-calc-get-started-btn`}
                  onClick={() => alert("Welcome! Initializing SonicStream onboarding with preset structures.")}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold uppercase tracking-wider py-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 font-sans"
                >
                  Own Your Earnings Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* segment custom quotes / proof */}
        <div className="mb-20">
          <div className="max-w-3xl mx-auto bg-zinc-900/30 border border-white/5 p-8 md:p-12 rounded-3xl relative">
            <div className="absolute -top-6 left-12 text-6xl text-violet-500/20 font-serif">“</div>
            <p className="text-base md:text-lg text-zinc-300 italic mb-6 leading-relaxed relative">
              {content.useCaseQuote.quote}
            </p>
            <div className="flex items-center gap-4">
              <img 
                src={content.useCaseQuote.avatar} 
                alt={content.useCaseQuote.author}
                className="w-12 h-12 rounded-full object-cover border border-violet-500/30"
              />
              <div>
                <h4 className="font-bold text-white text-sm">{content.useCaseQuote.author}</h4>
                <p className="text-zinc-500 text-xs font-medium">{content.useCaseQuote.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits bullets list / Action CTA Card */}
        <div className="bg-gradient-to-r from-violet-950/20 via-violet-900/10 to-indigo-950/20 border border-violet-500/20 p-8 md:p-12 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px]" />
          
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-6">
            Get your portal active in minutes
          </h2>

          <div className="max-w-xl mx-auto space-y-3.5 mb-10 text-left">
            {content.benefits.map((b, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
                <span className="text-zinc-300 text-sm font-medium">{b}</span>
              </div>
            ))}
          </div>

          <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <button
              id={`segment-${segment}-final-cta-btn`}
              onClick={() => alert(`Starting setup wizard optimized for Segment: ${segment}`)}
              className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-950 hover:bg-zinc-100 font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-lg"
            >
              {content.ctaText}
            </button>
            <a 
              id={`segment-${segment}-support-link`}
              href="/manual" 
              className="text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider"
            >
              View System Requirements
            </a>
          </div>
        </div>

      </div>

      {/* Segment switcher footbar links to keep search indexing high */}
      <footer className="border-t border-white/5 bg-zinc-950/20 py-12 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold block mb-4">Explore Segment Solutions</span>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.keys(SEGMENTS).map((segKey) => (
              <a 
                id={`footer-seg-${segKey}-link`}
                key={segKey} 
                href={`/for-${segKey}`}
                className={`text-xs px-4 py-2 rounded-lg border transition-all ${
                  segKey === segment 
                    ? 'bg-violet-950/40 text-violet-400 border-violet-500/30' 
                    : 'bg-zinc-900/30 text-zinc-400 border-white/5 hover:text-white hover:border-zinc-700'
                }`}
              >
                For {segKey.charAt(0).toUpperCase() + segKey.slice(1)}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
