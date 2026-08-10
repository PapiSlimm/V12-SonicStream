export default function Success() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="text-center p-12 max-w-md bg-zinc-900 border border-white/5 rounded-[40px] shadow-2xl">
        <div className="w-24 h-24 bg-emerald-500 rounded-full mx-auto mb-8 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Subscription Active!</h1>
        <p className="text-xl text-zinc-400 mb-8 font-medium">Your Pro plan is now active. Upload music, sell merch, book gigs.</p>
        <div className="flex flex-col gap-4">
          <a href="/" className="px-8 py-4 bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-600 transition-all">
            Go to Dashboard
          </a>
          <a href="/tracks" className="px-8 py-4 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/5 transition-all">
            Upload Music
          </a>
        </div>
      </div>
    </div>
  );
}
