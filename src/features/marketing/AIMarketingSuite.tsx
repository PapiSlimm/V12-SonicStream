import { useState } from 'react';
import { apiFetch } from '../../api/apiFetch';
import { Sparkles, Send, Copy, Calendar, AlertCircle } from 'lucide-react';
import { toast } from '../../components/ui/Toast';

interface GeneratedAsset {
  adCopy: string;
  socialPost: string;
  emailSubject: string;
  emailBody: string;
  suggestedVisuals: string;
  distributionStrategy: string;
}

export const AIMarketingSuite = () => {
  const [loading, setLoading] = useState(false);
  const textType = 'full_campaign';
  const [releaseName, setReleaseName] = useState('');
  const [genre, setGenre] = useState('Electronic');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('creative');
  const [result, setResult] = useState<GeneratedAsset | null>(null);

  // CRM Sync status
  const [syncing, setSyncing] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!releaseName.trim()) {
      toast.error('Please enter a track or release name.');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a brief description of the track mood or concept.');
      return;
    }

    setLoading(true);
    setResult(null);
    setCampaignId(null);
    try {
      const data = await apiFetch<any>('/api/marketing/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textType,
          releaseName,
          genre,
          description,
          tone,
        }),
      });

      if (data && data.success && data.result) {
        setResult(data.result);
        toast.success(`AI Promotional Suite compiled for "${releaseName}"`);
      } else {
        throw new Error(data.error || 'Marketing suite compilation failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to process AI marketing assets. Confirm Gemini is configured.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCRM = async () => {
    if (!result) return;
    setSyncing(true);
    try {
      // 1. Create a campaign draft
      const draftRes = await apiFetch<any>('/api/v1/social/notifications/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Launch of ${releaseName} (${genre})`,
          triggerType: 'OMNICHANNEL',
          subject: result.emailSubject,
          body: result.emailBody,
          targetSegment: 'all',
        }),
      });

      if (draftRes && draftRes.campaignId) {
        setCampaignId(draftRes.campaignId);
        toast.success('Campaign synchronized with Fan CRM. Ready to trigger outreach!');
      } else {
        throw new Error('Could not create campaign draft in CRM');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync campaign.');
    } finally {
      setSyncing(false);
    }
  };

  const handleTriggerCampaign = async () => {
    if (!campaignId) return;
    setSyncing(true);
    try {
      const res = await apiFetch<any>(`/api/v1/social/notifications/campaigns/${campaignId}/trigger`, {
        method: 'POST',
      });
      if (res && res.success) {
        toast.success('Omnichannel Outreach Campaign Dispatched instantly via Mobile and Web!');
        setCampaignId(null);
      } else {
        throw new Error('Dispatched trigger rejected by gateway');
      }
    } catch (err: any) {
      toast.error(err.message || 'Outreach trigger failed.');
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied text to clipboard');
  };

  return (
    <div className="space-y-8 bg-zinc-950/40 p-8 rounded-[40px] border border-white/5">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Sparkles className="text-emerald-400 animate-pulse" size={28} />
          <h3 className="text-2xl font-black uppercase tracking-tight text-white">AI Marketing & Promotion Suite</h3>
        </div>
        <p className="text-zinc-500 text-sm">Empowered by Gemini. Generate instantly optimized social copy, ad scripts, ad banners directions, email blasts, and sync them immediately with the creator CRM.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-zinc-400 tracking-wider">Release Name</label>
            <input
              type="text"
              placeholder="e.g., Midnight Echoes LP"
              value={releaseName}
              onChange={(e) => setReleaseName(e.target.value)}
              className="w-full bg-black border border-white/15 rounded-2xl px-5 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-zinc-400 tracking-wider">Primary Genre</label>
              <input
                type="text"
                placeholder="e.g., Chill Melodic Techno"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-black border border-white/15 rounded-2xl px-5 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-zinc-400 tracking-wider">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-black border border-white/15 rounded-2xl px-5 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="creative">Creative & Ambient</option>
                <option value="energetic">Energetic & Hype</option>
                <option value="brutalist">Brutalist & Tech</option>
                <option value="mysterious">Mysterious & Dark</option>
                <option value="sophisticated">Sophisticated & High Craft</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-zinc-400 tracking-wider">Campaign Concept & Context</label>
            <textarea
              placeholder="Tell Gemini about the story of the release, themes, inspirations, and what you want fans to feel..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black border border-white/15 rounded-2xl px-5 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-4 bg-zinc-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-600 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
          >
            {loading ? 'Compiling Campaign via Gemini...' : 'Compile Campaign Suite'}
            <Sparkles size={16} />
          </button>
        </div>

        {/* Real-time Generated Outputs */}
        <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-3xl flex flex-col justify-between min-h-[300px]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center py-12">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="font-bold text-white uppercase tracking-wider text-xs">Assembling Promotional Kit</p>
                <p className="text-zinc-500 text-xs mt-1">Generating ad hooks, newsletters, and scheduling timeline...</p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6 flex-1 overflow-y-auto max-h-[500px] pr-2">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">1. Optimized Ad Hook</span>
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 relative group">
                  <p className="text-sm text-zinc-300 leading-relaxed font-mono">{result.adCopy}</p>
                  <button 
                    onClick={() => copyToClipboard(result.adCopy)}
                    className="absolute right-3 top-3 p-1.5 bg-zinc-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">2. Social Post Script</span>
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 relative group">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{result.socialPost}</p>
                  <button 
                    onClick={() => copyToClipboard(result.socialPost)}
                    className="absolute right-3 top-3 p-1.5 bg-zinc-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-md">3. Email Blast Newsletter</span>
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2 relative group">
                  <p className="text-xs text-zinc-500 font-bold">Subject: <span className="text-white">{result.emailSubject}</span></p>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{result.emailBody}</p>
                  <button 
                    onClick={() => copyToClipboard(`${result.emailSubject}\n\n${result.emailBody}`)}
                    className="absolute right-3 top-3 p-1.5 bg-zinc-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-md">4. AI Design Directive Prompt</span>
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 relative group">
                  <p className="text-sm text-zinc-300 leading-relaxed font-mono italic">{result.suggestedVisuals}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-zinc-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Distribution Directive</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{result.distributionStrategy}</p>
              </div>

              {/* Sync with Campaign CRM tools row */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <p className="text-[10px] uppercase font-bold text-zinc-500">Campaign Automation Integrations</p>
                {!campaignId ? (
                  <button
                    onClick={handleSyncCRM}
                    disabled={syncing}
                    className="w-full py-3 bg-white text-black font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                  >
                    Sync Draft to Fan CRM
                    <Send size={14} />
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
                      <AlertCircle size={14} />
                      Draft sync confirmed. Trigger to deliver push & SMS immediately to all fans.
                    </div>
                    <button
                      onClick={handleTriggerCampaign}
                      disabled={syncing}
                      className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      Trigger Outreach Instantly
                      <Send size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 py-12 space-y-3">
              <Sparkles className="text-zinc-500/30" size={36} />
              <div>
                <p className="font-bold text-sm uppercase tracking-wider">Promotional Kit Vacant</p>
                <p className="text-xs text-zinc-600 max-w-xs mt-1">Configure parameters left and click "Compile" to draft a campaign via Gemini.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
