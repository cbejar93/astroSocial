import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  async recordEvents(
    payload: IngestAnalyticsEventsDto,
    requestIp?: string,
  ): Promise<{ count: number; sessionId?: string }> {
    const { sessionKey, userId, userAgent, startedAt, endedAt, events } =
      payload;

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

    const result = await this.prisma.analyticsEvent.createMany({
      data: records,
    });
    this.logger.debug(`Recorded ${result.count} analytics events`);

    return { count: result.count, sessionId };
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
    const since = new Date(Date.now() - safeRange * 24 * 60 * 60 * 1000);

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
      rangeDays: safeRange,
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
}
