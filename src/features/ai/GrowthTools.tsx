import { useState } from 'react';
import { 
  Zap, 
  Instagram, 
  Twitter, 
  Facebook, 
  Send, 
  Sparkles, 
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { generateGrowthContent, getSmartReleaseTiming, autoPostToSocial } from '../../services/growthService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const GrowthTools = () => {
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'timing' | 'autopost'>('ai');
  const [genre, setGenre] = useState('Electronic');

  const handleGenerate = async (type: 'tiktok' | 'reels' | 'caption') => {
    if (!context) {
      toast.error('Please provide some context about your music or brand');
      return;
    }
    setIsGenerating(true);
    try {
      const content = await generateGrowthContent(type, context);
      setGeneratedContent(content);
      toast.success('AI Content Generated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoPost = async (platform: any) => {
    if (!generatedContent) {
      toast.error('Generate some content first!');
      return;
    }
    try {
      await autoPostToSocial(platform, generatedContent);
      toast.success(`Successfully posted to ${platform}!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to post');
    } finally {
      // isPosting logic removed
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase">Growth Tools</h1>
          <p className="text-zinc-500 text-lg">Automate your social presence and optimize your releases with AI.</p>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <TrendingUp className="text-emerald-500" size={20} />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Growth Mode Active</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/5 pb-4">
        {[
          { id: 'ai', label: 'AI Content', icon: Sparkles },
          { id: 'timing', label: 'Smart Timing', icon: Clock },
          { id: 'autopost', label: 'Auto-Posting', icon: Send },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-zinc-700 text-white' 
                : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'ai' && (
            <div className="space-y-8">
              <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Music Context</label>
                  <textarea 
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Tell AI about your new track, video, or merch drop..."
                    className="w-full bg-black/40 border border-white/5 rounded-3xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 h-32 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <button 
                    onClick={() => handleGenerate('tiktok')}
                    disabled={isGenerating}
                    className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/5 transition-all group"
                  >
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Zap size={24} className="text-zinc-400 group-hover:text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">TikTok Ideas</span>
                  </button>
                  <button 
                    onClick={() => handleGenerate('reels')}
                    disabled={isGenerating}
                    className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/5 transition-all group"
                  >
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Instagram size={24} className="text-zinc-400 group-hover:text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Reels Concepts</span>
                  </button>
                  <button 
                    onClick={() => handleGenerate('caption')}
                    disabled={isGenerating}
                    className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/5 transition-all group"
                  >
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles size={24} className="text-zinc-400 group-hover:text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Smart Captions</span>
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {generatedContent && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-[40px] p-8 space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black uppercase tracking-tight text-emerald-400">AI Recommendations</h3>
                      <button 
                        onClick={() => setGeneratedContent(null)}
                        className="text-zinc-500 hover:text-white transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-zinc-300 leading-relaxed bg-transparent p-0 border-none">
                        {generatedContent}
                      </pre>
                    </div>
                    <div className="flex gap-4 pt-6 border-t border-white/5">
                      <button 
                        onClick={() => handleAutoPost('twitter')}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Twitter size={14} />
                        Post to X
                      </button>
                      <button 
                        onClick={() => handleAutoPost('instagram')}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Instagram size={14} />
                        Post to IG
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'timing' && (
            <div className="space-y-8">
              <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-black uppercase tracking-tight">Release Optimization</h3>
                  <p className="text-zinc-500">Select your genre to get the AI-recommended release window for maximum algorithmic impact.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {['Electronic', 'Hip-Hop', 'Pop', 'Lo-Fi'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGenre(g)}
                      className={`p-6 rounded-3xl border transition-all text-left space-y-2 ${
                        genre === g 
                          ? 'bg-zinc-700 border-emerald-500 text-white' 
                          : 'bg-white/5 border-white/5 text-white hover:border-white/10'
                      }`}
                    >
                      <div className="font-black uppercase tracking-widest text-[10px] opacity-60">Genre</div>
                      <div className="text-xl font-black uppercase">{g}</div>
                    </button>
                  ))}
                </div>

                <div className="p-8 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Calendar size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Recommended Window</span>
                    </div>
                    <div className="text-2xl font-black uppercase tracking-tight">{getSmartReleaseTiming(genre)}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Confidence Score</div>
                    <div className="text-xl font-black text-white">94%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'autopost' && (
            <div className="space-y-8">
              <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tight">Connected Accounts</h3>
                    <p className="text-zinc-500 text-sm">Manage where SonicStream auto-posts your content.</p>
                  </div>
                  <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                    Connect New
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { platform: 'Twitter / X', handle: '@v12_collective', icon: Twitter, status: 'Connected' },
                    { platform: 'Instagram', handle: '@v12.official', icon: Instagram, status: 'Connected' },
                    { platform: 'TikTok', handle: '@v12_music', icon: Zap, status: 'Action Required' },
                    { platform: 'Facebook', handle: 'V12 Collective', icon: Facebook, status: 'Disconnected' },
                  ].map((acc) => (
                    <div key={acc.platform} className="p-6 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                          <acc.icon size={24} className="text-zinc-500" />
                        </div>
                        <div>
                          <p className="font-bold">{acc.platform}</p>
                          <p className="text-zinc-500 text-xs">{acc.handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                          acc.status === 'Connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {acc.status}
                        </span>
                        <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Analytics & Insights */}
        <div className="space-y-8">
          <div className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 space-y-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-emerald-500" size={24} />
              <h3 className="text-lg font-black uppercase tracking-tight">Growth Insights</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <span>Social Reach</span>
                  <span className="text-emerald-500">+24%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[74%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <span>Engagement Rate</span>
                  <span className="text-emerald-500">+12%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[48%]" />
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-white/5 space-y-4">
              <p className="text-xs text-zinc-500 font-medium italic">"Your TikTok content is performing 3x better than average. Focus on short-form video this week."</p>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                <CheckCircle2 size={14} />
                AI Strategy Updated
              </div>
            </div>
          </div>

          <div className="bg-zinc-700 rounded-[40px] p-8 text-white space-y-6 shadow-2xl shadow-black/20">
            <h3 className="text-lg font-black uppercase tracking-tight">Pro Tip</h3>
            <p className="text-sm font-bold leading-relaxed opacity-80">
              Artists who post at least 3 times a week using AI-generated captions see a 45% increase in streaming conversions.
            </p>
            <button className="w-full py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
              Schedule Posts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
