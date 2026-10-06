import { useState, useEffect } from 'react';
import { Mail, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { api } from '../../api';
import { cn } from '../../utils/cn';
import { SupportTicket } from '../../types';

export const SupportCenter = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [formData, setFormData] = useState({ subject: '', message: '', priority: 'medium' as const });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await api.support.getTickets();
      setTickets(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.support.createTicket(formData);
      setFormData({ subject: '', message: '', priority: 'medium' });
      fetchTickets();
      alert('Ticket submitted successfully.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const helpCategories = [
    {
      title: "Getting started",
      articles: [
        "Welcome to SonicStream: A New Era for Artists",
        "Setting Up Your Professional Artist Profile",
        "Navigating the SonicStream Dashboard",
        "Understanding Our 70/30 Revenue Split",
        "Connecting Your Social Media Accounts",
        "First Steps for Content Creators",
        "How to Use the AI Music Assistant",
        "SonicStream for Independent Producers"
      ]
    },
    {
      title: "Uploading & releases",
      articles: [
        "Preparing Your Audio Files for Upload",
        "Metadata Best Practices for Maximum Visibility",
        "Uploading Your First Single or Album",
        "Managing Your Music Catalog",
        "Understanding the Moderation Process",
        "ISRC and UPC Codes Explained",
        "Creating High-Quality Cover Art",
        "Release Scheduling and Pre-Saves"
      ]
    },
    {
      title: "Distribution & stores",
      articles: [
        "Global Distribution: Where Your Music Goes",
        "Managing Store-Specific Metadata",
        "Takedowns and Re-releases",
        "Understanding Streaming Platform Requirements",
        "SonicStream's Direct-to-Fan Digital Store",
        "Distribution Timelines and Expectations",
        "Expanding Your Global Reach"
      ]
    },
    {
      title: "Royalties & payouts",
      articles: [
        "How Streaming Royalties are Calculated",
        "Understanding Your Earnings Dashboard",
        "Setting Up Your Payout Method",
        "Minimum Payout Thresholds",
        "Mechanical vs. Performance Royalties",
        "Tax Documentation and Reporting",
        "Withdrawing Your Funds: Step-by-Step",
        "SonicStream's 10% Overhead Commission"
      ]
    },
    {
      title: "Video-specific questions",
      articles: [
        "Uploading Music Videos to SonicStream",
        "Video Monetization and Ad Revenue",
        "Technical Specs for Video Uploads",
        "Managing Your Video Catalog",
        "Video Distribution to Major Platforms",
        "Using AI to Generate Video Backgrounds",
        "Video Rights and Licensing",
        "Promoting Your Videos on Social Media"
      ]
    },
    {
      title: "Account & billing",
      articles: [
        "Managing Your Subscription Plan",
        "Upgrading to SonicStream Pro",
        "Updating Your Billing Information",
        "Account Security and Two-Factor Auth",
        "Understanding Your Monthly Invoice",
        "Canceling or Pausing Your Subscription",
        "Managing Team and Agency Access",
        "Privacy Settings and Data Control"
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      <header className="text-center space-y-4">
        <h2 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
          Help Center
        </h2>
        <p className="text-xl text-zinc-400">Knowledge base for independent artists and producers.</p>
      </header>

      {/* Knowledge Base Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {helpCategories.map((cat, idx) => (
          <div key={idx} className="bg-zinc-900/50 border border-white/5 p-8 rounded-[32px] space-y-6 hover:border-emerald-500/30 transition-all group">
            <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{cat.title}</h3>
            <ul className="space-y-3">
              {cat.articles.map((art, aIdx) => (
                <li key={aIdx}>
                  <button className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors text-left leading-relaxed">
                    {art}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/5">
        <div className="md:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
            <h3 className="font-bold">New Support Ticket</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Subject</label>
                <input 
                  type="text" 
                  required
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Priority</label>
                <select 
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value as any})}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Message</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors resize-none" 
                />
              </div>
            </div>
            <button 
              disabled={isSubmitting}
              className="w-full bg-zinc-700 text-white py-4 rounded-xl font-bold hover:bg-zinc-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>

          <div className="space-y-4">
            <h3 className="font-bold px-2">Your Tickets</h3>
            {tickets.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/30 border border-white/5 rounded-3xl text-zinc-500 text-sm">
                No active tickets.
              </div>
            ) : (
              tickets.map(t => (
                <div key={t.id} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-bold">{t.subject}</p>
                    <p className="text-xs text-zinc-500">{format(parseISO(t.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    t.status === 'open' ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                  )}>
                    {t.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-4">
            <h4 className="font-bold">Direct Support</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Our concierge team is available 24/7 for Pro and Enterprise artists.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Mail size={16} />
                <span>support@v12multimedia.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Users size={16} />
                <span>Live Chat (Pro Only)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
