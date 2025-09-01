import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoungesService } from '../lounges/lounges.service';
import { Request } from 'express';

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;
const rateMap = new Map<string, { count: number; start: number }>();

@Controller('api/search')
export class SearchController {
  constructor(
    private readonly users: UsersService,
    private readonly lounges: LoungesService,
  ) {}

  @Get()
  async search(
    @Req() req: Request,
    @Query('type') type?: string,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const now = Date.now();
    const ip = req.ip ?? 'unknown';
    const record = rateMap.get(ip);
    if (!record || now - record.start > WINDOW_MS) {
      rateMap.set(ip, { count: 1, start: now });
    } else {
      if (record.count >= MAX_REQUESTS) {
        throw new HttpException(
          'Too many search requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      record.count++;
    }

    const query = q?.trim();
    if (!query) {
      throw new BadRequestException('Query parameter q is required');
    }
    const l = Math.min(parseInt(limit, 10) || 20, 50);
    const p = parseInt(page, 10) || 1;

    if (type === 'user' || type === 'users') {
      return { users: await this.users.searchUsers(query, p, l) };
    }
    if (type === 'lounge' || type === 'lounges') {
      return { lounges: await this.lounges.searchLounges(query, p, l) };
    }
    const [users, lounges] = await Promise.all([
      this.users.searchUsers(query, p, l),
      this.lounges.searchLounges(query, p, l),
    ]);
    return { users, lounges };
  }
}
