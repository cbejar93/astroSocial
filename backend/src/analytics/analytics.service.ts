import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IngestAnalyticsEventsDto } from './dto/ingest-events.dto';

type GeoIpLookupResult = {
  country?: string;
  region?: string;
  city?: string;
};

type GeoIpModule = {
  lookup: (ip: string) => GeoIpLookupResult | null;
};

// geoip-lite ships as a CommonJS module. Load it lazily so that local development
// continues to work even when the optional database is unavailable.
let geoipLite: GeoIpModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  geoipLite = require('geoip-lite');
} catch (error) {
  geoipLite = null;
}

type CanonicalEvent = {
  userId?: string;
  sessionKey?: string;
  type: string;
  targetType?: string;
  targetId?: string;
  value?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

export interface AnalyticsSummary {
  rangeDays: number;
  generatedAt: string;
  totals: {
    events: number;
    uniqueUsers: number;
  };
  interactionCounts: { type: string; count: number }[];
  sessions: {
    count: number;
    totalDurationMs: number;
    averageDurationMs: number;
  };
  dailyActiveUsers: { date: string; count: number }[];
  platformActivity: {
    postInteractions: { type: string; count: number }[];
    commentLikes: number;
  };
  visitsByLocation: { location: string; count: number }[];
}

@Injectable()
export class AnalyticsService implements OnModuleDestroy {
  private static readonly BATCH_SIZE = 50;
  private static readonly FLUSH_INTERVAL_MS = 5_000;
  private static readonly SUMMARY_CACHE_TTL_MS = 5 * 60 * 1000;
  private static readonly RETENTION_DAYS = 180;
  private static readonly UNKNOWN_LOCATION_LABEL = 'Unknown region';
  private static loggedGeoIpWarning = false;

  private static readonly REGION_DISPLAY =
    typeof Intl.DisplayNames === 'function'
      ? new Intl.DisplayNames(['en'], {
          type: 'region',
        })
      : null;

  private readonly logger = new Logger(AnalyticsService.name);
  private pendingEvents: Prisma.AnalyticsEventCreateManyInput[] = [];
  private flushPromise: Promise<void> | null = null;
  private flushInterval?: NodeJS.Timeout;
  private summaryCache = new Map<number, { summary: AnalyticsSummary; expiresAt: number }>();

  constructor(private readonly prisma: PrismaService) {
    this.flushInterval = setInterval(() => {
      if (this.pendingEvents.length === 0) {
        return;
      }

      void this.triggerFlush().catch((error) => {
        this.logger.error(
          `Scheduled analytics flush failed: ${(error as Error).message}`,
        );
      });
    }, AnalyticsService.FLUSH_INTERVAL_MS);
    this.flushInterval.unref?.();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    if (this.flushPromise) {
      try {
        await this.flushPromise;
      } catch (error) {
        this.logger.error(
          `Failed to flush analytics buffer during shutdown: ${(error as Error).message}`,
        );
      }
    }

    if (this.pendingEvents.length) {
      try {
        await this.flushPendingEventsInternal();
        this.clearSummaryCache();
      } catch (error) {
        this.logger.error(
          `Failed to persist buffered analytics events on shutdown: ${(error as Error).message}`,
        );
      }
    }
  }

  private sanitizeMetadata(
    metadata?: Record<string, unknown>,
  ): Prisma.InputJsonValue | undefined {
    if (!metadata) {
      return undefined;
    }

    try {
      return JSON.parse(JSON.stringify(metadata));
    } catch (error) {
      this.logger.warn(
        `Failed to serialize analytics metadata: ${(error as Error).message}`,
      );
      return undefined;
    }
  }

  private coerceDate(input?: string): Date | undefined {
    if (!input) {
      return undefined;
    }

    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      this.logger.warn(`Invalid date received in analytics payload: ${input}`);
      return undefined;
    }

    return parsed;
  }

  private enqueueEvents(records: Prisma.AnalyticsEventCreateManyInput[]): void {
    if (!records.length) {
      return;
    }
    this.pendingEvents.push(...records);
  }

  private normalizeIpAddress(ip?: string | null): string | null {
    if (!ip) {
      return null;
    }

    let normalized = ip.trim();
    if (!normalized) {
      return null;
    }

    if (normalized.startsWith('[') && normalized.endsWith(']')) {
      normalized = normalized.slice(1, -1);
    }

    if (normalized.startsWith('::ffff:')) {
      normalized = normalized.slice(7);
    }

    const ipv4WithPort = normalized.match(/^((?:\d{1,3}\.){3}\d{1,3}):\d+$/);
    if (ipv4WithPort) {
      return ipv4WithPort[1];
    }

    if (normalized.includes(':')) {
      const potentialIpv4 = normalized.split(':').pop();
      if (potentialIpv4 && /^(?:\d{1,3}\.){3}\d{1,3}$/.test(potentialIpv4)) {
        return potentialIpv4;
      }
    }

    return normalized;
  }

  private resolveCountryName(code?: string | null): string | null {
    if (!code) {
      return null;
    }

    if (AnalyticsService.REGION_DISPLAY) {
      try {
        const name = AnalyticsService.REGION_DISPLAY.of(code);
        if (name) {
          return name;
        }
      } catch (error) {
        this.logger.debug(
          `Failed to resolve country name for ${code}: ${(error as Error).message}`,
        );
      }
    }

    return code;
  }

  private inferLocationFromLocale(userAgent?: string | null): string {
    if (!userAgent) {
      return AnalyticsService.UNKNOWN_LOCATION_LABEL;
    }

    const localeMatch = userAgent.match(/([a-z]{2,3})[-_]?([A-Z]{2})/);
    if (!localeMatch) {
      return AnalyticsService.UNKNOWN_LOCATION_LABEL;
    }

    const regionCode = localeMatch[2]?.toUpperCase();
    if (!regionCode) {
      return AnalyticsService.UNKNOWN_LOCATION_LABEL;
    }

    const regionName = this.resolveCountryName(regionCode);
    if (regionName) {
      return regionName;
    }

    return `Region ${regionCode}`;
  }

  private inferLocationFromIp(ip?: string | null): string | null {
    const normalized = this.normalizeIpAddress(ip);
    if (!normalized) {
      return null;
    }

    if (!geoipLite) {
      if (!AnalyticsService.loggedGeoIpWarning) {
        AnalyticsService.loggedGeoIpWarning = true;
        this.logger.warn(
          'geoip-lite module unavailable; falling back to locale-derived locations.',
        );
      }
      return null;
    }

    try {
      const result = geoipLite.lookup(normalized);
      if (!result) {
        return null;
      }

      const parts: string[] = [];
      if (result.city) {
        parts.push(result.city);
      }

      const countryName = this.resolveCountryName(result.country);
      if (countryName) {
        parts.push(countryName);
      }

      if (!parts.length && result.region) {
        parts.push(result.region);
      }

      if (!parts.length) {
        return null;
      }

      return parts.join(', ');
    } catch (error) {
      this.logger.debug(
        `Failed to resolve IP geolocation for ${normalized}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private inferApproximateLocation(
    session: { ipAddress?: string | null; userAgent?: string | null },
  ): string {
    const ipLocation = this.inferLocationFromIp(session.ipAddress);
    if (ipLocation) {
      return ipLocation;
    }

    return this.inferLocationFromLocale(session.userAgent);
  }

  private async flushPendingEventsInternal(): Promise<number> {
    if (!this.pendingEvents.length) {
      return 0;
    }

    const batch = this.pendingEvents;
    this.pendingEvents = [];

    try {
      const result = await this.prisma.analyticsEvent.createMany({
        data: batch,
        skipDuplicates: true,
      });
      return result.count;
    } catch (error) {
      this.pendingEvents = batch.concat(this.pendingEvents);
      throw error;
    }
  }

  private clearSummaryCache(): void {
    this.summaryCache.clear();
  }

  private triggerFlush(): Promise<void> {
    if (this.flushPromise) {
      return this.flushPromise;
    }

    this.flushPromise = this.flushPendingEventsInternal()
      .then((count) => {
        if (count > 0) {
          this.logger.debug(`Flushed ${count} analytics events from buffer`);
          this.clearSummaryCache();
        }
      })
      .finally(() => {
        this.flushPromise = null;
        if (this.pendingEvents.length >= AnalyticsService.BATCH_SIZE) {
          void this.triggerFlush().catch((error) => {
            this.logger.error(
              `Follow-up analytics flush failed: ${(error as Error).message}`,
            );
          });
        }
      });

    return this.flushPromise;
  }

  private async computeSummary(rangeDays: number): Promise<AnalyticsSummary> {
    const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      distinctUsers,
      typeCounts,
      sessions,
      eventsForDaily,
      postInteractions,
      commentLikes,
    ] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since }, userId: { not: null } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['type'],
        _count: { _all: true },
        where: { createdAt: { gte: since } },
      }),
      this.prisma.analyticsSession.findMany({
        where: {
          OR: [{ startedAt: { gte: since } }, { endedAt: { gte: since } }],
        },
        select: {
          startedAt: true,
          endedAt: true,
          userAgent: true,
          ipAddress: true,
        },
      }),
      this.prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since }, userId: { not: null } },
        select: { createdAt: true, userId: true },
      }),
      this.prisma.postInteraction.groupBy({
        by: ['type'],
        _count: { _all: true },
        where: { createdAt: { gte: since } },
      }),
      this.prisma.commentLike.count({
        where: { createdAt: { gte: since } },
      }),
    ]);

    const sessionDurations = sessions
      .map((session) => {
        const end = session.endedAt ?? new Date();
        const duration = end.getTime() - session.startedAt.getTime();
        return duration > 0 ? duration : 0;
      })
      .filter((duration) => duration > 0);

    const totalSessionDurationMs = sessionDurations.reduce(
      (sum, duration) => sum + duration,
      0,
    );
    const averageSessionDurationMs = sessionDurations.length
      ? Math.round(totalSessionDurationMs / sessionDurations.length)
      : 0;

    const dailyActiveUsersMap = new Map<string, Set<string>>();
    eventsForDaily.forEach((event) => {
      if (!event.userId) {
        return;
      }
      const dateKey = event.createdAt.toISOString().slice(0, 10);
      if (!dailyActiveUsersMap.has(dateKey)) {
        dailyActiveUsersMap.set(dateKey, new Set());
      }
      dailyActiveUsersMap.get(dateKey)!.add(event.userId);
    });

    const dailyActiveUsers = Array.from(dailyActiveUsersMap.entries())
      .map(([date, users]) => ({ date, count: users.size }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const visitsByLocationMap = sessions.reduce<Map<string, number>>((map, session) => {
      const key = this.inferApproximateLocation({
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      });
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map());

    const visitsByLocation = Array.from(visitsByLocationMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      rangeDays,
      generatedAt: new Date().toISOString(),
      totals: {
        events: totalEvents,
        uniqueUsers: distinctUsers.length,
      },
      interactionCounts: typeCounts.map((entry) => ({
        type: entry.type,
        count: entry._count._all,
      })),
      sessions: {
        count: sessions.length,
        totalDurationMs: totalSessionDurationMs,
        averageDurationMs: averageSessionDurationMs,
      },
      dailyActiveUsers,
      platformActivity: {
        postInteractions: postInteractions.map((entry) => ({
          type: entry.type,
          count: entry._count._all,
        })),
        commentLikes,
      },
      visitsByLocation,
    };
  }

  private storeSummary(rangeDays: number, summary: AnalyticsSummary): void {
    this.summaryCache.set(rangeDays, {
      summary,
      expiresAt: Date.now() + AnalyticsService.SUMMARY_CACHE_TTL_MS,
    });
  }

  async recordEvents(
    payload: IngestAnalyticsEventsDto,
    requestIp?: string,
  ): Promise<{ count: number; sessionId?: string }> {
    const { sessionKey, userId, userAgent, startedAt, endedAt, events } = payload;

    let sessionId: string | undefined;

    if (sessionKey) {
      const startedAtDate = this.coerceDate(startedAt) ?? new Date();
      const endedAtDate = this.coerceDate(endedAt);

      try {
        const session = await this.prisma.analyticsSession.upsert({
          where: { sessionKey },
          update: {
            ...(userId ? { userId } : {}),
            ...(userAgent ? { userAgent } : {}),
            ...(requestIp ? { ipAddress: requestIp } : {}),
            ...(endedAtDate ? { endedAt: endedAtDate } : {}),
          },
          create: {
            sessionKey,
            userId,
            userAgent,
            ipAddress: requestIp,
            startedAt: startedAtDate,
            ...(endedAtDate ? { endedAt: endedAtDate } : {}),
          },
        });

        sessionId = session.id;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          this.logger.warn(
            `Duplicate analytics session key received: ${sessionKey}`,
          );
        } else {
          this.logger.error(
            `Failed to upsert analytics session ${sessionKey}: ${
              (error as Error).message
            }`,
          );
          throw error;
        }
      }
    }

    if (!events?.length) {
      return { count: 0, sessionId };
    }

    const records = events.map((event) => {
      const timestamp = this.coerceDate(event.timestamp) ?? new Date();
      const record: Prisma.AnalyticsEventCreateManyInput = {
        sessionId: sessionId ?? null,
        userId: event.userId ?? userId ?? null,
        type: event.type,
        targetType: event.targetType ?? null,
        targetId: event.targetId ?? null,
        durationMs: event.durationMs ?? null,
        value: event.value ?? null,
        createdAt: timestamp,
      };

      const metadata = this.sanitizeMetadata(event.metadata);
      if (metadata !== undefined) {
        record.metadata = metadata;
      }

      return record;
    });

    this.enqueueEvents(records);

    const shouldFlushImmediately =
      this.pendingEvents.length >= AnalyticsService.BATCH_SIZE ||
      Boolean(endedAt) ||
      events.some((event) => event.type === 'session_end');

    if (shouldFlushImmediately) {
      await this.triggerFlush();
    }

    return { count: records.length, sessionId };
  }

  async recordCanonicalEvent(event: CanonicalEvent): Promise<void> {
    const { type, metadata, targetId, targetType, sessionKey, userId, value } =
      event;

    try {
      await this.recordEvents(
        {
          sessionKey,
          userId,
          events: [
            {
              type,
              metadata,
              targetId,
              targetType,
              value,
              durationMs: event.durationMs,
              userId,
            },
          ],
        },
        undefined,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to record canonical analytics event ${type}: ${
          (error as Error).message
        }`,
      );
    }
  }

  async getSummary(rangeDays: number): Promise<AnalyticsSummary> {
    const safeRange = Number.isFinite(rangeDays) ? Math.max(rangeDays, 1) : 7;
    const cached = this.summaryCache.get(safeRange);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.summary;
    }

    if (this.pendingEvents.length) {
      try {
        await this.triggerFlush();
      } catch (error) {
        this.logger.warn(
          `Proceeding with stale analytics summary due to flush error: ${(error as Error).message}`,
        );
      }
    }

    const summary = await this.computeSummary(safeRange);
    this.storeSummary(safeRange, summary);
    return summary;
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async pruneOldAnalytics(): Promise<void> {
    if (this.pendingEvents.length) {
      try {
        await this.triggerFlush();
      } catch (error) {
        this.logger.warn(
          `Analytics buffer flush failed before pruning: ${(error as Error).message}`,
        );
      }
    }

    const cutoff = new Date(
      Date.now() - AnalyticsService.RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    const [eventResult, sessionResult] = await Promise.all([
      this.prisma.analyticsEvent.deleteMany({
        where: { createdAt: { lt: cutoff } },
      }),
      this.prisma.analyticsSession.deleteMany({
        where: {
          startedAt: { lt: cutoff },
          OR: [{ endedAt: null }, { endedAt: { lt: cutoff } }],
        },
      }),
    ]);

    if (eventResult.count > 0 || sessionResult.count > 0) {
      this.logger.log(
        `Pruned ${eventResult.count} analytics events and ${sessionResult.count} sessions older than ${AnalyticsService.RETENTION_DAYS} days`,
      );
    }

    this.clearSummaryCache();
  }

  @Cron('15 1 * * *')
  async warmAnalyticsRollups(): Promise<void> {
    const rangesToWarm = [1, 7, 30];

    if (this.pendingEvents.length) {
      try {
        await this.triggerFlush();
      } catch (error) {
        this.logger.warn(
          `Analytics buffer flush failed before warming cache: ${(error as Error).message}`,
        );
      }
    }

    for (const range of rangesToWarm) {
      try {
        const summary = await this.computeSummary(range);
        this.storeSummary(range, summary);
        this.logger.debug(`Warmed analytics summary cache for ${range}-day range`);
      } catch (error) {
        this.logger.warn(
          `Failed to warm analytics summary cache for ${range} days: ${(error as Error).message}`,
        );
      }
    }
  }
}
