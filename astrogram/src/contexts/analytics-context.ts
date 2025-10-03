import { createContext } from 'react';
import type { AnalyticsEventInput, TrackEventOptions } from '../lib/analytics';

export interface AnalyticsContextValue {
  trackEvent: (event: AnalyticsEventInput, options?: TrackEventOptions) => Promise<void>;
}

export const AnalyticsContext =
  createContext<AnalyticsContextValue | undefined>(undefined);
