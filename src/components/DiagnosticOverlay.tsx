import { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Clock, Terminal, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

export const DiagnosticOverlay = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [mountedTime, setMountedTime] = useState<string>('');
  const [domContentLoadedFired, setDomContentLoadedFired] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    setMountedTime(new Date().toLocaleTimeString());
    setDomContentLoadedFired(document.readyState === 'interactive' || document.readyState === 'complete');
    
    // Captured initial logging info
    setLogs(prev => [
      ...prev,
      `[Diagnostic] React element tree successfully mounted inside #root`,
      `[Diagnostic] Path: ${window.location.pathname}`,
      `[Diagnostic] Timestamp: ${new Date().toISOString()}`,
      `[Diagnostic] Screen: ${window.innerWidth}x${window.innerHeight}`
    ]);

    console.log("%c[Diagnostic Overlay] React component tree mounts successfully. Status: Mounted", "color: #c81e3a; font-weight: bold; font-size: 14px;");
  }, []);

  return (
    <div id="diagnostic-overlay-root" className="fixed bottom-4 right-4 z-[9999] font-mono select-none antialiased">
      {isMinimized ? (
        <button
          id="diagnostic-btn-expand"
          type="button"
          onClick={() => setIsMinimized(false)}
          className="bg-zinc-950/90 hover:bg-zinc-900 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-full shadow-lg shadow-emerald-500/10 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          title="Show Diagnostic status: mounted"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black tracking-wider uppercase pr-1">status: mounted</span>
          <ChevronLeft size={14} className="text-zinc-500" />
        </button>
      ) : (
        <div 
          id="diagnostic-panel-card"
          className="w-80 bg-zinc-950/95 border border-emerald-500/25 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white animate-fadeIn"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">SYS_DIAGNOSTICS</span>
            </div>
            <button
              id="diagnostic-btn-minimize"
              type="button"
              onClick={() => setIsMinimized(true)}
              className="text-zinc-500 hover:text-white p-1 hover:bg-white/5 rounded-md transition-all"
              title="Minimize panel"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Status Metrics */}
          <div className="space-y-2 mb-3">
            {/* Mounted Indicator */}
            <div className="flex items-center justify-between text-xs bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/20">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span className="font-bold text-zinc-300">Status</span>
              </div>
              <span className="bg-zinc-700 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-inner">
                status: mounted
              </span>
            </div>

            {/* DOMContentLoaded Indicator */}
            <div className="flex items-center justify-between text-[11px] bg-white/5 p-2 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-cyan-400" />
                <span className="text-zinc-400">DOMContentLoaded</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${domContentLoadedFired ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                {domContentLoadedFired ? 'FIRED' : 'PENDING'}
              </span>
            </div>

            {/* Mounted Time */}
            <div className="flex items-center justify-between text-[11px] bg-white/5 p-2 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-purple-400" />
                <span className="text-zinc-400">Mounted At</span>
              </div>
              <span className="text-zinc-300 font-mono text-[10px]">{mountedTime || '--:--:--'}</span>
            </div>
          </div>

          {/* Core Logs Console */}
          <div className="space-y-1.5 mb-3">
            <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold block">Console Telemetry</span>
            <div className="bg-black/60 p-2 text-[9px] rounded-xl border border-white/5 max-h-24 overflow-y-auto space-y-1 scrollbar-hide text-zinc-400">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-1.5 items-start">
                  <Terminal size={10} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="break-all">{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Clear Cache / Force Restart button */}
          <button
            id="diagnostic-btn-hard-reset"
            type="button"
            onClick={async () => {
              try {
                setLogs(prev => [...prev, '[Reset] Initiating complete app reset...']);
                
                // 1. Unregister all Service Workers
                if ('serviceWorker' in navigator) {
                  setLogs(prev => [...prev, '[Reset] Unregistering service workers...']);
                  const registrations = await navigator.serviceWorker.getRegistrations();
                  for (const r of registrations) {
                    await r.unregister();
                  }
                }
                
                // 2. Delete all caches
                if ('caches' in window) {
                  setLogs(prev => [...prev, '[Reset] Deleting cache storage...']);
                  const keys = await caches.keys();
                  for (const k of keys) {
                    await caches.delete(k);
                  }
                }
                
                // 3. Clear storage
                setLogs(prev => [...prev, '[Reset] Clearing Local & Session storage...']);
                localStorage.clear();
                sessionStorage.clear();
                
                setLogs(prev => [...prev, '[Reset] Perfect. Reloading in 1 second...']);
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              } catch (e: any) {
                setLogs(prev => [...prev, `[Error] Fail: ${e.message || 'Unknown'}`]);
              }
            }}
            className="w-full text-center bg-red-950/40 hover:bg-red-950/80 active:bg-red-950 text-red-400 border border-red-500/30 font-bold p-2 text-[10px] rounded-xl transition-all cursor-pointer shadow-md tracking-wider uppercase"
          >
            Clear Browser Cache & Reload
          </button>
        </div>
      )}
    </div>
  );
};
