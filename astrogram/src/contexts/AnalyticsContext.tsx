import { useEffect, useMemo, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  configureAnalyticsSession,
  trackEvent as trackEventClient,
  trackEvents as trackEventsClient,
  updateAnalyticsUser,
} from '../lib/analytics';
import type { AnalyticsEventInput, TrackEventOptions } from '../lib/analytics';
import { AnalyticsContext, AnalyticsContextValue } from './analytics-context';

const SESSION_STORAGE_KEY = 'astro.analytics.session-key';

function randomSessionKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

  if (!sessionKeyRef.current) {
    sessionKeyRef.current = ensureSessionKey();
  }

  const emitEvent = useCallback(
    async (event: AnalyticsEventInput, options?: TrackEventOptions) => {
      await trackEventClient(event, options);
    },
    [],
  );

  useEffect(() => {
    configureAnalyticsSession({
      sessionKey: sessionKeyRef.current,
      startedAt: new Date(sessionStartRef.current),
      userId: user?.id,
    });
  }, [user?.id]);

  useEffect(() => {
    updateAnalyticsUser(user?.id ?? undefined);
  }, [user?.id]);

  useEffect(() => {
    const start = new Date(sessionStartRef.current);
    void trackEventClient({
      type: 'session_start',
      metadata: {
        path: location.pathname,
        search: location.search,
      },
    });

    activeViewRef.current = {
      path: `${location.pathname}${location.search}`,
      startedAt: Date.now(),
    };

    void trackEventClient({
      type: 'page_view',
      targetType: 'route',
      targetId: activeViewRef.current.path,
      metadata: {
        path: location.pathname,
        search: location.search,
      },
    });

    return () => {
      const endedAt = new Date();
      void trackEventClient(
        {
          type: 'session_end',
          metadata: {
            reason: 'unmount',
          },
        },
        {
          keepalive: true,
          endedAt,
          startedAt: start.toISOString(),
        },
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}`;
    const now = Date.now();
    const previousView = activeViewRef.current;

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
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handler = () => {
      const state = document.visibilityState;
      void trackEventClient({
        type: 'session_heartbeat',
        metadata: { visibilityState: state },
      });
    };

    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  useEffect(() => {
    const beforeUnloadHandler = () => {
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

    window.addEventListener('beforeunload', beforeUnloadHandler);
    return () => window.removeEventListener('beforeunload', beforeUnloadHandler);
  }, []);

  const value = useMemo<AnalyticsContextValue>(() => ({
    trackEvent: emitEvent,
  }), [emitEvent]);

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};
