// src/middleware/request-logging.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request & { user?: any }, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const userPart = req.user
        ? `User ${req.user.sub} <${req.user.email}> `
        : '';
      const ms = Date.now() - start;
      this.logger.log(
        `${userPart}${req.method} ${req.originalUrl} ${res.statusCode} — ${ms}ms`
      );
    });
    next();
  }
}