import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { RequestMetricsService } from './request-metrics.service';

@Module({
  imports: [PrismaModule],
  providers: [AnalyticsService, RequestMetricsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, RequestMetricsService],
})
export class AnalyticsModule {}
