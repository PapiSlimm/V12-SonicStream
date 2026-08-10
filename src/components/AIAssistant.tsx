import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  Image as ImageIcon, 
  Loader2, 
  Bot, 
  User, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Wand2, 
  Download, 
  Play,
  Share2,
  Megaphone,
  Type,
  Layout,
  Music,
  Mic,
  MicOff,
  AlertTriangle,
  RefreshCw,
  FileVideo,
  TrendingUp,
  History,
  Settings2,
  FastForward,
  Video,
  RotateCcw
} from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { db, auth, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';
import { useAuthStore, useChatStore, useAIStore } from '../store/useStore';
import { analytics } from '../lib/analytics';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  isGeneratedImage?: boolean;
  videoUrl?: string;
  audio?: string;
  transcription?: { text: string; startTime: number; endTime: number }[];
}

function VideoPlayer({ url }: { url: string }) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (url.startsWith('blob:')) {
      setVideoSrc(url);
      return;
    }
    const fetchVideo = async () => {
      try {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey || '',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch video');
        const blob = await response.ok ? await response.blob() : null;
        if (blob) {
          setVideoSrc(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error('Video fetch error:', err);
        setError('Failed to load video');
      }
    };

    fetchVideo();
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [url]);

  if (error) return <div className="p-4 bg-v12-red/20 border border-v12-red text-v12-red text-[10px] font-black uppercase tracking-widest">{error}</div>;
  if (!videoSrc) return <div className="p-4 bg-v12-gray-800 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest animate-pulse">Loading Video Stream...</div>;

  return (
    <video 
      src={videoSrc} 
      controls 
      className="w-full h-auto border-2 border-white/20"
    />
  );
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, setMessages, addMessage } = useChatStore();
  const { isProcessing, setIsProcessing, error: aiError, setError: setAiError } = useAIStore();
  const { user, subscriptionStatus, fetchSubscription } = useAuthStore();
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setMessages([{ role: 'assistant', content: "V12 AI ENGINE ONLINE. READY TO ACCELERATE YOUR VISION. PLEASE LOGIN TO ACCESS PERSISTENT CHAT HISTORY." }]);
      return;
    }

    // Fetch history from backend
    const fetchHistory = async () => {
      const { conversationId } = useAIStore.getState();
      const token = useAuthStore.getState().token;
      if (!conversationId || !token) {
        setMessages([{ role: 'assistant', content: "V12 AI ENGINE ONLINE. READY TO ACCELERATE YOUR VISION. I CAN CHAT, ANALYZE IMAGES, GENERATE VISUALS, AND SPEAK." }]);
        return;
      }

      try {
        const response = await fetch(`/api/ai/history/${conversationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
        }
      } catch (err) {
        console.error('Failed to fetch AI history:', err);
      }
    };

    fetchHistory();
  }, [user]);

  const saveMessage = async (msg: Message) => {
    addMessage(msg);
  };

  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState<string>('');
  const [styleTransfer, setStyleTransfer] = useState('');
  const [voiceHistory, setVoiceHistory] = useState<string[]>([]);
  const [showVoiceHistory, setShowVoiceHistory] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('en-US');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isSubscribed = subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || subscriptionStatus === 'admin';

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPlaybackRef = useRef<HTMLAudioElement>(null);

  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [selectedStylePreset, setSelectedStylePreset] = useState('photorealistic');
  const [showGenSuggestions, setShowGenSuggestions] = useState(false);
  const [showCommandAutocomplete, setShowCommandAutocomplete] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const recognitionRef = useRef<any>(null);

  const voices = [
    { id: 'Kore', label: 'Professional (Kore)', mood: 'Balanced' },
    { id: 'Fenrir', label: 'Energetic (Fenrir)', mood: 'High-Energy' },
    { id: 'Puck', label: 'Calm (Puck)', mood: 'Smooth' },
    { id: 'Charon', label: 'Authoritative (Charon)', mood: 'Deep' },
    { id: 'Zephyr', label: 'Friendly (Zephyr)', mood: 'Light' }
  ];

  const stylePresets = [
    { id: 'photorealistic', label: 'Photorealistic' },
    { id: 'cartoon', label: 'Cartoon' },
    { id: 'abstract', label: 'Abstract' },
    { id: 'cyberpunk', label: 'Cyberpunk' },
    { id: 'brutalist', label: 'Brutalist' }
  ];

  const [imageSize, setImageSize] = useState<'512px' | '1K' | '2K' | '4K'>('1K');

  const commands = [
    { name: '/gen', description: 'Generate Image (Supports --negative, --seed, --style)', icon: <Wand2 size={14} /> },
    { name: '/generate-video', description: 'Generate Video', icon: <FileVideo size={14} /> },
    { name: '/summarize-video', description: 'Summarize Video URL', icon: <FileVideo size={14} /> },
    { name: '/social', description: 'Social Post', icon: <Share2 size={14} /> },
    { name: '/marketing', description: 'Marketing Copy', icon: <Megaphone size={14} /> },
    { name: '/draft', description: 'Draft Article', icon: <Type size={14} /> },
    { name: '/predict', description: 'Predictive Analytics', icon: <TrendingUp size={14} /> },
    { name: '/sentiment', description: 'Sentiment Analysis', icon: <Sparkles size={14} /> },
  ];

  const genSuggestions = [
    'futuristic city skyline',
    'abstract audio waves',
    'brutalist tech logo',
    'cyberpunk artist portrait',
    'neon multimedia studio',
    'holographic interface design',
    'V12 SonicStream brand identity',
    'urban multimedia hub',
    'high-speed data visualization'
  ];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.lang = preferredLanguage;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setVoiceHistory(prev => [transcript, ...prev].slice(0, 10));
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setAiError({ 
          message: `VOICE_INPUT_ERROR: ${event.error.toUpperCase()}`,
          action: () => setIsListening(true)
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = preferredLanguage;
    }
  }, [preferredLanguage]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setAiError(null);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      setMessages(prev => [...prev, { role: 'assistant', content: "AUDIO FILE UPLOADED. READY FOR PLAYBACK SYNC." }]);
    }
  };

  const togglePlayback = () => {
    if (audioPlaybackRef.current) {
      if (isPlaying) {
        audioPlaybackRef.current.pause();
      } else {
        audioPlaybackRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioPlaybackRef.current) {
      setCurrentTime(audioPlaybackRef.current.currentTime);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise as string, mimeType: file.type },
    };
  };

  const generateImage = async (prompt: string, overrides?: { negative?: string, seed?: string, style?: string }) => {
    setIsProcessing(true);
    setAiError(null);
    try {
      const neg = overrides?.negative !== undefined ? overrides.negative : negativePrompt;
      const s = overrides?.seed !== undefined ? overrides.seed : seed;
      const st = overrides?.style !== undefined ? overrides.style : styleTransfer;

      const fullPrompt = `High-tech, brutalist, urban multimedia aesthetic, V12 SonicStream brand style, ${selectedStylePreset}: ${prompt}${neg ? ` [NEGATIVE_PROMPT: ${neg}]` : ''}${st ? ` [STYLE_TRANSFER: ${st}]` : ''}${s ? ` [SEED: ${s}]` : ''}`;
      const response = await genAI.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [{ parts: [{ text: fullPrompt }] }],
        config: {
          imageConfig: { 
            aspectRatio: selectedAspectRatio as any,
            imageSize: imageSize
          }
        }
      });

      let imageUrl = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `GENERATED VISUAL FOR: "${prompt.toUpperCase()}"`, 
          image: imageUrl,
          isGeneratedImage: true 
        }]);
      }
    } catch (error: any) {
      console.error('Image Gen Error:', error);
      setAiError({
        message: "IMAGE_GEN_FAILED: THE ENGINE ENCOUNTERED A TURBULENCE.",
        action: () => generateImage(prompt)
      });
      setMessages(prev => [...prev, { role: 'assistant', content: "ERROR: IMAGE GENERATION FAILED. SYSTEM OVERLOAD OR INVALID PROMPT." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = async (text: string, messageId: string, index: number) => {
    if (isSpeaking === messageId) return;
    setIsSpeaking(messageId);
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with a professional, slightly aggressive, high-tech tone: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice as any } }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        audio.playbackRate = playbackRate;
        
        // Update message with audio URL for sync
        const audioBlobUrl = `data:audio/wav;base64,${base64Audio}`;
        setMessages(prev => prev.map((m, i) => i === index ? { ...m, audio: audioBlobUrl } : m));
        
        setAudioUrl(audioBlobUrl);
        setIsPlaying(true);
        
        audio.onended = () => {
          setIsSpeaking(null);
          setIsPlaying(false);
        };
        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
        };
        audio.play();
      } else {
        setIsSpeaking(null);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(null);
    }
  };

  const generateVideo = async (prompt: string) => {
    setIsProcessing(true);
    setAiError(null);
    setMessages(prev => [...prev, { role: 'assistant', content: `INITIALIZING VIDEO GENERATION ENGINE FOR: "${prompt.toUpperCase()}"... THIS MAY TAKE A FEW MOMENTS.` }]);
    
    try {
      let operation = await genAI.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `High-tech, brutalist, urban multimedia aesthetic, V12 SonicStream brand style: ${prompt}`,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await genAI.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `VIDEO GENERATION COMPLETE: "${prompt.toUpperCase()}"`, 
          videoUrl: downloadLink 
        }]);
      }
    } catch (error: any) {
      console.error('Video Gen Error:', error);
      setAiError({
        message: "VIDEO_GEN_FAILED: THE ENGINE OVERHEATED.",
        action: () => generateVideo(prompt)
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setSelectedVideo(URL.createObjectURL(file));
      setMessages(prev => [...prev, { role: 'assistant', content: "VIDEO FILE UPLOADED. READY FOR PREVIEW." }]);
    }
  };

  const handleSend = async () => {
    analytics.track('click', 'ai_assistant_send', { command: input.startsWith('/') ? input.split(' ')[0] : 'chat' });
    if (!isSubscribed) {
      setMessages(prev => [...prev, { role: 'assistant', content: "ACCESS DENIED. AI SERVICES ARE EXCLUSIVE TO SUBSCRIBED USERS. PLEASE UPGRADE YOUR PLAN." }]);
      return;
    }
    if (!input.trim() && !imageFile) return;

    setAiError(null);

    if (input.toLowerCase().startsWith('/generate-video ')) {
      const prompt = input.slice(16);
      await saveMessage({ role: 'user', content: input });
      setInput('');
      await generateVideo(prompt);
      return;
    }

    if (input.toLowerCase().startsWith('/gen ')) {
      let promptText = input.slice(5);
      
      const overrides: { negative?: string, seed?: string, style?: string } = {};
      
      const negativeMatch = promptText.match(/--negative\s+([^--]+)/i);
      const seedMatch = promptText.match(/--seed\s+(\d+)/i);
      const styleMatch = promptText.match(/--style\s+([^--]+)/i);

      if (negativeMatch) {
        overrides.negative = negativeMatch[1].trim();
        promptText = promptText.replace(negativeMatch[0], '').trim();
        setNegativePrompt(overrides.negative);
      }
      if (seedMatch) {
        overrides.seed = seedMatch[1].trim();
        promptText = promptText.replace(seedMatch[0], '').trim();
        setSeed(overrides.seed);
      }
      if (styleMatch) {
        overrides.style = styleMatch[1].trim();
        promptText = promptText.replace(styleMatch[0], '').trim();
        setStyleTransfer(overrides.style);
      }

      await saveMessage({ role: 'user', content: input });
      setInput('');
      setShowGenSuggestions(false);
      await generateImage(promptText, overrides);
      return;
    }

    if (input.toLowerCase().startsWith('/social ') || input.toLowerCase().startsWith('/caption ')) {
      const topic = input.startsWith('/social ') ? input.slice(8) : input.slice(9);
      await saveMessage({ role: 'user', content: input });
      setInput('');
      setIsProcessing(true);
      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: [{ role: 'user', parts: [{ text: `Generate a complete social media post strategy for: "${topic}". 
Include:
1. A catchy headline.
2. 3 variations of engaging captions (Short, Medium, Long).
3. A curated list of 10 relevant hashtags.
4. Strategic use of emojis.
Style: Trendy, High-energy, Professional.
Target: High engagement and shareability.` }] }],
          config: { systemInstruction: "You are V12_AI, a professional, technical, and brutalist multimedia assistant. Your tone is direct, efficient, and high-tech. You specialize in urban multimedia trends, marketing strategy, and content creation." }
        });
        await saveMessage({ role: 'assistant', content: `SOCIAL MEDIA STRATEGY GENERATED:\n\n${response.text}` });
      } catch (e) { console.error(e); } finally { setIsProcessing(false); }
      return;
    }

    if (input.toLowerCase().startsWith('/draft ')) {
      const topic = input.slice(7);
      await saveMessage({ role: 'user', content: input });
      setInput('');
      setIsProcessing(true);
      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: [{ role: 'user', parts: [{ text: `Draft a professional blog post or article about: "${topic}". Include a catchy title, introduction, 3 main points, and a conclusion.` }] }],
          config: { systemInstruction: "You are V12_AI, a professional, technical, and brutalist multimedia assistant. Your tone is direct, efficient, and high-tech. You specialize in urban multimedia trends, marketing strategy, and content creation." }
        });
        await saveMessage({ role: 'assistant', content: `BLOG POST DRAFT GENERATED:\n\n${response.text}` });
      } catch (e) { console.error(e); } finally { setIsProcessing(false); }
      return;
    }

    if (input.toLowerCase().startsWith('/marketing ')) {
      const topic = input.slice(11);
      await saveMessage({ role: 'user', content: input });
      setInput('');
      setIsProcessing(true);
      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: [{ role: 'user', parts: [{ text: `Generate high-converting marketing copy for: "${topic}".
Requirements:
- Use the AIDA (Attention, Interest, Desire, Action) framework.
- Focus heavily on benefits and transformation, not just features.
- Include a clear, punchy Call to Action (CTA).
- Use persuasive, professional, yet high-tech tone.
- Target audience: Independent creators, digital entrepreneurs, and modern businesses.` }] }],
          config: { systemInstruction: "You are V12_AI, a professional, technical, and brutalist multimedia assistant. Your tone is direct, efficient, and high-tech. You specialize in urban multimedia trends, marketing strategy, and content creation." }
        });
        await saveMessage({ role: 'assistant', content: `MARKETING COPY GENERATED:\n\n${response.text}` });
      } catch (e) { 
        console.error(e); 
        await saveMessage({ role: 'assistant', content: "ERROR: MARKETING COPY GENERATION FAILED." });
      } finally { setIsProcessing(false); }
      return;
    }

    if (input.toLowerCase().startsWith('/summarize-video ')) {
      const videoUrl = input.slice(17);
      await saveMessage({ role: 'user', content: input });
      setInput('');
      setIsProcessing(true);
      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ role: 'user', parts: [{ text: `Summarize the content of this video: ${videoUrl}` }] }],
          config: { 
            tools: [{ urlContext: {} }],
            systemInstruction: "You are V12_AI, a professional, technical, and brutalist multimedia assistant. Your tone is direct, efficient, and high-tech. You specialize in urban multimedia trends, marketing strategy, and content creation." 
          }
        });
        await saveMessage({ role: 'assistant', content: `VIDEO SUMMARY GENERATED:\n\n${response.text}` });
      } catch (e) { 
        console.error(e); 
        await saveMessage({ role: 'assistant', content: "ERROR: VIDEO SUMMARIZATION FAILED. ENSURE THE URL IS ACCESSIBLE." });
      } finally { setIsProcessing(false); }
      return;
    }

    if (input.toLowerCase().startsWith('/sentiment ')) {
      const text = input.slice(11);
      await saveMessage({ role: 'user', content: input });
      setInput('');
      setIsProcessing(true);
      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: [{ role: 'user', parts: [{ text: `Analyze the sentiment of the following text and provide a brief summary of the emotional tone (e.g., positive, negative, neutral, mixed): "${text}"` }] }],
          config: { systemInstruction: "You are V12_AI, a professional, technical, and brutalist multimedia assistant. Your tone is direct, efficient, and high-tech. You specialize in urban multimedia trends, marketing strategy, and content creation." }
        });
        await saveMessage({ role: 'assistant', content: `SENTIMENT ANALYSIS REPORT:\n\n${response.text}` });
      } catch (e) { 
        console.error(e); 
        await saveMessage({ role: 'assistant', content: "ERROR: SENTIMENT ANALYSIS FAILED." });
      } finally { setIsProcessing(false); }
      return;
    }

    if (input.toLowerCase().startsWith('/predict ')) {
      const campaign = input.slice(9);
      await saveMessage({ role: 'user', content: input });
      setInput('');
      setIsProcessing(true);
      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: [{ role: 'user', parts: [{ text: `Analyze the following campaign idea and provide predictive analytics (estimated success score, key drivers, and potential risks) based on V12 Multimedia Design Studio's brutalist tech aesthetic: "${campaign}"` }] }],
          config: { systemInstruction: "You are V12_AI, a professional, technical, and brutalist multimedia assistant. Your tone is direct, efficient, and high-tech. You specialize in urban multimedia trends, marketing strategy, and content creation." }
        });
        await saveMessage({ role: 'assistant', content: `PREDICTIVE ANALYTICS REPORT:\n\n${response.text}` });
      } catch (e) { 
        console.error(e); 
        await saveMessage({ role: 'assistant', content: "ERROR: PREDICTIVE ANALYTICS FAILED." });
      } finally { setIsProcessing(false); }
      return;
    }

    const userMessage: Message = { 
      role: 'user', 
      content: input, 
      image: selectedImage || undefined,
      videoUrl: selectedVideo || undefined
    };
    await saveMessage(userMessage);
    setInput('');
    setSelectedImage(null);
    setImageFile(null);
    setSelectedVideo(null);
    setVideoFile(null);
    setIsProcessing(true);

    const { conversationId, setConversationId } = useAIStore.getState();
    const token = useAuthStore.getState().token;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: input,
          conversationId
        })
      });

      if (!response.ok) throw new Error('AI_UPLINK_FAILURE');

      const data = await response.json();
      
      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message.content || "ERROR: NO RESPONSE GENERATED.",
      };
      await saveMessage(assistantMessage);
    } catch (error: any) {
      console.error('AI Error:', error);
      setAiError({
        message: "CONNECTION_FAILURE: THE NEURAL LINK IS UNSTABLE.",
        action: () => handleSend()
      });
      await saveMessage({ role: 'assistant', content: "ERROR: CONNECTION FAILED. PLEASE CHECK YOUR UPLINK AND TRY AGAIN." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-v12-red text-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black logo-glow"
      >
        <Sparkles size={32} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-28 right-8 z-50 w-[400px] h-[650px] bg-v12-gray-900 border-4 border-v12-red shadow-[8px_8px_0px_0px_rgba(239,68,68,0.3)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-v12-red text-white p-4 flex items-center justify-between border-b-4 border-black">
              <div className="flex items-center gap-2">
                <Bot size={24} className="animate-pulse" />
                <span className="font-black uppercase tracking-tighter">V12 AI ENGINE v4.0</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/20 px-2 py-1 border border-white/10">
                  <FastForward size={12} className="text-v12-red" />
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1" 
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-v12-red/30 appearance-none cursor-pointer accent-v12-red"
                  />
                  <span className="text-[8px] font-black w-6">{playbackRate}x</span>
                </div>
                <select 
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="bg-black/20 border border-white/20 text-[10px] font-black uppercase p-1 outline-none"
                >
                  {voices.map((v, idx) => (
                    <option key={idx} value={v.id} className="bg-v12-gray-900">{v.label}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setIsSettingsOpen(true)} 
                  className="p-1 hover:bg-black/20 transition-colors"
                  title="Voice & Language Settings"
                >
                  <Settings2 size={20} />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Settings Modal */}
            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full bg-v12-gray-900 border-4 border-v12-red p-6 shadow-2xl space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2">
                        <Settings2 className="text-v12-red" size={20} />
                        <h3 className="text-lg font-black uppercase tracking-tighter">AI ENGINE SETTINGS</h3>
                      </div>
                      <button onClick={() => setIsSettingsOpen(false)} className="text-v12-gray-400 hover:text-white">
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Preferred Language</label>
                        <select 
                          value={preferredLanguage}
                          onChange={(e) => setPreferredLanguage(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 text-xs font-bold uppercase p-3 outline-none text-white focus:border-v12-red"
                        >
                          <option value="en-US">English (US)</option>
                          <option value="en-GB">English (UK)</option>
                          <option value="es-ES">Spanish (Spain)</option>
                          <option value="fr-FR">French (France)</option>
                          <option value="de-DE">German (Germany)</option>
                          <option value="ja-JP">Japanese</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Voice Model</label>
                        <div className="grid grid-cols-1 gap-2">
                          {voices.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => setSelectedVoice(v.id)}
                              className={cn(
                                "flex items-center justify-between px-4 py-3 border-2 transition-all text-left",
                                selectedVoice === v.id 
                                  ? "bg-v12-red border-v12-red text-white" 
                                  : "bg-white/5 border-white/10 text-v12-gray-400 hover:border-white/30"
                              )}
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-black uppercase">{v.label}</span>
                                <span className="text-[8px] font-bold opacity-70">{v.mood}</span>
                              </div>
                              {selectedVoice === v.id && <Sparkles size={14} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setIsSettingsOpen(false)}
                      className="w-full py-4 bg-v12-red text-white font-black uppercase tracking-[0.2em] text-xs border-2 border-black hover:bg-white hover:text-v12-red transition-all"
                    >
                      Apply Configuration
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-v12-gray-800/50 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setInput('/social ')}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-v12-red text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Share2 size={12} className="text-v12-red" />
                Social Post
              </button>
              <button 
                onClick={() => setInput('/marketing ')}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-v12-red text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Megaphone size={12} className="text-v12-red" />
                Marketing Copy
              </button>
              <button 
                onClick={() => setInput('/draft ')}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-v12-red text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Type size={12} className="text-v12-red" />
                Draft Article
              </button>
              <button 
                onClick={() => setInput('/gen ')}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-v12-red text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Wand2 size={12} className="text-v12-red" />
                Gen Visual
              </button>
              <button 
                onClick={() => setInput('/summarize-video ')}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-v12-red text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <FileVideo size={12} className="text-v12-red" />
                Summarize Video
              </button>
              <button 
                onClick={() => setInput('/generate-video ')}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-v12-red text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Video size={12} className="text-v12-red" />
                Gen Video
              </button>
              <button 
                onClick={() => setInput('/sentiment ')}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-v12-red text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Sparkles size={12} className="text-v12-red" />
                Sentiment
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-6 bg-black/40 scrollbar-thin scrollbar-thumb-v12-red relative">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={cn(
                    "max-w-[90%] p-4 border-2 relative group",
                    msg.role === 'user' 
                      ? 'bg-v12-red text-white border-v12-red' 
                      : 'bg-v12-gray-800 text-white border-white/10'
                  )}>
                    {msg.image && (
                      <div className="relative mb-3">
                        <img src={msg.image} alt="Visual" className="w-full h-auto border-2 border-white/20" />
                        {msg.isGeneratedImage && (
                          <a 
                            href={msg.image} 
                            download="v12-ai-gen.png"
                            className="absolute bottom-2 right-2 p-2 bg-black/60 text-white hover:bg-v12-red transition-colors"
                          >
                            <Download size={14} />
                          </a>
                        )}
                      </div>
                    )}
                    {msg.videoUrl && (
                      <div className="relative mb-3">
                        <VideoPlayer url={msg.videoUrl} />
                        <a 
                          href={msg.videoUrl} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2 p-2 bg-black/60 text-white hover:bg-v12-red transition-colors"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    )}
                    <p className="font-bold uppercase tracking-tighter text-sm leading-tight whitespace-pre-wrap">
                      {msg.transcription && isPlaying && audioUrl ? (
                        msg.transcription.map((word, idx) => (
                          <span 
                            key={idx}
                            className={cn(
                              "transition-colors duration-200",
                              currentTime >= word.startTime && currentTime <= word.endTime 
                                ? "text-v12-red bg-white/10" 
                                : ""
                            )}
                          >
                            {word.text}{' '}
                          </span>
                        ))
                      ) : (
                        msg.content
                      )}
                    </p>
                    
                    {msg.role === 'assistant' && !msg.isGeneratedImage && !msg.videoUrl && (
                      <button 
                        onClick={() => speakText(msg.content, i.toString(), i)}
                        className={cn(
                          "absolute -bottom-3 -right-3 w-8 h-8 bg-v12-red text-white flex items-center justify-center border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity",
                          isSpeaking === i.toString() && "opacity-100 animate-pulse"
                        )}
                      >
                        {isSpeaking === i.toString() ? <Volume2 size={14} /> : <Play size={14} />}
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest opacity-50 text-v12-gray-400">
                    {msg.role === 'user' ? <><User size={10} /> YOU</> : <><Bot size={10} /> V12_AI</>}
                  </div>
                </div>
              ))}
              
              {/* Audio Playback Sync Section */}
              {audioUrl && (
                <div className="glass-card p-4 border-v12-red/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music size={16} className="text-v12-red" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Playback Sync Engine</span>
                    </div>
                    <button onClick={() => { setAudioUrl(null); setAudioFile(null); }} className="text-v12-gray-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                  
                  {/* Mock Waveform */}
                  <div className="h-12 flex items-end gap-1 px-2">
                    {[...Array(30)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          height: isPlaying ? [4, Math.random() * 40 + 4, 4] : 4
                        }}
                        transition={{ 
                          duration: 0.5 + Math.random(), 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-1 bg-v12-red/50 rounded-full"
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={togglePlayback}
                      className="w-10 h-10 bg-v12-red text-white flex items-center justify-center border-2 border-black"
                    >
                      {isPlaying ? <VolumeX size={18} /> : <Play size={18} />}
                    </button>
                    <div className="flex-grow h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: isPlaying ? ['-100%', '0%'] : '-100%' }}
                        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
                        className="h-full bg-v12-red w-full"
                      />
                    </div>
                  </div>
                  <audio 
                    ref={audioPlaybackRef} 
                    src={audioUrl} 
                    className="hidden" 
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              )}

              {aiError && (
                <div className="p-4 bg-v12-red/20 border-2 border-v12-red flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-v12-red text-[10px] font-black uppercase tracking-widest">
                    <AlertTriangle size={16} />
                    {aiError.message}
                  </div>
                  {aiError.action && (
                    <button 
                      onClick={aiError.action}
                      className="p-2 bg-v12-red text-white hover:bg-white hover:text-v12-red transition-colors"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2 text-v12-red font-black uppercase tracking-widest text-xs">
                  <Loader2 className="animate-spin" size={16} />
                  PROCESSING_REQUEST...
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t-4 border-black bg-v12-gray-900 relative">
              {showCommandAutocomplete && (
                <div className="absolute bottom-full left-4 right-4 bg-v12-gray-800 border-2 border-v12-red p-2 mb-2 shadow-xl z-[60] max-h-48 overflow-y-auto">
                  <p className="text-[10px] font-black uppercase tracking-widest text-v12-red mb-2">Available Commands:</p>
                  <div className="space-y-1">
                    {commands.filter(c => c.name.startsWith(input)).map((c, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { setInput(`${c.name} `); setShowCommandAutocomplete(false); }}
                        className="w-full flex items-center justify-between text-[10px] font-bold uppercase bg-white/5 border border-white/10 px-3 py-2 hover:bg-v12-red transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {c.icon}
                          <span>{c.name}</span>
                        </div>
                        <span className="text-v12-gray-400 text-[8px]">{c.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {showGenSuggestions && input.toLowerCase().startsWith('/gen ') && (
                <div className="absolute bottom-full left-4 right-4 bg-v12-gray-800 border-2 border-v12-red p-2 mb-2 shadow-xl z-[60]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-v12-red mb-2">Suggested Themes:</p>
                  <div className="flex flex-wrap gap-2">
                    {genSuggestions.map((s, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { setInput(`/gen ${s}`); setShowGenSuggestions(false); }}
                        className="text-[9px] font-bold uppercase bg-white/5 border border-white/10 px-2 py-1 hover:bg-v12-red transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedImage && (
                <div className="relative inline-block mb-4">
                  <img src={selectedImage} alt="Preview" className="w-20 h-20 object-cover border-2 border-v12-red" />
                  <button 
                    onClick={() => { setSelectedImage(null); setImageFile(null); }}
                    className="absolute -top-2 -right-2 bg-v12-red text-white p-1 border-2 border-black"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {input.toLowerCase().startsWith('/gen ') && (
                <div className="mb-4 grid grid-cols-2 gap-4 p-3 bg-white/5 border border-white/10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Aspect Ratio</label>
                    <div className="flex gap-2">
                      {['1:1', '16:9', '9:16'].map(ratio => (
                        <button
                          key={ratio}
                          onClick={() => setSelectedAspectRatio(ratio)}
                          className={cn(
                            "px-2 py-1 text-[10px] font-bold border transition-all",
                            selectedAspectRatio === ratio ? "bg-v12-red border-v12-red text-white" : "border-white/10 text-v12-gray-400 hover:border-white/30"
                          )}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Style Preset</label>
                    <select
                      value={selectedStylePreset}
                      onChange={(e) => setSelectedStylePreset(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 text-[10px] font-bold uppercase p-1 outline-none text-white"
                    >
                      {stylePresets.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Negative Prompt</label>
                    <input 
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="EXCLUDE: BLURRY, LOW_RES, DISTORTED..."
                      className="w-full bg-black/40 border border-white/10 text-[10px] font-bold uppercase p-2 outline-none text-white focus:border-v12-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Seed Value</label>
                    <input 
                      type="text"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="RANDOM"
                      className="w-full bg-black/40 border border-white/10 text-[10px] font-bold uppercase p-2 outline-none text-white focus:border-v12-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Style Transfer</label>
                    <input 
                      type="text"
                      value={styleTransfer}
                      onChange={(e) => setStyleTransfer(e.target.value)}
                      placeholder="ARTIST_NAME OR STYLE..."
                      className="w-full bg-black/40 border border-white/10 text-[10px] font-bold uppercase p-2 outline-none text-white focus:border-v12-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Image Size</label>
                    <div className="flex gap-2">
                      {['512px', '1K', '2K', '4K'].map(size => (
                        <button
                          key={size}
                          onClick={() => setImageSize(size as any)}
                          className={cn(
                            "px-2 py-1 text-[10px] font-bold border transition-all",
                            imageSize === size ? "bg-v12-red border-v12-red text-white" : "border-white/10 text-v12-gray-400 hover:border-white/30"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button 
                      onClick={() => {
                        setNegativePrompt('');
                        setSeed('');
                        setStyleTransfer('');
                        setSelectedAspectRatio('1:1');
                        setImageSize('1K');
                        setSelectedStylePreset('tech');
                      }}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-v12-gray-500 hover:text-v12-red transition-colors"
                    >
                      <RotateCcw size={12} />
                      Reset Parameters
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 border-2 border-white/10 hover:border-v12-red hover:text-v12-red transition-colors text-v12-gray-400"
                    title="Upload Image"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <button 
                    onClick={() => audioInputRef.current?.click()}
                    className="p-3 border-2 border-white/10 hover:border-v12-red hover:text-v12-red transition-colors text-v12-gray-400"
                    title="Upload Audio"
                  >
                    <Music size={20} />
                  </button>
                  <button 
                    onClick={() => videoInputRef.current?.click()}
                    className="p-3 border-2 border-white/10 hover:border-v12-red hover:text-v12-red transition-colors text-v12-gray-400"
                    title="Upload Video"
                  >
                    <Video size={20} />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={toggleListening}
                      className={cn(
                        "p-3 border-2 transition-colors",
                        isListening 
                          ? "bg-v12-red border-v12-red text-white animate-pulse" 
                          : "border-white/10 hover:border-v12-red hover:text-v12-red text-v12-gray-400"
                      )}
                      title={isListening ? "Stop Listening" : "Voice Input"}
                    >
                      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    {voiceHistory.length > 0 && (
                      <button 
                        onClick={() => setShowVoiceHistory(!showVoiceHistory)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-v12-gray-800 border border-v12-red text-v12-red flex items-center justify-center rounded-full hover:bg-v12-red hover:text-white transition-colors"
                      >
                        <History size={10} />
                      </button>
                    )}
                    <AnimatePresence>
                      {showVoiceHistory && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full right-0 mb-2 w-64 bg-v12-gray-800 border-2 border-v12-red p-2 shadow-2xl z-[70]"
                        >
                          <p className="text-[10px] font-black uppercase tracking-widest text-v12-red mb-2 flex items-center justify-between">
                            Voice History
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setVoiceHistory([])}
                                className="text-[8px] hover:text-white transition-colors"
                              >
                                CLEAR
                              </button>
                              <button onClick={() => setShowVoiceHistory(false)}><X size={10} /></button>
                            </div>
                          </p>
                          <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                            {voiceHistory.map((h, idx) => (
                              <div key={idx} className="group flex items-center gap-1">
                                <button 
                                  onClick={() => { setInput(h); setShowVoiceHistory(false); }}
                                  className="flex-grow text-left text-[9px] font-bold uppercase bg-white/5 border border-white/10 px-2 py-1.5 hover:bg-white/10 transition-colors truncate"
                                >
                                  {h}
                                </button>
                                <button 
                                  onClick={() => { setInput(h); handleSend(); setShowVoiceHistory(false); }}
                                  className="p-1.5 bg-v12-red text-white border border-black hover:bg-white hover:text-v12-red transition-all"
                                  title="Resend"
                                >
                                  <RotateCcw size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  accept="image/*" 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  ref={audioInputRef} 
                  onChange={handleAudioSelect} 
                  accept="audio/*" 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  ref={videoInputRef} 
                  onChange={handleVideoSelect} 
                  accept="video/*" 
                  className="hidden" 
                />
                <textarea
                  value={input}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInput(value);
                    
                    if (value.startsWith('/') && !value.includes(' ')) {
                      const matchingCommands = commands.filter(c => c.name.startsWith(value));
                      setShowCommandAutocomplete(matchingCommands.length > 0);
                    } else {
                      setShowCommandAutocomplete(false);
                    }
                    
                    if (value.toLowerCase().startsWith('/gen ')) {
                      setShowGenSuggestions(true);
                    } else {
                      setShowGenSuggestions(false);
                    }
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="TYPE_MESSAGE OR USE QUICK ACTIONS..."
                  className="flex-grow bg-black/40 border-2 border-white/10 p-3 focus:outline-none focus:border-v12-red font-bold uppercase tracking-tighter text-sm resize-none h-24 text-white"
                />
                <button 
                  onClick={handleSend}
                  disabled={isProcessing}
                  className="p-4 bg-v12-red text-white border-2 border-black hover:bg-white hover:text-v12-red transition-all disabled:opacity-50 h-24 flex items-center justify-center"
                >
                  <Send size={24} />
                </button>
              </div>
              <p className="mt-2 text-[8px] font-black text-v12-gray-500 uppercase tracking-widest text-center">
                Commands: /gen, /social, /marketing, /draft, /sentiment, /predict
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
