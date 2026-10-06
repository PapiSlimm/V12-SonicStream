import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { SoundwaveAnimation } from '../../components/layout/SoundwaveAnimation';
import { SoundboardParticles } from '../../components/layout/SoundboardParticles';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '../../components/ErrorBoundary';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    console.log("%c[AppShell] Injected. Initializing mounting process for layout layers...", "color: #f43f5e; font-weight: bold;");
  }, []);

  return (
    <div id="app-shell-root" className="min-h-screen flex bg-black text-white selection:bg-emerald-500/30">
      {/* Immersive Background Layer */}
      <div id="app-shell-bg" className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          id="app-shell-cover-img"
          className="absolute inset-0 bg-cover bg-center opacity-40 brightness-[0.3] contrast-125 scale-110"
          style={{ backgroundImage: 'url("https://picsum.photos/seed/concert/1920/1080")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-purple-500/5 to-blue-500/10" />
        
        {/* Shield background animations from crashing */}
        <ErrorBoundary fallback={null}>
          <SoundwaveAnimation />
        </ErrorBoundary>
        <ErrorBoundary fallback={null}>
          <SoundboardParticles />
        </ErrorBoundary>
      </div>

      {/* Sidebar - Shield layout sidebar from crashing */}
      <ErrorBoundary fallback={
        <div className="w-64 bg-zinc-950 border-r border-zinc-800 p-4 font-mono text-xs text-red-500 flex flex-col items-center justify-center">
          <span>Sidebar load error</span>
        </div>
      }>
        <Sidebar />
      </ErrorBoundary>

      {/* Main Content Area */}
      <div id="app-shell-main" className="flex-1 flex flex-col relative z-10 min-w-0">
        <ErrorBoundary fallback={
          <div className="bg-zinc-900 border-b border-zinc-800 p-3 text-center text-xs text-red-400">
            Topbar render failure
          </div>
        }>
          <Topbar />
        </ErrorBoundary>
        
        <main id="app-shell-content-container" className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-[1600px] mx-auto p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={window.location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

