import { useEffect, Suspense } from 'react';
import { AppProviders } from './core/providers';
import { AppShell } from './core/shell/AppShell';
import { AppRouter } from './components/AppRouter';
import { GlobalUI } from './core/ui/GlobalUI';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DiagnosticOverlay } from './components/DiagnosticOverlay';
import { LoadingScreen } from './shared/ui/LoadingScreen';

function AppContent() {
  useEffect(() => {
    // 1. Startup Monitoring & Cold load metrics
    try {
      performance.mark("app-mounted");
      console.log("%c[AppContent] Startup metrics: 'app-mounted' performance mark set.", "color: #c81e3a; font-weight: bold;");
      
      if ((window as any).analytics) {
        (window as any).analytics.track("app_loaded");
      } else {
        console.log("%c[AppContent] Tracked 'app_loaded' internally.", "color: #c81e3a;");
      }
    } catch (err) {
      console.warn("Startup monitoring registration warning:", err);
    }
  }, []);

  useEffect(() => {
    // 2. Global Fatal Error Capture
    const handleError = (event: ErrorEvent) => {
      console.error("[Global Error Event Handler]:", event.error || event.message);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[Global Unhandled Rejection Event Handler]:", event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <>
      <AppShell>
        <Suspense fallback={<LoadingScreen />}>
          <AppRouter />
        </Suspense>
      </AppShell>
      <GlobalUI />
      {/* Visual Diagnostic mount badge - dev builds only; add ?debug=1 to show in prod */}
      {(import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug')) && <DiagnosticOverlay />}
    </>
  );
}

export default function App() {
  useEffect(() => {
    console.log("%c[App Root] Mounted. Injected ErrorBoundary and AppProviders into root node.", "color: #38bdf8; font-weight: bold;");
  }, []);

  return (
    <ErrorBoundary>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </ErrorBoundary>
  );
}

