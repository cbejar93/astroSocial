import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  configureAnalyticsSession,
  setAnalyticsEnabled,
  trackEvent as trackEventClient,
  trackEvents as trackEventsClient,
  updateAnalyticsUser,
} from '../lib/analytics';
import type { AnalyticsEventInput, TrackEventOptions } from '../lib/analytics';
import { AnalyticsContext, AnalyticsContextValue } from './analytics-context';

const SESSION_STORAGE_KEY = 'astro.analytics.session-key';
const OPT_OUT_STORAGE_KEY = 'astro.analytics.optOut';

function randomSessionKey(): string {
  const globalCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  if (globalCrypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalCrypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('Secure random generator is unavailable in this environment.');
}

function ensureSessionKey(): string {
  if (typeof sessionStorage === 'undefined') {
    return randomSessionKey();
  }
  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const key = randomSessionKey();
  sessionStorage.setItem(SESSION_STORAGE_KEY, key);
  return key;
}

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();
  const sessionKeyRef = useRef<string>('');
  const sessionStartRef = useRef<number>(Date.now());
  const activeViewRef = useRef<{ path: string; startedAt: number } | null>(null);
  const hasStartedRef = useRef(false);

  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    try {
      const stored = window.localStorage?.getItem(OPT_OUT_STORAGE_KEY);
      if (stored === '1') {
        return false;
      }
      if (stored === '0') {
        return true;
      }
    } catch {
      // ignore storage errors
    }

    try {
      const nav = window.navigator as Navigator & { msDoNotTrack?: string };
      const dnt = nav.doNotTrack ?? nav.msDoNotTrack ?? null;
      if (dnt === '1') {
        return false;
      }
    } catch {
      // ignore navigator errors
    }

    return true;
  });

  useEffect(() => {
    setAnalyticsEnabled(enabled);
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (!enabled) {
        window.localStorage?.setItem(OPT_OUT_STORAGE_KEY, '1');
      } else {
        window.localStorage?.removeItem(OPT_OUT_STORAGE_KEY);
      }
    } catch {
      // ignore storage persistence issues
    }
  }, [enabled]);

  if (!sessionKeyRef.current) {
    sessionKeyRef.current = ensureSessionKey();
  }

  const emitEvent = useCallback(
    async (event: AnalyticsEventInput, options?: TrackEventOptions) => {
      if (!enabled) {
        return;
      }
      await trackEventClient(event, options);
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (!hasStartedRef.current) {
      sessionStartRef.current = Date.now();
    }
    configureAnalyticsSession({
      sessionKey: sessionKeyRef.current,
      startedAt: new Date(sessionStartRef.current),
      userId: user?.id,
    });
  }, [enabled, user?.id]);

  useEffect(() => {
    updateAnalyticsUser(user?.id ?? undefined);
  }, [user?.id]);

  useEffect(() => {
    if (!enabled) {
      hasStartedRef.current = false;
      return;
    }

    const startAt = new Date(sessionStartRef.current);
    hasStartedRef.current = true;

    void trackEventClient({
      type: 'session_start',
      metadata: {
        path: location.pathname,
        search: location.search,
      },
    });

    return () => {
      const activeView = activeViewRef.current;
      if (activeView) {
        const duration = Math.max(0, Date.now() - activeView.startedAt);
        if (duration > 0) {
          void trackEventClient({
            type: 'page_view_duration',
            targetType: 'route',
            targetId: activeView.path,
            durationMs: duration,
            metadata: { path: activeView.path },
          });
        }
      }

      const endedAt = new Date();
      void trackEventClient(
        {
          type: 'session_end',
          metadata: {
            reason: 'teardown',
          },
        },
        {
          keepalive: true,
          endedAt,
          startedAt: startAt.toISOString(),
        },
      );
      hasStartedRef.current = false;
      activeViewRef.current = null;
    };
    // We intentionally only depend on `enabled` so a route change
    // doesn't terminate the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}`;
    const now = Date.now();
    const previousView = activeViewRef.current;

    if (!enabled) {
      return;
    }

    if (previousView && previousView.path === currentPath) {
      return;
    }

    if (previousView && previousView.path !== currentPath) {
      const duration = now - previousView.startedAt;
      if (duration > 0) {
        void trackEventClient({
          type: 'page_view_duration',
          targetType: 'route',
          targetId: previousView.path,
          durationMs: duration,
          metadata: { path: previousView.path },
        });
      }
    }

    activeViewRef.current = { path: currentPath, startedAt: now };

    void trackEventClient({
      type: 'page_view',
      targetType: 'route',
      targetId: currentPath,
      metadata: {
        path: location.pathname,
        search: location.search,
      },
    });
  }, [enabled, location.pathname, location.search]);

  useEffect(() => {
    const handler = () => {
      if (!enabled) {
        return;
      }
      const state = document.visibilityState;
      void trackEventClient({
        type: 'session_heartbeat',
        metadata: { visibilityState: state },
      });
    };

    if (!enabled) {
      return;
    }

    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [enabled]);

  useEffect(() => {
    const beforeUnloadHandler = () => {
      if (!enabled) {
        return;
      }
      const now = Date.now();
      const activeView = activeViewRef.current;
      const events: AnalyticsEventInput[] = [];

      if (activeView) {
        const duration = Math.max(0, now - activeView.startedAt);
        if (duration) {
          events.push({
            type: 'page_view_duration',
            targetType: 'route',
            targetId: activeView.path,
            durationMs: duration,
            metadata: { path: activeView.path },
          });
        }
      }

      events.push({
        type: 'session_end',
        metadata: { reason: 'beforeunload' },
      });

      void trackEventsClient(events, {
        keepalive: true,
        endedAt: new Date(),
      });
    };

    if (!enabled) {
      return;
    }

    window.addEventListener('beforeunload', beforeUnloadHandler);
    return () => window.removeEventListener('beforeunload', beforeUnloadHandler);
  }, [enabled]);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
  }, []);

  const value = useMemo<AnalyticsContextValue>(() => ({
    enabled,
    setEnabled,
    trackEvent: emitEvent,
  }), [emitEvent, enabled, setEnabled]);

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};
