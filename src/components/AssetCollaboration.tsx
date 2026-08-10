import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, FastForward, Rewind, 
  MapPin, MessageSquare, Save, Download,
  Clock, CheckCircle, Clock as ClockIcon,
  Loader2
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useStore.ts';
import { cn } from '../lib/utils.ts';

interface Comment {
  id: string;
  userId: string;
  content: string;
  timestamp?: number;
  frame?: number;
  createdAt: string;
  userName?: string;
}

interface Asset {
  id: string;
  name: string;
  url: string;
  type: string; // 'video' | 'audio'
  stage: string;
  comments: Comment[];
}

interface AssetCollaborationProps {
  asset: Asset;
  projectId: string;
  onRefresh: () => void;
}

export function AssetCollaboration({ asset, projectId, onRefresh }: AssetCollaborationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const { user, token } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(window.location.origin, { auth: { token } });
    s.on('connect', () => s.emit('join-project', projectId));
    
    s.on('marker-added', (data) => {
      if (data.assetId === asset.id) {
        onRefresh();
      }
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [projectId, asset.id, onRefresh]);

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) mediaRef.current.pause();
      else mediaRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const addComment = async () => {
    if (!commentText.trim() || !token) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/assets/${asset.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: commentText,
          timestamp: currentTime,
          frame: asset.type === 'video' ? Math.floor(currentTime * 24) : null // Mock 24fps
        })
      });

      if (response.ok) {
        setCommentText('');
        socket?.emit('new-marker', { projectId, assetId: asset.id });
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to add comment');
    } finally {
      setIsSaving(false);
    }
  };

  const seekTo = (time: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      mediaRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 bg-v12-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Player Column */}
      <div className="lg:w-2/3 flex flex-col">
        <div className="aspect-video bg-black relative group">
          {asset.type === 'video' ? (
            <video 
              ref={mediaRef as any}
              src={asset.url}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-v12-blue/20">
              <audio 
                ref={mediaRef as any}
                src={asset.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              />
              <div className="flex items-center gap-4">
                {[...Array(20)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: isPlaying ? [10, 40, 10] : 10 }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.05 }}
                    className="w-1 bg-v12-red rounded-full"
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="text-white hover:text-v12-red transition-colors">
                {isPlaying ? <Pause size={32} /> : <Play size={32} />}
              </button>
              
              <div className="flex-1 space-y-2">
                <div className="relative h-1.5 bg-white/10 rounded-full cursor-pointer">
                  <div 
                    className="absolute top-0 left-0 h-full bg-v12-red rounded-full relative" 
                    style={{ width: `${(currentTime / duration || 0) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                  </div>
                  {/* Markers on Timeline */}
                  {asset.comments.filter(c => c.timestamp !== undefined).map(c => (
                    <div 
                      key={c.id}
                      className="absolute top-0 w-1 h-full bg-v12-orange z-10"
                      style={{ left: `${(c.timestamp! / duration || 0) * 100}%` }}
                      title={c.content}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-black text-v12-silver uppercase tracking-widest font-mono">
                  <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                  <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">{asset.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-0.5 bg-v12-red text-white text-[8px] font-black uppercase tracking-widest">{asset.stage}</span>
                <span className="text-[10px] font-bold text-v12-gray-400 uppercase tracking-widest">{asset.type} REVIEW</span>
              </div>
            </div>
            <button className="btn btn-outline py-2 px-4 text-xs flex items-center gap-2">
              <Download size={16} />
              DOWNLOAD ASSET
            </button>
          </div>
          
          <div className="flex gap-4">
            <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`ADD TIMESTAMPED COMMENT AT ${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}...`}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm font-bold placeholder:text-v12-gray-600 focus:border-v12-red outline-none transition-all uppercase tracking-tighter"
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
            />
            <button 
              onClick={addComment}
              disabled={isSaving || !commentText.trim()}
              className="btn btn-primary px-8 flex items-center gap-2"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
              MARK
            </button>
          </div>
        </div>
      </div>

      {/* Review Column */}
      <div className="lg:w-1/3 border-l border-white/10 flex flex-col bg-black/20">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-v12-blue/10">
          <div className="flex items-center gap-3">
            <MessageSquare size={18} className="text-v12-red" />
            <h4 className="text-sm font-black uppercase tracking-widest">Feedback Log</h4>
          </div>
          <span className="px-2 py-0.5 bg-black/40 rounded text-[10px] font-black text-v12-gray-400">{asset.comments.length} MARKS</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar max-h-[600px]">
          {asset.comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Clock size={40} className="mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">No feedback yet.<br/>Be the first to leave a mark.</p>
            </div>
          ) : (
            asset.comments.sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0)).map((comment) => (
              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={comment.id}
                onClick={() => seekTo(comment.timestamp || 0)}
                className="w-full text-left p-4 glass-card border-white/5 hover:border-v12-red/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-v12-red">
                    <ClockIcon size={12} />
                    {Math.floor((comment.timestamp || 0) / 60)}:{Math.floor((comment.timestamp || 0) % 60).toString().padStart(2, '0')}
                    {comment.frame !== null && comment.frame !== undefined && <span className="text-v12-gray-500 ml-1">F{comment.frame}</span>}
                  </div>
                  <span className="text-[8px] font-black text-v12-gray-600 uppercase">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs font-bold text-v12-silver uppercase leading-tight group-hover:text-white transition-colors">
                  {comment.content}
                </p>
              </motion.button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
