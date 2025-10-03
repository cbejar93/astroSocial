import { useContext } from 'react';
import { AnalyticsContext } from '../contexts/analytics-context';

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    return {
      trackEvent: async () => {
        /* noop when provider missing */
      },
    };
  }
  return ctx;
}
