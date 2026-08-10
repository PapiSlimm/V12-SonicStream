import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Music, 
  Share2, 
  ShoppingCart, 
  Shield, 
  Zap,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "SonicAI Studio",
    question: "What is AI Mastering and how do I use it?",
    answer: "AI Mastering is our professional-grade audio enhancement tool. Simply upload your track in the SonicAI Studio, select your desired style (e.g., 'Warm', 'Punchy', 'Transparent'), and our AI will optimize your levels, EQ, and dynamics for commercial release. This feature is available to SonicStar, SonicVisionary, and SonicPro members."
  },
  {
    category: "SonicAI Studio",
    question: "How does Album and Product Promotion work?",
    answer: "Our AI-driven promotion tools help you create marketing assets and campaigns. Album Promotion generates social media snippets, press releases, and pitch emails. Product Promotion helps you create ads for your merchandise. These tools are exclusive to paid subscription tiers."
  },
  {
    category: "Community & Social",
    question: "Who can post to the Community Feed?",
    answer: "Posting to the Community Feed is a premium feature available to all paid subscribers. Free users can view the feed and interact with posts (like/share), but creating new posts requires a SonicStar, SonicVisionary, or SonicPro subscription."
  },
  {
    category: "Community & Social",
    question: "How do I start a Live Stream?",
    answer: "Live streaming is available in the 'Community' tab under the 'Live' section. You must be a paid subscriber to go live. Once active, your followers will be notified, and your stream will appear at the top of the community feed."
  },
  {
    category: "Distribution",
    question: "Where does my music get distributed?",
    answer: "SonicStream distributes your music to over 150 digital stores and streaming platforms globally, including Spotify, Apple Music, Amazon Music, TikTok, and Instagram. We ensure your metadata is industry-standard."
  },
  {
    category: "Distribution",
    question: "What is the revenue split?",
    answer: "We believe in a fair deal for artists. SonicStream operates on a 70/30 revenue split, where artists keep 70% of their streaming royalties. We take a 10% overhead commission for distribution services, and the remaining 20% covers platform maintenance and growth."
  },
  {
    category: "Digital Store",
    question: "How do I sell my merchandise?",
    answer: "You can set up your own storefront in the 'Digital Store' section. Upload product images, set your pricing, and manage inventory. We handle the transaction processing, and you can track your sales in the 'Direct Sales' dashboard."
  },
  {
    category: "Subscriptions",
    question: "What are the different subscription tiers?",
    answer: "We offer four tiers: Free (Listener), SonicStar (Emerging Artist), SonicVisionary (Professional Creator), and SonicPro (Enterprise/Label). Each tier unlocks progressively more features, including higher distribution limits, advanced AI tools, and dedicated support."
  },
  {
    category: "Marketing Hub",
    question: "What analytics are available to me?",
    answer: "Our Marketing Hub provides deep insights into your audience. You can track listener demographics, watch time, social share of voice, and conversion rates. Advanced analytics are available to paid subscribers to help you scale your brand."
  }
];

const categories = Array.from(new Set(faqs.map(faq => faq.category)));

export const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory ? faq.category === activeCategory : true;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
      {/* Hero Section */}
      <header className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-bold uppercase tracking-widest">
          <Shield size={14} />
          Support & Help
        </div>
        <h1 className="text-6xl font-black tracking-tighter text-white">
          How can we <span className="text-emerald-500 italic">help</span> you?
        </h1>
        <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
          Everything you need to know about using SonicStream to its full potential.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mt-12">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input 
            type="text"
            placeholder="Search for features, services, or questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-3xl py-6 pl-16 pr-8 text-white outline-none focus:border-emerald-500/50 transition-all text-lg"
          />
        </div>
      </header>

      {/* Quick Links / Categories */}
      <div className="flex flex-wrap justify-center gap-4">
        <button 
          onClick={() => setActiveCategory(null)}
          className={cn(
            "px-6 py-3 rounded-2xl font-bold transition-all border",
            activeCategory === null 
              ? "bg-zinc-700 text-white border-zinc-600" 
              : "bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/20"
          )}
        >
          All Topics
        </button>
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-6 py-3 rounded-2xl font-bold transition-all border",
              activeCategory === cat 
                ? "bg-zinc-700 text-white border-zinc-600" 
                : "bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/20"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, idx) => (
            <div 
              key={idx}
              className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden transition-all hover:border-white/10"
            >
              <button 
                onClick={() => toggleExpand(idx)}
                className="w-full px-8 py-6 flex items-center justify-between text-left group"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">
                    {faq.category}
                  </span>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {faq.question}
                  </h3>
                </div>
                {expandedIndex === idx ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
              </button>
              
              <AnimatePresence>
                {expandedIndex === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-8 pb-8 text-zinc-400 leading-relaxed text-lg border-t border-white/5 pt-6">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-zinc-900/20 rounded-[40px] border border-dashed border-white/10">
            <p className="text-zinc-500 font-bold">No results found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Feature Guide Grid */}
      <div className="pt-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black tracking-tighter">Feature Guide</h2>
          <p className="text-zinc-500">A quick overview of our core services.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Sparkles className="text-emerald-400" />}
            title="SonicAI Studio"
            description="Professional AI mastering, album promotion, and product ad generation for your brand."
          />
          <FeatureCard 
            icon={<Music className="text-blue-400" />}
            title="Distribution Hub"
            description="Global distribution to 150+ stores with industry-standard metadata and 70/30 split."
          />
          <FeatureCard 
            icon={<Share2 className="text-pink-400" />}
            title="Community Feed"
            description="Connect with fans and other artists. Post updates, share music, and go live."
          />
          <FeatureCard 
            icon={<ShoppingCart className="text-yellow-400" />}
            title="Digital Store"
            description="Sell your music and merchandise directly to your fans with your own custom storefront."
          />
          <FeatureCard 
            icon={<TrendingUp className="text-purple-400" />}
            title="Marketing Hub"
            description="Advanced analytics and performance metrics to help you understand and grow your audience."
          />
          <FeatureCard 
            icon={<Zap className="text-orange-400" />}
            title="Event Booking"
            description="Book venues, manage events, and sell tickets directly through the platform."
          />
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gradient-to-br from-emerald-500 to-blue-600 rounded-[40px] p-12 text-center space-y-8 shadow-2xl shadow-emerald-500/20">
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-black tracking-tighter">Still have questions?</h2>
          <p className="text-black/70 text-lg font-medium max-w-xl mx-auto">
            Our support team is here to help you 24/7. Reach out to us anytime.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-8 py-4 bg-black text-white font-black rounded-2xl hover:scale-105 transition-transform">
            Contact Support
          </button>
          <button className="px-8 py-4 bg-white/20 backdrop-blur-md text-black font-black rounded-2xl hover:bg-white/30 transition-all border border-black/10">
            Join Discord
          </button>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[32px] space-y-4 hover:border-white/20 transition-all group">
    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white">{title}</h3>
    <p className="text-zinc-500 leading-relaxed">{description}</p>
  </div>
);
