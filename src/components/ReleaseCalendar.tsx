import { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Play, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  addEventToCalendar, 
  isGoogleCalendarConnected, 
  connectGoogleCalendar, 
  getConnectedEmail 
} from '../services/googleCalendar';

export default function ReleaseCalendar() {
  const [isGCalConnected, setIsGCalConnected] = useState(isGoogleCalendarConnected());
  const [gcalEmail, setGcalEmail] = useState(getConnectedEmail());
  const [isLinking, setIsLinking] = useState(false);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  const [milestones, setMilestones] = useState({
    week1: { title: 'Teaser Campaign', action: 'TikTok (15s clip)', status: 'scheduled', date: '2026-03-01T12:00:00Z' },
    week2: { title: 'Pre-save Push', action: 'Instagram Stories', status: 'pending', date: '2026-03-08T12:00:00Z' }, 
    week3: { title: 'Release Day', action: '3D Player Premiere', status: 'pending', date: '2026-03-15T00:00:00Z' },
    week4: { title: 'Fan Engagement', action: 'Live Q&A + Merch', status: 'pending', date: '2026-03-22T18:00:00Z' }
  });

  const handleConnect = async () => {
    setIsLinking(true);
    try {
      const result = await connectGoogleCalendar();
      if (result) {
        setIsGCalConnected(true);
        setGcalEmail(result.email);
      }
    } catch (err: any) {
      alert(`Google Calendar connection failed: ${err.message || err}`);
    } finally {
      setIsLinking(false);
    }
  };

  const handleScheduleMilestone = async (key: string, data: any) => {
    if (!isGCalConnected) {
      const wantConnect = window.confirm('Connect Google Calendar to schedule this release milestone directly in your schedule?');
      if (wantConnect) {
        await handleConnect();
      }
      return;
    }

    const isConfirmed = window.confirm(
      `Confirm Action: Do you authorize SonicStream to schedule "${data.title}" on ${new Date(data.date).toLocaleDateString()} inside your Google Calendar?`
    );
    if (!isConfirmed) return;

    setSchedulingId(key);
    try {
      await addEventToCalendar(
        `SonicStream Release: ${data.title}`,
        `Optimized milestone for Indie Pop Release.\nRecommended action: ${data.action}`,
        'Virtual Campaign Session',
        data.date,
        new Date(new Date(data.date).getTime() + 60 * 60 * 1000).toISOString() // 1 hour duration
      );

      setMilestones(prev => ({
        ...prev,
        [key]: {
          ...prev[key as keyof typeof prev],
          status: 'scheduled'
        }
      }));
      alert(`Milestone "${data.title}" successfully added to Google Calendar!`);
    } catch (err: any) {
      alert(`Failed to add milestone: ${err.message || err}`);
    } finally {
      setSchedulingId(null);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-[48px] shadow-2xl p-12 border border-white/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-[28px] flex items-center justify-center">
            <Calendar className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Smart Release Calendar</h2>
            <p className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-1.5">
              <span>Optimized for Indie Pop Release</span>
              {isGCalConnected && (
                <>
                  <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                  <span className="text-zinc-400 font-normal">Synced with {gcalEmail}</span>
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          {!isGCalConnected ? (
            <button 
              type="button"
              onClick={handleConnect}
              disabled={isLinking}
              className="px-6 py-4 bg-zinc-700/10 border border-emerald-500/20 text-emerald-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-700 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              {isLinking ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
              Sync Google Calendar
            </button>
          ) : (
            <span className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
              <CheckCircle2 size={14} /> Active GCal Connection
            </span>
          )}
          <button type="button" className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-sans text-xs">
            Change Template
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {Object.entries(milestones).map(([key, data], i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={key} 
            className={`p-10 rounded-[40px] border-4 transition-all group relative overflow-hidden ${
              data.status === 'scheduled' 
                ? 'border-emerald-500 bg-zinc-800/50' 
                : 'border-white/5 bg-zinc-900/50 hover:border-emerald-500/30'
            }`}
          >
            {data.status === 'scheduled' && (
              <div className="absolute top-6 right-6">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
            )}
            
            <div className="flex flex-col h-full">
              <div className="w-12 h-12 bg-zinc-700 text-white rounded-2xl flex items-center justify-center font-black text-sm mb-6 shadow-lg shadow-black/10">
                W{i + 1}
              </div>
              <h3 className="font-black text-xl mb-1 uppercase tracking-tight text-white">{data.title}</h3>
              <p className="text-zinc-500 font-medium text-sm mb-4">{data.action}</p>
              <p className="text-[10px] font-mono text-zinc-600 mb-8 uppercase font-bold">Planned: {new Date(data.date).toLocaleDateString()}</p>
              
              <div className="mt-auto">
                <button 
                  type="button"
                  onClick={() => handleScheduleMilestone(key, data)}
                  disabled={data.status === 'scheduled' || schedulingId === key}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                    data.status === 'scheduled'
                      ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 cursor-default'
                      : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer'
                  }`}
                >
                  {schedulingId === key ? (
                    <>
                      <Loader2 className="animate-spin text-emerald-400" size={14} /> Scheduling...
                    </>
                  ) : data.status === 'scheduled' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Scheduled
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" /> Schedule
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-zinc-800/30 border border-white/5 p-8 rounded-[32px] flex items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
            <Play className="w-6 h-6 text-zinc-400" />
          </div>
          <div>
            <div className="font-black uppercase tracking-tight text-white">Next Milestone: Release Day</div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Friday, March 15th • 12:00 AM EST</div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-2xl font-black text-emerald-500 tracking-tighter">9 DAYS</div>
            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Countdown</div>
          </div>
        </div>
      </div>
    </div>
  );
}
