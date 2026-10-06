import { useState, useEffect, useRef } from 'react';
import { io as socketIO, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Plus, CheckCircle2, Award, Zap, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
}

interface LivePollProps {
  eventId: string;
}

export const LivePoll = ({ eventId }: LivePollProps) => {
  const { token } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  
  // Custom poll form states
  const [newQuestion, setNewQuestion] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Load standard seed poll as local fallback until socket loads
  useEffect(() => {
    setPoll({
      id: `poll-${eventId}`,
      question: "Which track should the artist play in the encore?",
      options: [
        { id: "1", text: "Electric Overdrive (Hardwave)", votes: 142 },
        { id: "2", text: "Midnight Reflection (Synthwave)", votes: 94 },
        { id: "3", text: "Stardust Horizon (Trance VIP)", votes: 215 }
      ]
    });
  }, [eventId]);

  useEffect(() => {
    const socketUrl = window.location.origin;
    const socketOpts: any = {
      reconnectionAttempts: 5,
      timeout: 10000,
    };

    if (token) {
      socketOpts.auth = { token };
    }

    try {
      const socket = socketIO(socketUrl, socketOpts);
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('join-room', eventId);
      });

      socket.on('disconnect', () => {
        setConnected(false);
      });

      // Handle real-time poll updates broadcasted by server
      socket.on('poll-updated', (updatedPoll: Poll) => {
        if (updatedPoll && updatedPoll.id) {
          setPoll(updatedPoll);
        }
      });

      return () => {
        socket.disconnect();
      };
    } catch (err) {
      console.warn("Unable to establish Socket.io connection for LivePoll.", err);
    }
  }, [eventId, token]);

  const handleVote = (optionId: string) => {
    if (votedOptionId) return; // Prevent multiple votes per session
    setVotedOptionId(optionId);

    // Track optimistic update locally
    setPoll(prev => {
      if (!prev) return null;
      return {
        ...prev,
        options: prev.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
      };
    });

    // Transmit to Socket server
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('submit-vote', { roomId: eventId, optionId });
    }
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !opt1.trim() || !opt2.trim()) return;

    const reqOptions = [opt1.trim(), opt2.trim()];
    if (opt3.trim()) reqOptions.push(opt3.trim());

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('create-poll', {
        roomId: eventId,
        question: newQuestion.trim(),
        options: reqOptions
      });
    } else {
      // Optimistic mock update for simulation mode
      setPoll({
        id: `poll-${Date.now()}`,
        question: newQuestion.trim(),
        options: reqOptions.map((text, idx) => ({ id: String(idx + 1), text, votes: 0 }))
      });
    }

    // Reset states
    setNewQuestion('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setVotedOptionId(null);
    setShowCreate(false);
  };

  if (!poll) return null;

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0) || 1;
  const winningOptionId = poll.options.reduce((winnerId, opt) => {
    const winnerOpt = poll.options.find(o => o.id === winnerId);
    return !winnerOpt || opt.votes > winnerOpt.votes ? opt.id : winnerId;
  }, poll.options[0]?.id);

  return (
    <div className="bg-zinc-900/45 border border-white/5 rounded-[32px] p-8 overflow-hidden relative shadow-2xl space-y-6 transition-all hover:border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Radio className="animate-pulse" size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              Setlist Live Poll
            </h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
              {connected ? 'Syncing over websocket' : 'Local simulation mode'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors"
          title="Create custom poll"
        >
          <Plus size={16} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!showCreate ? (
          <motion.div
            key="poll-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <p className="text-base font-bold text-zinc-200">{poll.question}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                <HelpCircle size={12} />
                {totalVotes.toLocaleString()} total votes cast
              </p>
            </div>

            <div className="space-y-4">
              {poll.options.map((opt) => {
                const percent = Math.round((opt.votes / totalVotes) * 100);
                const isWinner = opt.id === winningOptionId;
                const hasVotedThis = votedOptionId === opt.id;

                return (
                  <button
                    key={opt.id}
                    disabled={votedOptionId !== null}
                    onClick={() => handleVote(opt.id)}
                    className={`w-full text-left relative overflow-hidden p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      votedOptionId !== null
                        ? 'cursor-default border-white/5 bg-zinc-950/40'
                        : 'border-white/5 bg-zinc-900 hover:border-purple-500/40 hover:bg-zinc-805'
                    }`}
                  >
                    {/* Progress Bar background overlay */}
                    {votedOptionId !== null && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute left-0 top-0 bottom-0 ${
                          isWinner ? 'bg-emerald-500/10' : 'bg-purple-500/10'
                        } z-0`}
                      />
                    )}

                    <div className="relative z-10 flex items-center gap-3">
                      {votedOptionId !== null ? (
                        hasVotedThis ? (
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        ) : isWinner ? (
                          <Award size={16} className="text-purple-400 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-zinc-700 shrink-0" />
                        )
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-700 group-hover:border-purple-500 shrink-0 transition-colors" />
                      )}
                      <span className={`text-xs font-bold transition-colors ${
                        isWinner ? 'text-white' : 'text-zinc-400'
                      }`}>
                        {opt.text}
                      </span>
                    </div>

                    <div className="relative z-10 flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-zinc-500">
                        {opt.votes} votes
                      </span>
                      {votedOptionId !== null && (
                        <span className={`text-xs font-black font-mono ${
                          isWinner ? 'text-emerald-400' : 'text-purple-400'
                        }`}>
                          {percent}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {votedOptionId && (
              <p className="text-[10px] text-center text-emerald-400/80 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
                <Zap size={10} /> Thanks for voting! Audience reaction synced.
              </p>
            )}
          </motion.div>
        ) : (
          <motion.form
            key="poll-create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleCreatePollSubmit}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Question</label>
              <input
                type="text"
                required
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g. Next genre transition?"
                className="w-full px-4 py-3 bg-zinc-950/40 border border-white/5 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Voting Options</label>
              <input
                type="text"
                required
                value={opt1}
                onChange={(e) => setOpt1(e.target.value)}
                placeholder="Option 1 (Required)"
                className="w-full px-4 py-3 bg-zinc-950/40 border border-white/5 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                required
                value={opt2}
                onChange={(e) => setOpt2(e.target.value)}
                placeholder="Option 2 (Required)"
                className="w-full px-4 py-3 bg-zinc-950/40 border border-white/5 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                value={opt3}
                onChange={(e) => setOpt3(e.target.value)}
                placeholder="Option 3 (Optional)"
                className="w-full px-4 py-3 bg-zinc-950/40 border border-white/5 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 py-3 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-purple-500 hover:bg-purple-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Launch Poll
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};
