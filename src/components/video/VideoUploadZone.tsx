import React, { useState, useRef } from 'react';
import { Upload, X, FileVideo, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface VideoUploadZoneProps {
  onUploadComplete: (url: string) => void;
  className?: string;
}

export const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({ onUploadComplete, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File) => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Please upload MP4, MOV, or WebM.';
    }
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return 'File too large. Max size is 500MB.';
    }
    return null;
  };

  const simulateUpload = (file: File) => {
    setFile(file);
    setError(null);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          // In a real app, we'd upload to Storage and get a URL
          // For now, we'll create a local object URL
          const url = URL.createObjectURL(file);
          onUploadComplete(url);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const errorMsg = validateFile(droppedFile);
      if (errorMsg) {
        setError(errorMsg);
      } else {
        simulateUpload(droppedFile);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const errorMsg = validateFile(selectedFile);
      if (errorMsg) {
        setError(errorMsg);
      } else {
        simulateUpload(selectedFile);
      }
    }
  };

  const reset = () => {
    setFile(null);
    setUploadProgress(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence mode="wait">
        {uploadProgress === null ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 group",
              isDragging 
                ? "border-emerald-500 bg-emerald-500/5 scale-[1.02]" 
                : "border-white/10 bg-zinc-900/30 hover:border-white/20 hover:bg-zinc-900/50"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="video/*"
            />
            
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
              isDragging ? "bg-zinc-700 text-white" : "bg-white/5 text-zinc-500 group-hover:text-zinc-300"
            )}>
              <Upload size={32} />
            </div>

            <div className="text-center">
              <p className="text-lg font-bold text-white">Drop your video here</p>
              <p className="text-sm text-zinc-500 mt-1">or click to browse from your device</p>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                <FileVideo size={12} />
                MP4, MOV, WebM
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                <CheckCircle2 size={12} />
                Up to 500MB
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-xl border border-red-400/20"
              >
                <AlertCircle size={14} />
                <span className="text-xs font-bold">{error}</span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/50 border border-white/10 rounded-[32px] p-12 space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  {uploadProgress < 100 ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                </div>
                <div>
                  <h4 className="font-bold text-white">{file?.name}</h4>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-black">
                    {uploadProgress < 100 ? 'Uploading...' : 'Upload Complete'}
                  </p>
                </div>
              </div>
              <button 
                onClick={reset}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                <span className="text-zinc-500">Progress</span>
                <span className="text-emerald-400">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

            {uploadProgress === 100 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <button 
                  onClick={reset}
                  className="px-8 py-3 bg-white text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-600 transition-all"
                >
                  Upload Another File
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
