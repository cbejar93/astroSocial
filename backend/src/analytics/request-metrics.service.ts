import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

export interface RecordedRequestContext {
  route?: string;
  method?: string;
  statusCode: number;
  durationMs: number;
  requestId?: string;
  userId?: string;
  occurredAt?: Date;
}

@Injectable()
export class RequestMetricsService {
  private readonly logger = new Logger(RequestMetricsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async recordRequestMetric(
    context: RecordedRequestContext,
  ): Promise<void> {
    if (!Number.isFinite(context.durationMs) || context.durationMs < 0) {
      return;
    }

    try {
      await this.prisma.requestMetric.create({
        data: {
          route: context.route,
          method: context.method,
          statusCode: context.statusCode,
          durationMs: Math.round(context.durationMs),
          occurredAt: context.occurredAt ?? new Date(),
          requestId: context.requestId,
          userId: context.userId,
        },
      });

      this.analyticsService.invalidateSummaryCache();
    } catch (error) {
      this.logger.warn(
        `Failed to persist request metric: ${(error as Error).message}`,
      );
    }
  }
}
