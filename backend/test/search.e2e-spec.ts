import { UsersService } from '../src/users/users.service';
import { LoungesService } from '../src/lounges/lounges.service';
import { ArticlesService } from '../src/articles/articles.service';
import { SearchController } from '../src/search/search.controller';

describe('Search services', () => {
  it('searchUsers returns matching users', async () => {
    const prisma: any = {
      user: {
        findMany: jest.fn().mockResolvedValue([
          { id: '1', username: 'alice', avatarUrl: 'a.png' },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: (promises: any[]) => Promise.all(promises),
    };
    const service = new UsersService({} as any, {} as any, prisma);
    const result = await service.searchUsers('ali', 1, 20);
    expect(result).toEqual({
      results: [{ id: '1', username: 'alice', avatarUrl: 'a.png' }],
      total: 1,
      page: 1,
      limit: 20,
    });
  });

  it('searchLounges returns matching lounges', async () => {
    const prisma: any = {
      lounge: {
        findMany: jest.fn().mockResolvedValue([
          { id: '1', name: 'space', bannerUrl: 'b.png' },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: (promises: any[]) => Promise.all(promises),
    };
    const service = new LoungesService(prisma, {} as any);
    const result = await service.searchLounges('spa', 1, 20);
    expect(result).toEqual({
      results: [{ id: '1', name: 'space', bannerUrl: 'b.png' }],
      total: 1,
      page: 1,
      limit: 20,
    });
  });

  it('search controller returns users, lounges and articles when type is missing', async () => {
    const users: any = {
      searchUsers: jest.fn().mockResolvedValue({
        results: [{ id: '1', username: 'alice', avatarUrl: 'a.png' }],
        total: 1,
        page: 1,
        limit: 20,
      }),
    };
    const lounges: any = {
      searchLounges: jest.fn().mockResolvedValue({
        results: [{ id: '2', name: 'space', bannerUrl: 'b.png' }],
        total: 1,
        page: 1,
        limit: 20,
      }),
    };
    const articles: any = {
      searchArticles: jest.fn().mockResolvedValue({
        results: [{ id: '3', title: 'Astro 101', slug: 'astro-101', coverImageUrl: null }],
        total: 1,
        page: 1,
        limit: 20,
      }),
    };
    const controller = new SearchController(users, lounges, articles);
    const req: any = { ip: '127.0.0.1' };
    const result = await controller.search(req, undefined, 'a');
    expect(result).toEqual({
      users: {
        results: [{ id: '1', username: 'alice', avatarUrl: 'a.png' }],
        total: 1,
        page: 1,
        limit: 20,
      },
      lounges: {
        results: [{ id: '2', name: 'space', bannerUrl: 'b.png' }],
        total: 1,
        page: 1,
        limit: 20,
      },
      articles: {
        results: [{ id: '3', title: 'Astro 101', slug: 'astro-101', coverImageUrl: null }],
        total: 1,
        page: 1,
        limit: 20,
      },
    });
  });
});
