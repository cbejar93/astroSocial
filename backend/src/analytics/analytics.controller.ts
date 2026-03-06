import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AnalyticsService, AnalyticsSummary } from './analytics.service';
import { IngestAnalyticsEventsDto } from './dto/ingest-events.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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

  @UseGuards(JwtAuthGuard)
  @Get('summary')
  async summary(
    @Req() req: Request & { user: { role: string } },
    @Query('rangeDays') rangeDays = '7',
  ): Promise<AnalyticsSummary> {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    const parsed = Number.parseInt(rangeDays, 10);
    return this.analytics.getSummary(Number.isNaN(parsed) ? 7 : parsed);
  }
}
