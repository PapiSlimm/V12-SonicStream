import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Play, Sparkles, Loader2, X, Activity } from 'lucide-react';

interface Highlight {
  id: number;
  eventId: string;
  title: string;
  clipUrl: string;
  activityLevel: number;
  createdAt: string;
}

interface EventHighlightsListProps {
  eventId: string;
}

export const EventHighlightsList = ({ eventId }: EventHighlightsListProps) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [activeClipUrl, setActiveClipUrl] = useState<string | null>(null);
  const [activeClipTitle, setActiveClipTitle] = useState<string | null>(null);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/highlights`);
        if (response.ok) {
          const data = await response.json();
          setHighlights(data);
        }
      } catch (err) {
        console.error('Failed to load highlights from server:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHighlights();
  }, [eventId]);

  const handleSimulateBurst = async () => {
    setIsTriggering(true);
    try {
      // Send activity burst representing a surge of 15 simultaneous actions (massive spike!)
      const response = await fetch(`/api/events/${eventId}/highlights/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score: Math.floor(Math.random() * 8) + 12 }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Instantly refresh list
          setHighlights(result.clips);
        }
      }
    } catch (err) {
      console.error('Failed to simulate crowd burst:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-[40px] p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <Film className="text-emerald-400" size={20} />
            Background Highlights Capture
          </h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">
            Daemon automatically compiles broadcast reels during high audience activity windows
          </p>
        </div>

        {/* Trigger Segment Button */}
        <button
          onClick={handleSimulateBurst}
          disabled={isTriggering}
          className="px-5 py-3 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white font-black uppercase tracking-wider text-[11px] rounded-2xl flex items-center gap-2.5 shadow-lg shadow-black/10 transition-all shrink-0 active:scale-95"
        >
          {isTriggering ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <Activity className="animate-pulse" size={14} />
          )}
          {isTriggering ? 'Compiling Clip...' : 'Trigger Crowd Burst (Demo)'}
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Querying sqlite databases...</p>
          </div>
        ) : highlights.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-dashed border-white/5 p-12 text-center rounded-3xl"
          >
            <Sparkles size={32} className="text-zinc-700 mx-auto mb-4" />
            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">No highlights captured yet</h4>
            <p className="text-xs text-zinc-650 max-w-sm mx-auto mt-1.5 font-medium">
              Start chat discussions, submit setlist votes, or trigger a crowd burst above to hit activity thresholds!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((clip, index) => (
              <motion.div
                key={clip.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-zinc-950/40 border border-white/5 hover:border-emerald-500/20 rounded-[28px] overflow-hidden group hover:shadow-xl transition-all relative flex flex-col justify-between"
              >
                {/* Simulated Thumbnail */}
                <div className="aspect-video bg-zinc-900 border-b border-white/5 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                  
                  {/* Subtle video glow */}
                  <div className="absolute w-2/3 h-2/3 bg-emerald-500/5 blur-3xl rounded-full" />

                  <button
                    onClick={() => {
                      setActiveClipUrl(clip.clipUrl);
                      setActiveClipTitle(clip.title);
                    }}
                    className="p-4 bg-zinc-700 text-white rounded-full scale-90 opacity-80 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-20 flex items-center justify-center shadow-lg shadow-black/20"
                  >
                    <Play size={18} fill="currentColor" />
                  </button>

                  <div className="absolute top-4 left-4 z-20 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5">
                    <Activity size={10} className="text-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-white">
                      Score: {clip.activityLevel}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-1.5">
                  <p className="text-xs font-bold text-white tracking-tight line-clamp-1">{clip.title}</p>
                  <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                    Captured: {new Date(clip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Video Preview Overlay Modal */}
      <AnimatePresence>
        {activeClipUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-[32px] w-full max-w-3xl overflow-hidden relative shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                    Auto Segment Clip
                  </span>
                  <h4 className="text-sm font-black text-white mt-1 uppercase tracking-tight">{activeClipTitle}</h4>
                </div>
                <button
                  onClick={() => {
                    setActiveClipUrl(null);
                    setActiveClipTitle(null);
                  }}
                  className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Video frame */}
              <div className="aspect-video bg-black relative flex items-center justify-center">
                <video
                  src={activeClipUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
