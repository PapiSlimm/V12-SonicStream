import { Rocket, ArrowRight, Layout, User } from 'lucide-react';

interface SuccessStepProps {
  onFinish: () => void;
}

export const SuccessStep = ({ onFinish }: SuccessStepProps) => {
  return (
    <div className="text-center space-y-12 py-12">
      <div className="relative">
        <div className="w-32 h-32 bg-emerald-500/20 rounded-[40px] flex items-center justify-center mx-auto border-4 border-emerald-500/50 animate-bounce">
          <Rocket className="w-16 h-16 text-emerald-500" />
        </div>
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-2xl">✨</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-purple-500 bg-clip-text text-transparent tracking-tighter">
          Profile Live!
        </h2>
        <p className="text-xl text-zinc-400 max-w-sm mx-auto">
          Welcome to the future of music distribution. Your journey starts now.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto">
        <div className="p-6 bg-zinc-800/30 border border-white/5 rounded-3xl text-left space-y-4">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h4 className="font-bold text-white">Artist Profile</h4>
            <p className="text-sm text-zinc-500">Your public presence is ready for fans.</p>
          </div>
        </div>
        <div className="p-6 bg-zinc-800/30 border border-white/5 rounded-3xl text-left space-y-4">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Layout className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h4 className="font-bold text-white">Creator Studio</h4>
            <p className="text-sm text-zinc-500">Upload tracks and manage your earnings.</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
        <button
          onClick={onFinish}
          className="bg-gradient-to-r from-emerald-500 to-purple-500 text-white font-black px-12 py-5 rounded-3xl text-xl shadow-2xl hover:shadow-black/40 hover:scale-105 transition-all flex items-center justify-center gap-3"
        >
          Go to Dashboard
          <ArrowRight className="w-6 h-6" />
        </button>
        <button
          onClick={onFinish}
          className="bg-white/5 border border-white/10 text-white font-bold px-12 py-5 rounded-3xl text-xl hover:bg-white/10 transition-all"
        >
          Upload First Track
        </button>
      </div>
    </div>
  );
};
