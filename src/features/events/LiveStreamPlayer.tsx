import { useState, useEffect, useRef } from 'react';
import { io as socketIO, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize2, Users, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LiveStreamPlayerProps {
  eventId: string;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number; // starting left percentage
  delay: number; // staggered entrance helper
  scale: number;
}

const PRESET_EMOJIS = ['❤️', '🔥', '👏', '🙌', '😮', '💯'];

export const LiveStreamPlayer = ({ eventId }: LiveStreamPlayerProps) => {
  const { token } = useAuth();
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [viewerCount, setViewerCount] = useState(482);
  const [isWebRTC, setIsWebRTC] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const broadcasterSocketIdRef = useRef<string | null>(null);

  // Video looping feeds
  const streamUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';

  const cleanupWebRTC = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    broadcasterSocketIdRef.current = null;
    setIsWebRTC(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

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
        socket.emit('join-room', eventId);
        // Signal that we are ready as a viewer to receive peer-to-peer stream
        socket.emit('webrtc-join-as-viewer', { roomId: eventId });
      });

      // WebRTC Low-Latency Signaling handlers
      socket.on('webrtc-offer', async ({ offer, senderSocketId }) => {
        cleanupWebRTC();
        
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        peerConnectionRef.current = pc;
        broadcasterSocketIdRef.current = senderSocketId;

        pc.onicecandidate = (event) => {
          if (event.candidate && socketRef.current) {
            socketRef.current.emit('webrtc-candidate', {
              targetSocketId: senderSocketId,
              candidate: event.candidate
            });
          }
        };

        pc.ontrack = (event) => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
            setIsWebRTC(true);
            setIsPlaying(true);
          }
        };

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('webrtc-answer', {
            targetSocketId: senderSocketId,
            answer
          });
        } catch (err) {
          console.error('[WebRTC] Error during offer-answer negotiation:', err);
        }
      });

      socket.on('webrtc-candidate', async ({ candidate }) => {
        if (peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('[WebRTC] Error adding received ICE candidate:', err);
          }
        }
      });

      socket.on('webrtc-streamer-disconnected', () => {
        console.log('[WebRTC] Streamer left, switching back to loop video fallback.');
        cleanupWebRTC();
      });

      // Listen for reactions broadcasted by the server from anyone in this room
      socket.on('new-reaction', ({ emoji }) => {
        const id = `rec-${Math.random()}-${Date.now()}`;
        const newReaction: FloatingReaction = {
          id,
          emoji,
          x: 10 + Math.random() * 80, // random start position from 10% to 90%
          delay: Math.random() * 0.2,
          scale: 0.8 + Math.random() * 0.5,
        };

        setReactions((prev) => [...prev, newReaction]);

        // Cleanup reaction after 3 seconds
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== id));
        }, 3000);
      });

      return () => {
        cleanupWebRTC();
        socket.disconnect();
      };
    } catch (err) {
      console.warn("Unable to establish Socket.io connection for LiveStreamPlayer.", err);
    }
  }, [eventId, token]);

  // Handle local user clicking an emoji reaction button
  const sendReaction = (emoji: string) => {
    // Standard optimistic animation for the clicker
    const id = `rec-local-${Math.random()}-${Date.now()}`;
    const newReaction: FloatingReaction = {
      id,
      emoji,
      x: 10 + Math.random() * 80,
      delay: 0,
      scale: 1.1,
    };
    setReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);

    // Broadcast reaction to other room attendees
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send-reaction', { roomId: eventId, emoji });
    }
  };

  // Simulate viewer fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => prev + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 4));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Aspect Video frame wrapper */}
      <div className="aspect-video bg-black rounded-[40px] border border-white/5 overflow-hidden relative group shadow-2xl">
        
        {/* Real HTML5 loop player simulating live rtp stream code */}
        <video
          ref={videoRef}
          src={isWebRTC ? undefined : streamUrl}
          autoPlay
          loop={!isWebRTC}
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover opacity-85"
          onClick={() => setIsPlaying(!isPlaying)}
        />

        {/* Live Broadcast Badge Overlays */}
        <div className="absolute top-6 left-6 z-20 flex gap-2.5">
          <span className="px-3.5 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-1.5 shadow-md animate-pulse">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            {isWebRTC ? 'Low Latency WebRTC' : 'Live Feed'}
          </span>
          <span className="px-3.5 py-1 bg-black/60 backdrop-blur-md text-zinc-300 text-[9px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 border border-white/5">
            <Users size={10} className="text-zinc-400" />
            {viewerCount.toLocaleString()} streaming
          </span>
        </div>

        {/* Render Floating Reaction Emojis particle overlays (Framer Motion Animation) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
          <AnimatePresence>
            {reactions.map((react) => (
              <motion.div
                key={react.id}
                initial={{ opacity: 0, y: '95%', x: `${react.x}%`, scale: 0.5 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: '10%',
                  x: [
                    `${react.x}%`, 
                    `${react.x + (react.x > 50 ? -12 : 12)}%`, 
                    `${react.x}%`
                  ],
                  scale: react.scale,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2.8,
                  ease: 'easeOut',
                  delay: react.delay
                }}
                className="absolute text-3xl select-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                style={{ originY: 1 }}
              >
                {react.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Video Player Action controls HUD (overlay on hover) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none" />
        
        <div className="absolute bottom-6 left-6 right-6 z-30 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-3 pointer-events-auto">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-all border border-white/10"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-all border border-white/10"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>

          <div className="pointer-events-auto">
            <button className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-all border border-white/10">
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Reaction triggers bar */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-[32px] p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Heart className="text-red-500 fill-red-500 animate-pulse shrink-0" size={14} />
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
            React to the Drop:
          </span>
        </div>

        <div className="flex gap-2 relative">
          {PRESET_EMOJIS.map((emoji) => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.25, rotate: [0, -5, 5, 0] }}
              whileTap={{ scale: 0.9 }}
              onClick={() => sendReaction(emoji)}
              className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xl select-none transition-colors"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
