import {
  Controller,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoungesService } from '../lounges/lounges.service';
import { ArticlesService } from '../articles/articles.service';

// Rate limiting for /api/search is handled by the express-rate-limit middleware
// registered in main.ts (30 req / 60 s per IP).

@Controller('api/search')
export class SearchController {
  constructor(
    private readonly users: UsersService,
    private readonly lounges: LoungesService,
    private readonly articles: ArticlesService,
  ) {}

  @Get()
  async search(
    @Query('type') type?: string,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
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
    if (type === 'article' || type === 'articles') {
      return { articles: await this.articles.searchArticles(query, p, l) };
    }
    const [users, lounges, articles] = await Promise.all([
      this.users.searchUsers(query, p, l),
      this.lounges.searchLounges(query, p, l),
      this.articles.searchArticles(query, p, l),
    ]);
    return { users, lounges, articles };
  }
}
