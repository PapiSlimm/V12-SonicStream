import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, User, Bot, Loader2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useStore';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  userId: string;
  user: { name: string; email: string };
  content: string;
  createdAt: string;
  roomId: string;
}

export function ChatRoom({ roomId, title }: { roomId: string; title: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { user, token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Initialize socket — authenticated handshake (server rejects tokenless connects).
    socketRef.current = io(window.location.origin, { auth: { token } });

    socketRef.current.on('connect', () => {
      console.log('Connected to chat server');
      socketRef.current?.emit('join-room', roomId);
    });

    socketRef.current.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Fetch history
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/chat/${roomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const history = await response.json();
          setMessages(history);
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };

    fetchHistory();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId, token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !user || !token) return;

    const content = input;
    setInput('');

    try {
      const response = await fetch(`/api/chat/${roomId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const savedMsg = await response.json();
        // Emit to socket for realtime broadcast
        socketRef.current?.emit('send-message', savedMsg);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 left-8 z-50 w-14 h-14 bg-v12-red text-white flex items-center justify-center shadow-xl border-2 border-black hover:scale-110 transition-transform"
      >
        <MessageSquare size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.8 }}
            className="fixed bottom-44 left-8 z-50 w-[350px] h-[500px] bg-v12-gray-900 border-4 border-v12-red shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="bg-v12-red text-white p-4 flex items-center justify-between border-b-4 border-black">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} />
                <span className="font-black uppercase tracking-tighter text-sm">{title}</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-black/40 scrollbar-thin scrollbar-thumb-v12-red relative">
              {messages.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <MessageSquare size={48} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No messages yet. Start the conversation.</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "flex flex-col",
                  msg.userId === user?.id ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-[85%] p-3 border-2",
                    msg.userId === user?.id 
                      ? "bg-v12-red text-white border-v12-red" 
                      : "bg-v12-gray-800 text-white border-white/10"
                  )}>
                    <p className="text-xs font-bold leading-tight">{msg.content}</p>
                  </div>
                  <span className="mt-1 text-[8px] font-black uppercase tracking-widest opacity-50">
                    {msg.user?.name || 'Anonymous'}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t-4 border-black bg-v12-gray-900">
              {!user ? (
                <p className="text-[10px] font-black text-v12-red uppercase tracking-widest text-center py-2">
                  Please login to participate in the chat.
                </p>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type message..."
                    className="flex-grow bg-black/40 border-2 border-white/10 p-2 focus:outline-none focus:border-v12-red font-bold uppercase tracking-tighter text-xs text-white"
                  />
                  <button 
                    type="submit"
                    className="p-2 bg-v12-red text-white border-2 border-black hover:bg-white hover:text-v12-red transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
