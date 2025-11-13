export interface AnalyticsEventInput {
  type: string;
  targetType?: string;
  targetId?: string;
  value?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  userId?: string;
}

type AnalyticsFetcher = (
  path: string,
  init?: RequestInit,
) => Promise<Response>;

interface AnalyticsSessionState {
  sessionKey?: string;
  startedAt?: string;
  userAgent?: string;
  userId?: string;
}

const sessionState: AnalyticsSessionState = {
  sessionKey: undefined,
  startedAt: undefined,
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  userId: undefined,
};

let fetcher: AnalyticsFetcher | null = null;
let analyticsEnabled = true;
const API_BASE = import.meta.env?.VITE_API_BASE_URL || '/api';

export interface TrackEventOptions {
  keepalive?: boolean;
  endedAt?: Date;
  sessionKey?: string;
  userId?: string;
  startedAt?: string;
}

interface AnalyticsEnvelope {
  sessionKey?: string;
  userId?: string;
  userAgent?: string;
  startedAt?: string;
  endedAt?: string;
  events: AnalyticsEventInput[];
}

function buildEnvelope(
  events: AnalyticsEventInput[],
  options?: TrackEventOptions,
): AnalyticsEnvelope {
  const baseSessionKey = options?.sessionKey ?? sessionState.sessionKey;
  const baseUserId = options?.userId ?? sessionState.userId;
  const startedAt = options?.startedAt ?? sessionState.startedAt;

  const normalizedEvents = events.map((event) => ({
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
    userId: event.userId ?? baseUserId,
  }));

  return {
    sessionKey: baseSessionKey,
    userId: baseUserId,
    userAgent: sessionState.userAgent,
    startedAt,
    endedAt: options?.endedAt?.toISOString(),
    events: normalizedEvents,
  };
}

export function setAnalyticsEnabled(enabled: boolean): void {
  analyticsEnabled = enabled;
}

export function isAnalyticsEnabled(): boolean {
  return analyticsEnabled;
}

async function sendEnvelope(
  envelope: AnalyticsEnvelope,
  options?: TrackEventOptions,
): Promise<void> {
  if (!analyticsEnabled) {
    return;
  }
  if (!envelope.events.length) {
    return;
  }

  try {
    const request: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
      keepalive: options?.keepalive,
    };

    let res: Response;
    if (fetcher) {
      res = await fetcher('/analytics/events', request);
    } else {
      res = await fetch(`${API_BASE}/analytics/events`, {
        ...request,
        credentials: 'include',
      });
    }
    // Drain the body to release the connection; ignore errors.
    await res
      .json()
      .catch(() => undefined);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('Failed to send analytics event', error);
    }
  }
}

export function configureAnalyticsSession(config: {
  sessionKey: string;
  startedAt?: Date;
  userId?: string;
  userAgent?: string;
}): void {
  sessionState.sessionKey = config.sessionKey;
  sessionState.startedAt = (config.startedAt ?? new Date()).toISOString();
  sessionState.userAgent =
    config.userAgent ??
    (typeof navigator !== 'undefined' ? navigator.userAgent : undefined);
  sessionState.userId = config.userId;
}

export function updateAnalyticsUser(userId?: string): void {
  sessionState.userId = userId;
}

export function setAnalyticsFetcher(fn: AnalyticsFetcher): void {
  fetcher = fn;
}

export async function trackEvent(
  event: AnalyticsEventInput,
  options?: TrackEventOptions,
): Promise<void> {
  const envelope = buildEnvelope([event], options);
  await sendEnvelope(envelope, options);
}

export async function trackEvents(
  events: AnalyticsEventInput[],
  options?: TrackEventOptions,
): Promise<void> {
  const envelope = buildEnvelope(events, options);
  await sendEnvelope(envelope, options);
}
