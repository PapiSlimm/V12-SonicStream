import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Library, 
  User, 
  Bell, 
  MessageCircle,
  PlusCircle,
  ShoppingBag,
  Mic,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageSquare,
  Share2,
  Link,
  Copy,
  Disc,
  Smartphone,
  CheckCircle2,
  Send,
  Sparkles,
  Zap,
  ChevronRight,
  Send as PaperPlane,
  ChevronLeft,
  DollarSign,
  Flag,
  Tv,
  Sliders,
  Bookmark,
  Repeat,
  Timer,
  Info,
  AlertCircle,
  Twitter,
  Instagram,
  Facebook,
  QrCode,
  Code,
  Cpu,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Download,
  Camera
} from 'lucide-react';
import { usePlayTracking } from '../../hooks/usePlayTracking';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import QRCode from 'qrcode';

// --- MOCK DATA FOR THE MOBILE EXPERIENCES ---

interface ShortVideo {
  id: number;
  creator: string;
  avatar: string;
  description: string;
  song: string;
  url: string;
  likes: number;
  commentsCount: number;
  shares: number;
  bio?: string;
  releaseDate?: string;
  fullTitle?: string;
  genre?: string;
  bitrate?: string;
  aiGenres?: string[];
  aiMoods?: string[];
  aiAnalysisText?: string;
}

const MOCK_SHORT_VIDEOS: ShortVideo[] = [
  {
    id: 1,
    creator: "@synth_collective",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    description: "Recording live modular loops for our new summer electronic compilation. Turn the volume UP for that deep bass! 🔊✨ #synthesizer #ambient #livemusic",
    song: "Solar Flares - Synthetic Sounds Project",
    url: "https://assets.mixkit.co/videos/preview/mixkit-retro-futuristic-music-visualizer-background-40748-large.mp4",
    likes: 1243,
    commentsCount: 87,
    shares: 45,
    bio: "@synth_collective is a Berlin-based pioneer of analog synthesizer ensembles, renowned for hyper-detailed hardware-only live audio experimentation and modular research.",
    releaseDate: "June 2, 2026",
    fullTitle: "Solar Flares (Extended Live Modular Mix)",
    genre: "Ambient Electronica",
    bitrate: "320kbps Streaming / 24-bit Lossless Studio WAV Masters",
    aiGenres: ["Modular Techno", "Ambient IDM", "Generative Soundscape"],
    aiMoods: ["Hypnotic", "Ethereal", "Meditative", "Organic"],
    aiAnalysisText: "Detected rich 54Hz analog sub-bass drone, warm modular state-variable filter swept sweep sequences, and progressive 120BPM hardware clock gating."
  },
  {
    id: 2,
    creator: "@cyberpunk_dj",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    description: "Deep analog warmth and cybernetic glitches. Direct release from the Tokyo underground! Exclusive streaming starts now. 👾🔥 #cyberpunk #synth #djset",
    song: "Neo Metropolis - DJ Spark & The Grid",
    url: "https://assets.mixkit.co/videos/preview/mixkit-motion-of-sound-waves-41381-large.mp4",
    likes: 3102,
    commentsCount: 240,
    shares: 118,
    bio: "@cyberpunk_dj emerges from Shibuya, Tokyo, blending heavy modular glitch rhythms, digital cyber wave, and physical club-ready drum computers.",
    releaseDate: "May 28, 2026",
    fullTitle: "Neo Metropolis (The Grid Club Edit v1.2)",
    genre: "Synthwave / Cyberpunk",
    bitrate: "320kbps Streaming / Hi-Res FLAC Stereo ready",
    aiGenres: ["Synthwave", "Cyberpunk Industrial", "Dark Electro"],
    aiMoods: ["Energetic", "Futuristic", "Neo-Noirish", "Suspenseful"],
    aiAnalysisText: "Detected heavy digital clock sync signal, high-transient 4/4 electronic drum machine kicks at 132BPM, dual oscillator detuned saw stacks, and wave-meter variance spikes."
  },
  {
    id: 3,
    creator: "@vaporwave_dreamer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    description: "Lost in the nostalgia of 1999 virtual beaches and analog VHS aesthetics. Listen exclusively on SonicStream Premium. 🌴📻 #retro #neon #dreamy",
    song: "VHS Memories - Vaporwave Oasis Ltd.",
    url: "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-42007-large.mp4",
    likes: 954,
    commentsCount: 48,
    shares: 23,
    bio: "@vaporwave_dreamer operates anonymously to sculpt tape-saturated sounds, recreating late-90s shopping centers, FM radio nostalgic loops, and vintage mallsoft atmospheres.",
    releaseDate: "April 11, 2026",
    fullTitle: "VHS Memories (Nostalgia Deluxe Reprise)",
    genre: "Vaporwave / Mallsoft",
    bitrate: "320kbps Retro Tape-Transcoded Stereo",
    aiGenres: ["Vaporwave", "Mallsoft", "Lo-Fi Lounge"],
    aiMoods: ["Nostalgic", "Dreamy", "Melancholic", "Warm / Tape-Saturated"],
    aiAnalysisText: "Detected low-frequency tape rumble emulation (15Hz tape hum), sidechained 92BPM filter pads, slow harmonic chorus modulation, and high-accent early 90s digital reverb reflections."
  }
];

interface Subtitle {
  start: number;
  end: number;
  text: string;
}

const MOCK_SUBTITLES: Record<number, Subtitle[]> = {
  1: [
    { start: 0, end: 3, text: "[Analog synthesizer hum starts rising gradually...]" },
    { start: 3, end: 6, text: "Hey collective! Live in Berlin setting up some hardware modular patching." },
    { start: 6, end: 10, text: "Sweeping this low-pass filter to build analog resonant warmth." },
    { start: 10, end: 14, text: "Turn up the subwoofers to catch that 54Hz deep bass modulation!" },
    { start: 14, end: 18, text: "[Sub-filters cycling in harmony under generative sequencer triggers]" },
    { start: 18, end: 22, text: "This ambient soundscape is streaming exclusively on SonicStream!" }
  ],
  2: [
    { start: 0, end: 3, text: "[Heavy cybernetic modular drone pulsing with high energy...]" },
    { start: 3, end: 7, text: "Tokyo underground vibes: syncing live hardware step-sequencers." },
    { start: 7, end: 11, text: "These dual saw-oscillators are heavily detuned for that grit." },
    { start: 11, end: 15, text: "Feel the 132BPM kick transient hitting physical filters!" },
    { start: 15, end: 19, text: "[Electro-glitch transitions sweeping across neon vectors]" },
    { start: 19, end: 24, text: "Cyberpunk DJ set, streaming live under Neon Metropolis." }
  ],
  3: [
    { start: 0, end: 4, text: "[Lush chorus-saturated synthesizer chords fading in slowly...]" },
    { start: 4, end: 8, text: "Rewinding back to 1999: Shopping mall Nostalgia and vintage VHS static." },
    { start: 8, end: 12, text: "Lush chord structures moving over warm tape saturation emulations." },
    { start: 12, end: 16, text: "Taking you on a mental tour through glass plazas and slow palms." },
    { start: 16, end: 20, text: "[Phased echo reflections repeating warmly over low-frequency tape hum]" },
    { start: 20, end: 24, text: "VHS Memories - Melt into the soundscape with SonicStream Premium." }
  ]
};

