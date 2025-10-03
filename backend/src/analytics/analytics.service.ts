import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IngestAnalyticsEventsDto } from './dto/ingest-events.dto';

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

interface AnalyticsSummary {
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
}

@Injectable()
export class AnalyticsService implements OnModuleDestroy {
  private static readonly BATCH_SIZE = 50;
  private static readonly FLUSH_INTERVAL_MS = 5_000;
  private static readonly SUMMARY_CACHE_TTL_MS = 5 * 60 * 1000;
  private static readonly RETENTION_DAYS = 180;

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

  async getSummary(rangeDays: number) {
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

  @Cron(CronExpression.EVERY_DAY_AT_0100)
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

  @Cron(CronExpression.EVERY_DAY_AT_0115)
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
