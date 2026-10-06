import { Loader2 } from 'lucide-react';

export const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full animate-pulse" />
        <Loader2 className="absolute inset-0 m-auto text-emerald-500 animate-spin" size={32} />
      </div>
      <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px]">Loading SonicStream...</p>
    </div>
  );
};
