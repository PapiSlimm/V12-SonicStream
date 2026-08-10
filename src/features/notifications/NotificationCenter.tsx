import React from 'react';
import { 
  Bell, 
  Zap, 
  Calendar, 
  Music, 
  CheckCircle2, 
  Trash2, 
  Settings,
  MoreVertical,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { useNotifications, useMarkNotificationsRead } from '../../hooks/useApi';

export const NotificationCenter: React.FC = () => {
  const { data: notifications = [] } = useNotifications();
  const markReadMutation = useMarkNotificationsRead();

  const markAsRead = () => {
    markReadMutation.mutate(); // This usually marks all as read in the current implementation, but we can refine it
    toast.success('Marked as read');
  };

  const deleteNotification = () => {
    // We need a delete notification hook if we want to support this
    toast.error('Delete not implemented yet');
  };

  const clearAll = () => {
    toast.error('Clear all not implemented yet');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'release': return <Music className="text-emerald-400" size={18} />;
      case 'event': return <Calendar className="text-blue-400" size={18} />;
      case 'booking': return <Zap className="text-purple-400" size={18} />;
      default: return <Info className="text-zinc-400" size={18} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="flex items-end justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <Bell size={12} />
            Live Updates
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tight">Notification Center</h2>
          <p className="text-zinc-400">Stay updated with the latest releases, events, and booking requests.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={clearAll}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold transition-all border border-white/5"
          >
            Clear All
          </button>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
            <Settings size={20} className="text-zinc-400" />
          </button>
        </div>
      </header>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.map((n) => (
            <motion.div 
              key={n.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "p-6 rounded-[32px] border transition-all flex gap-6 group",
                n.isRead 
                  ? "bg-zinc-900/20 border-white/5 opacity-60" 
                  : "bg-zinc-900/50 border-white/10 shadow-xl shadow-emerald-500/5"
              )}
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                n.isRead ? "bg-white/5" : "bg-white/10"
              )}>
                {getIcon(n.type)}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {n.type} • {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                  {!n.isRead && (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
                  )}
                </div>
                <p className={cn("text-lg font-bold leading-tight", !n.isRead ? "text-white" : "text-zinc-400")}>
                  {n.message}
                </p>
                <div className="flex items-center gap-6 pt-2">
                  <button 
                    onClick={() => markAsRead()}
                    className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Mark as read
                  </button>
                  <button className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                    View Details
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                  <MoreVertical size={18} />
                </button>
                <button 
                  onClick={() => deleteNotification()}
                  className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="p-32 text-center space-y-6 bg-zinc-900/20 border border-dashed border-white/10 rounded-[40px]">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-zinc-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight">All Caught Up</h3>
              <p className="text-zinc-500 text-sm">You have no new notifications at this time.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
