import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AnalyticsService, AnalyticsSummary } from './analytics.service';
import { IngestAnalyticsEventsDto } from './dto/ingest-events.dto';

@Controller('api/analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analytics: AnalyticsService) {}

  @Post('events')
  async ingestEvents(
    @Body() body: IngestAnalyticsEventsDto,
    @Req() request: Request,
  ) {
    const forwardedFor = request.headers['x-forwarded-for'];
    const ip =
      typeof forwardedFor === 'string' && forwardedFor.length > 0
        ? forwardedFor.split(',')[0].trim()
        : request.ip;
    const result = await this.analytics.recordEvents(body, ip);
    this.logger.log(`Ingested ${result.count} analytics events`);
    return result;
  }

  @Get('summary')
  async summary(
    @Query('rangeDays') rangeDays = '7',
  ): Promise<AnalyticsSummary> {
    const parsed = Number.parseInt(rangeDays, 10);
    return this.analytics.getSummary(Number.isNaN(parsed) ? 7 : parsed);
  }
}
