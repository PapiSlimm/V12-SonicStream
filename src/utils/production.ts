import { useEffect } from 'react';

// 1. A/B Test Deployment for prefers-reduced-motion
export const useReducedMotionABTest = () => {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent | MediaQueryList) => {
      // Log for A/B testing analytics
      console.log(`[AB-TEST] Motion preference: ${e.matches ? 'reduced' : 'standard'}`);
      document.documentElement.classList.toggle('reduce-motion', e.matches);
    };

    handleMotionChange(mediaQuery);
    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);
};

// 2. Screen Reader Announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcer = document.getElementById('sr-announcer');
  if (announcer) {
    announcer.setAttribute('aria-live', 'off');
    setTimeout(() => {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
    }, 100);
  }
};

// 3. Mobile Audio Context Unlock (iOS/Safari)
export const unlockAudioContext = (audioContext: AudioContext) => {
  if (audioContext.state === 'suspended') {
    const unlock = () => {
      audioContext.resume().then(() => {
        console.log('[AUDIO] Context unlocked');
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
      });
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
  }
};

// 4. Sentry Mock / Error Tracking
export const trackError = (error: Error, context?: any) => {
  console.error('[SENTRY-MOCK]', error, context);
  // In production: Sentry.captureException(error, { extra: context });
};

// 5. Core Web Vitals Baseline
export const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
};
