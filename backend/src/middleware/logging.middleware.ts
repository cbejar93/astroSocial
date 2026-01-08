// src/middleware/request-logging.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { RequestMetricsService } from '../analytics/request-metrics.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly requestMetrics: RequestMetricsService) {}

  use(req: Request & { user?: any }, res: Response, next: NextFunction) {
    const start = Date.now();
    const isApiRequest = req.originalUrl?.startsWith('/api');

    res.on('finish', () => {
      const userPart = req.user
        ? `User ${req.user.sub} <${req.user.email}> `
        : '';
      const ms = Date.now() - start;
      this.logger.log(
        `${userPart}${req.method} ${req.originalUrl} ${res.statusCode} — ${ms}ms`
      );

      if (!isApiRequest) {
        return;
      }

      void this.requestMetrics
        .recordRequestMetric({
          route: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          durationMs: ms,
          requestId: req.headers['x-request-id']?.toString(),
          userId: req.user?.sub,
        })
        .catch(() => {
          /* Already logged inside the service; do not block response */
        });
    });
    next();
  }
}
