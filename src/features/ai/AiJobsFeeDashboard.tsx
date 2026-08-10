import { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShoppingBag, 
  Calculator, 
  Loader2, 
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../api/apiFetch';
import { AIJob, AIGeneratedProduct } from '../../types';

interface FeeSummaryDetails {
  totalSalesCents: number;
  profitFeeRatePercent: number;
  profitFeeCollectedCents: number;
  linkedProducts: Array<{
    id: string;
    productId: string;
    aiJobId: string;
    product_name?: string;
    product_price?: number;
  }>;
}

export const AiJobsFeeDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [feeSummary, setFeeSummary] = useState<FeeSummaryDetails>({
    totalSalesCents: 0,
    profitFeeRatePercent: 5.5,
    profitFeeCollectedCents: 0,
    linkedProducts: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [triggeringJob, setTriggeringJob] = useState<boolean>(false);
  const [linkingProduct, setLinkingProduct] = useState<boolean>(false);

  // Form Inputs
  const [selectedJobType, setSelectedJobType] = useState<'mastering' | 'cover_art' | 'video_segment' | 'lyrics_generation'>('mastering');
  const [inputUrl, setInputUrl] = useState<string>('');

  const [productIdToLink, setProductIdToLink] = useState<string>('');
  const [jobIdToLink, setJobIdToLink] = useState<string>('');

  const loadData = async () => {
    try {
      const allJobs = await apiFetch<AIJob[]>('/api/ai-jobs');
      setJobs(allJobs);

      const summary = await apiFetch<FeeSummaryDetails>('/api/ai-jobs/fee-summary');
      setFeeSummary(summary);
    } catch (err: any) {
      console.error('Failed to load AI job fee details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartAIJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriggeringJob(true);
    try {
      await apiFetch<AIJob>('/api/ai-jobs', {
        method: 'POST',
        body: JSON.stringify({
          jobType: selectedJobType,
          inputUrl: inputUrl.trim() || undefined
        })
      });
      toast.success('AI Neural job completed successfully!');
      setInputUrl('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start AI job');
    } finally {
      setTriggeringJob(false);
    }
  };

  const handleLinkProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productIdToLink.trim() || !jobIdToLink.trim()) {
      toast.error('Both Product ID and AI Job Reference are required.');
      return;
    }
    setLinkingProduct(true);
    try {
      await apiFetch<AIGeneratedProduct>('/api/ai-jobs/link-product', {
        method: 'POST',
        body: JSON.stringify({
          productId: productIdToLink.trim(),
          aiJobId: jobIdToLink.trim()
        })
      });
      toast.success('Successfully linked product sales to AI fee tracking engine!');
      setProductIdToLink('');
      setJobIdToLink('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failure linking product');
    } finally {
      setLinkingProduct(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emerald-400" size={36} />
        <p className="text-zinc-500 font-medium">Synchronizing AI Platform Ledger...</p>
      </div>
    );
  }

  const salesTotalFloat = feeSummary.totalSalesCents / 100;
  const platformFeeFloat = feeSummary.profitFeeCollectedCents / 100;

  return (
    <div className="space-y-12">
      {/* Platform Fee Notification Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/0 border border-emerald-500/20 p-8 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Calculator size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Pricing &amp; Commissions</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">AI Generated Content (5.5% Profit Royalty)</h2>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
            In compliance with our standard subscription terms, SonicStream automatically captures a <strong className="text-white">5.5% commission fee</strong> on all digital products, custom voice models, mastering tracks, and printed merchandise utilizing AI render jobs, calculated on actual sales.
          </p>
        </div>
        <div className="bg-black/60 border border-white/5 p-6 rounded-2xl flex flex-col items-center md:items-end justify-center shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Captured Royalty</span>
          <span className="text-3xl font-black text-emerald-400 mt-1">${platformFeeFloat.toFixed(2)}</span>
          <span className="text-[9px] font-mono text-zinc-500 mt-1">From ${salesTotalFloat.toFixed(2)} sales</span>
        </div>
      </div>

      {/* Main double column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Spawn New AI tasks form */}
        <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Cpu className="text-emerald-400 animate-pulse" size={20} />
              Neural Job Dispatcher
            </h3>
            <p className="text-zinc-500 text-sm">Deploy high-performance neural nodes directly to verify output and link profits.</p>
          </div>

          <form onSubmit={handleStartAIJob} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Select Model Engine</label>
              <select 
                value={selectedJobType}
                onChange={(e) => setSelectedJobType(e.target.value as any)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 outline-none text-zinc-200 focus:border-emerald-500 text-sm"
              >
                <option value="mastering">Audio AI Mastering (Stereographical Limiters)</option>
                <option value="cover_art">Cover Art (Text-To-Image Diffusion Model)</option>
                <option value="video_segment">Active Video Rendering (Temporal Frames)</option>
                <option value="lyrics_generation">Structural Lyric Assistant (LLM Lyricist)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Input Asset Url (Optional)</label>
              <input 
                type="url"
                placeholder="https://storage.googleapis.com/raw_instrumentals/demo_file.wav"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 outline-none text-zinc-200 focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            <button 
              type="submit"
              disabled={triggeringJob}
              className="w-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all"
            >
              {triggeringJob ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Provisioning AI Compute Node...
                </>
              ) : (
                <>
                  <Play size={12} className="fill-black" />
                  Dispatch Neural Node
                </>
              )}
            </button>
          </form>

          {/* AI-Store linker form */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-md font-black uppercase tracking-tight flex items-center gap-1.5">
                <ShoppingBag className="text-blue-400" size={16} />
                Link Store Merchandise to AI Job
              </h3>
              <p className="text-zinc-500 text-xs">Flag existing music catalogs or print products for automatic 5.5% royalty tracking.</p>
            </div>

            <form onSubmit={handleLinkProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[9px] text-zinc-500 font-bold uppercase">Store Product ID or Reference URL</label>
                <input 
                  type="text" 
                  placeholder="e.g. prd_vinyl_901 or track-77"
                  value={productIdToLink}
                  onChange={(e) => setProductIdToLink(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-bold uppercase font-mono">Neural Job Reference ID</label>
                <select 
                  value={jobIdToLink}
                  onChange={(e) => setJobIdToLink(e.target.value)}
                  required
                  className="w-full bg-black border border-white/10 rounded-xl px-2 py-2 text-[10px] focus:outline-none focus:border-emerald-500 text-zinc-300"
                >
                  <option value="">Select AI Job...</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.jobType.toUpperCase()} ({j.id.slice(-6)})</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                disabled={linkingProduct}
                className="bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-900 rounded-xl font-black text-[10px] uppercase tracking-widest px-4 py-2 self-end text-center h-[35px]"
              >
                {linkingProduct ? 'Linking...' : 'Hook Royalty'}
              </button>
            </form>
          </div>
        </div>

        {/* AI Job ledger logs */}
        <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tight">Active Renders ledger</h3>
            <span className="text-zinc-500 text-xs font-mono">{jobs.length} completed nodes</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[420px] pr-2">
            {jobs.length === 0 ? (
              <p className="text-center py-12 text-zinc-500 italic text-sm">No completed AI jobs logged. Deploy a node above!</p>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="p-4 bg-black/20 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black font-mono">
                        {job.id}
                      </span>
                      <span className="text-xs font-black text-white uppercase">{job.jobType.replace('_', ' ')}</span>
                    </div>
                    {job.outputUrl && (
                      <div className="text-[10px] text-zinc-400 select-all truncate max-w-xs font-mono">
                        Output: {job.outputUrl}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col md:items-end justify-center">
                    <div className="text-[9px] text-zinc-500">Platform rate</div>
                    <div className="text-xs font-black text-emerald-400 font-mono">5.5% Profit fee</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Linked product sales lists */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-[32px] p-10 space-y-6">
        <h3 className="text-2xl font-black uppercase tracking-tight">Merchandise Linked To AI Profit Royalties</h3>
        {feeSummary.linkedProducts.length === 0 ? (
          <p className="text-zinc-500 italic text-sm text-center py-10">No accounts/products paired to AI jobs. Select and link above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feeSummary.linkedProducts.map((p) => (
              <div key={p.id} className="bg-black/40 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">{p.product_name || 'Generic AI Item'}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">Linked Job: {p.aiJobId}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-400 font-mono">5.5% Fee</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Active track</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
