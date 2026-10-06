import { useState } from 'react';
import { Music, Mic, Video, Palette, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { APP_NAME } from '../../constants';

interface UserTypeStepProps {
  onSuccess: (type: string) => void;
}

const colorStyles = {
  emerald: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-500',
    hover: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
    selected: 'border-emerald-500 bg-emerald-500/10'
  },
  purple: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-500',
    hover: 'hover:border-purple-500/50 hover:bg-purple-500/5',
    selected: 'border-purple-500 bg-purple-500/10'
  },
  blue: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-500',
    hover: 'hover:border-blue-500/50 hover:bg-blue-500/5',
    selected: 'border-blue-500 bg-blue-500/10'
  },
  orange: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-500',
    hover: 'hover:border-orange-500/50 hover:bg-orange-500/5',
    selected: 'border-orange-500 bg-orange-500/10'
  }
};

export const UserTypeStep = ({ onSuccess }: UserTypeStepProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const types = [
    { id: 'artist', title: 'Artist', desc: 'Musician, vocalist, songwriter', icon: Mic, color: 'emerald' as const, recommended: true },
    { id: 'producer', title: 'Producer', desc: 'Beatmaker, label owner', icon: Music, color: 'purple' as const },
    { id: 'video', title: 'Video Creator', desc: 'Music videos, lyric videos', icon: Video, color: 'blue' as const },
    { id: 'mixed', title: 'Mixed Creator', desc: 'Multiple creative roles', icon: Palette, color: 'orange' as const }
  ];

  const handleSelect = (id: string) => {
    setSelected(id);
    localStorage.setItem('userType', id);
  };

  return (
    <div className="text-center space-y-12 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="text-4xl font-black text-white">What best describes you?</h2>
        <p className="text-zinc-400 max-w-md mx-auto">
          Choose your primary role on {APP_NAME}. You can always add more later.
        </p>
      </motion.div>
      
      <div role="radiogroup" className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {types.map((type, idx) => {
          const styles = colorStyles[type.color];
          const isSelected = selected === type.id;

          return (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleSelect(type.id)}
              role="radio"
              aria-checked={isSelected}
              className={`group relative p-8 border-2 rounded-[32px] transition-all flex flex-col items-center justify-center text-center space-y-4 ${
                isSelected 
                  ? styles.selected 
                  : `border-white/10 ${styles.hover}`
              }`}
            >
              {type.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-black/20">
                  Recommended
                </div>
              )}

              <div className={`w-16 h-16 ${styles.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <type.icon className={`w-8 h-8 ${styles.text}`} />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-xl text-white">{type.title}</h3>
                <p className="text-zinc-500 text-sm">{type.desc}</p>
              </div>
              <div className={`absolute top-4 right-4 transition-all ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-black" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: selected ? 1 : 0 }}
        className="pt-8"
      >
        <button
          disabled={!selected}
          onClick={() => onSuccess(selected!)}
          className="px-12 py-4 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/20"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
};
