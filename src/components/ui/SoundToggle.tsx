
import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';
import { cn } from '../../utils/cn';

export const SoundToggle = () => {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!isMuted) {
      soundEngine.startAmbient();
    } else {
      soundEngine.stopAmbient();
    }
  }, [isMuted]);

  const toggleSound = () => {
    setIsMuted(!isMuted);
    if (isMuted) {
      soundEngine.playArpeggio();
    }
  };

  return (
    <button
      onClick={toggleSound}
      className={cn(
        "p-2 rounded-xl transition-all flex items-center gap-2",
        isMuted ? "bg-zinc-900 text-zinc-500 hover:text-zinc-400" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      )}
      title={isMuted ? "Enable Sound Experience" : "Mute Experience"}
    >
      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
        {isMuted ? "Sound Off" : "Sound On"}
      </span>
    </button>
  );
};
