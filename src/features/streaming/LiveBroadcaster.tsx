import { useState, useEffect, useRef } from 'react';
import { io as socketIO, Socket } from 'socket.io-client';
import { 
  Video, 
  VideoOff, 
  Radio, 
  Share2, 
  X, 
  Mic, 
  Play, 
  Square, 
  Layers, 
  MessageSquare, 
  Users, 
  Presentation, 
  ShoppingBag, 
  VolumeX, 
  Monitor 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Define the supported stream destinations
interface StreamDestination {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  isConnected: boolean;
  streamKey: string;
  streamUrl: string;
}

// Define mock products for small business livestream layout
interface LiveProduct {
  id: string;
  name: string;
  price: string;
  image: string;
  ctaText: string;
}

export const LiveBroadcaster = () => {
  const { user, token } = useAuth();
  
  // Streaming state
  const [isLive, setIsLive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  
  // Creator Profile and Live Preset Selection
  // Types: 'creator' | 'business' | 'promoter' | 'startup' | 'artist'
  const [broadcasterType, setBroadcasterType] = useState<'creator' | 'business' | 'promoter' | 'startup' | 'artist'>('creator');
  
  // Active Overlay configurations
  const [showLowerThird, setShowLowerThird] = useState(true);
  const [lowerThirdName, setLowerThirdName] = useState(user?.name || 'Presenter');
  const [lowerThirdTitle, setLowerThirdTitle] = useState('Live Broadcaster Hub');
  
  const [showSponsorMarquee, setShowSponsorMarquee] = useState(false);
  const [sponsorText, setSponsorText] = useState('V12 Streaming Inc. • SonicStream Partner • MegaTech Hub');
  
  const [showProductOverlay, setShowProductOverlay] = useState(false);
  const [promotedProduct, setPromotedProduct] = useState<LiveProduct>({
    id: 'prod-1',
    name: 'Supercharged Creator Mic',
    price: '$129.99',
    image: 'https://images.unsplash.com/photo-1590608897129-79da98d15969?auto=format&fit=crop&q=80&w=200',
    ctaText: 'Buy in 1-Click'
  });

  const [showPitchDeck, setShowPitchDeck] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slides = [
    { title: 'The Problem', content: 'Connecting and syncing state across 5 social streams with low latency is painfully difficult.' },
    { title: 'Our Solution', content: 'SonicStream Omnichannel RTMP engine relays 4K video feeds to YouTube, Twitch, and Twitter with a 1.2s delay.' },
    { title: 'Market Size', content: 'Creators and startups spent $42B in live events during the last calendar year.' },
    { title: 'Next Steps', content: 'Launch and syndicate immediately to capture local leads or fan transactions.' }
  ];

  // List of configured destinations
  const [destinations, setDestinations] = useState<StreamDestination[]>([
    { id: 'youtube', name: 'YouTube Live', color: 'text-red-500', bgColor: 'bg-red-500/10 border-red-500/20', icon: '🔴', isConnected: true, streamKey: 'yt-9482-sk12-pq81', streamUrl: 'rtmp://a.rtmp.youtube.com/live2' },
    { id: 'twitch', name: 'Twitch TV', color: 'text-purple-500', bgColor: 'bg-purple-500/10 border-purple-500/20', icon: '👾', isConnected: true, streamKey: 'tw-9102-k128-lp09', streamUrl: 'rtmp://live.twitch.tv/app' },
    { id: 'facebook', name: 'Facebook Live', color: 'text-blue-500', bgColor: 'bg-blue-500/10 border-blue-500/20', icon: '👥', isConnected: false, streamKey: '', streamUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/' },
    { id: 'linkedin', name: 'LinkedIn Professional', color: 'text-sky-500', bgColor: 'bg-sky-500/10 border-sky-500/20', icon: '💼', isConnected: false, streamKey: '', streamUrl: 'rtmpe://live-ingest.linkedin.com/live' },
    { id: 'tiktok', name: 'TikTok Live', color: 'text-rose-400', bgColor: 'bg-rose-400/10 border-rose-400/20', icon: '🎵', isConnected: false, streamKey: '', streamUrl: 'rtmp://live-push.tiktok.com/stream' },
    { id: 'custom', name: 'Custom RTMP', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10 border-emerald-400/20', icon: '🌐', isConnected: false, streamKey: '', streamUrl: '' },
  ]);

  // Combined Live Chat Message log
  const [chatMessages, setChatMessages] = useState([
    { id: '1', user: 'Alex Rivera', origin: 'youtube', text: 'This presentation is incredibly clear! Wow! 🚀', time: '12:01' },
    { id: '2', user: 'StartupGeek', origin: 'linkedin', text: 'What is the projected CAC metric for the second slide?', time: '12:02' },
    { id: '3', user: 'CraftyChef', origin: 'twitch', text: 'Is the merch drop restricted to US listeners only?', time: '12:03' },
    { id: '4', user: 'LuminaInc', origin: 'custom', text: 'Excellent streaming bandwidth on SonicStream!', time: '12:03' },
  ]);
  const [newChatMessage, setNewChatMessage] = useState('');

  // Diagnostic Stats
  const [stats, setStats] = useState({
    fps: 60,
    bitrate: 5800, // kbps
    latency: 1.1,  // seconds
    droppedFrames: 0,
    viewersCount: 245
  });

  // Sound cues trigger
  const playSoundEffect = (effectType: string) => {
    toast(`Triggered feedback effect: ${effectType.toUpperCase()}!`, { icon: '🔊' });
  };

  // Start the live camera and audio feed
  const initCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: cameraActive ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } } : false,
        audio: micActive
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Could not connect camera/mic stream:', err);
      toast.error('Could not load camera. Using simulated broadcast stream.');
    }
  };

  useEffect(() => {
    initCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive, micActive]);

  // Turn on/off streaming
  const toggleStreaming = async () => {
    if (!isLive) {
      setIsLive(true);
      toast.success('Omnichannel stream launched successfully!');

      // Notify attendees by calling the Go Live api which dispatches notifications
      try {
        await fetch('/api/events/list/mock_event/go-live', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        toast.success('Push notifications dispatched to all attendees!');
      } catch (err) {
        console.warn('Could not dispatch go-live push notifications:', err);
      }

      // Establish socket.io connection for low-latency P2P WebRTC signaling
      try {
        const socketUrl = window.location.origin;
        const socket = socketIO(socketUrl, token ? { auth: { token } } : {});
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join-room', 'mock_event');
          console.log('[WebRTC] Broadcaster signal channel established.');
        });

        socket.on('webrtc-new-viewer', async ({ viewerSocketId }) => {
          console.log(`[WebRTC] Initiating P2P broadcast connection to viewer: ${viewerSocketId}`);
          
          const activeStream = stream || (videoRef.current?.srcObject as MediaStream);
          if (!activeStream) {
            console.warn('[WebRTC] No active camera stream available for peer-to-peer transmission.');
            return;
          }

          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });
          pcsRef.current.set(viewerSocketId, pc);

          activeStream.getTracks().forEach(track => {
            pc.addTrack(track, activeStream);
          });

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit('webrtc-candidate', {
                targetSocketId: viewerSocketId,
                candidate: event.candidate
              });
            }
          };

          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc-offer', {
              targetSocketId: viewerSocketId,
              offer
            });
          } catch (err) {
            console.error('[WebRTC] Failed to create or sign broadcast offer:', err);
          }
        });

        socket.on('webrtc-answer', async ({ senderSocketId, answer }) => {
          const pc = pcsRef.current.get(senderSocketId);
          if (pc) {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              console.log(`[WebRTC] Connected P2P stream to viewer: ${senderSocketId}`);
            } catch (err) {
              console.error('[WebRTC] Error setting remote viewer description:', err);
            }
          }
        });

        socket.on('webrtc-candidate', async ({ senderSocketId, candidate }) => {
          const pc = pcsRef.current.get(senderSocketId);
          if (pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error('[WebRTC] Error adding viewer candidate:', err);
            }
          }
        });

      } catch (err) {
        console.warn('WebRTC signal socket initialization failed:', err);
      }

      // Simulate live activity and stats fluctuates
      const interval = setInterval(() => {
        setStats(prev => ({
          fps: Math.max(58, Math.min(60, prev.fps + (Math.random() > 0.5 ? 1 : -1))),
          bitrate: Math.floor(5500 + Math.random() * 600),
          latency: parseFloat((1.0 + Math.random() * 0.4).toFixed(2)),
          droppedFrames: prev.droppedFrames + (Math.random() > 0.98 ? 1 : 0),
          viewersCount: prev.viewersCount + Math.floor(Math.random() * 12 - 5)
        }));
      }, 3000);
      
      (window as any)._streamingStatsInterval = interval;
    } else {
      setIsLive(false);
      clearInterval((window as any)._streamingStatsInterval);
      
      if (socketRef.current) {
        socketRef.current.emit('webrtc-disconnect-stream', { roomId: 'mock_event' });
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      pcsRef.current.forEach(pc => {
        try {
          pc.close();
        } catch {
          // Closed peer connection successfully
        }
      });
      pcsRef.current.clear();

      toast('Omnichannel feed stopped.', { icon: '⏹️' });
    }
  };

  // Switch destination active state
  const toggleDestination = (id: string) => {
    setDestinations(prev => prev.map(dst => {
      if (dst.id === id) {
        const nextState = !dst.isConnected;
        if (nextState) {
          toast.success(`Broadcasting target set for ${dst.name}`);
        }
        return {
          ...dst,
          isConnected: nextState,
          streamKey: dst.streamKey || `key-${Math.random().toString(36).substring(5)}-rtmp`,
          streamUrl: dst.streamUrl || `rtmp://ingest.${dst.id}.stream.net/live`
        };
      }
      return dst;
    }));
  };

  // Add customized chat comments
  const postChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    const channels = destinations.filter(d => d.isConnected).map(d => d.id);
    const origin = channels.length > 0 ? channels[Math.floor(Math.random() * channels.length)] : 'custom';

    const newMessage = {
      id: String(chatMessages.length + 1),
      user: user?.name || 'Local Moderator',
      origin,
      text: newChatMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMessage]);
    setNewChatMessage('');
  };

  // Copy embed layout
  const copyEmbedCode = () => {
    const embedId = Math.random().toString(36).substring(4);
    const code = `<iframe src="https://sonicstream.com/embed/live/${embedId}" width="100%" height="480" frameborder="0" allow="autoplay; encrypted-media; gyroscope" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(code);
    toast.success('Embed HTML code copied to clipboard!');
  };

  return (
    <div className="space-y-8 select-none">
      {/* V12SonicStream Cinematic Motion Title (Action Title Pro 1 Style) */}
      <div className="relative overflow-hidden w-full bg-zinc-950 rounded-[30px] border border-white/[0.08] p-8 md:p-12 flex flex-col items-center justify-center text-center shadow-2xl bg-gradient-to-b from-zinc-900 via-neutral-950 to-black select-none">
        {/* Cinematic Glitch/Scanline and Smoke Overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/[0.02] via-transparent to-purple-500/[0.02] pointer-events-none" />
        
        {/* Dust Particles behind title */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <motion.div 
            animate={{ 
              y: [-10, -50], 
              opacity: [0, 0.8, 0],
              scale: [0.8, 1.1, 0.8] 
            }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute top-1/2 left-1/4 w-2 h-2 bg-emerald-400 rounded-full blur-[1px]" 
          />
          <motion.div 
            animate={{ 
              y: [20, -30], 
              opacity: [0, 0.6, 0],
              scale: [1, 1.3, 1] 
            }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear", delay: 2 }}
            className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-teal-400 rounded-full blur-[1.5px]" 
          />
          <motion.div 
            animate={{ 
              y: [-30, -70], 
              opacity: [0, 0.7, 0],
              scale: [0.9, 1.2, 0.9] 
            }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear", delay: 4 }}
            className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full blur-[0.5px]" 
          />
        </div>

        {/* Dynamic Glowing Aura */}
        <div className="absolute w-[350px] h-[120px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        <div className="relative z-10 space-y-4">
          {/* Action Title Heading */}
          <motion.div
            initial={{ scale: 1.4, opacity: 0, filter: "blur(15px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative select-none"
          >
            {/* Split Text for the 3D high contrast gritty steel outline effect */}
            <h1 className="font-display text-4xl md:text-7xl tracking-[0.25em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-zinc-300 via-white to-zinc-400 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] filter contrast-150 leading-none">
              V12<span className="text-emerald-400 font-black relative drop-shadow-[0_0_12px_rgba(52,211,153,0.35)]">SONIC</span>STREAM
            </h1>

            {/* Glowing duplicate background for Action Title look */}
            <h1 className="absolute inset-0 font-display text-4xl md:text-7xl tracking-[0.25em] uppercase text-emerald-400 opacity-20 blur-[12px] leading-none select-none pointer-events-none">
              V12SONICSTREAM
            </h1>
          </motion.div>

          {/* Gritty Metallic Subline */}
          <motion.div
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            animate={{ opacity: 1, letterSpacing: "0.40em" }}
            transition={{ duration: 1.6, ease: "easeOut", delay: 0.6 }}
            className="flex items-center justify-center gap-4 text-xs font-mono font-bold text-zinc-500 uppercase"
          >
            <span className="h-[1px] w-6 md:w-12 bg-gradient-to-r from-transparent to-zinc-700" />
            <span className="text-[9px] md:text-10px text-emerald-400/80 tracking-[0.40em] font-black uppercase">OMNIPRESENT STREAM ENGINE</span>
            <span className="h-[1px] w-6 md:w-12 bg-gradient-to-l from-transparent to-zinc-700" />
          </motion.div>
        </div>
      </div>

      {/* Dynamic Hub Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[10px] tracking-widest bg-emerald-500/15 py-1 px-3.5 rounded-full w-fit mb-2">
            <Radio size={12} className="animate-pulse" />
            Live Hub - Multichannel Broadcast Suite
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">OmniStream Broadcast Studio</h1>
          <p className="text-zinc-500 text-sm mt-1 max-w-2xl">
            Stream high-fidelity interactive media to your followers, startups platform, local business landing page, and external social media destinations simultaneously.
          </p>
        </div>

        {/* Big Omnichannel Control Slider */}
        <div className="flex items-center gap-4 bg-zinc-950/60 p-3 rounded-2xl border border-white/5 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">Relay Mode</span>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
              {destinations.filter(d => d.isConnected).length} Connected Targets
            </span>
          </div>

          <button
            onClick={toggleStreaming}
            className={`px-8 py-3.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-lg flex items-center gap-2 ${
              isLive 
                ? 'bg-red-500 text-white shadow-red-500/10 hover:bg-red-600' 
                : 'bg-zinc-700 text-white shadow-black/10 hover:bg-zinc-600'
            }`}
          >
            {isLive ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
            {isLive ? 'Stop Broadcast' : 'Launch Omnicast'}
          </button>
        </div>
      </div>

      {/* Profile & Audience Setting Selection */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => { setBroadcasterType('creator'); setLowerThirdTitle('Digital Content Creator'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${broadcasterType === 'creator' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
        >
          <div className="p-2 rounded-xl bg-white/5 w-fit mb-3"><MessageSquare size={18} /></div>
          <span className="text-xs font-black uppercase tracking-wider block">Content Creator</span>
          <span className="text-[10px] text-zinc-500 font-medium font-sans mt-1 block">Live podcasts & chats</span>
        </button>

        <button
          onClick={() => { setBroadcasterType('business'); setLowerThirdTitle('Product & Live Shopping'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${broadcasterType === 'business' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
        >
          <div className="p-2 rounded-xl bg-white/5 w-fit mb-3"><ShoppingBag size={18} /></div>
          <span className="text-xs font-black uppercase tracking-wider block">Small Business</span>
          <span className="text-[10px] text-zinc-500 font-medium font-sans mt-1 block">Product storefront drops</span>
        </button>

        <button
          onClick={() => { setBroadcasterType('promoter'); setLowerThirdTitle('Gigs & Event Organizer'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${broadcasterType === 'promoter' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
        >
          <div className="p-2 rounded-xl bg-white/5 w-fit mb-3"><Users size={18} /></div>
          <span className="text-xs font-black uppercase tracking-wider block">Promoter / Gigs</span>
          <span className="text-[10px] text-zinc-500 font-medium font-sans mt-1 block">Ticket sales & music promotion</span>
        </button>

        <button
          onClick={() => { setBroadcasterType('startup'); setLowerThirdTitle('Startup Keynote Pitch'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${broadcasterType === 'startup' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
        >
          <div className="p-2 rounded-xl bg-white/5 w-fit mb-3"><Presentation size={18} /></div>
          <span className="text-xs font-black uppercase tracking-wider block">Startup Demo</span>
          <span className="text-[10px] text-zinc-500 font-medium font-sans mt-1 block">Pitch deck & live demo templates</span>
        </button>

        <button
          onClick={() => { setBroadcasterType('artist'); setLowerThirdTitle('Live Music & Acoustic'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${broadcasterType === 'artist' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
        >
          <div className="p-2 rounded-xl bg-white/5 w-fit mb-3"><Radio size={18} /></div>
          <span className="text-xs font-black uppercase tracking-wider block">Solo Artist</span>
          <span className="text-[10px] text-zinc-500 font-medium font-sans mt-1 block">Audio stream & studio mastering</span>
        </button>
      </div>

      {/* Main Studio Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Stream Monitoring and Live preview with Overlays */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Video Viewfinder */}
          <div className="bg-zinc-950 border border-white/10 rounded-[32px] overflow-hidden relative aspect-video shadow-2xl group">
            {/* Real HTML5 Camera feed or backdrop */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover transition-filter duration-300 ${isLive ? 'brightness-110' : 'brightness-50'}`}
            />

            {/* Static Camera Off State */}
            {!cameraActive && (
              <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center space-y-4">
                <VideoOff size={48} className="text-zinc-700 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-mono">Camera Feed Muted</p>
              </div>
            )}

            {/* Top Right LIVE banner overlay */}
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
                isLive 
                  ? 'bg-red-500/80 text-white border-red-500/35' 
                  : 'bg-zinc-900/80 text-zinc-400 border-white/10'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-white animate-ping' : 'bg-zinc-500'}`} />
                {isLive ? 'On Air' : 'Preview'}
              </span>

              {isLive && (
                <span className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 border border-white/10 rounded-full text-[10px] uppercase font-bold text-teal-400 font-mono">
                  {stats.viewersCount} Viewers
                </span>
              )}
            </div>

            {/* Lower-Third overlay simulation */}
            <AnimatePresence>
              {showLowerThird && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-6 left-6 right-6"
                >
                  <div className="bg-zinc-950/90 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl flex items-center justify-between shadow-2xl">
                    <div>
                      <h4 className="text-sm font-black uppercase text-white tracking-wide">{lowerThirdName}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{lowerThirdTitle}</p>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs uppercase">
                      V12
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrolling Banner Marquee Overlay */}
            <AnimatePresence>
              {showSponsorMarquee && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-0 inset-x-0 bg-zinc-700 text-white py-1 px-4 overflow-hidden text-center select-none"
                >
                  <div className="whitespace-nowrap font-black uppercase text-[10px] tracking-widest inline-block animate-marquee">
                    {sponsorText}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Small Business Product drop Promo Card Pin */}
            <AnimatePresence>
              {showProductOverlay && broadcasterType === 'business' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 20 }}
                  className="absolute top-20 right-6 w-56 bg-zinc-950/95 border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl"
                >
                  <img src={promotedProduct.image} alt={promotedProduct.name} className="w-full h-24 object-cover" />
                  <div className="p-3 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Shop Live Item</p>
                    <h5 className="text-xs font-black text-white truncate">{promotedProduct.name}</h5>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-black text-white">{promotedProduct.price}</span>
                      <button 
                        onClick={() => toast.success('Cart integration clicked!')}
                        className="bg-amber-500 text-black font-black uppercase text-[9px] px-2.5 py-1.5 rounded-lg hover:bg-amber-400 transition-colors"
                      >
                        {promotedProduct.ctaText}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Startups Pitch Deck presentation slot */}
            <AnimatePresence>
              {showPitchDeck && broadcasterType === 'startup' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-y-12 right-6 w-72 bg-zinc-950/95 border border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-2xl z-30"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Pitch Slide {currentSlideIndex + 1}/{slides.length}</span>
                      <button onClick={() => setShowPitchDeck(false)} className="text-zinc-500 hover:text-white"><X size={12} /></button>
                    </div>
                    <div className="mt-4 space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-tight text-white">{slides[currentSlideIndex].title}</h4>
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">{slides[currentSlideIndex].content}</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 pt-4">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`flex-1 h-1 rounded-sm transition-all ${currentSlideIndex === idx ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Realtime Feed Adjusters */}
          <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-[28px] grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
            
            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all ${
                cameraActive 
                  ? 'bg-zinc-800 text-white hover:bg-zinc-700/80' 
                  : 'bg-red-500/10 border border-red-500/30 text-red-500'
              }`}
            >
              {cameraActive ? <Video size={16} /> : <VideoOff size={16} />}
              Camera: {cameraActive ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setMicActive(!micActive)}
              className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all ${
                micActive 
                  ? 'bg-zinc-800 text-white hover:bg-zinc-700/80' 
                  : 'bg-red-500/10 border border-red-500/30 text-red-500'
              }`}
            >
              {micActive ? <Mic size={16} /> : <VolumeX size={16} />}
              Mic: {micActive ? 'ON' : 'OFF'}
            </button>

            {/* Mic Meter bar */}
            <div className="flex flex-col gap-1 col-span-2">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                <span>Audio In Peak</span>
                <span className="font-mono">{micActive ? 'Active (-12dB)' : 'Muted'}</span>
              </div>
              <div className="h-2.5 bg-black rounded-full overflow-hidden flex p-0.5 border border-white/5">
                <motion.div 
                  initial={{ width: '40%' }}
                  animate={{ width: micActive ? ['45%', '70%', '55%', '90%', '65%', '40%'] : '0%' }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full" 
                />
              </div>
            </div>
          </div>

          {/* Dynamic Overlays Panel for each group */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-[32px] p-6 space-y-6">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="text-emerald-400" size={18} />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Interactive Screen Overlays</h3>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-zinc-950 px-2.5 py-1 rounded text-zinc-500">Live Customizer</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lower third info */}
              <div className="space-y-3.5 p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Lower Third Overlay</span>
                  <input 
                    type="checkbox" 
                    checked={showLowerThird} 
                    onChange={(e) => setShowLowerThird(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={lowerThirdName}
                    onChange={(e) => setLowerThirdName(e.target.value)}
                    placeholder="Presenter Label"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={lowerThirdTitle}
                    onChange={(e) => setLowerThirdTitle(e.target.value)}
                    placeholder="Subtitle/Topic"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Sponsor ticker */}
              <div className="space-y-3.5 p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Sponsor Logo / Text Marquee</span>
                  <input 
                    type="checkbox" 
                    checked={showSponsorMarquee} 
                    onChange={(e) => setShowSponsorMarquee(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={sponsorText}
                  onChange={(e) => setSponsorText(e.target.value)}
                  placeholder="Rolling sponsor banner text..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Business: Store Drop Pin controls */}
              {broadcasterType === 'business' && (
                <div className="space-y-3 p-4 bg-zinc-900 border border-amber-500/20 rounded-2xl md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-500">Active Live Store Drop Overlay</span>
                    <input 
                      type="checkbox" 
                      checked={showProductOverlay} 
                      onChange={(e) => setShowProductOverlay(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={promotedProduct.name}
                      onChange={(e) => setPromotedProduct({ ...promotedProduct, name: e.target.value })}
                      placeholder="Product Name"
                      className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={promotedProduct.price}
                      onChange={(e) => setPromotedProduct({ ...promotedProduct, price: e.target.value })}
                      placeholder="Product Price"
                      className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* Startup Pitchdeck Deck controls */}
              {broadcasterType === 'startup' && (
                <div className="space-y-3 p-4 bg-zinc-900 border border-emerald-500/20 rounded-2xl md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Startup Slide Deck Overlay</span>
                    <input 
                      type="checkbox" 
                      checked={showPitchDeck} 
                      onChange={(e) => setShowPitchDeck(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2">
                    {slides.map((sld, i) => (
                      <button
                        key={i}
                        onClick={() => { setCurrentSlideIndex(i); setShowPitchDeck(true); }}
                        className={`text-[9px] px-3 py-1.5 rounded-lg border font-black uppercase transition-all ${currentSlideIndex === i ? 'bg-zinc-700 border-emerald-400 text-white' : 'bg-zinc-950 border-white/5 text-zinc-500'}`}
                      >
                        {sld.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: destinations lists, diagnostic health, embed links */}
        <div className="space-y-8">
          
          {/* Diagnostic Monitor Panel */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Diagnostics & Stream Quality</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl text-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Encoder FPS</span>
                <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">{isLive ? stats.fps : '0'}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl text-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Relay Bitrate</span>
                <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">{isLive ? `${(stats.bitrate / 1000).toFixed(1)} Mbps` : '0 Mbps'}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl text-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Network Latency</span>
                <span className="text-xl font-bold font-mono text-indigo-400 block mt-1">{isLive ? `${stats.latency}s` : '--'}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl text-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block">Dropped Frames</span>
                <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">{stats.droppedFrames}</span>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-900 rounded-xl border border-white/5 text-center flex items-center justify-between text-xs font-bold text-zinc-400">
              <span>Sync Server: East Coast Relay</span>
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
              </span>
            </div>
          </div>

          {/* Connected Targets Section */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Simulcast Targets</h3>
              <span className="text-[9px] font-black text-emerald-400 tracking-wider">RTMP Relays</span>
            </div>

            <div className="space-y-3">
              {destinations.map(dst => (
                <div 
                  key={dst.id}
                  className={`p-3.5 rounded-2xl border transition-all ${dst.isConnected ? 'bg-zinc-950 border-emerald-500/30' : 'bg-zinc-900/20 border-white/5 opacity-50'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{dst.icon}</span>
                      <div>
                        <span className="text-xs font-black text-white block">{dst.name}</span>
                        {dst.isConnected && (
                          <span className="text-[9.5px] font-mono text-emerald-400 truncate max-w-[140px] block mt-0.5">
                            {dst.streamKey}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleDestination(dst.id)}
                      className={`text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all ${
                        dst.isConnected 
                          ? 'bg-zinc-700 text-white' 
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {dst.isConnected ? 'MAPPED' : 'CONNECT'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share & Embed Hub */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Share Streaming Link</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`https://sonicstream.com/live/${user?.id || 'studio-b'}`}
                className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-400 select-all"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`https://sonicstream.com/live/${user?.id || 'studio-b'}`);
                  toast.success('Shareable link copied!');
                }}
                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                title="Copy Link"
              >
                <Share2 size={16} />
              </button>
            </div>

            <button
              onClick={copyEmbedCode}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5"
            >
              <Monitor size={14} />
              Grab HTML Embed Code
            </button>
          </div>

          {/* Soundboard interactions triggers - great for creators/promoters */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Feedback Soundboard</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => playSoundEffect('applause')}
                className="py-2 px-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                👏 Applause
              </button>
              <button 
                onClick={() => playSoundEffect('clap')}
                className="py-2 px-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                🎉 Cheer Loop
              </button>
              <button 
                onClick={() => playSoundEffect('syth-wave')}
                className="py-2 px-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-400 transition-colors"
              >
                ⚡ Synth Drop
              </button>
              <button 
                onClick={() => playSoundEffect('airhorn')}
                className="py-2 px-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-rose-400 transition-colors"
              >
                📢 Air Horn
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Omnichannel Chat Panel and Total Audience Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Multichannel Chat relay feed */}
        <div className="lg:col-span-2 bg-zinc-950 border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-indigo-400" size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Aggregated Ingest Chat</h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500">Live feed from connected targets</span>
          </div>

          <div className="space-y-4 max-h-72 overflow-y-auto pr-1 no-scrollbar min-h-[180px]">
            {chatMessages.map(msg => (
              <div key={msg.id} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-lg leading-none pt-0.5">
                  {msg.origin === 'youtube' ? '🔴' : msg.origin === 'twitch' ? '👾' : msg.origin === 'linkedin' ? '💼' : '💬'}
                </span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{msg.user}</span>
                    <span className="text-[9px] font-mono text-zinc-500">{msg.time}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={postChatMessage} className="flex gap-2">
            <input
              type="text"
              value={newChatMessage}
              onChange={(e) => setNewChatMessage(e.target.value)}
              placeholder="Send announcements to all connected streams..."
              className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white uppercase placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
            />
            <button 
              type="submit" 
              className="bg-indigo-500 hover:bg-indigo-400 text-black font-black uppercase text-xs px-6 rounded-xl transition-all"
            >
              BROADCAST
            </button>
          </form>
        </div>

        {/* Real-time viewer metrics and retention tracker */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Total Retention breakdown</h3>
          
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between items-center text-xs font-bold font-sans mb-1 text-zinc-300">
                <span>YouTube Livestream</span>
                <span>{isLive ? '45% (Excellent)' : '0%'}</span>
              </div>
              <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-red-500 rounded-full" style={{ width: isLive ? '45%' : '0%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold font-sans mb-1 text-zinc-300">
                <span>Twitch Live Sync</span>
                <span>{isLive ? '30% (High)' : '0%'}</span>
              </div>
              <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: isLive ? '30%' : '0%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold font-sans mb-1 text-zinc-300">
                <span>Direct Embed Site</span>
                <span>{isLive ? '25% (Growing)' : '0%'}</span>
              </div>
              <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: isLive ? '25%' : '0%' }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-4 text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-black block">Total Estimated Audience Value</span>
            <span className="text-lg font-black text-white tracking-widest mt-1 block">
              {isLive ? '$1,450.00 Live Value' : '$0.00'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
