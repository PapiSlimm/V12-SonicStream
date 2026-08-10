import React, { useEffect } from 'react';
import { reportWebVitals } from '../../utils/production';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (import.meta.env.PROD) {
      reportWebVitals((metric) => {
        fetch('/api/analytics/vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric),
        }).catch(err => console.debug('Analytics sync failed:', err));
      });
    }
  }, []);

  return <>{children}</>;
}