// Helper to format video seconds to mm:ss
const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Helper to format video seconds to double-digit mm:ss
const formatDoubleDigitTime = (seconds: number) => {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const FILTER_EFFECTS = [
  { id: 'none', label: 'Normal', class: '' },
  { id: 'grayscale', label: 'Grayscale', class: 'grayscale' },
  { id: 'sepia', label: 'Sepia', class: 'sepia' },
  { id: 'high-contrast', label: 'Contrast', class: 'contrast-150' },
  { id: 'invert', label: 'Invert', class: 'invert' },
  { id: 'blur', label: 'Blur', class: 'blur-[2px]' }
];

interface ChapterMarker {
  time: number;
  label: string;
}

const getChaptersForVideo = (video: ShortVideo, duration: number): ChapterMarker[] => {
  if (!duration || isNaN(duration)) return [];
  if (video.id === 1) {
    return [
      { time: 0, label: "Ambient Gate Intro" },
      { time: Math.min(3.5, duration), label: "Sub-Oscillator Pulse" },
      { time: Math.min(7.2, duration), label: "Low Frequency Drop" },
      { time: Math.min(11.5, duration), label: "Resonance Sweep" },
      { time: Math.min(15.5, duration), label: "Retro Modulation" }
    ].filter(c => c.time < duration);
  }
  if (video.id === 2) {
    return [
      { time: 0, label: "Cyberpunk Sunrise" },
      { time: Math.min(4.0, duration), label: "Synthesized Gating" },
      { time: Math.min(8.5, duration), label: "Glitch Progression" },
      { time: Math.min(13.2, duration), label: "Cyber-Ambient Rise" },
      { time: Math.min(18.0, duration), label: "Sunset Outro" }
    ].filter(c => c.time < duration);
  }
  const baseTitle = video.song ? video.song.split('-')[0].trim() : "Music Piece";
  return [
    { time: 0, label: `${baseTitle} - Harmonic Intro` },
    { time: duration * 0.25, label: `${baseTitle} - Rhythmic Build` },
    { time: duration * 0.55, label: `${baseTitle} - Peak Climax` },
    { time: duration * 0.85, label: `${baseTitle} - Ambient Tail` }
  ];
};

// --- SHORT VIDEO COMPONENT WITH CUSTOM CONTROLS ---

interface ShortPlayItemProps {
  video: ShortVideo;
  isActive: boolean;
  onOpenComments: (videoId: number) => void;
  isSaved: boolean;
  onToggleSave: (id: number) => void;
  initialTime?: number;
  onVideoEnded?: () => void;
  savedVideos?: number[];
  powerSaveMode?: boolean;
  playlist?: ShortVideo[];
  currentIdx?: number;
  setCurrentIdx?: (idx: number | ((prev: number) => number)) => void;
}

const ShortPlayItem = ({ 
  video, 
  isActive, 
  onOpenComments, 
  isSaved, 
  onToggleSave, 
  initialTime, 
  onVideoEnded, 
  savedVideos = [], 
  powerSaveMode = false,
  playlist,
  currentIdx,
  setCurrentIdx
}: ShortPlayItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Autoplay compatible starting muted
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCenterIcon, setShowCenterIcon] = useState<'play' | 'pause' | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes);

  // Swipe-to-Like States
  const [swipeDeltaX, setSwipeDeltaX] = useState<number>(0);
  const [isSwipingRight, setIsSwipingRight] = useState<boolean>(false);
  const [showSwipeLikeSplash, setShowSwipeLikeSplash] = useState<boolean>(false);
  const [showSwipeHapticPulse, setShowSwipeHapticPulse] = useState<boolean>(false);

  const { user } = useAuth();

  // Task 1: Touch/Mouse drag-scrubbing parameters
  const isDragScrubbing = useRef<boolean>(false);
  const dragStartX = useRef<number>(0);
  const dragStartTime = useRef<number>(0);
  const hasMovedScrub = useRef<boolean>(false);
  const ignoreNextClick = useRef<boolean>(false);
  const [scrubFeedback, setScrubFeedback] = useState<{
    show: boolean;
    offset: number;
    targetTime: number;
  }>({ show: false, offset: 0, targetTime: 0 });

  // Task 2: Automatic video layout adjustment to fullscreen landscape when rotated 90 degrees
  useEffect(() => {
    if (!isActive) return;

    const handleOrientationChange = () => {
      // 90 degrees rotation results in a landscape viewport: width > height
      const isLandscape = window.innerWidth > window.innerHeight;
      
      if (isLandscape && videoRef.current) {
        const playerContainer = videoRef.current.parentElement;
        if (playerContainer) {
          if (playerContainer.requestFullscreen) {
            playerContainer.requestFullscreen().catch((err) => {
              console.log('[OrientationSync] Request to enter full-screen rejected:', err);
            });
          } else if ((playerContainer as any).webkitRequestFullscreen) {
            (playerContainer as any).webkitRequestFullscreen();
          }
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch((err) => {
            console.log('[OrientationSync] Request to exit full-screen rejected:', err);
          });
        }
      }
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Check initial state
    handleOrientationChange();

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isActive]);

  // Task 3: Automatic cross-device synchronization: Fetch position on active state
  useEffect(() => {
    if (!isActive || !user) return;

    const fetchLastPlayedPosition = async () => {
      try {
        const docRef = doc(db, 'last_played_positions', `${user.uid}_${video.id}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const pos = data.position;
          if (pos && typeof pos === 'number' && pos > 1 && videoRef.current) {
            console.log(`[FirebaseSync] Retrieved synced position for video ${video.id}: ${pos}s`);
            videoRef.current.currentTime = pos;
            setCurrentTime(pos);
            setShowToast(`Synced position from another device: Resumed at ${formatTime(pos)}`);
            setTimeout(() => setShowToast(null), 3500);
          }
        }
      } catch (e) {
        console.warn('[FirebaseSync] Error retrieving position:', e);
      }
    };

    fetchLastPlayedPosition();
  }, [isActive, user, video.id]);

  const lastSavedTimeRef = useRef<number>(0);
  const lastSavedTimestampRef = useRef<number>(0);

  // Sync state on unmount or on switching active video
  useEffect(() => {
    const activeVideoElement = videoRef.current;
    return () => {
      if (user && activeVideoElement) {
        const time = activeVideoElement.currentTime;
        if (time > 0.5 && time < duration - 1) {
          const posDocId = `${user.uid}_${video.id}`;
          setDoc(doc(db, 'last_played_positions', posDocId), {
            videoId: String(video.id),
            userId: user.uid,
            position: time,
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        }
      }
    };
  }, [isActive, user, video.id, duration]);

  // Custom states added for requested features
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showSeekFeedback, setShowSeekFeedback] = useState<'rewind' | 'forward' | null>(null);
  const [isPiP, setIsPiP] = useState(false);
  const [showEffectsMenu, setShowEffectsMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');
  const doubleTapTimeoutRef = useRef<any>(null);

  // Video fallback and error handling states
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>(video.url);

  useEffect(() => {
    setVideoUrl(video.url);
    setVideoError(null);
    setGeneratedSubtitles(null);
  }, [video.url]);

  const FALLBACK_VIDEO_URL = "https://assets.mixkit.co/videos/preview/mixkit-motion-of-sound-waves-41381-large.mp4";

  const handleVideoError = (e: any) => {
    console.error("Video component loading error, falling back:", e);
    if (videoUrl !== FALLBACK_VIDEO_URL) {
      setVideoError("Primary stream failed to load. Switching to cloud backup visual...");
      setVideoUrl(FALLBACK_VIDEO_URL);
    } else {
      setVideoError("Both primary and backup video streams failed to render.");
    }
  };

  // Additional new features states
  const [isLooping, setIsLooping] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [aiSynopsis, setAiSynopsis] = useState<string>('');
  const [isGeneratingSynopsis, setIsGeneratingSynopsis] = useState<boolean>(false);

  // Mix Mode States
  const [mixModeActive, setMixModeActive] = useState(false);
  const [targetTrackIdx, setTargetTrackIdx] = useState<number | null>(null);
  const [crossfadeValue, setCrossfadeValue] = useState(0); // 0 (100% current) to 100 (100% target)
  const [isCrossfading, setIsCrossfading] = useState(false);
  const targetAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      if (targetAudioRef.current) {
        targetAudioRef.current.pause();
      }
    };
  }, [video.id]);

  const startAutoCrossfade = () => {
    if (isCrossfading || targetTrackIdx === null) return;
    setIsCrossfading(true);
    let currentVal = crossfadeValue;
    
    if (targetAudioRef.current) {
      targetAudioRef.current.volume = (currentVal / 100) * volume;
      targetAudioRef.current.play().catch(() => {});
    }

    const interval = setInterval(() => {
      currentVal += 2;
      if (currentVal >= 100) {
        currentVal = 100;
        clearInterval(interval);
        setTimeout(() => {
          commitMixTransition();
          setIsCrossfading(false);
        }, 100);
      } else {
        setCrossfadeValue(currentVal);
        if (videoRef.current) {
          videoRef.current.volume = ((100 - currentVal) / 100) * volume;
        }
        if (targetAudioRef.current) {
          targetAudioRef.current.volume = (currentVal / 100) * volume;
        }
      }
    }, 30);
  };

  const commitMixTransition = () => {
    if (targetTrackIdx === null || !playlist || !setCurrentIdx) return;
    const targetIdx = targetTrackIdx;
    setCurrentIdx(targetIdx);
    const targetVideo = playlist[targetIdx];
    setShowToast(`🎛️ Blended seamlessly into ${targetVideo.song}`);
    setTimeout(() => setShowToast(null), 3000);
    setCrossfadeValue(0);
    setTargetTrackIdx(null);
    setMixModeActive(false);
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  };

  useEffect(() => {
    if (showInfoModal) {
      setIsGeneratingSynopsis(true);
      const timer = setTimeout(() => {
        const genresStr = video.aiGenres && video.aiGenres.length > 0 ? video.aiGenres.join(' and ') : (video.genre || 'electronic');
        const moodStr = video.aiMoods && video.aiMoods.length > 0 ? video.aiMoods.slice(0, 2).join(' or ') : 'vibrant';
        const sentences = [
          `SonicStream Core-AI synthesized '${video.song}' as an exceptionally crafted ${genresStr} profile, delivering a ${moodStr} acoustic landscape that resonates in any ambient space.`,
          `Synthesized frequency sweeps confirm that ${video.creator}'s production achieves perfect binaural resolution, making it an essential high-fidelity addition to customized playlists.`
        ].join(' ');
        setAiSynopsis(sentences);
        setIsGeneratingSynopsis(false);
      }, 950);
      return () => clearTimeout(timer);
    }
  }, [showInfoModal, video.id, video.song, video.creator, video.aiGenres, video.aiMoods, video.genre]);
  const [showMomentModal, setShowMomentModal] = useState(false);
  const [capturedMoment, setCapturedMoment] = useState<{ time: number; link: string; formatted: string } | null>(null);
  const [hasSetInitialTime, setHasSetInitialTime] = useState(false);
  const [visitedMoments, setVisitedMoments] = useState<number[]>([]);
  const [ccEnabled, setCcEnabled] = useState(true);
  const [generatedSubtitles, setGeneratedSubtitles] = useState<Subtitle[] | null>(null);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [hoveredPercent, setHoveredPercent] = useState<number | null>(null);
  const [isHoverSnapped, setIsHoverSnapped] = useState(false);
  const [snappedChapter, setSnappedChapter] = useState<ChapterMarker | null>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);

  // Auto-swipe and Social sharing states and hooks
  const [isAutoSwipe, setIsAutoSwipe] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareWithTimestamp, setShareWithTimestamp] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);
  const [qrStyle, setQrStyle] = useState<'squared' | 'rounded' | 'dots'>('rounded');
  const [testScanStatus, setTestScanStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [scanCount, setScanCount] = useState<number>(0);
  const [qrHighContrast, setQrHighContrast] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [qrHovered, setQrHovered] = useState<boolean>(false);
  const countdownIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!showQrModal) {
      setScanCount(0);
    }
  }, [showQrModal]);

  const [shareTab, setShareTab] = useState<'single' | 'batch'>('single');
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [compilationUrl, setCompilationUrl] = useState<string | null>(null);

  useEffect(() => {
    if (showShareMenu) {
      setSelectedBatchIds(savedVideos || []);
      setCompilationUrl(null);
      setShareTab('single');
    }
  }, [showShareMenu, savedVideos]);

  // Real-time Play Tracking Integration
  usePlayTracking(video, isPlaying && isActive, currentTime, duration);

  // Synchronize canvas preview on drag/scrub or seek-bar hover
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const videoElement = videoRef.current;
    if (canvas && videoElement) {
      try {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        }
      } catch (err) {
        // Prevent crashes due to CORS or metadata load states
      }
    }
  });

  // Power Save dynamic class filter to stop fast animations/visualizers
  const animClass = (classes: string) => {
    if (!powerSaveMode) return classes;
    return classes
      .replace(/\banimate-spin\b/g, '')
      .replace(/\banimate-pulse\b/g, '')
      .replace(/\banimate-ping\b/g, '')
      .replace(/\banimate-bounce\b/g, '')
      .replace(/\banimate-fade-in\b/g, '')
      .replace(/\banimate-fadeIn\b/g, '');
  };

  const lastTimeUpdateRef = useRef<number>(0);

  // Keyboard shortcut handlers for Space and Arrow Keys (with native visual feedback)
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid stealing keystrokes if typing inside text fields
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.hasAttribute('contenteditable')
      )) {
        return;
      }

      const key = e.code;
      if (key === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) {
          const target = Math.max(0, videoRef.current.currentTime - 5);
          videoRef.current.currentTime = target;
          setCurrentTime(target);
          setShowSeekFeedback('rewind');
          setTimeout(() => setShowSeekFeedback(null), 600);
        }
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current) {
          const target = Math.min(duration, videoRef.current.currentTime + 5);
          videoRef.current.currentTime = target;
          setCurrentTime(target);
          setShowSeekFeedback('forward');
          setTimeout(() => setShowSeekFeedback(null), 600);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, duration, isPlaying]);

  // Real-time video progress analytics tracker for 25%, 50%, and 75%
  const reportedMilestonesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    reportedMilestonesRef.current.clear();
  }, [video.id]);

  useEffect(() => {
    if (!isActive || duration <= 0) return;
    
    const percentage = Math.floor((currentTime / duration) * 100);
    const milestones = [25, 50, 75];
    
    for (const milestone of milestones) {
      if (percentage >= milestone && !reportedMilestonesRef.current.has(milestone)) {
        reportedMilestonesRef.current.add(milestone);
        
        console.log(`[Analytics] Video ${video.id} has reached ${milestone}% completion. Sending progress event.`);
        fetch('/api/analytics/video-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Id': 'default'
          },
          body: JSON.stringify({
            videoId: video.id,
            percentage: milestone,
            currentTime,
            duration,
            userId: user?.uid || null
          })
        })
        .then(res => res.json())
        .then(data => {
          console.log(`[Analytics] Successfully tracked video ${video.id} milestone ${milestone}%:`, data);
        })
        .catch(err => {
          console.error(`[Analytics] Error reporting video ${video.id} milestone ${milestone}%:`, err);
        });
      }
    }
  }, [currentTime, duration, video.id, isActive, user]);

  const handleVideoEnded = () => {
    if (isAutoSwipe && onVideoEnded) {
      setCountdown(3);
    } else if (!isLooping) {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (countdown !== null) {
      if (countdown > 0) {
        countdownIntervalRef.current = setTimeout(() => {
          setCountdown(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
      } else {
        setCountdown(null);
        if (onVideoEnded) {
          onVideoEnded();
        }
      }
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearTimeout(countdownIntervalRef.current);
      }
    };
  }, [countdown, onVideoEnded]);

  useEffect(() => {
    setCountdown(null);
    if (countdownIntervalRef.current) {
      clearTimeout(countdownIntervalRef.current);
    }
  }, [video.id, isActive]);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!showQrModal || !qrCanvasRef.current) return;
    
    const canvas = qrCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const qrLink = `${window.location.origin}${window.location.pathname}?video=${video.id}`;
    
    try {
      const qr = QRCode.create(qrLink, { errorCorrectionLevel: 'H' });
      const size = qr.modules.size;
      
      canvas.width = 360;
      canvas.height = 360;
      
      // Clear with background color based on high contrast mode
      ctx.fillStyle = qrHighContrast ? '#09090b' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const margin = 24;
      const cellSize = (canvas.width - 2 * margin) / size;
      
      // Set foreground color based on high contrast mode
      ctx.fillStyle = qrHighContrast ? '#ffffff' : '#09090b';
      
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const isDark = qr.modules.get 
            ? qr.modules.get(r, c) 
            : qr.modules.data[r * size + c];
            
          if (isDark) {
            const x = margin + c * cellSize;
            const y = margin + r * cellSize;
            
            ctx.beginPath();
            if (qrStyle === 'dots') {
              ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.44, 0, 2 * Math.PI);
              ctx.fill();
            } else if (qrStyle === 'rounded') {
              const radius = cellSize * 0.35;
              if (ctx.roundRect) {
                ctx.roundRect(x, y, cellSize, cellSize, radius);
              } else {
                ctx.rect(x, y, cellSize, cellSize);
              }
              ctx.fill();
            } else {
              // Squared
              ctx.fillRect(x, y, cellSize, cellSize);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to draw live custom QR pattern on canvas:", err);
    }
  }, [showQrModal, qrStyle, video.id, qrHighContrast]);

  const currentSubtitlesList = generatedSubtitles || (video && video.id && MOCK_SUBTITLES ? MOCK_SUBTITLES[video.id] : []);
  const activeSubtitle = currentSubtitlesList?.find(sub => currentTime >= sub.start && currentTime <= sub.end)?.text;

  const longPressTimerRef = useRef<any>(null);
  const isLongPressActive = useRef(false);
  const wasLongPressed = useRef(false);

  const handleCaptureMoment = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    const deepLink = `${window.location.origin}${window.location.pathname}?video=${video.id}&t=${Math.floor(time)}`;
    
    // Copy to clip board
    navigator.clipboard.writeText(deepLink).catch(() => {});
    
    setCapturedMoment({
      time: time,
      link: deepLink,
      formatted: formatTime(time)
    });
    setShowMomentModal(true);
  };

  const startPress = () => {
    wasLongPressed.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActive.current = true;
      wasLongPressed.current = true;
      handleCaptureMoment();
    }, 650);
  };

  const endPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
      if (isActive) {
        setIsPlaying(true);
        videoRef.current.play().catch(() => {
          // Autoplay protection fallback
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, playbackRate]);

  // Sync Picture-in-Picture event listeners
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleEnterPiP = () => setIsPiP(true);
    const handleLeavePiP = () => setIsPiP(false);

    videoEl.addEventListener('enterpictureinpicture', handleEnterPiP);
    videoEl.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      videoEl.removeEventListener('enterpictureinpicture', handleEnterPiP);
      videoEl.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowCenterIcon('pause');
      } else {
        videoRef.current.play().catch(e => console.log(e));
        setIsPlaying(true);
        setShowCenterIcon('play');
      }
      setTimeout(() => setShowCenterIcon(null), 700);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const now = Date.now();
      if (powerSaveMode) {
        // limit updates to 30fps max interval (~33.3ms) to save render layout updates
        if (now - lastTimeUpdateRef.current < 33) {
          return;
        }
      }
      lastTimeUpdateRef.current = now;
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      const sec = Math.floor(time);
      if (sec > 0) {
        setVisitedMoments(prev => {
          if (!prev.includes(sec) && !prev.some(t => Math.abs(t - sec) < 2)) {
            return [...prev, sec];
          }
          return prev;
        });
      }

      // Sync playback time to Firebase database (throttled at 5 seconds)
      if (user && isActive && duration > 0) {
        const now = Date.now();
        if (now - lastSavedTimestampRef.current >= 5000 || Math.abs(time - lastSavedTimeRef.current) >= 5) {
          lastSavedTimestampRef.current = now;
          lastSavedTimeRef.current = time;
          const posDocId = `${user.uid}_${video.id}`;
          setDoc(doc(db, 'last_played_positions', posDocId), {
            videoId: String(video.id),
            userId: user.uid,
            position: time,
            updatedAt: new Date().toISOString()
          }).catch((err) => console.warn('[FirebaseSync] Position update failed:', err));
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (initialTime && !hasSetInitialTime) {
        videoRef.current.currentTime = initialTime;
        setHasSetInitialTime(true);
        setShowToast(`Seeking to moment (${formatTime(initialTime)})...`);
        setTimeout(() => setShowToast(null), 2500);
      }
    }
  };

  useEffect(() => {
    setHasSetInitialTime(false);
    setVisitedMoments([]);
  }, [video.id]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volVal = parseFloat(e.target.value);
    setVolume(volVal);
    if (videoRef.current) {
      videoRef.current.volume = volVal;
      videoRef.current.muted = volVal === 0;
    }
    setIsMuted(volVal === 0);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      videoRef.current.muted = nextMute;
      if (!nextMute && volume === 0) {
        setVolume(0.8);
        videoRef.current.volume = 0.8;
      }
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) {
      setLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  // Double-tap to seek feature handler
  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    e.preventDefault();
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false;
      return; // Skip action if clicking after a drag-scrub event
    }
    if (wasLongPressed.current) {
      wasLongPressed.current = false;
      return; // Handled by long-press
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;

    if (e.detail === 2) {
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
        doubleTapTimeoutRef.current = null;
      }
      if (offsetX < width * 0.5) {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          setShowSeekFeedback('rewind');
          setTimeout(() => setShowSeekFeedback(null), 600);
        }
      } else {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
          setShowSeekFeedback('forward');
          setTimeout(() => setShowSeekFeedback(null), 600);
        }
      }
    } else {
      if (doubleTapTimeoutRef.current) clearTimeout(doubleTapTimeoutRef.current);
      doubleTapTimeoutRef.current = setTimeout(() => {
        togglePlay();
      }, 250);
    }
  };

  const triggerSwipeLike = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
    setShowSwipeLikeSplash(true);
    setShowSwipeHapticPulse(true);
    
    // Add micro-vibration haptic pulse
    setTimeout(() => {
      setShowSwipeHapticPulse(false);
    }, 300);
    setTimeout(() => {
      setShowSwipeLikeSplash(false);
    }, 1200);
  };

  // Handle desktop mouse click-and-drag scrubbing OR swipe-to-like
  const handleMouseDown = (e: React.MouseEvent<HTMLVideoElement>) => {
    startPress();
    isDragScrubbing.current = true;
    dragStartX.current = e.clientX;
    dragStartTime.current = videoRef.current ? videoRef.current.currentTime : 0;
    hasMovedScrub.current = false;
    setSwipeDeltaX(0);
    setIsSwipingRight(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!isDragScrubbing.current) return;
    const currentX = e.clientX;
    const deltaX = currentX - dragStartX.current;

    // Distinguish Swipe-Right gesture (deltaX > 15) before moving timeline scrubbing
    if (deltaX > 15 && !hasMovedScrub.current) {
      setIsSwipingRight(true);
    }

    if (isSwipingRight) {
      e.preventDefault();
      setSwipeDeltaX(deltaX);
      return;
    }

    if (!hasMovedScrub.current && Math.abs(deltaX) > 12) {
      hasMovedScrub.current = true;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (hasMovedScrub.current && duration > 0) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const percentDiff = deltaX / (rect.width || 1);
      let targetTime = dragStartTime.current + percentDiff * duration;
      targetTime = Math.max(0, Math.min(duration, targetTime));

      if (videoRef.current) {
        videoRef.current.currentTime = targetTime;
      }
      setCurrentTime(targetTime);
      setScrubFeedback({
        show: true,
        offset: percentDiff * duration,
        targetTime
      });
    }
  };

  const handleMouseUp = () => {
    endPress();
    if (isSwipingRight) {
      if (swipeDeltaX > 80) {
        triggerSwipeLike();
      }
      setIsSwipingRight(false);
      setSwipeDeltaX(0);
      ignoreNextClick.current = true;
      isDragScrubbing.current = false;
      return;
    }
    if (hasMovedScrub.current) {
      ignoreNextClick.current = true;
      setScrubFeedback(prev => ({ ...prev, show: false }));
    }
    isDragScrubbing.current = false;
  };

  // Handle mobile touch horizontal swipe drag scrubbing OR swipe-to-like
  const handleTouchStart = (e: React.TouchEvent<HTMLVideoElement>) => {
    startPress();
    isDragScrubbing.current = true;
    dragStartX.current = e.touches[0].clientX;
    dragStartTime.current = videoRef.current ? videoRef.current.currentTime : 0;
    hasMovedScrub.current = false;
    setSwipeDeltaX(0);
    setIsSwipingRight(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLVideoElement>) => {
    if (!isDragScrubbing.current) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - dragStartX.current;

    // Distinguish Swipe-Right gesture (deltaX > 15) before moving timeline scrubbing
    if (deltaX > 15 && !hasMovedScrub.current) {
      setIsSwipingRight(true);
    }

    if (isSwipingRight) {
      if (e.cancelable) e.preventDefault();
      setSwipeDeltaX(deltaX);
      return;
    }

    if (!hasMovedScrub.current && Math.abs(deltaX) > 12) {
      hasMovedScrub.current = true;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (hasMovedScrub.current && duration > 0) {
      if (e.cancelable) e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const percentDiff = deltaX / (rect.width || 1);
      let targetTime = dragStartTime.current + percentDiff * duration;
      targetTime = Math.max(0, Math.min(duration, targetTime));

      if (videoRef.current) {
        videoRef.current.currentTime = targetTime;
      }
      setCurrentTime(targetTime);
      setScrubFeedback({
        show: true,
        offset: percentDiff * duration,
        targetTime
      });
    }
  };

  const handleTouchEnd = () => {
    endPress();
    if (isSwipingRight) {
      if (swipeDeltaX > 80) {
        triggerSwipeLike();
      }
      setIsSwipingRight(false);
      setSwipeDeltaX(0);
      ignoreNextClick.current = true;
      isDragScrubbing.current = false;
      return;
    }
    if (hasMovedScrub.current) {
      ignoreNextClick.current = true;
      setScrubFeedback(prev => ({ ...prev, show: false }));
    }
    isDragScrubbing.current = false;
  };

  // Picture in Picture feature toggle
  const togglePiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("Picture in Picture error: ", err);
    }
  };

  const handleReportContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowToast("Content flagged. Our moderation team will review this within 24 hours.");
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!duration || !progressTrackRef.current) return;
    const trackRect = progressTrackRef.current.getBoundingClientRect();
    const relativeX = e.clientX - trackRect.left;
    let computedPercent = Math.max(0, Math.min(1, relativeX / trackRect.width));
    let targetTime = computedPercent * duration;

    // Granular magnetic snapping threshold (in seconds)
    const snapThreshold = 2.0; 
    let snapped = false;
    let matchedChapter: ChapterMarker | null = null;

    const chapters = getChaptersForVideo(video, duration);

    // 1. Check if we can snap to pre-defined chapters / key moments
    for (const chapter of chapters) {
      if (Math.abs(targetTime - chapter.time) < snapThreshold) {
        targetTime = chapter.time;
        computedPercent = chapter.time / duration;
        snapped = true;
        matchedChapter = chapter;
        break;
      }
    }

    // 2. Check if we can snap to played/visited moments
    if (!snapped) {
      for (const momentSec of visitedMoments) {
        if (Math.abs(targetTime - momentSec) < snapThreshold) {
          targetTime = momentSec;
          computedPercent = momentSec / duration;
          snapped = true;
          matchedChapter = { time: momentSec, label: "Visited Point" };
          break;
        }
      }
    }

    // 3. Snap to absolute start (0:00)
    if (!snapped && targetTime < 1.5) {
      targetTime = 0;
      computedPercent = 0;
      snapped = true;
      matchedChapter = { time: 0, label: "Track Start" };
    }

    // 4. Snap to absolute end of stream
    if (!snapped && Math.abs(duration - targetTime) < 1.5) {
      targetTime = duration;
      computedPercent = 1;
      snapped = true;
      matchedChapter = { time: duration, label: "Track End" };
    }

    setHoveredPercent(computedPercent);
    setHoveredTime(targetTime);
    setIsHoverSnapped(snapped);
    setSnappedChapter(matchedChapter);

    // Update video element synchronously on hover to provide continuous visual feedback
    if (videoRef.current && isFinite(targetTime)) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleProgressMouseLeave = () => {
    setHoveredPercent(null);
    setHoveredTime(null);
    setIsHoverSnapped(false);
    setSnappedChapter(null);
  };

  return (
    <div className={`relative w-full h-full bg-zinc-950 flex flex-col justify-between overflow-hidden transition-all duration-500 ease-out hover:scale-[1.003] border border-transparent hover:border-emerald-500/25 hover:shadow-[0_0_30px_rgba(52,211,153,0.12)] ${
      showSwipeHapticPulse ? 'animate-shake-short' : ''
    }`}>
      {/* Swipe-to-Like Dynamic Gesture Feedback Overlay */}
      {isSwipingRight && (
        <div className="absolute inset-y-0 left-0 z-30 pointer-events-none flex items-center bg-gradient-to-r from-red-500/20 via-rose-500/5 to-transparent transition-all duration-75" style={{ width: `${Math.min(100, Math.max(20, swipeDeltaX * 1.25))}%` }}>
          <div className="pl-6 flex items-center gap-3">
            <div 
              className="p-3.5 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center transition-transform backdrop-blur-sm"
              style={{ 
                transform: `scale(${Math.min(1.5, 0.8 + (swipeDeltaX / 100))})`,
                boxShadow: `0 0 ${Math.min(30, swipeDeltaX / 2)}px rgba(239, 68, 68, 0.4)`
              }}
            >
              <Heart 
                size={28} 
                className={`transition-colors ${
                  swipeDeltaX > 80 ? 'text-red-500 fill-red-500 scale-110 drop-shadow-[0_0_10px_#ef4444]' : 'text-zinc-300'
                }`} 
              />
            </div>
            
            <div className="flex flex-col select-none">
              <span className={`text-xs font-black uppercase tracking-widest transition-colors ${swipeDeltaX > 80 ? 'text-red-400' : 'text-zinc-300'}`}>
                {swipeDeltaX > 80 ? 'Release to Like!' : 'Swipe Right to Like'}
              </span>
              <span className="text-[9px] font-bold text-zinc-500 tracking-wider">
                Threshold: {Math.round(Math.min(100, (swipeDeltaX / 80) * 100))}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Swipe LIKED Center Heart Splash & Spark Animation haptic feedback */}
      <AnimatePresence>
        {showSwipeLikeSplash && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2, y: -40 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-zinc-950/30 backdrop-blur-[1px] pointer-events-none"
          >
            <div className="relative flex items-center justify-center">
              {/* Pulsating Light Rings */}
              <div className="absolute w-44 h-44 bg-red-500/20 rounded-full blur-2xl animate-ping" />
              <div className="absolute w-32 h-32 border border-red-500/40 rounded-full animate-ping [animation-duration:0.8s]" />
              <div className="absolute w-24 h-24 border border-rose-500/20 rounded-full animate-ping [animation-duration:1.2s]" />

              {/* Giant Splashing Heart */}
              <div className="relative animate-heart-splash p-6 bg-red-500/10 border border-red-500/25 rounded-full backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.4)]">
                <Heart size={68} className="text-red-500 fill-red-500" />
              </div>
              
              {/* Sparkle indicators */}
              <div className="absolute -top-6 text-xl animate-bounce">⚡</div>
              <div className="absolute -bottom-6 text-xl animate-bounce [animation-delay:0.2s]">🔥</div>
              <div className="absolute -left-10 text-xl animate-pulse">✨</div>
              <div className="absolute -right-10 text-xl animate-pulse [animation-delay:0.3s]">✨</div>
            </div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-6 flex flex-col items-center bg-black/60 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md"
            >
              <span className="text-xs font-black uppercase tracking-[0.2em] text-red-400">Liked with Swipe</span>
              <span className="text-[10px] font-mono text-zinc-400 font-bold">HAPTIC RESPONSE ACTIVE</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Absolute Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        crossOrigin="anonymous"
        loop={!isAutoSwipe && isLooping}
        playsInline
        muted={isMuted}
        onClick={handleVideoClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleVideoError}
        onEnded={handleVideoEnded}
        className={`absolute inset-0 w-full h-full object-cover cursor-pointer transition-all duration-300 ${
          FILTER_EFFECTS.find(f => f.id === activeFilter)?.class || ''
        }`}
      />

      {/* Target Track Audio Element for Mix Mode Seamless Crossfades */}
      {targetTrackIdx !== null && playlist && playlist[targetTrackIdx] && (
        <audio
          ref={targetAudioRef}
          src={playlist[targetTrackIdx].url}
          preload="auto"
          crossOrigin="anonymous"
          loop
          style={{ display: 'none' }}
        />
      )}

      {/* Visual scrubbing HUD overlay (Task 1) */}
      {scrubFeedback.show && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/40 pointer-events-none">
          <div className="bg-zinc-950/95 border border-emerald-500/35 px-6 py-4 rounded-3xl flex flex-col items-center gap-1 shadow-[0_20px_50px_rgba(16,185,129,0.25)] scale-105 transition-all">
            <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-widest uppercase">
              {scrubFeedback.offset >= 0 ? '⏩ Seeking Forward' : '⏪ Seeking Backward'}
            </span>
            <div className="text-2xl font-black text-white font-mono flex items-center gap-1.5">
              <span>{formatDoubleDigitTime(scrubFeedback.targetTime)}</span>
              <span className="text-zinc-600 text-base">/</span>
              <span className="text-zinc-400 text-sm">{formatDoubleDigitTime(duration)}</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1.5 flex items-center gap-1 font-mono">
              <span>{scrubFeedback.offset >= 0 ? '+' : ''}{Math.round(scrubFeedback.offset)}s</span>
              <span className="text-zinc-500">({Math.round((scrubFeedback.targetTime / (duration || 1)) * 100)}%)</span>
            </span>
          </div>
        </div>
      )}

      {/* Video failure error message overlay */}
      {videoError && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-30 pointer-events-auto">
          <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-full text-red-400 mb-2 animate-pulse">
            <AlertCircle size={24} />
          </div>
          <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-wider font-mono">Stream Connection Offline</h4>
          <p className="text-[9px] text-zinc-400 max-w-[220px] leading-relaxed mb-4">{videoError}</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setVideoUrl(FALLBACK_VIDEO_URL);
              setVideoError(null);
            }}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[9px] uppercase font-bold tracking-widest border border-white/5 transition-all"
          >
            Refresh Backup Feed
          </button>
        </div>
      )}

      {/* Dimmed bottom overlay gradient to ensure text readability */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

      {/* Interactive Overlay Progress Bar */}
      <div 
        id="video-overlay-progress-bar"
        className="absolute bottom-1/2 left-4 right-4 bg-black/60 hover:bg-black/85 backdrop-blur-md rounded-2xl border border-white/15 p-3.5 z-25 flex flex-col gap-2 transition-all duration-300 shadow-2xl group/overlay-progress select-none"
        onMouseMove={handleProgressMouseMove}
        onMouseLeave={handleProgressMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          const track = e.currentTarget.querySelector('.progress-track-bg');
          if (track && duration) {
            const rect = track.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const percentage = Math.max(0, Math.min(1, clickX / width));
            const newTime = percentage * duration;
            if (videoRef.current) {
              videoRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }
          }
        }}
      >
        {/* Interactive Detailed Time-Tooltip / Drag-Scrubbing Preview Thumb */}
        {((hoveredTime !== null && hoveredPercent !== null) || scrubFeedback.show || isDragScrubbing.current) && duration > 0 && (() => {
          // Determine active seek percentage and timestamp based on whether dragging screen or hovering seek-bar
          const activePercent = hoveredPercent !== null 
            ? hoveredPercent 
            : (scrubFeedback.show 
               ? (scrubFeedback.targetTime / duration) 
               : (currentTime / duration));
               
          const activeTime = hoveredTime !== null 
            ? hoveredTime 
            : (scrubFeedback.show 
               ? scrubFeedback.targetTime 
               : currentTime);

          const isDragging = scrubFeedback.show || isDragScrubbing.current;

          const relativeOffset = activeTime - currentTime;
          const offsetSign = relativeOffset >= 0 ? '+' : '-';
          const formattedOffset = `${offsetSign}${formatTime(Math.abs(relativeOffset))}`;
          
          return (
            <div 
              className="absolute bottom-full mb-3 z-45 pointer-events-none transition-all duration-75 ease-out"
              style={{ 
                left: `${Math.max(0, Math.min(1, activePercent)) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className={`bg-zinc-950/95 border-2 backdrop-blur-md rounded-2xl p-3 flex flex-col gap-2 items-center text-center min-w-[170px] max-w-[240px] shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all ${
                isHoverSnapped && !isDragging
                  ? 'border-teal-400 shadow-[0_12px_40px_rgba(45,212,191,0.35)] scale-[1.03]' 
                  : 'border-emerald-400'
              }`}>
                {/* Real-time Dynamic Frame Snapshot Preview Box */}
                <div className="w-[150px] relative rounded-lg overflow-hidden border border-zinc-700 bg-black flex flex-col items-center justify-center aspect-[16/10] shadow-md">
                  <canvas 
                    ref={previewCanvasRef} 
                    width={150} 
                    height={94} 
                    className="w-full h-full object-cover"
                  />
                  {/* Neon HUD grid line scan */}
                  <div className="absolute inset-x-0 top-0 h-[1.5px] bg-emerald-400/40 shadow-[0_0_8px_rgba(52,211,153,0.5)] pointer-events-none animate-bounce" />
                  <div className="absolute top-1.5 left-2 bg-black/75 px-1.5 py-0.5 rounded text-[7px] text-zinc-405 font-mono flex items-center gap-1 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Frame Snapshot</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-0.5">
                  <span className={`font-mono text-base font-black tracking-wider drop-shadow-[0_0_8px_rgba(52,211,153,0.4)] ${
                    isHoverSnapped && !isDragging ? 'text-teal-300' : 'text-emerald-400'
                  }`}>
                    {formatDoubleDigitTime(activeTime)}
                  </span>
                  
                  {isDragging ? (
                    <span className="text-[8px] font-black tracking-widest text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded uppercase flex items-center gap-1.5 backdrop-blur-md">
                      ⚡ DRAG SCRUBBING
                    </span>
                  ) : snappedChapter ? (
                    <div className="flex flex-col items-center mt-1">
                      <span className="text-[9px] font-black text-teal-300 animate-pulse uppercase tracking-wider font-sans max-w-[210px] truncate leading-tight">
                        📍 {snappedChapter.label}
                      </span>
                      <span className="text-[8px] font-semibold text-teal-400/80 uppercase tracking-widest font-mono flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] animate-bounce">🧲</span> SNAP LOCKED
                      </span>
                    </div>
                  ) : (
                    <span className="text-[8px] font-black tracking-widest text-zinc-500 uppercase font-sans">
                      HOVERING SEEKER
                    </span>
                  )}
                </div>
                
                {Math.abs(relativeOffset) > 0.5 && (
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold font-mono py-1 px-2 rounded-md w-full justify-center transition-all ${
                    isHoverSnapped ? 'bg-teal-500/10 border border-teal-500/20 text-teal-300' : 'bg-white/5 text-zinc-300'
                  }`}>
                    <span className={relativeOffset >= 0 ? "text-emerald-400" : "text-amber-400"}>
                      {relativeOffset >= 0 ? "▶ SKIP" : "◀ REWIND"}
                    </span>
                    <span>
                      {formattedOffset}
                    </span>
                  </div>
                )}
                
                <div className="w-full pt-1.5 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-zinc-500">
                  <span>Progress: {(activePercent * 100).toFixed(1)}%</span>
                  <span>{isHoverSnapped ? 'Magnetic Snap' : 'Seek Precise'}</span>
                </div>
              </div>
              {/* Tooltip triangle indicator */}
              <div className="w-3 h-3 bg-zinc-950 border-r-2 border-b-2 border-emerald-400 rotate-45 mx-auto -mt-1.5 shadow-md" />
            </div>
          );
        })()}

        <div className="flex items-center justify-between text-[10px] font-mono font-bold z-35">
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${animClass("animate-pulse")}`} />
            VISUAL PLAYER PROGRESS
          </span>
          <div className="flex items-center gap-2">
            {/* Quick Share Button */}
            <button
              type="button"
              id="quick-share-progress-overlay"
              onClick={(e) => {
                e.stopPropagation();
                setShareWithTimestamp(true);
                setShowShareMenu(true);
                
                // Track share intent event by POSTing to /api/analytics/share-intent
                console.log(`[Analytics] Quick Share clicked for video ${video.id}. Sending share intent event.`);
                fetch('/api/analytics/share-intent', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Id': 'default'
                  },
                  body: JSON.stringify({
                    videoId: video.id,
                    song: video.song,
                    creator: video.creator,
                    currentTime,
                    duration,
                    userId: user?.uid || null
                  })
                })
                .then(res => res.json())
                .then(data => {
                  console.log(`[Analytics] Successfully tracked video share intent:`, data);
                })
                .catch(err => {
                  console.error(`[Analytics] Error tracking video share intent:`, err);
                });
              }}
              className="text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 active:bg-cyan-400/30 px-2.5 py-0.5 rounded-md font-mono text-[9px] border border-cyan-400/35 cursor-pointer flex items-center gap-1 transition-all uppercase tracking-wider font-extrabold shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:scale-[1.03]"
              title="Share with current timestamp"
            >
              <Share2 size={10} className={animClass("animate-pulse")} />
              <span>Quick Share</span>
            </button>

            {/* Quick Playback Speed Dropdown */}
            <div 
              className="relative text-zinc-300 bg-white/10 hover:bg-white/20 active:bg-white/25 px-2.5 py-0.5 rounded-md font-mono text-[9px] border border-white/5 cursor-pointer flex items-center gap-1 transition-colors backdrop-blur-sm shadow-sm"
              title="Change playback speed"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{playbackRate}x</span>
              <span className="text-[7px] text-zinc-400">▼</span>
              <select
                value={playbackRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPlaybackRate(val);
                  setShowToast(`Playback rate updated: ${val}x`);
                  setTimeout(() => setShowToast(null), 2000);
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="0.5" className="bg-zinc-950 text-white font-mono">0.5x</option>
                <option value="0.75" className="bg-zinc-950 text-white font-mono">0.75x</option>
                <option value="1" className="bg-zinc-950 text-white font-mono">1.0x (Normal)</option>
                <option value="1.25" className="bg-zinc-950 text-white font-mono">1.25x</option>
                <option value="1.5" className="bg-zinc-950 text-white font-mono">1.5x</option>
                <option value="2" className="bg-zinc-950 text-white font-mono">2.0x</option>
              </select>
            </div>

            <span className="text-zinc-200 bg-white/10 px-2 py-0.5 rounded-md font-mono tracking-tight text-[9px] border border-white/5 backdrop-blur-sm">
              {formatTime(currentTime)} <span className="text-zinc-500 mx-0.5">/</span> {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Real-time Live Stream Heat / Listener Spike Sparkline */}
        <div className="flex items-center justify-between gap-3 px-2 py-1 text-[8px] font-mono font-bold text-zinc-400 bg-black/40 rounded-lg border border-white/5">
          <span className="flex items-center gap-1 text-rose-400 shrink-0">
            <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping" />
            LIVE STREAM HEAT
          </span>
          <div className="flex-1 h-4 relative flex items-center">
            <svg className="w-full h-full text-rose-500/30 group-hover/overlay-progress:text-rose-500/50 transition-all" preserveAspectRatio="none" viewBox="0 0 100 20" fill="none" stroke="currentColor">
              <path d="M 0,15 C 10,12 15,3 25,14 C 35,5 40,16 50,4 C 60,18 65,2 75,15 C 85,12 90,5 100,10" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M 0,15 C 10,12 15,3 25,14 C 35,5 40,16 50,4 C 60,18 65,2 75,15 C 85,12 90,5 100,10 L 100,20 L 0,20 Z" fill="currentColor" className="opacity-10" stroke="none" />
            </svg>
          </div>
          <span className="text-rose-400 text-[8px] bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20 shrink-0">
            +4.8k spike
          </span>
        </div>

        {/* The slider tracking track */}
        <div 
          ref={progressTrackRef}
          className="relative w-full h-2 bg-white/15 rounded-full progress-track-bg transition-all duration-200 group-hover/overlay-progress:h-3"
        >
          {/* Vertical indicator line for precise hovered point */}
          {hoveredPercent !== null && duration > 0 && (
            <div 
              className="absolute top-0 bottom-0 w-[1.5px] bg-emerald-400/60 z-15 pointer-events-none"
              style={{ left: `${hoveredPercent * 100}%` }}
            />
          )}

          {/* Visited moments vertical ticks */}
          {duration > 0 && visitedMoments.map((momentSec) => {
            const pct = (momentSec / duration) * 100;
            if (pct < 0 || pct > 100) return null;
            return (
              <div
                key={`visited-${momentSec}`}
                className="absolute top-1/2 -translate-y-1/2 w-[3px] h-[150%] bg-emerald-400/80 hover:bg-emerald-300 z-20 pointer-events-none transition-all rounded-full shadow-[0_0_4px_rgba(52,211,153,0.6)]"
                style={{ left: `${pct}%` }}
                title={`Visited: ${formatTime(momentSec)}`}
              />
            );
          })}

          {/* Pre-defined Chapter markers & Visual Snapping Highlights */}
          {duration > 0 && getChaptersForVideo(video, duration).map((chapter, idx) => {
            const pct = (chapter.time / duration) * 100;
            if (pct < 0 || pct > 100) return null;
            const isSnappedThis = snappedChapter && snappedChapter.label === chapter.label && Math.abs(snappedChapter.time - chapter.time) < 0.1;
            
            return (
              <div
                key={`chapter-${idx}-${chapter.time}`}
                className="absolute top-1/2 -translate-y-1/2 z-25 pointer-events-none transition-all duration-200"
                style={{ left: `${pct}%` }}
              >
                {/* Magnetic field halo pulse when snapped */}
                {isSnappedThis && (
                  <span className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 w-8 h-8 rounded-full bg-teal-400/40 animate-ping pointer-events-none" />
                )}
                
                {/* Predefined Chapter core tick marker */}
                <div
                  className={`w-[4px] h-[180%] rounded-full -translate-x-1/2 transition-all duration-300 ${
                    isSnappedThis 
                      ? 'bg-teal-300 scale-150 shadow-[0_0_12px_rgba(45,212,191,1)] h-[240%]' 
                      : 'bg-white/40 hover:bg-white/95 h-[180%] shadow-[0_0_4px_rgba(255,255,255,0.4)]'
                  }`}
                  title={`Chapter: ${chapter.label} (${formatTime(chapter.time)})`}
                />
              </div>
            );
          })}

          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-100 relative overflow-hidden"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          >
            {/* Pulsing light effect inside the progress line */}
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/60 blur-[1px] animate-pulse rounded-full" />
          </div>
        </div>
      </div>

      {/* AI-Generated Closed Captions Overlay */}
      {ccEnabled && (
        <div className="absolute bottom-[170px] left-4 right-4 flex justify-center text-center pointer-events-none z-20">
          <AnimatePresence mode="wait">
            {activeSubtitle ? (
              <motion.div
                key={activeSubtitle}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="bg-black/75 text-emerald-400 border border-white/5 px-3.5 py-1.5 rounded-xl text-[11px] font-sans font-semibold tracking-wide max-w-[90%] leading-normal backdrop-blur-sm shadow-xl flex items-center gap-1.5"
              >
                <Sparkles size={11} className="text-emerald-400 animate-pulse shrink-0" />
                <span>{activeSubtitle}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}

      {/* Flag feedback warning notify */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-16 left-4 right-4 bg-zinc-900 border border-red-500/30 text-white rounded-2xl p-4 shadow-2xl z-50 text-xs text-center font-bold flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seek gesture indicator overlays */}
      <AnimatePresence>
        {showSeekFeedback === 'rewind' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-black/50 to-transparent flex flex-col items-center justify-center pointer-events-none z-20"
          >
            <ChevronLeft size={36} className="text-white animate-pulse" />
            <span className="text-[10px] font-mono font-black text-white mt-1">-5 seconds</span>
          </motion.div>
        )}
        {showSeekFeedback === 'forward' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-black/50 to-transparent flex flex-col items-center justify-center pointer-events-none z-20"
          >
            <ChevronRight size={36} className="text-white animate-pulse" />
            <span className="text-[10px] font-mono font-black text-white mt-1">+5 seconds</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flashing Play/Pause Icons over Center */}
      <AnimatePresence>
        {showCenterIcon && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.8, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="p-5 bg-black/60 rounded-full text-white backdrop-blur-md">
              {showCenterIcon === 'play' ? <Play size={32} /> : <Pause size={32} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Controls Row */}
      <div className="p-4 flex justify-between items-center z-10 gap-2 w-full">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-black tracking-widest text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 backdrop-blur-md">
            <Sparkles size={10} /> Live Showreel
          </span>
          {powerSaveMode && (
            <span className="text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.2 py-1 rounded-full uppercase flex items-center gap-1 backdrop-blur-md animate-pulse">
              <Cpu size={10} className="text-emerald-400" /> 30 FPS LIMIT
            </span>
          )}
        </div>
        
        {/* Compact Controls Group */}
        <div className="flex items-center gap-2">
          {/* Playback speed selector */}
          <div className="relative shrink-0">
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="appearance-none bg-black/45 hover:bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold text-white px-3 py-1.5 pr-7 rounded-full border border-white/10 cursor-pointer focus:outline-none transition-colors"
            >
              <option value={1} className="bg-zinc-950 text-white">1x</option>
              <option value={1.5} className="bg-zinc-950 text-white">1.5x</option>
              <option value={2} className="bg-zinc-950 text-white font-bold text-emerald-400">2x</option>
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-zinc-400">▼</span>
          </div>

          {/* Report inappropriate flag button */}
          <button 
            type="button"
            onClick={handleReportContent}
            className="p-2 bg-black/45 hover:bg-red-500/20 text-white hover:text-red-400 backdrop-blur-md rounded-full border border-white/10 transition-all shrink-0"
            title="Report Content"
          >
            <Flag size={11} />
          </button>

          {/* Loop toggle button */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const nextLooping = !isLooping;
              setIsLooping(nextLooping);
              setShowToast(nextLooping ? "Infinite looping turned ON" : "Infinite looping turned OFF");
              setTimeout(() => setShowToast(null), 2500);
            }}
            className={`p-2 backdrop-blur-md rounded-full border transition-all shrink-0 ${
              isLooping 
                ? 'bg-zinc-700 text-white border-emerald-500' 
                : 'bg-black/45 text-white hover:text-emerald-400 border-white/10'
            }`}
            title={isLooping ? "Disable Infinite Loop" : "Enable Infinite Loop"}
          >
            <Repeat size={11} />
          </button>

          {/* Auto-Swipe toggle button */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const nextAuto = !isAutoSwipe;
              setIsAutoSwipe(nextAuto);
              setShowToast(nextAuto ? "Auto-Swipe: ENABLED" : "Auto-Swipe: DISABLED");
              setTimeout(() => setShowToast(null), 2500);
            }}
            className={`p-2 backdrop-blur-md rounded-full border transition-all shrink-0 flex items-center gap-1.5 text-[9px] font-sans font-bold leading-none ${
              isAutoSwipe 
                ? 'bg-zinc-700 text-white border-emerald-500 font-black' 
                : 'bg-black/45 text-white hover:text-emerald-400 border-white/10 font-bold'
            }`}
            title={isAutoSwipe ? "Disable Auto-Swipe" : "Enable Auto-Swipe"}
          >
            <Zap size={11} className={isAutoSwipe ? "animate-pulse" : ""} />
            <span>Auto-Swipe</span>
          </button>

          {/* AI-Generated Closed Captions Button */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCcEnabled(!ccEnabled);
              setShowToast(!ccEnabled ? "AI Closed Captions: ENABLED" : "AI Closed Captions: DISABLED");
              setTimeout(() => setShowToast(null), 2500);
            }}
            className={`p-2 backdrop-blur-md rounded-full border text-[10px] font-sans font-black flex items-center justify-center shrink-0 w-[27px] h-[27px] transition-all duration-300 ${
              ccEnabled 
                ? 'bg-zinc-700 text-white border-emerald-500' 
                : 'bg-black/45 text-white hover:text-emerald-400 border-white/10'
            }`}
            title={ccEnabled ? "Disable AI Closed Captions" : "Enable AI Closed Captions"}
          >
            CC
          </button>

          {/* AI-Powered Auto-Caption Sparkles Button */}
          <button 
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              if (isGeneratingCaptions) return;
              setIsGeneratingCaptions(true);
              setShowToast("🤖 AI Auto-Captioning started...");
              try {
                const response = await fetch('/api/ai/video/captions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                  },
                  body: JSON.stringify({
                    videoId: video.id,
                    creator: video.creator,
                    description: video.description,
                    song: video.song,
                    genre: video.genre || 'Electronic',
                    aiAnalysisText: video.aiAnalysisText || ''
                  })
                });
                const data = await response.json();
                if (data.success && data.subtitles) {
                  setGeneratedSubtitles(data.subtitles);
                  setCcEnabled(true);
                  setShowToast("✨ AI Captions generated successfully!");
                } else {
                  setShowToast("❌ Failed to generate captions.");
                }
              } catch (err) {
                console.error("Caption generation failed", err);
                setShowToast("❌ Connection error generating captions.");
              } finally {
                setIsGeneratingCaptions(false);
                setTimeout(() => setShowToast(null), 3000);
              }
            }}
            className={`p-2 backdrop-blur-md rounded-full border text-[10px] font-sans font-bold flex items-center justify-center shrink-0 h-[27px] px-2.5 transition-all duration-300 ${
              generatedSubtitles 
                ? 'bg-amber-500 text-black border-amber-500' 
                : 'bg-black/45 text-white hover:text-amber-400 border-white/10'
            }`}
            title="Generate AI Captions with Gemini"
            disabled={isGeneratingCaptions}
          >
            {isGeneratingCaptions ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw size={11} className="animate-spin" />
                <span>Analyzing...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Sparkles size={11} className={generatedSubtitles ? "text-black animate-pulse" : "text-amber-400 animate-pulse"} />
                <span>{generatedSubtitles ? "AI Subtitles Active" : "AI Caption"}</span>
              </span>
            )}
          </button>

          {/* Effects filter overlay toggle button */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEffectsMenu(!showEffectsMenu);
            }}
            className={`p-2 backdrop-blur-md rounded-full border transition-all shrink-0 ${
              showEffectsMenu 
                ? 'bg-zinc-700 text-white border-emerald-500' 
                : 'bg-black/45 text-white hover:text-emerald-400 border-white/10'
            }`}
            title="Video Effects"
          >
            <Sliders size={11} />
          </button>

          {/* Compact Volume Control Slider Panel */}
          <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
            <button 
              type="button"
              onClick={toggleMute} 
              className="text-white hover:text-emerald-400 transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              onClick={(e) => e.stopPropagation()}
              className="w-14 h-1 bg-white/20 accent-emerald-500 rounded-lg cursor-pointer outline-none"
            />
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Effects Menu */}
      <AnimatePresence>
        {showEffectsMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 left-4 bg-zinc-900/90 border border-zinc-700/60 text-white rounded-2xl p-3 shadow-2xl z-30 flex flex-col gap-2 backdrop-blur-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400">Video Effects</span>
              <button 
                type="button" 
                onClick={() => setShowEffectsMenu(false)}
                className="text-[9px] font-bold text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin select-none">
              {FILTER_EFFECTS.map((effect) => (
                <button
                  key={effect.id}
                  type="button"
                  onClick={() => {
                    setActiveFilter(effect.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                    activeFilter === effect.id
                      ? 'bg-zinc-700 text-white border-emerald-500'
                      : 'bg-black/40 text-zinc-300 border-white/10 hover:bg-black/75'
                  }`}
                >
                  {effect.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Side Buttons & Bottom Texts Container */}
      <div className="flex flex-col justify-end h-full z-10 p-4">
        <div className="flex justify-between items-end gap-2">
          {/* Bottom Left Creators + Metadata Info */}
          <div className="flex-1 space-y-3 pr-4">
            <div className="flex items-center gap-2">
              <img src={video.avatar} alt={video.creator} className="w-8 h-8 rounded-full border border-white/20" />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-white tracking-tight">{video.creator}</span>
                  <CheckCircle2 size={12} className="text-emerald-400 fill-emerald-500/20" />
                </div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">Featured Artist</span>
              </div>
            </div>

            <p className="text-xs text-zinc-200 leading-relaxed font-medium line-clamp-3">
              {video.description}
            </p>

            {/* Live Track Ticker */}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/5 w-fit">
              <Disc className={animClass("text-emerald-400 animate-spin")} size={12} />
              <div className="text-[10px] text-zinc-300 font-mono font-bold truncate max-w-[150px]">
                {video.song}
              </div>
            </div>
          </div>

          {/* Bottom Right Floating Action List */}
          <div className="flex flex-col gap-4 items-center pl-1">
            <button 
              type="button"
              onClick={handleLike}
              className="flex flex-col items-center gap-1 group bg-black/35 backdrop-blur-md p-2.5 rounded-full border border-white/5 hover:bg-white/10 transition-colors"
            >
              <Heart size={20} className={liked ? "text-red-500 fill-red-500" : "text-white group-hover:scale-110 transition-transform"} />
              <span className="text-[9px] font-mono text-zinc-300">{likeCount}</span>
            </button>

            <button 
              type="button"
              onClick={() => onOpenComments(video.id)}
              className="flex flex-col items-center gap-1 group bg-black/35 backdrop-blur-md p-2.5 rounded-full border border-white/5 hover:bg-white/10 transition-colors"
            >
              <MessageSquare size={20} className="text-white group-hover:text-emerald-400 group-hover:scale-110 transition-all" />
              <span className="text-[9px] font-mono text-zinc-300">{video.commentsCount}</span>
            </button>

            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShareWithTimestamp(false);
                setShowShareMenu(true);
              }}
              className="flex flex-col items-center gap-1 group bg-black/35 backdrop-blur-md p-2.5 rounded-full border border-white/5 hover:bg-white/10 transition-colors"
              title="Share Video"
            >
              <Share2 size={19} className="text-white group-hover:text-blue-400 group-hover:scale-110 transition-all" />
              <span className="text-[9px] font-mono text-zinc-300">{video.shares}</span>
            </button>

            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(video.id);
                const nextSaved = !isSaved;
                setShowToast(nextSaved ? "Saved to Favorites!" : "Removed from Favorites");
                setTimeout(() => setShowToast(null), 2500);
              }}
              className="flex flex-col items-center gap-1 group bg-black/35 backdrop-blur-md p-2.5 rounded-full border border-white/5 hover:bg-white/10 transition-colors"
              title={isSaved ? "Remove from Favorites" : "Save to Favorites"}
            >
              <Bookmark size={19} className={isSaved ? "text-emerald-400 fill-emerald-500" : "text-white group-hover:scale-110 transition-all"} />
              <span className="text-[9px] font-mono text-zinc-300">{isSaved ? "Saved" : "Save"}</span>
            </button>

            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMixModeActive(!mixModeActive);
              }}
              className={`flex flex-col items-center gap-1 group bg-black/35 backdrop-blur-md p-2.5 rounded-full border transition-all ${
                mixModeActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5 hover:bg-white/10'
              }`}
              title="Toggle Cognitive Mix Mode"
            >
              <Disc size={19} className={mixModeActive ? "text-emerald-400 animate-spin" : "text-white group-hover:scale-110 transition-all"} style={{ animationDuration: '4s' }} />
              <span className={`text-[9px] font-mono ${mixModeActive ? 'text-emerald-400 font-bold' : 'text-zinc-300'}`}>Mix Mode</span>
            </button>

            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowInfoModal(true);
              }}
              className="flex flex-col items-center gap-1 group bg-black/35 backdrop-blur-md p-2.5 rounded-full border border-white/5 hover:bg-white/10 transition-colors"
              title="Show Video Metadata"
            >
              <Info size={19} className="text-white group-hover:text-cyan-400 group-hover:scale-110 transition-all" />
              <span className="text-[9px] font-mono text-zinc-300">Info</span>
            </button>
          </div>
        </div>

        {/* Modular Timeline Seek Progress bar on the Bottom edge */}
        <div className="mt-4 pt-2 border-t border-white/5 flex items-center gap-2.5">
          <button 
            type="button" 
            onClick={togglePlay} 
            className="p-1.5 bg-zinc-700 text-white hover:bg-zinc-600 rounded-lg transition-colors z-20"
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
          </button>

          {/* Picture-in-Picture mode toggle */}
          <button
            type="button"
            onClick={togglePiP}
            className={`p-1.5 rounded-lg border transition-all duration-300 z-20 ${
              isPiP 
                ? 'bg-zinc-700 text-white border-emerald-500' 
                : 'bg-black/40 text-zinc-300 border-white/10 hover:text-white hover:bg-black/60'
            }`}
            title="Picture-in-Picture Toggle"
          >
            <Tv size={10} />
          </button>

          <span className="text-[9px] text-zinc-400 font-mono w-7 select-none">{formatTime(currentTime)}</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative select-none">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-emerald-500 rounded-full"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-zinc-400 font-mono w-7 select-none text-right">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Info Metadata Modal Overlay */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-x-4 top-16 bottom-16 bg-zinc-950/95 border border-zinc-700/80 text-white rounded-3xl p-5 shadow-2xl z-40 flex flex-col justify-between backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4 overflow-y-auto max-h-[85%]">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-[10px] uppercase tracking-widest font-black text-cyan-400">Video Metadata</span>
                <button 
                  type="button" 
                  onClick={() => setShowInfoModal(false)}
                  className="p-1 px-2.5 bg-white/10 hover:bg-white/25 rounded-lg text-[10px] uppercase font-bold text-zinc-300 hover:text-white transition-all text-center"
                >
                  Close
                </button>
              </div>

              {/* Creator Card */}
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <img src={video.avatar} alt={video.creator} className="w-10 h-10 rounded-full border border-white/20" />
                <div>
                  <h4 className="text-xs font-bold text-white">{video.creator}</h4>
                  <span className="text-[8px] text-zinc-400 uppercase tracking-wider">Verified Artist</span>
                </div>
              </div>

              {/* Creator Bio */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">About the Artist</span>
                <p className="text-xs text-zinc-300 font-medium leading-relaxed bg-white/2 p-3 rounded-xl border border-white/5">
                  {video.bio || `${video.creator} is an active composer and direct-to-fan digital entrepreneur on SonicStream.`}
                </p>
              </div>

              {/* Track Metadata fields */}
              <div className="space-y-2 font-mono text-[10px] text-zinc-400 bg-black/40 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between gap-1">
                  <span>Full Song:</span>
                  <span className="text-white font-bold text-right truncate max-w-[160px]">{video.fullTitle || video.song}</span>
                </div>
                <div className="flex justify-between">
                  <span>Release Date:</span>
                  <span className="text-white font-bold text-right">{video.releaseDate || "June 1, 2026"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Primary Genre:</span>
                  <span className="text-cyan-400 font-bold text-right">{video.genre || "Electronic / Techno"}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Encoding Specs:</span>
                  <span className="text-white font-bold text-right">{video.bitrate || "320kbps Standard"}</span>
                </div>
              </div>

              {/* AI Content Analysis, Genres and Mood Tags */}
              <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5 font-sans">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Sparkles size={13} className="animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest font-black font-mono">AI Content Analysis</span>
                </div>
                
                {/* Auto-generated Genre tags */}
                {video.aiGenres && video.aiGenres.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Recognized Genres</span>
                    <div className="flex flex-wrap gap-1.5 animate-fade-in">
                      {video.aiGenres.map((g, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto-generated Mood tags */}
                {video.aiMoods && video.aiMoods.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Acoustic Mood Profile</span>
                    <div className="flex flex-wrap gap-1.5 animate-fade-in">
                      {video.aiMoods.map((m, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[9px] font-bold">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Waveform text breakdown */}
                {video.aiAnalysisText && (
                  <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5 mt-1">
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Spectral Analysis Insights</span>
                    <p className="text-[10px] text-zinc-300 font-medium leading-relaxed font-mono">
                      {video.aiAnalysisText}
                    </p>
                  </div>
                )}

                {/* Simulated AI Synopsis Section */}
                <div className="space-y-1.5 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20 mt-2">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Cpu size={11} className={isGeneratingSynopsis ? "animate-spin animate-duration-1000" : ""} />
                    <span className="text-[8px] uppercase tracking-wider text-emerald-300 font-bold font-mono">Dynamic AI Synopsis</span>
                  </div>
                  {isGeneratingSynopsis ? (
                    <div className="flex items-center gap-2 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <span className="text-[9px] text-zinc-500 font-mono italic animate-pulse">Running neural summarizer...</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-200 leading-relaxed font-sans font-medium">
                      {aiSynopsis}
                    </p>
                  )}
                </div>
              </div>

              {/* Copy Deep Link Container */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!videoRef.current) return;
                    const time = videoRef.current.currentTime;
                    const deepLink = `${window.location.origin}${window.location.pathname}?video=${video.id}&t=${Math.floor(time)}`;
                    navigator.clipboard.writeText(deepLink)
                      .then(() => {
                        setShowToast(`Moment deep-link copied at ${formatTime(time)}!`);
                        setTimeout(() => setShowToast(null), 2500);
                      })
                      .catch(() => {
                        setShowToast("Moment deep-link copied to clipboard!");
                        setTimeout(() => setShowToast(null), 2000);
                      });
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transform hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5"
                >
                  <Link size={12} /> Copy Deep Link at {formatTime(currentTime)}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
              <span>Licensed via SonicStream Ledger</span>
              <span className="text-cyan-400 font-bold uppercase">v1.2 active</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cognitive Mix Mode Seamless DJ Panel Overlay */}
      <AnimatePresence>
        {mixModeActive && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-4 bottom-[74px] bg-zinc-950/95 border border-emerald-500/30 rounded-3xl p-4 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.35)] z-40 backdrop-blur-xl flex flex-col gap-3 select-none text-white max-h-[360px] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5 align-middle">
                <Disc size={16} className="text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-extrabold block leading-none">TRANSITION MIX DECK</span>
                  <span className="text-[8px] text-zinc-400 uppercase font-bold tracking-wider leading-none">Smooth Track Audio Crossfader</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMixModeActive(false);
                  if (videoRef.current) videoRef.current.volume = volume;
                  setCrossfadeValue(0);
                  setTargetTrackIdx(null);
                }}
                className="p-1 px-2 text-[8px] font-black uppercase text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>

            {/* Track Selector List */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block font-mono">Select Target Deck (CH-B):</span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {playlist && playlist.map((item, idx) => {
                  const isCurrent = item.id === video.id;
                  const isSelected = targetTrackIdx === idx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (isCurrent) return;
                        setTargetTrackIdx(idx);
                        setCrossfadeValue(0);
                        if (videoRef.current) {
                          videoRef.current.volume = volume;
                        }
                      }}
                      disabled={isCurrent}
                      className={`px-3 py-2 rounded-xl border flex flex-col items-center text-center gap-1 min-w-[100px] max-w-[110px] shrink-0 cursor-pointer transition-all ${
                        isCurrent 
                          ? 'border-zinc-800 bg-zinc-950/40 opacity-40 cursor-not-allowed'
                          : isSelected
                            ? 'border-teal-400 bg-teal-500/10 text-white shadow-md shadow-teal-500/10 scale-102 font-bold'
                            : 'border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 font-medium'
                      }`}
                    >
                      <img src={item.avatar} alt={item.creator} className="w-5 h-5 rounded-full border border-white/10 shrink-0" />
                      <span className="text-[9px] font-bold truncate w-full">{item.creator}</span>
                      <span className="text-[7px] font-mono opacity-80 truncate w-full leading-tight">{item.song.split('-')[0].trim()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deck Crossfader Controls */}
            {targetTrackIdx !== null ? (
              <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-3 flex flex-col gap-2.5">
                
                {/* Dynamic Waveform Simulation */}
                <div className="flex items-center gap-1 justify-between text-[8px] font-mono text-zinc-500">
                  <div className="flex flex-col gap-0.5 items-start shrink-0">
                    <span className="text-emerald-400 font-extrabold">DECK A (LIVE)</span>
                    <span className="truncate max-w-[80px] font-semibold text-zinc-400">{video.song.split('-')[0]}</span>
                  </div>

                  {/* Visual crossfader graphic indicator */}
                  <div className="flex-1 h-5 relative flex items-center justify-between px-3 gap-0.5 overflow-hidden">
                    {Array.from({ length: 18 }).map((_, i) => {
                      const activeLeft = i < 9;
                      const weightA = activeLeft ? (1 - crossfadeValue / 100) : 0;
                      const weightB = !activeLeft ? (crossfadeValue / 100) : 0;
                      const activeHeightScale = i % 2 === 0 ? 0.35 : 0.75;
                      const pulseScale = mixModeActive ? 1.2 : 1;
                      const heightPct = Math.round((activeLeft ? weightA : weightB) * activeHeightScale * 100 * pulseScale);
                      
                      return (
                        <div 
                          key={i} 
                          className={`flex-1 rounded-full transition-all duration-100 ${
                            activeLeft 
                              ? 'bg-emerald-400' 
                              : 'bg-teal-400'
                          }`}
                          style={{ 
                            height: `${Math.max(4, heightPct)}%`,
                            opacity: activeLeft ? (1 - crossfadeValue / 100) * 0.8 + 0.2 : (crossfadeValue / 100) * 0.8 + 0.2
                          }}
                        />
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-0.5 items-end text-right shrink-0">
                    <span className="text-teal-300 font-extrabold">DECK B (CUE)</span>
                    <span className="truncate max-w-[80px] font-semibold text-zinc-400">
                      {playlist && playlist[targetTrackIdx]?.song.split('-')[0]}
                    </span>
                  </div>
                </div>

                {/* Mixer Crossfader Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[8px] font-mono text-zinc-400 uppercase font-black tracking-widest px-1">
                    <span>CH-A Vol: {Math.round(100 - crossfadeValue)}%</span>
                    <span className="text-amber-400 font-bold bg-amber-500/10 px-1 rounded">DJ CROSSFADER</span>
                    <span>CH-B Vol: {Math.round(crossfadeValue)}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 font-bold font-mono">A</span>
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={crossfadeValue}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCrossfadeValue(val);
                          
                          if (videoRef.current) {
                            videoRef.current.volume = ((100 - val) / 100) * volume;
                          }
                          
                          if (targetAudioRef.current) {
                            targetAudioRef.current.volume = (val / 100) * volume;
                            if (val > 0 && targetAudioRef.current.paused) {
                              targetAudioRef.current.play().catch(() => {});
                            }
                          }
                        }}
                        className="w-full h-2 bg-zinc-850 accent-emerald-500 rounded-full cursor-pointer relative z-10 outline-none"
                      />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/30 z-0 pointer-events-none" />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold font-mono">B</span>
                  </div>
                </div>

                {/* Action Buttons: Auto blend or Commit */}
                <div className="flex gap-2 pt-1 border-t border-white/5">
                  <button
                    type="button"
                    disabled={isCrossfading}
                    onClick={startAutoCrossfade}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isCrossfading ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping shrink-0" />
                        <span>CROSSFADING...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡ AUTO-BLEND DROP (2S)</span>
                      </>
                    )}
                  </button>

                  {crossfadeValue >= 30 && (
                    <button
                      type="button"
                      onClick={commitMixTransition}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-[9px] uppercase font-black border border-white/10 cursor-pointer transition-all flex items-center justify-center gap-1 animate-pulse"
                    >
                      <span>DROP NOW ➔</span>
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="border border-dashed border-zinc-800 py-6 rounded-2xl flex flex-col items-center justify-center text-center p-4 bg-zinc-950/50">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">Queue Target Deck</span>
                <p className="text-[8px] text-zinc-505 max-w-[220px] leading-relaxed font-sans font-medium">
                  Select any artist track above to lock custom deck cues, load the live crossfader, and slide to crossfade audio seamlessly.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Moment Capture Modal Overlay */}
      <AnimatePresence>
        {showMomentModal && capturedMoment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-x-4 top-1/4 bg-zinc-950/95 border border-emerald-500/30 text-white rounded-3xl p-5 shadow-2xl z-50 flex flex-col gap-4 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400 flex items-center gap-1">
                <Timer size={12} /> Moment Captured!
              </span>
              <button 
                type="button" 
                onClick={() => setShowMomentModal(false)}
                className="text-[9px] font-bold text-zinc-400 hover:text-white uppercase"
              >
                Dismiss
              </button>
            </div>

            <div className="space-y-2 text-center py-2">
              <p className="text-xs text-zinc-300">
                You saved a moment at <strong className="text-emerald-400 font-mono text-sm">{capturedMoment.formatted}</strong>!
              </p>
              <p className="text-[10px] text-zinc-500">
                The timestamped deep-link has been copied to your clipboard.
              </p>
            </div>

            <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 font-mono text-[9px] truncate text-zinc-400 select-all flex items-center justify-between gap-2">
              <span className="truncate flex-1">{capturedMoment.link}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(capturedMoment.link).catch(() => {});
                  setShowToast("Deep-link copied to clipboard!");
                  setTimeout(() => setShowToast(null), 2000);
                }}
                className="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-sans font-bold uppercase text-[8px] tracking-wider shrink-0"
              >
                Copy
              </button>
            </div>

            <p className="text-[8px] text-center text-zinc-600 uppercase font-bold tracking-widest">
              Long-press any video at any time to share moments
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-swipe Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              setCountdown(null);
              if (countdownIntervalRef.current) {
                clearTimeout(countdownIntervalRef.current);
              }
              setShowToast("Auto-swipe paused");
              setTimeout(() => setShowToast(null), 2000);
            }}
          >
            <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center max-w-[280px]">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center text-xl font-black text-emerald-400 font-mono mb-4">
                <span className="animate-pulse">{countdown}</span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-wider font-mono">Next Video Is Loading</h4>
              <p className="text-[10px] text-zinc-400 leading-normal mb-4">
                Transitioning automatically to the next stream. Tap anywhere to stay here.
              </p>
              <button
                type="button"
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[9px] uppercase font-mono font-bold tracking-widest border border-white/5 transition-all"
              >
                Cancel Auto-Swipe
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Media Sharing Modal Overlay */}
      <AnimatePresence>
        {showShareMenu && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 bg-zinc-950/98 border-t border-zinc-800 rounded-t-[32px] p-6 shadow-2xl z-50 flex flex-col gap-4 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-1 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-widest font-black text-cyan-400 flex items-center gap-1.5 font-mono">
                <Share2 size={12} /> Share Menu
              </span>
              <button 
                type="button" 
                onClick={() => setShowShareMenu(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all text-center flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            {/* Share Type Selector Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setShareTab('single')}
                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  shareTab === 'single'
                    ? 'bg-zinc-700 text-white shadow-md shadow-black/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🎬 Single Video
              </button>
              <button
                type="button"
                onClick={() => setShareTab('batch')}
                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  shareTab === 'batch'
                    ? 'bg-zinc-700 text-white shadow-md shadow-black/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                📀 Batch Share Favorites {savedVideos && savedVideos.length > 0 && `(${savedVideos.length})`}
              </button>
            </div>

            {shareTab === 'single' ? (() => {
              const baseShareUrl = `${window.location.origin}${window.location.pathname}?video=${video.id}`;
              const shareUrl = shareWithTimestamp 
                ? `${baseShareUrl}&t=${Math.floor(currentTime)}` 
                : baseShareUrl;
              return (
                <>
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <img src={video.avatar} alt={video.creator} className="w-10 h-10 rounded-full border border-white/20" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{video.creator}</h4>
                      <p className="text-[10px] text-zinc-400 truncate">{video.song}</p>
                    </div>
                  </div>

                  {/* Include Timestamp toggle */}
                  <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider font-sans">
                          Include Timestamp
                        </span>
                        <span className="text-[8px] font-mono text-zinc-400">
                          Link starts at timestamp {formatTime(currentTime)}
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={shareWithTimestamp}
                        onChange={(e) => setShareWithTimestamp(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-black peer-checked:after:border-transparent" />
                    </label>
                  </div>

                  {/* Quick Share Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Twitter Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const text = `Check out ${video.creator}'s track "${video.song}" on SonicStream! 🎧🔥`;
                        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
                        setShowShareMenu(false);
                        setShowToast("Opened X/Twitter share dialog!");
                        setTimeout(() => setShowToast(null), 2500);
                      }}
                      className="flex flex-col items-center justify-center p-3.5 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-[#1DA1F2] rounded-2xl transition-all gap-1.5 hover:scale-[1.03]"
                    >
                      <Twitter size={18} />
                      <span className="text-[8px] font-black uppercase tracking-wider">Twitter / X</span>
                    </button>

                    {/* Instagram Story Instruction / Copy button */}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl)
                          .then(() => {
                            setShowToast("Deep-link copied! Paste as a Link Sticker on your Instagram Story 🌟");
                            setTimeout(() => setShowToast(null), 3500);
                          })
                          .catch(() => {
                            setShowToast("Deep link copied!");
                            setTimeout(() => setShowToast(null), 2000);
                          });
                        setShowShareMenu(false);
                      }}
                      className="flex flex-col items-center justify-center p-3.5 bg-[#E1306C]/10 hover:bg-[#E1306C]/20 border border-[#E1306C]/30 text-[#E1306C] rounded-2xl transition-all gap-1.5 hover:scale-[1.03]"
                    >
                      <Instagram size={18} />
                      <span className="text-[8px] font-black uppercase tracking-wider">Instagram</span>
                    </button>

                    {/* Facebook Button */}
                    <button
                      type="button"
                      onClick={() => {
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
                        setShowShareMenu(false);
                        setShowToast("Opened Facebook share dialog!");
                        setTimeout(() => setShowToast(null), 2500);
                      }}
                      className="flex flex-col items-center justify-center p-3.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] rounded-2xl transition-all gap-1.5 hover:scale-[1.03]"
                    >
                      <Facebook size={18} />
                      <span className="text-[8px] font-black uppercase tracking-wider">Facebook</span>
                    </button>

                    {/* SMS / Text Button */}
                    <button
                      type="button"
                      onClick={async () => {
                        const text = `Check out ${video.creator}'s track "${video.song}" on SonicStream! 🎧`;
                        if (typeof navigator !== 'undefined' && navigator.share) {
                          try {
                            await navigator.share({
                              title: `SonicStream - ${video.creator}`,
                              text: text,
                              url: shareUrl,
                            });
                            setShowToast("Shared successfully!");
                            setTimeout(() => setShowToast(null), 2000);
                          } catch {
                            window.open(`sms:?body=${encodeURIComponent(text + '\n' + shareUrl)}`, '_blank');
                          }
                        } else {
                          window.open(`sms:?body=${encodeURIComponent(text + '\n' + shareUrl)}`, '_blank');
                          setShowToast("Opened SMS text options!");
                          setTimeout(() => setShowToast(null), 2500);
                        }
                        setShowShareMenu(false);
                      }}
                      className="flex flex-col items-center justify-center p-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl transition-all gap-1.5 hover:scale-[1.03]"
                    >
                      <MessageSquare size={18} />
                      <span className="text-[8px] font-black uppercase tracking-wider font-sans">SMS / Text</span>
                    </button>

                    {/* Show QR Code Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowShareMenu(false);
                        setShowQrModal(true);
                      }}
                      className="flex flex-col items-center justify-center p-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-2xl transition-all gap-1.5 hover:scale-[1.03]"
                    >
                      <QrCode size={18} />
                      <span className="text-[8px] font-black uppercase tracking-wider font-sans">QR Code</span>
                    </button>

                    {/* Embed Code Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const iframeCode = `<iframe src="${shareUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(iframeCode)
                            .then(() => {
                              setShowToast("Embed iframe code copied to clipboard! Paste it inside your website 🌐");
                              setTimeout(() => setShowToast(null), 3500);
                            })
                            .catch(() => {
                              setShowToast("Failed to copy embed code.");
                              setTimeout(() => setShowToast(null), 2000);
                            });
                        }
                        setShowShareMenu(false);
                      }}
                      className="flex flex-col items-center justify-center p-3.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-2xl transition-all gap-1.5 hover:scale-[1.03]"
                    >
                      <Code size={18} />
                      <span className="text-[8px] font-black uppercase tracking-wider font-sans">Embed iframe</span>
                    </button>
                  </div>

                  {/* Manual Copy Deep Link input field */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Shareable Link</span>
                    <div className="bg-black/50 p-3 rounded-2xl border border-white/5 font-mono text-[9px] text-zinc-300 flex items-center justify-between gap-3">
                      <span className="truncate flex-1 select-all">{shareUrl}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl)
                            .then(() => {
                              setShowToast("Link copied to clipboard!");
                              setTimeout(() => setShowToast(null), 2000);
                            })
                            .catch(() => {});
                          setShowShareMenu(false);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-sans font-black uppercase text-[8px] tracking-wider shrink-0 transition-all hover:scale-[1.02]"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </>
              );
            })() : (() => {
              const favoriteVideos = MOCK_SHORT_VIDEOS.filter(v => savedVideos?.includes(v.id));
              if (favoriteVideos.length === 0) {
                return (
                  <div className="py-8 px-4 text-center text-zinc-500 text-xs font-semibold flex flex-col items-center gap-2">
                    <Bookmark size={24} className="text-zinc-700 animate-pulse" />
                    <span>No saved favorites yet!</span>
                    <p className="text-[10px] text-zinc-600 font-medium max-w-[280px] leading-relaxed">
                      Bookmark some videos from the feed by clicking the ribbon flag icon to build your custom consolidated compilation!
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {compilationUrl ? (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/35 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Disc size={16} className="animate-spin" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-white uppercase tracking-wider leading-none">Compilation Ready!</h4>
                            <p className="text-[9px] text-zinc-400 font-mono font-bold mt-0.5">{selectedBatchIds.length} tracks bundled</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCompilationUrl(null)}
                          className="text-[9px] font-black text-zinc-400 hover:text-white uppercase font-sans tracking-wider bg-white/5 px-2.5 py-1 rounded-lg border border-white/5"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Compilation Quick Share Grid */}
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const text = `🎧 I just compiled a curated list of my top ${selectedBatchIds.length} tracks on SonicStream! Listen together here 📀🚀`;
                            window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(compilationUrl)}&text=${encodeURIComponent(text)}`, '_blank');
                            setShowShareMenu(false);
                            setShowToast("Opened X/Twitter share dialog!");
                            setTimeout(() => setShowToast(null), 2500);
                          }}
                          className="flex flex-col items-center justify-center p-3 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 text-[#1DA1F2] rounded-xl transition-all gap-1 hover:scale-[1.02]"
                        >
                          <Twitter size={16} />
                          <span className="text-[7.5px] font-bold uppercase tracking-wider">Twitter / X</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const text = `Take a listen to my favorite compilation:`;
                            window.open(`sms:?body=${encodeURIComponent(text + '\n' + compilationUrl)}`, '_blank');
                            setShowShareMenu(false);
                            setShowToast("Opened SMS options!");
                            setTimeout(() => setShowToast(null), 2500);
                          }}
                          className="flex flex-col items-center justify-center p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl transition-all gap-1 hover:scale-[1.02]"
                        >
                          <MessageSquare size={16} />
                          <span className="text-[7.5px] font-bold uppercase tracking-wider font-sans">SMS Message</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(compilationUrl)
                              .then(() => {
                                setShowToast("Compilation link copied to clipboard! 📀✨");
                                setTimeout(() => setShowToast(null), 3000);
                              });
                            setShowShareMenu(false);
                          }}
                          className="flex flex-col items-center justify-center p-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-xl transition-all gap-1 hover:scale-[1.02]"
                        >
                          <Copy size={16} />
                          <span className="text-[7.5px] font-bold uppercase tracking-wider">Copy Link</span>
                        </button>
                      </div>

                      {/* Link Copier Bars */}
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <span className="text-[7.5px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Consolidated Shareable Link</span>
                          <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 font-mono text-[9px] text-zinc-300 flex items-center justify-between gap-2">
                            <span className="truncate flex-1 select-all font-mono text-[9px] text-zinc-400">{compilationUrl}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(compilationUrl)
                                  .then(() => {
                                    setShowToast("Compilation link copied!");
                                    setTimeout(() => setShowToast(null), 2000);
                                  });
                              }}
                              className="px-2 py-1 bg-zinc-700 text-white hover:bg-zinc-600 rounded font-sans font-black uppercase text-[7px] tracking-wider transition-all"
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[7.5px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Embed Compilation Player</span>
                          <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 font-mono text-[9px] text-zinc-300 flex items-center justify-between gap-2">
                            <span className="truncate flex-1 font-mono text-[8px] text-zinc-500">
                              {`<iframe src="${compilationUrl}" width="100%" height="800px" ...>`}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const iframeText = `<iframe src="${compilationUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
                                navigator.clipboard.writeText(iframeText)
                                  .then(() => {
                                    setShowToast("Embed player iframe code copied!");
                                    setTimeout(() => setShowToast(null), 2000);
                                  });
                              }}
                              className="px-2 py-1 bg-cyan-500 text-black hover:bg-cyan-400 rounded font-sans font-black uppercase text-[7px] tracking-wider transition-all"
                            >
                              Iframe
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1.5 mb-1.5">
                        <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">
                          Select Favorites to Include ({selectedBatchIds.length} of {favoriteVideos.length} chosen)
                        </span>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedBatchIds.length === favoriteVideos.length) {
                                setSelectedBatchIds([]);
                              } else {
                                setSelectedBatchIds(favoriteVideos.map(v => v.id));
                              }
                            }}
                            className="text-[7.5px] uppercase tracking-wider text-emerald-400 hover:text-emerald-300 font-black font-mono bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-0.5 rounded transition-all cursor-pointer"
                          >
                            {selectedBatchIds.length === favoriteVideos.length ? "Deselect All" : "Select All"}
                          </button>
                        </div>
                      </div>
                      <motion.div 
                        variants={{
                          hidden: { opacity: 0 },
                          show: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.08
                            }
                          }
                        }}
                        initial="hidden"
                        animate="show"
                        className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 font-sans"
                      >
                        {favoriteVideos.map((fVideo) => {
                          const isSelected = selectedBatchIds.includes(fVideo.id);
                          return (
                            <motion.div
                              key={fVideo.id}
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                show: { 
                                  opacity: 1, 
                                  y: 0, 
                                  transition: { 
                                    type: "spring", 
                                    stiffness: 400, 
                                    damping: 28 
                                  } 
                                }
                              }}
                              whileTap={{ scale: 0.97 }}
                              whileHover={{ scale: 1.01 }}
                              onClick={() => {
                                setSelectedBatchIds(prev => 
                                  prev.includes(fVideo.id) 
                                    ? prev.filter(id => id !== fVideo.id) 
                                    : [...prev, fVideo.id]
                                );
                              }}
                              className={`p-2 rounded-xl border transition-all duration-205 flex items-center justify-between cursor-pointer ${
                                isSelected 
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                                  : 'bg-zinc-900/40 border-zinc-900/60 text-zinc-400 hover:border-zinc-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <motion.input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // Click handled by parent div
                                  animate={{ scale: isSelected ? 1.15 : 1.0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                  className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 shrink-0 bg-zinc-900 pointer-events-none"
                                />
                                <img src={fVideo.avatar} alt={fVideo.creator} className="w-6 h-6 rounded-full border border-white/10 shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-[11px] font-bold block truncate text-zinc-200">{fVideo.creator}</span>
                                  <span className="text-[9px] font-mono italic truncate block max-w-[170px] text-zinc-400">{fVideo.song}</span>
                                </div>
                              </div>
                              <span className="text-[8px] uppercase tracking-wider font-mono text-zinc-600 px-1.5 py-0.5 bg-black/30 rounded-md">
                                ID: {fVideo.id}
                              </span>
                            </motion.div>
                          );
                        })}
                      </motion.div>

                      {/* Drag & Drop Reorder Deck */}
                      {selectedBatchIds.length > 0 && (
                        <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold font-mono">
                              📀 compilation sequence (Drag track / use arrows)
                            </span>
                            <span className="text-[8px] text-zinc-500 font-mono font-bold">
                              {selectedBatchIds.length} tracks
                            </span>
                          </div>
                          
                          <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 font-sans">
                            {selectedBatchIds.map((id, index) => {
                              const fVideo = favoriteVideos.find(v => v.id === id);
                              if (!fVideo) return null;
                              return (
                                <motion.div
                                  key={id}
                                  layout
                                  transition={{ type: "spring", stiffness: 550, damping: 30 }}
                                  draggable
                                  onDragStart={(e) => {
                                    setDraggingIndex(index);
                                    e.dataTransfer.effectAllowed = 'move';
                                  }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    if (draggingIndex === null || draggingIndex === index) return;
                                    setSelectedBatchIds(prev => {
                                      const updated = [...prev];
                                      const draggedItem = updated[draggingIndex];
                                      updated.splice(draggingIndex, 1);
                                      updated.splice(index, 0, draggedItem);
                                      return updated;
                                    });
                                    setDraggingIndex(null);
                                  }}
                                  className={`p-2 rounded-xl border bg-black/40 border-white/5 text-zinc-300 flex items-center justify-between cursor-grab active:cursor-grabbing transition-all ${
                                    draggingIndex === index ? 'opacity-40 border-emerald-500/40 border-dashed bg-emerald-500/5' : 'hover:border-zinc-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="p-1 text-zinc-600 hover:text-zinc-400 cursor-grab shrink-0">
                                      <GripVertical size={12} />
                                    </div>
                                    <img src={fVideo.avatar} alt={fVideo.creator} className="w-5 h-5 rounded-full border border-white/10 shrink-0" />
                                    <div className="min-w-0">
                                      <span className="text-[10px] font-bold block truncate text-zinc-200 leading-tight">
                                        {index + 1}. {fVideo.creator}
                                      </span>
                                      <span className="text-[8px] font-mono italic truncate block max-w-[130px] text-zinc-500 leading-none">
                                        {fVideo.song}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Quick Arrow Up/Down buttons for accessible reordering too */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (index === 0) return;
                                        setSelectedBatchIds(prev => {
                                          const updated = [...prev];
                                          const temp = updated[index];
                                          updated[index] = updated[index - 1];
                                          updated[index - 1] = temp;
                                          return updated;
                                        });
                                      }}
                                      className={`p-1 rounded bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-all disabled:opacity-20 disabled:pointer-events-none`}
                                      title="Move Up"
                                    >
                                      <ArrowUp size={10} />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={index === selectedBatchIds.length - 1}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (index === selectedBatchIds.length - 1) return;
                                        setSelectedBatchIds(prev => {
                                          const updated = [...prev];
                                          const temp = updated[index];
                                          updated[index] = updated[index + 1];
                                          updated[index + 1] = temp;
                                          return updated;
                                        });
                                      }}
                                      className={`p-1 rounded bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-all disabled:opacity-20 disabled:pointer-events-none`}
                                      title="Move Down"
                                    >
                                      <ArrowDown size={10} />
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={selectedBatchIds.length === 0}
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/video/compilations', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ trackIds: selectedBatchIds })
                            });
                            if (!response.ok) throw new Error('API creation failed');
                            const data = await response.json();
                            const urlDir = `${window.location.origin}${window.location.pathname}?compilation_id=${data.id}`;
                            setCompilationUrl(urlDir);
                          } catch (err) {
                            console.warn('API error when generating compilation, falling back to local query param:', err);
                            const idsStr = selectedBatchIds.join(',');
                            const urlDir = `${window.location.origin}${window.location.pathname}?compilation=${idsStr}`;
                            setCompilationUrl(urlDir);
                          }
                          try {
                            if (video) {
                              video.shares += 1; // Pure design confirmation feedback increments
                            }
                          } catch {
                            // Safe fallback
                          }
                        }}
                        className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-sans font-black uppercase text-[10px] tracking-wider transition-all duration-300 ${
                          selectedBatchIds.length === 0 
                            ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-black hover:opacity-95 shadow-lg active:scale-[0.99] hover:scale-[1.01]'
                        }`}
                      >
                        <Disc size={13} className={selectedBatchIds.length > 0 ? "animate-spin" : ""} />
                        Generate Compilation Link ({selectedBatchIds.length} Selected)
                      </button>
                    </>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal Overlay */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-x-4 top-[15%] bg-zinc-950/98 border border-amber-500/30 text-white rounded-[32px] p-6 shadow-2xl z-50 flex flex-col gap-4 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-widest font-black text-amber-400 flex items-center gap-1.5 font-mono">
                <QrCode size={12} /> Scan QR Code
              </span>
              <button 
                type="button" 
                onClick={() => setShowQrModal(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all text-center flex items-center justify-center cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4 bg-black/40 rounded-2xl border border-white/5 gap-3">
              <div 
                id="qr-printable-container" 
                className={`p-4 rounded-2xl shadow-xl relative flex flex-col items-center justify-center gap-3 overflow-hidden transition-all duration-300 w-60 ${
                  qrHighContrast 
                    ? 'bg-zinc-950 text-white border border-zinc-800' 
                    : 'bg-white text-zinc-900 border border-zinc-200'
                }`}
              >
                {/* QR Canvas absolute positioning container */}
                <div 
                  className="relative w-44 h-44 flex items-center justify-center overflow-hidden rounded-lg cursor-help transition-all duration-300"
                  onMouseEnter={() => setQrHovered(true)}
                  onMouseLeave={() => setQrHovered(false)}
                >
                  <canvas 
                    ref={qrCanvasRef}
                    className="w-44 h-44 rounded-lg select-none"
                  />
                  {/* Center overlay of Creator avatar */}
                  <div className={`absolute w-10 h-10 ${qrHighContrast ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} rounded-full p-0.5 flex items-center justify-center shadow-md border`}>
                    <img 
                      src={video.avatar} 
                      alt={video.creator} 
                      className="w-9 h-9 rounded-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Dynamic 'How to Scan' Instructional Tooltip on Hover */}
                  <AnimatePresence>
                    {qrHovered && testScanStatus === 'idle' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 p-3 flex flex-col items-center justify-center text-center gap-2 select-none"
                      >
                        <div className="p-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400">
                          <Camera size={18} className="animate-pulse" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-white">How to Scan</span>
                          <p className="text-[9px] font-sans text-grey-200 leading-tight px-1 font-medium">
                            Open your phone's camera app & aim it at this code to view the stream instantly!
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Persistent Scan Count Badge */}
                  {scanCount > 0 && (
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute top-2 right-2 bg-zinc-900 border border-emerald-500/40 text-emerald-400 text-[8px] font-mono uppercase font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-40 select-none"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Scans: {scanCount}</span>
                    </motion.div>
                  )}

                  {/* Scan Simulator Overlay */}
                  <AnimatePresence>
                    {testScanStatus === 'scanning' && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-2 rounded-lg animate-fade-in z-20"
                      >
                        {/* Laser scanning line */}
                        <motion.div 
                          animate={{ top: ['10%', '90%', '10%'] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] z-10"
                        />
                        <div className="bg-black/80 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5 backdrop-blur-sm z-20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase font-black">
                            Analyzing...
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {testScanStatus === 'success' && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="absolute inset-0 bg-emerald-950/95 flex flex-col items-center justify-center gap-2 p-2 rounded-lg border-2 border-emerald-500 z-30"
                      >
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.2, 1] }}
                          transition={{ duration: 0.4 }}
                        >
                          <CheckCircle2 size={36} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                        </motion.div>
                        <span className="text-[11px] text-white font-mono tracking-widest uppercase font-black text-center px-1">
                          Scan Verified!
                        </span>
                        <span className="text-[8px] text-emerald-400 font-mono text-center opacity-80 uppercase leading-none">
                          Reliability 100%
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Animated Upward Direction Indicator for Scanning */}
                <div className={`flex flex-col items-center justify-center -mt-1.5 py-0.5 select-none pointer-events-none w-full border-b border-dashed ${
                  qrHighContrast ? 'border-zinc-800 text-zinc-400' : 'border-zinc-100 text-zinc-500'
                }`}>
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                    className="flex items-center gap-1"
                  >
                    <ArrowUp size={11} className="text-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-mono uppercase tracking-wider font-extrabold">
                      This Side Up
                    </span>
                  </motion.div>
                </div>

                {/* High Contrast / Dark Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setQrHighContrast(!qrHighContrast)}
                  className={`w-full py-1.5 px-3 rounded-xl border flex items-center justify-between text-[10px] font-mono transition-all font-bold select-none cursor-pointer ${
                    qrHighContrast 
                      ? 'bg-zinc-900 hover:bg-zinc-805 text-zinc-300 border-zinc-800' 
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Sliders size={11} className={qrHighContrast ? 'text-amber-400' : 'text-zinc-500'} />
                    {qrHighContrast ? 'Contrast Mode' : 'Standard Mode'}
                  </span>
                  <div className={`w-6 h-3.5 rounded-full p-0.5 transition-colors duration-200 ${qrHighContrast ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform duration-200 transform ${qrHighContrast ? 'translate-x-2.5' : 'translate-x-0'}`} />
                  </div>
                </button>

                {/* Persistent Copy Stream URL Button */}
                <button
                  type="button"
                  onClick={() => {
                    const qrLink = `${window.location.origin}${window.location.pathname}?video=${video.id}`;
                    navigator.clipboard.writeText(qrLink).then(() => {
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }).catch(err => {
                      console.error("Failed to copy stream Link:", err);
                    });
                  }}
                  className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-mono tracking-wider uppercase font-extrabold transition-all duration-200 cursor-pointer ${
                    copiedLink
                      ? 'bg-zinc-700 hover:bg-zinc-600 text-white border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : qrHighContrast
                        ? 'bg-white hover:bg-zinc-100 text-white border-white'
                        : 'bg-zinc-950 hover:bg-zinc-900 text-white border-zinc-900'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 size={12} className="text-white shrink-0 animate-bounce" />
                      <span>Copied Stream!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} className="shrink-0" />
                      <span>Copy Stream URL</span>
                    </>
                  )}
                </button>
              </div>

              {testScanStatus === 'idle' ? (
                <button
                  id="test-scan-btn"
                  type="button"
                  onClick={() => {
                    setTestScanStatus('scanning');
                    setTimeout(() => {
                      setTestScanStatus('success');
                      setScanCount(prev => prev + 1);
                      setTimeout(() => {
                        setTestScanStatus('idle');
                      }, 2500);
                    }, 2000);
                  }}
                  className="px-3 py-1 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 rounded-xl text-[9px] uppercase font-bold tracking-widest text-zinc-300 hover:text-emerald-400 transition-all cursor-pointer flex items-center gap-1 font-mono"
                >
                  <Sparkles size={10} className="text-emerald-400" /> Test Scan Diagnostic
                </button>
              ) : (
                <div className="h-5 flex items-center justify-center">
                  <span className="text-[9px] text-emerald-400/80 font-mono tracking-widest uppercase animate-pulse">
                    {testScanStatus === 'scanning' ? 'Running Diagnostic...' : 'Redirection Verification Success'}
                  </span>
                </div>
              )}

              <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest mt-1 text-center font-mono">
                Hold camera up to scan stream
              </p>
            </div>

            {/* Style Presets Selector */}
            <div className="flex flex-col gap-2 bg-gradient-to-br from-zinc-900 to-black/80 p-3.5 rounded-2xl border border-amber-500/10">
              <span className="text-[8px] uppercase tracking-wider font-extrabold text-amber-400 font-mono flex items-center gap-1">
                <Sliders size={10} className="text-amber-500" /> Physical Dot-Pattern Style
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['squared', 'rounded', 'dots'] as const).map((styleOpt) => (
                  <button
                    key={styleOpt}
                    type="button"
                    onClick={() => setQrStyle(styleOpt)}
                    className={`py-2 px-1 rounded-xl border text-[9px] uppercase font-black tracking-widest font-mono transition-all text-center cursor-pointer ${
                      qrStyle === styleOpt
                        ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    {styleOpt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
                <img src={video.avatar} alt={video.creator} className="w-8 h-8 rounded-full border border-white/10" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{video.creator}</h4>
                  <p className="text-[9px] text-zinc-400 truncate">{video.song}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="qr-download-btn"
                type="button"
                disabled={isDownloadingQr}
                onClick={async () => {
                  setIsDownloadingQr(true);
                  try {
                    // Create high resolution canvas for the branded composite image (512x512)
                    const canvas = document.createElement('canvas');
                    canvas.width = 512;
                    canvas.height = 512;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      // 1. Draw solid pristine background
                      ctx.fillStyle = '#ffffff';
                      ctx.fillRect(0, 0, 512, 512);

                      // 2. Render base QR Code locally (offline-compatible, secure, lag-free)
                      const qrLink = `${window.location.origin}${window.location.pathname}?video=${video.id}`;
                      const qr = QRCode.create(qrLink, { errorCorrectionLevel: 'H' });
                      const size = qr.modules.size;
                      const margin = 36;
                      const cellSize = (512 - 2 * margin) / size;

                      ctx.fillStyle = '#09090b';
                      for (let r = 0; r < size; r++) {
                        for (let c = 0; c < size; c++) {
                          const isDark = qr.modules.get 
                            ? qr.modules.get(r, c) 
                            : qr.modules.data[r * size + c];
                            
                          if (isDark) {
                            const x = margin + c * cellSize;
                            const y = margin + r * cellSize;
                            
                            ctx.beginPath();
                            if (qrStyle === 'dots') {
                              ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.44, 0, 2 * Math.PI);
                              ctx.fill();
                            } else if (qrStyle === 'rounded') {
                              const radius = cellSize * 0.35;
                              if (ctx.roundRect) {
                                ctx.roundRect(x, y, cellSize, cellSize, radius);
                              } else {
                                ctx.rect(x, y, cellSize, cellSize);
                              }
                              ctx.fill();
                            } else {
                              // Squared
                              ctx.fillRect(x, y, cellSize, cellSize);
                            }
                          }
                        }
                      }

                      // 3. Render circular white background for branding badge in the center
                      ctx.beginPath();
                      ctx.arc(256, 256, 56, 0, 2 * Math.PI);
                      ctx.fillStyle = '#ffffff';
                      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                      ctx.shadowBlur = 12;
                      ctx.shadowOffsetX = 0;
                      ctx.shadowOffsetY = 6;
                      ctx.fill();
                      ctx.shadowColor = 'transparent'; // reset shadow

                      // 4. Render artist avatar image as central branding overlay
                      const avatarImg = new Image();
                      avatarImg.crossOrigin = "anonymous";
                      avatarImg.src = video.avatar;

                      try {
                        await new Promise((resolve) => {
                          avatarImg.onload = resolve;
                          avatarImg.onerror = resolve; // proceed even on CORS failure to complete download
                        });

                        if (avatarImg.complete && avatarImg.naturalWidth > 0) {
                          ctx.save();
                          ctx.beginPath();
                          ctx.arc(256, 256, 48, 0, 2 * Math.PI);
                          ctx.clip();
                          ctx.drawImage(avatarImg, 208, 208, 96, 96);
                          ctx.restore();
                        }
                      } catch (avErr) {
                        console.warn("Could not composite avatar into downloadable GCS QR code cleanly due to CORS limitations:", avErr);
                      }

                      // Convert canvas to blob and download
                      canvas.toBlob((blob) => {
                        if (blob) {
                          const blobUrl = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.id = "tmp-qr-download-anchor";
                          link.href = blobUrl;
                          link.download = `sonicstream_qr_${video.id}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(blobUrl);
                        }
                      }, 'image/png');
                    } else {
                      throw new Error("Could not acquire 2D canvas context");
                    }

                    setShowToast("QR code downloaded successfully!");
                    setTimeout(() => setShowToast(null), 2500);

                    // 5. Trigger browser native print dialog specific to the QR code element
                    try {
                      const printStyle = document.createElement('style');
                      printStyle.id = "qr-print-media-block";
                      printStyle.innerHTML = `
                        @media print {
                          body * {
                            display: none !important;
                          }
                          html, body {
                            background: white !important;
                            color: black !important;
                            margin: 0 !important;
                            padding: 0 !important;
                          }
                          #qr-printable-container, #qr-printable-container * {
                            display: flex !important;
                            visibility: visible !important;
                          }
                          #qr-printable-container {
                            position: absolute !important;
                            left: 50% !important;
                            top: 50% !important;
                            transform: translate(-50%, -50%) scale(1.6) !important;
                            border: none !important;
                            box-shadow: none !important;
                            background: white !important;
                            padding: 24px !important;
                          }
                        }
                      `;
                      document.head.appendChild(printStyle);
                      setTimeout(() => {
                        window.print();
                        document.head.removeChild(printStyle);
                      }, 400);
                    } catch (printErr) {
                      console.error("Print dialog launch error:", printErr);
                    }

                  } catch (error) {
                    console.error("Advanced composite download skipped, using simple fallback:", error);
                    // Standard fallback
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=09090b&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?video=${video.id}`)}`;
                    const link = document.createElement('a');
                    link.id = "tmp-qr-fallback-anchor";
                    link.href = qrUrl;
                    link.target = "_blank";
                    link.download = `sonicstream_qr_${video.id}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    setShowToast("Opened QR in fallback view.");
                    setTimeout(() => setShowToast(null), 2000);
                  } finally {
                    setIsDownloadingQr(false);
                  }
                }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl text-[10px] uppercase font-black tracking-widest transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download size={12} className={isDownloadingQr ? "animate-bounce" : ""} />
                {isDownloadingQr ? "Saving..." : "Download & Print"}
              </button>

              <button
                id="qr-copy-btn"
                type="button"
                onClick={() => {
                  const link = `${window.location.origin}${window.location.pathname}?video=${video.id}`;
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(link)
                      .then(() => {
                        setShowToast("Stream link copied!");
                        setTimeout(() => setShowToast(null), 2000);
                      })
                      .catch(() => {});
                  }
                  setShowQrModal(false);
                }}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] uppercase font-black tracking-widest transition-all hover:scale-[1.02] cursor-pointer border border-white/10"
              >
                Copy Link
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- MOCK SUBCOMPONENTS AND VIEWS ---

interface FeedViewProps {
  onOpenComments: (videoId: number) => void;
  savedVideos: number[];
  onToggleSave: (id: number) => void;
  currentIdx: number;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  videos?: ShortVideo[];
  compilationMode?: boolean;
  onExitCompilation?: () => void;
  powerSaveMode?: boolean;
}

const FeedView = ({ onOpenComments, savedVideos, onToggleSave, currentIdx, setCurrentIdx, videos, compilationMode, onExitCompilation, powerSaveMode = false }: FeedViewProps) => {
  // Check for deep link on mount
  const [initialTime, setInitialTime] = useState<number | undefined>(undefined);
  const [direction, setDirection] = useState<number>(1); // 1 = slide up (next), -1 = slide down (prev)

  const playlist = videos || MOCK_SHORT_VIDEOS;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const videoParam = params.get('video');
    const timeParam = params.get('t');
    
    if (videoParam) {
      const vidId = parseInt(videoParam, 10);
      const index = playlist.findIndex(v => v.id === vidId);
      if (index !== -1) {
        setDirection(index > currentIdx ? 1 : -1);
        setCurrentIdx(index);
      }
    }
    if (timeParam) {
      const seconds = parseFloat(timeParam);
      if (!isNaN(seconds)) {
        setInitialTime(seconds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCurrentIdx, playlist]);

  // Detect vertical swipe gestures to change mock short videos
  const handlePanEnd = (_: any, info: any) => {
    const thresholdY = 50;
    if (info.offset.y < -thresholdY) {
      // Swipe UP -> Next video (slide-up transition)
      setDirection(1);
      setCurrentIdx((prevIdx) => (prevIdx + 1) % playlist.length);
    } else if (info.offset.y > thresholdY) {
      // Swipe DOWN -> Prev video (slide-down transition)
      setDirection(-1);
      setCurrentIdx((prevIdx) => (prevIdx - 1 + playlist.length) % playlist.length);
    }
  };

  const handleDotClick = (idx: number) => {
    if (idx === currentIdx) return;
    setDirection(idx > currentIdx ? 1 : -1);
    setCurrentIdx(idx);
  };

  // Premium transition variants matching professional mobile feeds
  const slideVariants = {
    initial: (dir: number) => ({
      y: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.98,
    }),
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      y: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.98,
    }),
  };

  const slideTransition = {
    type: "spring",
    stiffness: 280,
    damping: 30,
    mass: 0.8,
    opacity: { duration: 0.2 },
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 select-none relative">
      {/* Dynamic Overlay Floating Compilation Progress Badge */}
      {compilationMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/80 backdrop-blur-md border border-emerald-500/30 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] uppercase font-black tracking-widest text-emerald-400 max-w-[130px] truncate font-mono">
            Comp: {currentIdx + 1} / {playlist.length}
          </span>
          <button
            type="button"
            onClick={() => {
              if (onExitCompilation) {
                onExitCompilation();
              }
            }}
            className="text-[8px] bg-white/10 hover:bg-white/20 text-white font-black px-1.5 py-0.5 rounded uppercase border border-white/5 transition-all shrink-0 font-mono"
          >
            Exit
          </button>
        </div>
      )}

      {/* Pan-detectable vertical swipe video container */}
      <motion.div 
        className="flex-1 relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onPanEnd={handlePanEnd}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIdx}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={slideTransition as any}
            className="absolute inset-0 w-full h-full"
          >
            <ShortPlayItem 
              video={playlist[currentIdx]} 
              isActive={true}
              onOpenComments={onOpenComments}
              isSaved={savedVideos.includes(playlist[currentIdx]?.id)}
              onToggleSave={onToggleSave}
              initialTime={initialTime}
              onVideoEnded={() => {
                setDirection(1);
                setCurrentIdx((prevIdx) => (prevIdx + 1) % playlist.length);
              }}
              savedVideos={savedVideos}
              powerSaveMode={powerSaveMode}
              playlist={playlist}
              currentIdx={currentIdx}
              setCurrentIdx={setCurrentIdx}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Scrolling Down Buttons */}
      <div className="absolute right-4 top-24 flex flex-col gap-2 z-20">
        {playlist.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleDotClick(idx)}
            className={`w-2.5 h-10 rounded-full transition-all border ${
              currentIdx === idx 
                ? "bg-emerald-400 border-emerald-400 scale-110 shadow-lg shadow-emerald-400/20" 
                : "bg-white/10 hover:bg-white/30 border-white/10"
            }`}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const LiveRoomsView = () => {
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([
    { user: 'HypeMaster', msg: 'This is the modular synth peak! 🔥' },
    { user: 'Solfeggio9', msg: 'Is this broadcast live from Berlin?' },
    { user: 'VibeCheck_99', msg: 'Bass is ridiculously tidy and warm' }
  ]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatLog([...chatLog, { user: 'You', msg: chatInput }]);
    setChatInput('');
  };

  return (
    <div className="p-5 space-y-6 overflow-y-auto h-full bg-zinc-950 text-white select-none">
      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-red-400">Broadcasting</h4>
          <p className="text-[10px] text-zinc-400 mt-0.5">Analog Modular Synthesizer Jam Room #10</p>
        </div>
      </div>

      {/* Loop Waveform Visualizer */}
      <div className="h-28 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-1.5 px-6 shrink-0 relative overflow-hidden">
        {[20, 45, 90, 75, 55, 30, 60, 40, 85, 95, 35, 75, 50, 82, 38, 55, 70, 92, 22, 60, 45, 80].map((val, idx) => (
          <motion.div 
            key={idx}
            animate={{ height: [`${val * 0.4}%`, `${val * 1.1}%`, `${val * 0.4}%`] }}
            transition={{ duration: 1.5 + (idx % 3) * 0.2, repeat: Infinity }}
            className="w-1.5 rounded-full bg-gradient-to-t from-red-500 via-rose-500 to-amber-500"
          />
        ))}
        <span className="absolute bottom-2 right-3 text-[8px] uppercase tracking-widest text-[#FFF] font-black font-mono">109 listeners online</span>
      </div>

      {/* Chat logs */}
      <div className="flex-1 flex flex-col gap-2 min-h-[220px]">
        <h5 className="text-[10px] tracking-widest uppercase text-zinc-500 font-black">Live Chatfeed</h5>
        <div className="flex-1 bg-black/50 p-4 rounded-2xl border border-white/5 space-y-3 overflow-y-auto max-h-[280px]">
          {chatLog.map((log, idx) => (
            <div key={idx} className="text-xs">
              <span className={`font-mono font-bold mr-1.5 ${log.user === 'You' ? 'text-emerald-400' : 'text-zinc-400'}`}>{log.user}:</span>
              <span className="text-zinc-300 leading-relaxed font-medium">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSendChat} className="flex gap-2 bg-white/5 border border-white/5 p-1 rounded-xl">
        <input 
          placeholder="Message room..." 
          value={chatInput} 
          onChange={(e) => setChatInput(e.target.value)}
          className="flex-1 bg-transparent px-3 text-xs focus:outline-none text-white border-none py-2"
        />
        <button type="submit" className="p-2 bg-red-500 hover:bg-red-400 text-black rounded-lg transition-colors">
          <PaperPlane size={14} />
        </button>
      </form>
    </div>
  );
};

interface CreatorProfileViewProps {
  savedVideosList: ShortVideo[];
  onPlayVideo: (id: number) => void;
  powerSaveMode: boolean;
  onTogglePowerSave: () => void;
}

const CreatorProfileView = ({ savedVideosList, onPlayVideo, powerSaveMode, onTogglePowerSave }: CreatorProfileViewProps) => {
  return (
    <div className="p-5 space-y-6 overflow-y-auto h-full bg-zinc-950 font-sans select-none max-h-[700px]">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative shadow-xl">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop" className="w-20 h-20 rounded-full border border-white/10" alt="avatar" />
          <span className="absolute bottom-0 right-0 p-1.5 bg-zinc-700 rounded-full text-white">
            <CheckCircle2 size={12} />
          </span>
        </div>
        <div>
          <h2 className="text-lg font-black text-white">@synth_collective</h2>
          <p className="text-xs text-zinc-500">Berlin / Electronica • V12 Verified Creator</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <span className="block text-sm font-black font-mono">1.2M</span>
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Monthly</span>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <span className="block text-sm font-black font-mono">24.5K</span>
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Subscribers</span>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <span className="block text-sm font-black font-mono">92%</span>
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Paid Splits</span>
        </div>
      </div>

      {/* Preferences / Power Save settings card */}
      <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-3">
        <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
          <Cpu size={12} className="text-emerald-400" /> System Preferences
        </h4>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white block">Power Save Mode</span>
            <span className="text-[9px] text-zinc-500 block max-w-[200px]">Cap video playback at 30 FPS & pause high-res visualizers</span>
          </div>
          <button 
            onClick={onTogglePowerSave}
            type="button"
            className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${powerSaveMode ? 'bg-emerald-500' : 'bg-zinc-800'}`}
          >
            <div className={`bg-black w-4 h-4 rounded-full shadow-md transform duration-200 ${powerSaveMode ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Favorites / Saved Moments Listing Section */}
      <div className="space-y-3">
        <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
          <Bookmark size={11} className="text-emerald-400 fill-emerald-500/20" /> Saved Favorites ({savedVideosList.length})
        </h3>
        {savedVideosList.length === 0 ? (
          <div className="p-6 bg-black/40 border border-white/5 rounded-2xl text-center text-[11px] text-zinc-500 font-medium">
            No saved videos yet. Click the "Save" bookmark button on any showreel video in your home Feed!
          </div>
        ) : (
          <div className="space-y-2">
            {savedVideosList.map((video) => (
              <div 
                key={video.id}
                onClick={() => onPlayVideo(video.id)}
                className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between hover:border-emerald-500/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={video.avatar} alt={video.creator} className="w-7 h-7 rounded-full border border-white/10 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">{video.creator}</span>
                    <span className="text-[9px] text-zinc-400 font-mono italic truncate block max-w-[180px]">{video.song}</span>
                  </div>
                </div>
                <span className="text-[9px] text-emerald-400 font-mono uppercase bg-zinc-700/10 border border-emerald-500/20 px-2.5 py-1 rounded-full group-hover:bg-zinc-700 group-hover:text-white transition-all shrink-0">
                  PLAY MIX
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Release Catalog</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { tag: 'Solar Flares', streams: '450K streams' },
            { tag: 'Luminous Space', streams: '312K streams' },
            { tag: 'Digital Rebirth', streams: '124K streams' },
            { tag: 'Modular Beats', streams: '900K streams' }
          ].map((t, idx) => (
            <div key={idx} className="bg-black/40 border border-white/5 p-3.5 rounded-xl space-y-1 hover:border-emerald-500/20 transition-all">
              <span className="text-xs font-bold block truncate text-white">{t.tag}</span>
              <span className="text-[9px] text-[#10B981] font-mono uppercase bg-[#10B981]/10 px-1.5 py-0.5 rounded-md w-fit block">{t.streams}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full py-3.5 bg-zinc-700 hover:bg-zinc-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-black/10 transition-colors">
        Edit V12 Bio
      </button>
    </div>
  );
};

const MessagingView = () => {
  return (
    <div className="p-5 space-y-4 overflow-y-auto h-full bg-zinc-950">
      {[
        { name: 'Label Manager (FUGA)', msg: 'Release Package metadata accepted by Spotify.', time: '10:42 AM', unread: true },
        { name: 'DJ Neon Spark', msg: 'Sent you the master split offer 50/50 ownership.', time: 'Yesterday', unread: false },
        { name: 'Vydia Delivery Bot', msg: 'TikTok sync pipeline triggered successfully.', time: 'June 1', unread: false }
      ].map((chat, idx) => (
        <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3 items-center hover:bg-white/10 transition-colors cursor-pointer relative">
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-white uppercase shrink-0">
            {chat.name.substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-xs font-bold text-white truncate">{chat.name}</span>
              <span className="text-[8px] text-zinc-500 font-mono">{chat.time}</span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate pr-4">{chat.msg}</p>
          </div>
          {chat.unread && (
            <span className="absolute right-4 w-2 h-2 bg-emerald-500 rounded-full" />
          )}
        </div>
      ))}
    </div>
  );
};

const CreatorToolsView = () => {
  return (
    <div className="p-5 space-y-6 overflow-y-auto h-full bg-zinc-950 text-white select-none">
      <div className="space-y-1">
        <h3 className="text-sm font-black uppercase text-zinc-400">V12 Creator Console</h3>
        <p className="text-[10px] text-zinc-500">Live operational telemetry & stream distribution monitoring.</p>
      </div>

      {/* Smart metrics widgets */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
          <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-black">Unified Revenue</span>
          <div className="text-xl font-mono font-black text-emerald-400">$4,310.45</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
          <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-black">Quota Usage</span>
          <div className="text-xl font-mono font-black text-white">42 / 500</div>
        </div>
      </div>

      {/* Distribution Status Check */}
      <div className="space-y-3">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-zinc-500">DSP Global Shipments</h4>
        <div className="space-y-2">
          {[
            { store: 'Spotify Music', status: 'Delivered', color: 'text-emerald-400' },
            { store: 'Apple Music', status: 'Delivered', color: 'text-emerald-400' },
            { store: 'TikTok Social Sync', status: 'In Registry', color: 'text-blue-400' }
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-black/40 border border-white/5 rounded-xl text-xs">
              <span className="font-bold">{item.store}</span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${item.color}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
        <div className="flex gap-2">
          <Sparkles size={16} className="text-emerald-400" />
          <h4 className="text-xs font-black text-white uppercase tracking-wider">AI SEO Metadata Optimization</h4>
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed">Instantly optimize titles, tags, and genres for upcoming digital releases via Gemini.</p>
        <button className="w-full py-2 bg-zinc-700 text-white font-black uppercase text-[10px] tracking-widest rounded-lg">Optimize Metadata</button>
      </div>
    </div>
  );
};

const NotificationsView = () => {
  return (
    <div className="p-5 space-y-4 overflow-y-auto h-full bg-zinc-950">
      {[
        { title: 'Payout Settled', desc: 'Master royalties for April ($1,208) deposited.', date: 'Just now', icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        { title: 'Rights Verified', desc: '100% mechanical split verified for "Solar Flares".', date: '3 hours ago', icon: Sparkles, color: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20' },
        { title: 'New Subscriber', desc: 'Alice bought a Pro Creator VIP Fan Membership.', date: '1 day ago', icon: Zap, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
      ].map((n, idx) => (
        <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3 hover:bg-white/10 transition-colors">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${n.color}`}>
            <n.icon size={16} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">{n.title}</h4>
              <span className="text-[8px] text-zinc-500 font-mono">{n.date}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">{n.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const CommerceView = () => {
  const [cart, setCart] = useState(0);

  return (
    <div className="p-5 space-y-5 overflow-y-auto h-full bg-zinc-950 text-white select-none max-h-[700px]">
      <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-2xl">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Merch Shop</h4>
          <p className="text-[10px] text-zinc-400 mt-0.5">V12 Creator exclusive releases.</p>
        </div>
        <div className="bg-zinc-700 text-white font-mono font-black text-xs px-3 py-1.5 rounded-full">
          Cart ({cart})
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { item: 'SonicStream Logo Hoodie', price: '$55.00', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&h=200&fit=crop' },
          { item: 'Modular Synth Vinyl LP', price: '$35.00', img: 'https://images.unsplash.com/photo-1539628399213-d6489e6729e7?w=200&h=200&fit=crop' },
          { item: 'Custom Slipmats Pack', price: '$20.00', img: 'https://images.unsplash.com/photo-1539707132456-a3c44a1afe6f?w=200&h=200&fit=crop' },
          { item: 'Berlin Studio USB Keys', price: '$12.00', img: 'https://images.unsplash.com/photo-1622445262465-2481c4574875?w=200&h=200&fit=crop' }
        ].map((prod, idx) => (
          <div key={idx} className="bg-black/40 border border-white/5 rounded-2xl p-3 space-y-3 flex flex-col justify-between">
            <img src={prod.img} className="w-full aspect-square rounded-xl object-cover" alt="product" />
            <div className="space-y-1">
              <span className="text-[11px] font-bold block truncate text-white">{prod.item}</span>
              <span className="text-xs font-black text-emerald-400 font-mono block">{prod.price}</span>
            </div>
            <button 
              onClick={() => setCart(c => c + 1)}
              className="w-full py-1.5 bg-white hover:bg-zinc-200 text-black font-black uppercase text-[9px] tracking-widest rounded-lg"
            >
              Add To Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const MusicExperienceView = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [vol, setVol] = useState(0.7);

  return (
    <div className="p-5 space-y-6 overflow-y-auto h-full bg-zinc-950 text-white select-none flex flex-col justify-between">
      <div className="space-y-1">
        <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Now Playing</h4>
        <p className="text-[10px] text-zinc-400">Streaming from SonicStream catalog in premium 320kbps format.</p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <motion.div 
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="w-48 h-48 bg-gradient-to-tr from-emerald-500 via-zinc-800 to-black rounded-full border border-white/20 flex items-center justify-center shadow-2xl relative"
        >
          <div className="w-16 h-16 bg-zinc-950 rounded-full border border-white/10" />
        </motion.div>

        <div className="text-center">
          <h2 className="text-base font-black uppercase tracking-tight">Solar Flares (VIP Mix)</h2>
          <p className="text-xs text-zinc-500 font-bold mt-1">@synth_collective</p>
        </div>
      </div>

      {/* Play Controls and custom vol slider */}
      <div className="space-y-4 bg-white/5 border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-black">Controls</span>
          <div className="flex items-center gap-2">
            <Volume2 size={12} className="text-zinc-500" />
            <input 
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={vol}
              onChange={(e) => setVol(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/20 accent-emerald-500 rounded-lg cursor-pointer outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button className="text-zinc-400 hover:text-white"><ChevronLeft size={24} /></button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 bg-zinc-700 hover:bg-zinc-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-black/10 transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <button className="text-zinc-400 hover:text-white"><ChevronRight size={24} /></button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN MOBILE APP CONTAINER ROUTE ---

interface CommentReply {
  id: string;
  user: string;
  avatar: string;
  text: string;
  createdAt: string;
}

interface CommentItem {
  id: string;
  user: string;
  avatar: string;
  text: string;
  createdAt: string;
  replies: CommentReply[];
}

export const MobileApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [powerSaveMode, setPowerSaveMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [commentsVideoId, setCommentsVideoId] = useState<number | null>(null);
  
  const [commentInputStr, setCommentInputStr] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; user: string } | null>(null);

  const [commentsByVideo, setCommentsByVideo] = useState<Record<number, CommentItem[]>>({
    1: [
      {
        id: 'c1-1',
        user: '@fan_coder',
        avatar: 'FC',
        text: 'Incredible ambient vibes',
        createdAt: '2h ago',
        replies: [
          {
            id: 'r1-1',
            user: '@synth_collective',
            avatar: 'SC',
            text: 'Thank you! The analog filter swept really nicely here.',
            createdAt: '1h ago'
          }
        ]
      },
      {
        id: 'c1-2',
        user: '@modular_lover',
        avatar: 'ML',
        text: 'Where of where is this modular kit sold?',
        createdAt: '1h ago',
        replies: []
      }
    ],
    2: [
      {
        id: 'c2-1',
        user: '@berlin_groove',
        avatar: 'BG',
        text: 'The Berlin visual is crisp',
        createdAt: '3h ago',
        replies: []
      },
      {
        id: 'c2-2',
        user: '@dj_spark_fan',
        avatar: 'DS',
        text: 'Pure heat! DJ Spark keeps on dropping bombs.',
        createdAt: '2h ago',
        replies: []
      }
    ],
    3: [
      {
        id: 'c3-1',
        user: '@retro_99',
        avatar: 'R9',
        text: '1999 aesthetic is extremely flawless!',
        createdAt: '5h ago',
        replies: []
      }
    ]
  });

  // Track user-saved bookmark favorite list
  const [savedVideos, setSavedVideos] = useState<number[]>([1]); // default video 1 is pre-favorited
  const [currentIdx, setCurrentIdx] = useState(0);

  const [compilationMode, setCompilationMode] = useState(false);
  const [feedVideos, setFeedVideos] = useState<ShortVideo[]>(MOCK_SHORT_VIDEOS);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchCompilation = async (compilationId: string) => {
      try {
        const response = await fetch(`/api/video/compilations/${compilationId}`);
        if (!response.ok) throw new Error('API retrieval failed');
        const data = await response.json();
        if (data && Array.isArray(data.trackIds)) {
          const ids = data.trackIds.map((id: any) => parseInt(id, 10)).filter(Number.isInteger);
          const matched = ids.map(id => MOCK_SHORT_VIDEOS.find(v => v.id === id)).filter((v): v is ShortVideo => !!v);
          if (matched.length > 0) {
            setFeedVideos(matched);
            setCompilationMode(true);
            setCurrentIdx(0);
          }
        }
      } catch (err) {
        console.error('Failed to load compilation via api', err);
      }
    };

    const params = new URLSearchParams(window.location.search);
    const compIdParam = params.get('compilation_id');
    const compParam = params.get('compilation');

    if (compIdParam) {
      fetchCompilation(compIdParam);
    } else if (compParam) {
      const ids = compParam.split(',').map(s => parseInt(s.trim(), 10)).filter(Number.isInteger);
      const matched = ids.map(id => MOCK_SHORT_VIDEOS.find(v => v.id === id)).filter((v): v is ShortVideo => !!v);
      if (matched.length > 0) {
        setFeedVideos(matched);
        setCompilationMode(true);
        setCurrentIdx(0);
      }
    }
  }, []);

  const handleExitCompilation = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('compilation');
    url.searchParams.delete('compilation_id');
    window.history.replaceState({}, '', url.toString());
    
    setFeedVideos(MOCK_SHORT_VIDEOS);
    setCompilationMode(false);
    setCurrentIdx(0);
  };

  const handleToggleSave = (id: number) => {
    setSavedVideos((prev) => 
      prev.includes(id) ? prev.filter(vidId => vidId !== id) : [...prev, id]
    );
  };

  const handleOpenComments = (id: number) => {
    setCommentsVideoId(id);
    setReplyingTo(null);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInputStr.trim() || commentsVideoId === null) return;
    const currentList = commentsByVideo[commentsVideoId] || [];

    if (replyingTo) {
      const updatedList = currentList.map(item => {
        if (item.id === replyingTo.commentId) {
          return {
            ...item,
            replies: [
              ...item.replies,
              {
                id: `rep-${Date.now()}`,
                user: '@user_pioneer',
                avatar: 'UP',
                text: commentInputStr,
                createdAt: 'Just now'
              }
            ]
          };
        }
        return item;
      });
      setCommentsByVideo({
        ...commentsByVideo,
        [commentsVideoId]: updatedList
      });
      setReplyingTo(null);
    } else {
      const newComment: CommentItem = {
        id: `comm-${Date.now()}`,
        user: '@user_pioneer',
        avatar: 'UP',
        text: commentInputStr,
        createdAt: 'Just now',
        replies: []
      };
      setCommentsByVideo({
        ...commentsByVideo,
        [commentsVideoId]: [...currentList, newComment]
      });
    }

    setCommentInputStr('');
  };

  const renderContent = () => {
    const savedVideosList = MOCK_SHORT_VIDEOS.filter(video => savedVideos.includes(video.id));

    switch (activeTab) {
      case 'home':
        return (
          <FeedView 
            onOpenComments={handleOpenComments}
            savedVideos={savedVideos}
            onToggleSave={handleToggleSave}
            currentIdx={currentIdx}
            setCurrentIdx={setCurrentIdx}
            videos={feedVideos}
            compilationMode={compilationMode}
            onExitCompilation={handleExitCompilation}
            powerSaveMode={powerSaveMode}
          />
        );
      case 'discover':
        return <CommerceView />;
      case 'create':
        return <CreatorToolsView />;
      case 'live':
        return <LiveRoomsView />;
      case 'library':
        return <MusicExperienceView />;
      case 'profile':
        return (
          <CreatorProfileView 
            savedVideosList={savedVideosList}
            onPlayVideo={(id) => {
              const idx = MOCK_SHORT_VIDEOS.findIndex(video => video.id === id);
              if (idx !== -1) {
                setCurrentIdx(idx);
                setActiveTab('home');
              }
            }}
            powerSaveMode={powerSaveMode}
            onTogglePowerSave={() => setPowerSaveMode(!powerSaveMode)}
          />
        );
      default:
        return (
          <FeedView 
            onOpenComments={handleOpenComments}
            savedVideos={savedVideos}
            onToggleSave={handleToggleSave}
            currentIdx={currentIdx}
            setCurrentIdx={setCurrentIdx}
            videos={feedVideos}
            compilationMode={compilationMode}
            onExitCompilation={handleExitCompilation}
            powerSaveMode={powerSaveMode}
          />
        );
    }
  };

  return (
    <div className="py-4 md:py-8 bg-zinc-950 flex flex-col items-center justify-center min-h-screen text-white">
      
      {/* Decorative Intro Header explaining control capabilities */}
      <div className="max-w-[430px] w-full text-center px-4 mb-4 space-y-1.5 select-none">
        <div className="flex items-center justify-center gap-2">
          <Smartphone className="text-emerald-400 animate-pulse" size={20} />
          <h1 className="text-lg font-black uppercase tracking-tight text-white leading-none">SonicStream Mobile App</h1>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed font-medium">
          A high-fidelity hardware mockup of the upcoming mobile experience. Experience short clips with custom overlays, play/pause toggles, range volume sliders, and seekable progress timelines.
        </p>
      </div>

      {/* Screen Frame Container */}
      <div className="max-w-[430px] w-full h-[880px] bg-black rounded-[60px] border-[8px] border-zinc-800 overflow-hidden relative shadow-2xl flex flex-col font-sans select-none border-t-[10px] border-b-[10px]">
        
        {/* iOS Dynamic Island Top Bar */}
        <div className="h-10 flex items-center justify-between px-8 pt-3 z-50 bg-black text-white shrink-0">
          <span className="text-[11px] font-mono leading-none font-black text-zinc-300">9:41</span>
          <div className="w-18 h-4.5 bg-zinc-900 rounded-full border border-white/5 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-black rounded-full" />
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <div className="w-4 h-2.5 bg-zinc-700 rounded-md border border-white/30" />
          </div>
        </div>

        {/* Dynamic Nav Header */}
        {activeTab !== 'home' && (
          <div className="p-4 flex items-center justify-between z-50 bg-zinc-950 border-b border-white/5 shrink-0">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">SonicStream</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowMessaging(true)}
                className="relative p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"
                title="Open Chat"
              >
                <MessageCircle size={14} />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </button>
              <button 
                onClick={() => setShowNotifications(true)}
                className="relative p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"
                title="Notifications"
              >
                <Bell size={14} />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </button>
            </div>
          </div>
        )}

        {/* Main Phone Viewport */}
        <div className="flex-1 relative overflow-hidden">
          {isInitializing ? (
            <div className="absolute inset-0 bg-zinc-950 flex flex-col justify-between p-6 z-40 font-sans">
              {/* Splash top status skeleton */}
              <div className="flex justify-between items-center mt-4 opacity-50">
                <div className="w-16 h-3 bg-zinc-800 rounded animate-pulse" />
                <div className="w-12 h-3 bg-zinc-800 rounded animate-pulse" />
              </div>

              {/* Immersive Splash Logo */}
              <div className="flex flex-col items-center justify-center flex-1 space-y-4">
                <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-3xl flex items-center justify-center border border-emerald-500/30 shadow-2xl relative shadow-emerald-500/10">
                  <span className="animate-ping absolute inline-flex h-12 w-12 rounded-2xl bg-emerald-400/20 opacity-75"></span>
                  <Sparkles size={36} className="text-emerald-400" />
                </div>
                <div className="space-y-1.5 text-center">
                  <h3 className="text-white text-sm font-black tracking-widest uppercase">SONICSTREAM</h3>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[8px] text-zinc-500 font-bold tracking-widest uppercase font-mono">Initializing streams...</p>
                  </div>
                </div>
              </div>

              {/* Bottom mockup skeleton layout */}
              <div className="space-y-3 mb-6">
                <div className="h-2 w-3/4 bg-zinc-800/80 rounded animate-pulse" />
                <div className="h-2 w-1/2 bg-zinc-800/80 rounded animate-pulse" />
                <div className="flex gap-2 pt-2.5">
                  <div className="h-6 w-16 bg-zinc-800/50 rounded-lg animate-pulse" />
                  <div className="h-6 w-12 bg-zinc-800/50 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>

        {/* Tab Navigation Bar */}
        <div className="h-20 bg-black border-t border-white/5 flex items-center justify-around px-2 pb-2 z-50 shrink-0">
          {[
            { id: 'home', icon: Home, label: 'Feed' },
            { id: 'discover', icon: ShoppingBag, label: 'Shop' },
            { id: 'create', icon: PlusCircle, label: 'Create' },
            { id: 'live', icon: Mic, label: 'Live' },
            { id: 'library', icon: Library, label: 'Listen' },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all flex-1 ${activeTab === tab.id ? 'text-emerald-500' : 'text-zinc-500'}`}
              title={tab.label}
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                className={activeTab === tab.id ? 'scale-110' : ''}
              >
                <tab.icon size={18} />
              </motion.div>
              <span className="text-[7px] font-black uppercase tracking-widest leading-none mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* --- OVERLAYS AND SLIDES --- */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-black z-[60] flex flex-col"
            >
              <div className="p-5 flex items-center justify-between border-b border-white/5 bg-zinc-950">
                <button onClick={() => setShowNotifications(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <X size={16} />
                </button>
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Activity Console</h2>
                <div className="w-8" />
              </div>
              <div className="flex-1 overflow-hidden">
                <NotificationsView />
              </div>
            </motion.div>
          )}

          {showMessaging && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-black z-[60] flex flex-col"
            >
              <div className="p-5 flex items-center justify-between border-b border-white/5 bg-zinc-950">
                <button onClick={() => setShowMessaging(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <X size={16} />
                </button>
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Collaborator Messages</h2>
                <div className="w-8" />
              </div>
              <div className="flex-1 overflow-hidden">
                <MessagingView />
              </div>
            </motion.div>
          )}

          {/* Comments Modal / Drawer Overlay */}
          {commentsVideoId !== null && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 h-[65%] bg-zinc-900 border-t border-white/15 rounded-t-[40px] z-[70] flex flex-col overflow-hidden"
            >
              <div className="p-5 flex items-center justify-between border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Discussion Comments ({
                    (commentsByVideo[commentsVideoId] || []).reduce((count, item) => count + 1 + (item.replies?.length || 0), 0)
                  })
                </h3>
                <button 
                  onClick={() => {
                    setCommentsVideoId(null);
                    setReplyingTo(null);
                  }} 
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Comments Scroller */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {(commentsByVideo[commentsVideoId] || []).map((comm) => (
                  <div key={comm.id} className="space-y-2.5">
                    {/* Parent Comment */}
                    <div className="flex gap-2.5 items-start bg-black/20 p-3 rounded-2xl border border-white/5 group relative">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-bold font-mono text-[10px] uppercase flex items-center justify-center shrink-0">
                        {comm.avatar || 'FA'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-300">{comm.user}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">{comm.createdAt}</span>
                        </div>
                        <p className="text-xs text-white leading-relaxed mt-0.5">{comm.text}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo({ commentId: comm.id, user: comm.user });
                            }}
                            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Replies Thread */}
                    {comm.replies && comm.replies.length > 0 && (
                      <div className="pl-6 ml-3.5 border-l-2 border-white/5 space-y-2.5">
                        {comm.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2.5 items-start bg-white/2 p-2.5 rounded-xl border border-white/5">
                            <div className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 font-bold font-mono text-[8px] uppercase flex items-center justify-center shrink-0 font-bold">
                              {reply.avatar || 'RP'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-zinc-400">{reply.user}</span>
                                <span className="text-[8px] text-zinc-600 font-mono">{reply.createdAt}</span>
                              </div>
                              <p className="text-[11px] text-zinc-200 leading-relaxed mt-0.5">{reply.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Replying Indicator */}
              {replyingTo !== null && (
                <div className="px-5 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">
                    Replying to <span className="text-emerald-400 font-bold font-mono">{replyingTo.user}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Send comment form input */}
              <form onSubmit={handleAddComment} className="p-4 bg-zinc-950 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  placeholder={replyingTo ? `Reply to ${replyingTo.user}...` : "Add a friendly comment..."}
                  value={commentInputStr}
                  onChange={(e) => setCommentInputStr(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button type="submit" className="p-3 bg-zinc-700 text-white hover:bg-zinc-600 rounded-xl transition-all font-black text-xs">
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
