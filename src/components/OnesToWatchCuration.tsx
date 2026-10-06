import { useState, useEffect } from 'react';
import { Star, TrendingUp, Play, CheckCircle2, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OnesToWatchCuration() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pitch, setPitch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCuration = async () => {
      try {
        const response = await fetch('/api/curation/ones-to-watch');
        const data = await response.json();
        setTracks(data.tracks || []);
      } catch (_error) {
        console.error('Failed to fetch curation:', _error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCuration();
  }, []);

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/curation/apply-curation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: 1, pitch }) // Mock track ID
      });
      const data = await response.json();
      setMessage(data.message || 'Application submitted successfully');
    } catch {
      setMessage('Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white flex items-center gap-4">
            <Star className="w-8 h-8 text-emerald-500" />
            OnesToWatch Editorial
          </h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2">Weekly Spotlight • Editorial Curation • High Engagement Auto-Approval</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="font-black text-emerald-500">20 New Artists</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">This Week</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-8">This Week's Spotlight</h3>
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-zinc-900 rounded-[32px] animate-pulse" />
            ))
          ) : (
            tracks.map((track, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={track.id} 
                className="flex items-center justify-between p-6 bg-zinc-900 border border-white/5 rounded-[32px] hover:bg-zinc-800/50 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-zinc-800 rounded-2xl overflow-hidden border border-white/5 relative">
                    <img src={track.artwork_url || `https://picsum.photos/seed/${track.id}/200/200`} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-lg uppercase tracking-tight text-white">{track.title}</h4>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">{track.artist_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right hidden md:block">
                    <div className="text-xl font-black text-emerald-500 tracking-tighter">{track.plays?.toLocaleString()}</div>
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Plays</div>
                  </div>
                  <button className="p-4 bg-white/5 text-zinc-400 rounded-2xl hover:text-white hover:bg-white/10 transition-all">
                    <Star className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-zinc-900 rounded-[48px] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Apply for Feature</h3>
            <p className="text-zinc-500 font-medium mb-8 text-sm leading-relaxed">Submit your best track for editorial review. Tracks with over 500 plays are automatically approved for the OnesToWatch list.</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500">Your Pitch</label>
                <textarea 
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="Tell us why your track belongs in the spotlight..."
                  className="w-full h-32 p-6 bg-zinc-800 border border-white/5 rounded-[32px] focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-white transition-all resize-none"
                />
              </div>
              
              <button 
                onClick={handleApply}
                disabled={isSubmitting || !pitch}
                className="w-full py-5 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all shadow-xl shadow-black/20 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5" />
                    Submit Application
                  </>
                )}
              </button>
              
              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 text-emerald-500"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-xs font-bold uppercase tracking-widest">{message}</p>
                </motion.div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 rounded-[48px] p-10 border border-white/5 shadow-2xl">
            <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-6 flex items-center gap-3">
              <Star className="w-5 h-5 text-emerald-500" />
              Editorial Stats
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Avg. Play Boost</span>
                <span className="font-black text-emerald-500">+240%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">New Followers</span>
                <span className="font-black text-emerald-500">4.2k</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Playlist Adds</span>
                <span className="font-black text-emerald-500">1.8k</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
