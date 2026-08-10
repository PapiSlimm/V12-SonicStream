import { useState, useEffect, useRef } from 'react';
import { Users, MessageSquare, Play, Pause, Send, Headphones, Plus, LogOut } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useTrack } from '../../context/TrackContext';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  user: string;
  message: string;
  timestamp: Date;
}

export const SonicRooms = () => {
  const { user } = useAuth();
  const { currentTrack, playTrack, isPlaying, setIsPlaying } = useTrack();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [inputRoomId, setInputRoomId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomId) {
      socketRef.current = io(window.location.origin);
      
      socketRef.current.emit('join-room', roomId);

      socketRef.current.on('playback-update', ({ track, isPlaying: remoteIsPlaying }) => {
        // In a real app, we'd sync position too
        if (track && (!currentTrack || track.id !== currentTrack.id)) {
          playTrack(track);
        }
        setIsPlaying(remoteIsPlaying);
      });

      socketRef.current.on('new-message', (msg: Message) => {
        setMessages(prev => [...prev, msg]);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [roomId, currentTrack, playTrack, setIsPlaying]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = () => {
    if (inputRoomId.trim()) {
      setRoomId(inputRoomId.trim());
    }
  };

  const handleCreate = () => {
    const newId = Math.random().toString(36).substring(7).toUpperCase();
    setRoomId(newId);
  };

  const sendMessage = () => {
    if (newMessage.trim() && roomId && socketRef.current) {
      socketRef.current.emit('chat-message', {
        roomId,
        message: newMessage.trim(),
        user: user?.name || 'Anonymous'
      });
      setNewMessage('');
    }
  };

  const syncPlayback = () => {
    if (roomId && socketRef.current && currentTrack) {
      socketRef.current.emit('sync-playback', {
        roomId,
        track: currentTrack,
        isPlaying,
        position: 0 // Simplified
      });
    }
  };

  if (!roomId) {
    return (
      <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] p-12 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <Headphones size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold mb-4">SonicRooms</h2>
        <p className="text-zinc-400 mb-12 max-w-md mx-auto">
          Listen to music in real-time with friends. Sync your playback and chat while you discover new sounds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              placeholder="Enter Room Code"
              className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500 transition-all"
            />
            <button
              onClick={handleJoin}
              className="bg-white text-black font-bold px-8 rounded-2xl hover:bg-zinc-200 transition-all"
            >
              Join
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-600 font-bold">OR</span>
            <button
              onClick={handleCreate}
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <Plus size={20} />
              Create Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
      <div className="lg:col-span-2 bg-zinc-900/50 border border-white/10 rounded-[40px] p-8 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/20 p-3 rounded-2xl">
              <Users className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Room: {roomId}</h3>
              <p className="text-zinc-500 text-xs uppercase tracking-widest">Live Session</p>
            </div>
          </div>
          <button 
            onClick={() => setRoomId(null)}
            className="p-3 bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-2xl transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
          {currentTrack ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="w-48 h-48 mx-auto rounded-[40px] overflow-hidden shadow-2xl shadow-emerald-500/20">
                <img 
                  src={currentTrack.coverUrl || `https://picsum.photos/seed/${currentTrack.id}/400/400`} 
                  className="w-full h-full object-cover"
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="text-2xl font-bold">{currentTrack.title}</h4>
                <p className="text-zinc-400">{currentTrack.displayArtistName}</p>
              </div>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => { setIsPlaying(!isPlaying); syncPlayback(); }}
                  className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                >
                  {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" className="ml-1" />}
                </button>
                <button 
                  onClick={syncPlayback}
                  className="px-6 py-4 bg-emerald-500/20 text-emerald-400 font-bold rounded-2xl hover:bg-emerald-500/30 transition-all flex items-center gap-2"
                >
                  <Headphones size={20} />
                  Sync Others
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                <Play size={32} className="text-zinc-600" />
              </div>
              <p className="text-zinc-500">Pick a track to start the party!</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-white/10 rounded-[40px] flex flex-col overflow-hidden">
        <div className="p-6 border-bottom border-white/5 bg-white/5 flex items-center gap-3">
          <MessageSquare size={18} className="text-emerald-400" />
          <h3 className="font-bold">Live Chat</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex flex-col max-w-[80%]",
                  msg.user === user?.name ? "ml-auto items-end" : "items-start"
                )}
              >
                <span className="text-[10px] font-bold text-zinc-500 uppercase mb-1">{msg.user}</span>
                <div className={cn(
                  "px-4 py-2 rounded-2xl text-sm",
                  msg.user === user?.name ? "bg-zinc-700 text-white font-medium" : "bg-white/10 text-white"
                )}>
                  {msg.message}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        <div className="p-6 bg-black/40">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Say something..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-all"
            />
            <button
              onClick={sendMessage}
              className="p-3 bg-zinc-700 text-white rounded-xl hover:bg-zinc-600 transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
