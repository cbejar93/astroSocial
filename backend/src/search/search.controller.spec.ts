import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { SearchController } from './search.controller';
import { UsersService } from '../users/users.service';
import { LoungesService } from '../lounges/lounges.service';
import { ArticlesService } from '../articles/articles.service';
import { Request } from 'express';

// The rateMap is module-level state. Re-requiring the module between tests
// is the only way to guarantee a clean slate, so we use jest.resetModules().
describe('SearchController', () => {
  let controller: SearchController;
  let users: { searchUsers: jest.Mock };
  let lounges: { searchLounges: jest.Mock };
  let articles: { searchArticles: jest.Mock };

  const makeReq = (ip = '127.0.0.1') => ({ ip }) as unknown as Request;

  beforeEach(() => {
    users = { searchUsers: jest.fn() };
    lounges = { searchLounges: jest.fn() };
    articles = { searchArticles: jest.fn() };
    controller = new SearchController(
      users as unknown as UsersService,
      lounges as unknown as LoungesService,
      articles as unknown as ArticlesService,
    );
  });

  describe('search – validation', () => {
    it('throws BadRequestException when q is missing', async () => {
      await expect(
        controller.search(makeReq(), undefined, undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when q is empty whitespace', async () => {
      await expect(
        controller.search(makeReq(), undefined, '   '),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('search – routing by type', () => {
    it('returns users when type=user', async () => {
      const userResults = { results: [{ id: 'u1' }], total: 1, page: 1, limit: 20 };
      users.searchUsers.mockResolvedValue(userResults);

      const result = await controller.search(makeReq(), 'user', 'alice');
      expect(result).toEqual({ users: userResults });
      expect(users.searchUsers).toHaveBeenCalledWith('alice', 1, 20);
      expect(lounges.searchLounges).not.toHaveBeenCalled();
      expect(articles.searchArticles).not.toHaveBeenCalled();
    });

    it('returns users when type=users', async () => {
      users.searchUsers.mockResolvedValue([]);

      const result = await controller.search(makeReq(), 'users', 'alice');
      expect(result).toHaveProperty('users');
    });

    it('returns lounges when type=lounge', async () => {
      const loungeResults = { results: [{ id: 'l1' }], total: 1, page: 1, limit: 20 };
      lounges.searchLounges.mockResolvedValue(loungeResults);

      const result = await controller.search(makeReq(), 'lounge', 'space');
      expect(result).toEqual({ lounges: loungeResults });
      expect(lounges.searchLounges).toHaveBeenCalledWith('space', 1, 20);
    });

    it('returns lounges when type=lounges', async () => {
      lounges.searchLounges.mockResolvedValue([]);

      const result = await controller.search(makeReq(), 'lounges', 'space');
      expect(result).toHaveProperty('lounges');
    });

    it('returns articles when type=article', async () => {
      const articleResults = { results: [{ id: 'a1' }], total: 1, page: 1, limit: 20 };
      articles.searchArticles.mockResolvedValue(articleResults);

      const result = await controller.search(makeReq(), 'article', 'nebula');
      expect(result).toEqual({ articles: articleResults });
      expect(articles.searchArticles).toHaveBeenCalledWith('nebula', 1, 20);
    });

    it('returns articles when type=articles', async () => {
      articles.searchArticles.mockResolvedValue([]);

      const result = await controller.search(makeReq(), 'articles', 'nebula');
      expect(result).toHaveProperty('articles');
    });

    it('runs all three searches in parallel when type is omitted', async () => {
      users.searchUsers.mockResolvedValue({ results: [], total: 0, page: 1, limit: 20 });
      lounges.searchLounges.mockResolvedValue({ results: [], total: 0, page: 1, limit: 20 });
      articles.searchArticles.mockResolvedValue({ results: [], total: 0, page: 1, limit: 20 });

      const result = await controller.search(makeReq(), undefined, 'test');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('lounges');
      expect(result).toHaveProperty('articles');
      expect(users.searchUsers).toHaveBeenCalledWith('test', 1, 20);
      expect(lounges.searchLounges).toHaveBeenCalledWith('test', 1, 20);
      expect(articles.searchArticles).toHaveBeenCalledWith('test', 1, 20);
    });
  });

  describe('search – pagination parsing', () => {
    it('parses page and limit from query strings', async () => {
      users.searchUsers.mockResolvedValue([]);

      await controller.search(makeReq(), 'user', 'alice', '3', '15');
      expect(users.searchUsers).toHaveBeenCalledWith('alice', 3, 15);
    });

    it('defaults to page=1 and limit=20 for invalid values', async () => {
      users.searchUsers.mockResolvedValue([]);

      await controller.search(makeReq(), 'user', 'alice', 'bad', 'bad');
      expect(users.searchUsers).toHaveBeenCalledWith('alice', 1, 20);
    });

    it('caps limit at 50', async () => {
      users.searchUsers.mockResolvedValue([]);

      await controller.search(makeReq(), 'user', 'alice', '1', '100');
      expect(users.searchUsers).toHaveBeenCalledWith('alice', 1, 50);
    });
  });

  describe('search – rate limiting', () => {
    it('allows requests up to the MAX_REQUESTS threshold', async () => {
      users.searchUsers.mockResolvedValue([]);
      // Use a unique IP to avoid pollution from other tests
      const req = makeReq('10.0.0.1');

      for (let i = 0; i < 30; i++) {
        await expect(
          controller.search(req, 'user', 'alice'),
        ).resolves.toBeDefined();
      }
    });

    it('throws 429 after exceeding MAX_REQUESTS within the window', async () => {
      users.searchUsers.mockResolvedValue([]);
      const req = makeReq('10.0.0.2');

      for (let i = 0; i < 30; i++) {
        await controller.search(req, 'user', 'alice');
      }

      await expect(
        controller.search(req, 'user', 'alice'),
      ).rejects.toBeInstanceOf(HttpException);

      try {
        await controller.search(req, 'user', 'alice');
      } catch (err: unknown) {
        expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it('uses unknown as ip when req.ip is undefined', async () => {
      users.searchUsers.mockResolvedValue([]);
      const req = { ip: undefined } as unknown as Request;

      await expect(controller.search(req, 'user', 'alice')).resolves.toBeDefined();
    });
  });
});
