import { useState, useEffect, useCallback } from 'react';
import { Play, Music } from 'lucide-react';
import { Track } from '../../types';

interface PreviewOverlayProps {
  track: Track;
  onPlayFull: () => void;
}

export const PreviewOverlay = ({ track, onPlayFull }: PreviewOverlayProps) => {
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const playPreview = useCallback(() => {
    if (audioPreview) {
      audioPreview.currentTime = 30; // Skip to preview section as requested
      audioPreview.volume = 0.3;
      audioPreview.play().catch(console.error);
      setIsPreviewing(true);
    }
  }, [audioPreview]);

  const stopPreview = useCallback(() => {
    if (audioPreview) {
      audioPreview.pause();
      setIsPreviewing(false);
    }
  }, [audioPreview]);

  useEffect(() => {
    const preview = new Audio(track.previewUrl || track.streamUrl);
    preview.preload = 'auto';
    preview.loop = true;
    preview.volume = 0.3;
    setAudioPreview(preview);

    return () => {
      preview.pause();
      preview.src = ''; // Cleanup
    };
  }, [track]);

  return (
    <div 
      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
      onMouseLeave={stopPreview}
    >
      <div className="text-center space-y-4 p-4">
        {isPreviewing ? (
          <>
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Music className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-white text-sm font-medium">Preview Playing</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                stopPreview();
                onPlayFull();
              }}
              className="bg-zinc-700 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-zinc-600 transition-colors"
            >
              Play Full Track
            </button>
          </>
        ) : (
          <button
            onMouseEnter={playPreview}
            onClick={(e) => {
              e.stopPropagation();
              onPlayFull();
            }}
            className="group/preview flex flex-col items-center"
            aria-label={`Preview ${track.title}`}
          >
            <Play className="w-16 h-16 text-white fill-white drop-shadow-lg mb-2 hover:scale-110 transition-transform" />
            <span className="text-white/80 text-xs font-medium mt-1">Preview</span>
          </button>
        )}
      </div>
    </div>
  );
};
