import { useState, useEffect, useRef } from 'react';
import { io as socketIO, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ChatMessage {
  id: string;
  message: string;
  user: {
    uid: string;
    email: string;
    name: string;
  };
  timestamp: Date;
}

interface LiveEventChatProps {
  eventId: string;
}

// Some funny simulated live attendee comments to inject periodically
const CHAT_SIMULATOR_POOL = [
  "This set is dropping absolute fire 🔥🔥🔥",
  "Is anyone else streaming from New York? Vibes are massive!",
  "V12 Collective never disappoints",
  "The light show at the Grand Arena must be insane tonight",
  "Can we buy official merchandise online?",
  "That transition was smoother than butter 🤤",
  "SonicStream V12 is unmatched honestly",
  "BASS IS UNREAL! Turn it up!",
  "Who is the opening DJ?",
  "Wish I could be there in person, but this high-fidelity stream is amazing",
  "Let's gooooo! 🙌🙌🙌",
  "Drop is coming! Wait for it...",
  "Pure magic right here ✨",
  "I am so glad they added live chat for this show!"
];

const CHAT_ATTENDEE_NAMES = [
  "Nebula_Beats", "Cyber_Samurai", "Hologram_Girl", "LunaSonic", "BassDrop99",
  "VibeArchitect", "ElectricDreamer", "SynthWanderer", "EchoWave", "FrequencyRider",
  "TechnoQueen", "NeonDancer"
];

export const LiveEventChat = ({ eventId }: LiveEventChatProps) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1248);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Load initial simulated chat history
  useEffect(() => {
    const initialHistory: ChatMessage[] = [];
    const now = new Date();
    for (let i = 4; i >= 1; i--) {
      const randomMsg = CHAT_SIMULATOR_POOL[Math.floor(Math.random() * CHAT_SIMULATOR_POOL.length)];
      const randomUser = CHAT_ATTENDEE_NAMES[Math.floor(Math.random() * CHAT_ATTENDEE_NAMES.length)];
      initialHistory.push({
        id: `init-${i}`,
        message: randomMsg,
        user: {
          uid: `mock-user-${i}`,
          email: `${randomUser.toLowerCase()}@example.com`,
          name: randomUser
        },
        timestamp: new Date(now.getTime() - i * 60000)
      });
    }
    setMessages(initialHistory);
  }, []);

  // Socket.io initialization and subscriptions
  useEffect(() => {
    // Attempt standard socket.io-client connection
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
        // Standard payload to sync into event id room
        socket.emit('join-room', { roomId: eventId });
      });

      socket.on('disconnect', () => {
        setConnected(false);
      });

      // Handle raw new-message from backend
      socket.on('new-message', (data: any) => {
        const incomingMsg: ChatMessage = {
          id: `socket-${Date.now()}-${Math.random()}`,
          message: data.message,
          user: data.user || { uid: 'anon', email: 'anon@example.com', name: 'Anonymous' },
          timestamp: new Date(data.timestamp || Date.now())
        };
        setMessages(prev => [...prev, incomingMsg].slice(-50));
      });

      return () => {
        socket.disconnect();
      };
    } catch (err) {
      console.warn("Unable to establish Socket.io connection. Operating in premium local simulation mode.", err);
    }
  }, [eventId, token]);

  // Handle auto-scrolling to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Periodic simulation to make the dashboard feel alive with heavy traffic
  useEffect(() => {
    const interval = setInterval(() => {
      // Periodic noise fluctuation of online count
      setOnlineCount(prev => prev + Math.floor(Math.random() * 7) - 3);

      // 30% chance of inserting a simulated live message
      if (Math.random() < 0.35) {
        const randomMsg = CHAT_SIMULATOR_POOL[Math.floor(Math.random() * CHAT_SIMULATOR_POOL.length)];
        const randomUser = CHAT_ATTENDEE_NAMES[Math.floor(Math.random() * CHAT_ATTENDEE_NAMES.length)];
        
        const generated: ChatMessage = {
          id: `sim-${Date.now()}`,
          message: randomMsg,
          user: {
            uid: `mock-user-${Date.now()}`,
            email: `${randomUser.toLowerCase()}@example.com`,
            name: randomUser
          },
          timestamp: new Date()
        };
        setMessages(prev => [...prev, generated].slice(-50));
      }
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Dispatch a message
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const myName = user?.name || user?.email?.split('@')[0] || 'You';
    const myMsg: ChatMessage = {
      id: `me-${Date.now()}`,
      message: inputValue.trim(),
      user: {
        uid: user?.id || 'uid-me',
        email: user?.email || '',
        name: myName
      },
      timestamp: new Date()
    };

    // Propagate message over sockets
    if (socketRef.current && (connected || socketRef.current.connected)) {
      socketRef.current.emit('chat-message', {
        roomId: eventId,
        message: inputValue.trim()
      });
    }

    // Append to local queue
    setMessages(prev => [...prev, myMsg]);
    setInputValue('');

    // Fast simulated response to make user experience interactive
    setTimeout(() => {
      const replies = [
        "True!", "No way!", "Agreed!", "Let's go!", "🔥🔥🔥", "pure gold right there", "Insane drop!"
      ];
      const randomReplier = CHAT_ATTENDEE_NAMES[Math.floor(Math.random() * CHAT_ATTENDEE_NAMES.length)];
      const simResponse: ChatMessage = {
        id: `sim-rep-${Date.now()}`,
        message: replies[Math.floor(Math.random() * replies.length)],
        user: {
          uid: `mock-${Date.now()}`,
          email: `${randomReplier.toLowerCase()}@example.com`,
          name: randomReplier
        },
        timestamp: new Date()
      };
      setMessages(prev => [...prev, simResponse]);
    }, 1200 + Math.random() * 1500);
  };

  const handleQuickEmoji = (emoji: string) => {
    setInputValue(prev => prev + emoji);
  };

  return (
    <div className="bg-zinc-900/45 border border-white/5 rounded-[32px] overflow-hidden flex flex-col h-[520px] transition-all hover:border-white/10 shadow-2xl">
      {/* Header section with pulsating neon statuses */}
      <div className="p-5 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <MessageSquare size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase text-white tracking-widest">Live Discussion</span>
              {connected ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
              {connected ? 'Socket.io Connected' : 'Simulated Live Broadcast'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-full text-zinc-400 text-[10px] font-black uppercase tracking-widest font-mono">
          <Users size={12} className="text-zinc-500" />
          <span>{onlineCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-black/5">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.user.uid === (user?.id || 'uid-me');
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon placeholder */}
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-black text-xs font-mono uppercase ${
                  isMe 
                    ? 'bg-zinc-700 text-white shadow-md shadow-black/20' 
                    : 'bg-zinc-800 text-zinc-400 border border-white/5'
                }`}>
                  {msg.user.name.charAt(0)}
                </div>

                <div className="space-y-1">
                  <div className={`flex items-baseline gap-2 ${isMe ? 'justify-end' : ''}`}>
                    <span className="text-xs font-black text-zinc-300 transition-colors uppercase hover:text-white">
                      {msg.user.name}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-600 font-bold">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-tr-none' 
                      : 'bg-zinc-800/40 border border-white/5 text-zinc-300 rounded-tl-none'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Quick Emojis Shortcut Bar */}
      <div className="px-5 py-1.5 border-t border-white/5 bg-zinc-950/20 flex gap-2">
        {["🔥", "🎉", "🙌", "❤️", "🚀", "💥"].map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleQuickEmoji(emoji)}
            className="p-1 px-2 hover:bg-white/5 rounded-lg text-xs transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Dispatch form input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-zinc-950/40 border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Join the discussion..."
          className="flex-1 px-4 py-3 bg-zinc-900 border border-white/5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
        <button
          type="submit"
          className="p-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-all font-black flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg shadow-black/10"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
