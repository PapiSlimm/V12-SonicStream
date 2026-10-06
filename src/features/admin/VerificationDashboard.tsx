import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Check, X, ExternalLink, User, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface Request {
  id: string;
  userName: string;
  userEmail: string;
  idImageUrl: string;
  socialLinks: string[];
  submittedAt: string;
}

export const AdminVerificationDashboard = () => {
  const [requests, setRequests] = useState<Request[]>([
    {
      id: '1',
      userName: 'Alex Pulse',
      userEmail: 'alex@pulse.com',
      idImageUrl: 'https://picsum.photos/seed/id1/800/600',
      socialLinks: ['https://instagram.com/alexpulse', 'https://twitter.com/alexpulse'],
      submittedAt: '2026-04-08T10:00:00Z'
    },
    {
      id: '2',
      userName: 'Luna Sound',
      userEmail: 'luna@sound.com',
      idImageUrl: 'https://picsum.photos/seed/id2/800/600',
      socialLinks: ['https://instagram.com/lunasound'],
      submittedAt: '2026-04-08T11:30:00Z'
    }
  ]);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setRequests(requests.filter(r => r.id !== id));
    toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Verification Queue</h1>
          <p className="text-zinc-500 text-sm">Review and process artist identity verification requests.</p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
          {requests.length} Pending
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {requests.map((req) => (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex items-center justify-between gap-8 group hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-6 flex-1">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                  <User size={24} className="text-zinc-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">{req.userName}</h3>
                  <p className="text-zinc-500 text-xs">{req.userEmail}</p>
                </div>
                <div className="h-8 w-px bg-white/5 mx-4" />
                <div className="flex gap-4">
                  <a 
                    href={req.idImageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Eye size={14} />
                    View ID
                  </a>
                  <div className="flex gap-2">
                    {req.socialLinks.map((link, i) => (
                      <a 
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-500 hover:text-white transition-all"
                      >
                        <ExternalLink size={14} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleAction(req.id, 'reject')}
                  className="p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                  title="Reject"
                >
                  <X size={20} />
                </button>
                <button 
                  onClick={() => handleAction(req.id, 'approve')}
                  className="p-4 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all"
                  title="Approve"
                >
                  <Check size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {requests.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck size={32} className="text-zinc-700" />
            </div>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">All caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};
