import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { MediaPlayer } from './MediaPlayer';

export function ServiceVideoSummary() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<{ text: string; start: number; end: number }[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [audioUrl]);

  const generateSummary = async () => {
    setIsLoading(true);
    setStatus('Analyzing V12 Multimedia services...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      // 1. Generate Video with Veo
      setStatus('Generating cinematic service visualization...');
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'A high-tech, cinematic montage of digital marketing, video editing, and creative innovation. Sleek red and dark gray aesthetic, professional lighting, 3D motion graphics.',
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        setStatus(`Rendering video... ${operation.metadata?.progress || ''}%`);
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const videoResponse = await fetch(downloadLink, {
          headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! }
        });
        const videoBlob = await videoResponse.blob();
        setVideoUrl(URL.createObjectURL(videoBlob));
      }

      // 2. Generate Audio with TTS
      setStatus('Synthesizing professional AI voiceover...');
      const prompt = `
        V12 Multimedia is your partner for growth. 
        We specialize in Technical Excellence, Creative Innovation, and Global Distribution.
        Our services include professional Video Editing, high-impact Graphic Design, 
        Strategic Marketing Research, and Promotional Packages designed for the digital age.
        Experience the power of V12.
      `;

      const audioResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = audioResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        setAudioUrl(URL.createObjectURL(blob));
      }

      // 3. Generate Transcription Alignment
      setStatus('Generating synchronized transcription...');
      const transcriptionResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
          parts: [{ 
            text: `Given the following text, provide a JSON array of objects with "text", "start" (seconds), and "end" (seconds) properties. Estimate the timing for a professional voiceover speaking at a moderate pace (approx 150 words per minute). Break the text into short, natural phrases.
            Text: "${prompt.trim()}"` 
          }] 
        }],
        config: {
          responseMimeType: "application/json",
        }
      });

      try {
        const parsedTranscription = JSON.parse(transcriptionResponse.text || '[]');
        setTranscription(parsedTranscription);
      } catch (e) {
        console.error('Failed to parse transcription:', e);
      }

      setStatus('Ready to launch.');
    } catch (error) {
      console.error('Error generating summary:', error);
      setStatus('Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current && audioRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        audioRef.current.pause();
      } else {
        videoRef.current.play();
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="glass-card overflow-hidden relative group">
      {!videoUrl && !isLoading && (
        <div className="aspect-video flex flex-col items-center justify-center p-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-v12-red/10 flex items-center justify-center border border-v12-red/20">
            <Sparkles className="text-v12-red" size={40} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">AI Service Summary</h3>
            <p className="text-v12-gray-400 text-sm max-w-md mx-auto">
              Generate a professional cinematic video and AI voiceover summarizing V12 Multimedia's core mission and services.
            </p>
          </div>
          <button 
            onClick={generateSummary}
            className="btn btn-primary px-8 py-3 text-xs font-black uppercase tracking-widest"
          >
            Generate Summary
          </button>
        </div>
      )}

      {isLoading && (
        <div className="aspect-video flex flex-col items-center justify-center p-12 bg-v12-gray-900/50 backdrop-blur-md">
          <Loader2 className="text-v12-red animate-spin mb-4" size={48} />
          <p className="text-v12-red font-black uppercase tracking-widest text-xs animate-pulse">
            {status}
          </p>
        </div>
      )}

      {videoUrl && (
        <MediaPlayer 
          src={videoUrl}
          title="V12 Mission Summary"
          subtitle="AI Generated • Cinematic Preview"
          type="video"
        />
      )}

      {/* Transcription Display */}
      {transcription.length > 0 && (
        <div className="p-6 bg-v12-gray-900/80 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-v12-red" />
            <span className="text-[10px] font-black uppercase tracking-widest text-v12-gray-400">Live Transcription</span>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {transcription.map((item, index) => {
              const isActive = currentTime >= item.start && currentTime <= item.end;
              return (
                <motion.span
                  key={index}
                  animate={{ 
                    color: isActive ? '#FFFFFF' : '#525252',
                    scale: isActive ? 1.05 : 1,
                    opacity: isActive ? 1 : 0.6
                  }}
                  className={cn(
                    "text-sm font-medium transition-all duration-300",
                    isActive ? "text-white drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "text-v12-gray-400"
                  )}
                >
                  {item.text}
                </motion.span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
