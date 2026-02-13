import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InteractionType } from '@prisma/client';
import { PostsService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  createMockPrisma,
  createMockStorage,
  createMockNotifications,
  createMockAnalytics,
} from '../test-utils/mocks';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let storage: ReturnType<typeof createMockStorage>;
  let notifications: ReturnType<typeof createMockNotifications>;
  let analytics: ReturnType<typeof createMockAnalytics>;

  beforeEach(() => {
    prisma = createMockPrisma();
    storage = createMockStorage();
    notifications = createMockNotifications();
    analytics = createMockAnalytics();
    service = new PostsService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
      notifications as unknown as NotificationsService,
      analytics as unknown as AnalyticsService,
    );
  });

  describe('create', () => {
    it('creates a post with body only', async () => {
      const post = { id: 'post-1', body: 'hello', authorId: 'u1' };
      prisma.post.create.mockResolvedValue(post);

      const result = await service.create('u1', { body: 'hello' });
      expect(result).toEqual(post);
      expect(prisma.post.create).toHaveBeenCalled();
    });

    it('creates a post with an uploaded image file', async () => {
      const file = {
        originalname: 'pic.png',
        mimetype: 'image/png',
        buffer: Buffer.from('img'),
      } as Express.Multer.File;
      storage.uploadFile.mockResolvedValue('https://cdn/pic.png');
      prisma.post.create.mockResolvedValue({ id: 'post-2' });

      await service.create('u1', { body: 'with image' }, file);
      expect(storage.uploadFile).toHaveBeenCalled();
      expect(prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ imageUrl: 'https://cdn/pic.png' }),
        }),
      );
    });

    it('throws BadRequestException when lounge post missing title', async () => {
      await expect(
        service.create('u1', { body: 'hello', loungeId: 'l1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when lounge post missing body', async () => {
      await expect(
        service.create('u1', { title: 'title', body: '', loungeId: 'l1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when non-lounge post missing body', async () => {
      await expect(
        service.create('u1', { body: '' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when body exceeds 314 chars for non-lounge post', async () => {
      await expect(
        service.create('u1', { body: 'a'.repeat(315) }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException for invalid YouTube URL', async () => {
      await expect(
        service.create('u1', { body: 'hi', youtubeUrl: 'https://vimeo.com/123' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException for non-HTTP linkUrl', async () => {
      await expect(
        service.create('u1', { body: 'hi', linkUrl: 'ftp://files.com/a' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws InternalServerErrorException when storage upload fails', async () => {
      const file = {
        originalname: 'pic.png',
        mimetype: 'image/png',
        buffer: Buffer.from('img'),
      } as Express.Multer.File;
      storage.uploadFile.mockRejectedValue(new Error('upload fail'));

      await expect(
        service.create('u1', { body: 'hello' }, file),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('throws InternalServerErrorException when prisma create fails', async () => {
      prisma.post.create.mockRejectedValue(new Error('db fail'));

      await expect(
        service.create('u1', { body: 'hello' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('toggleLike', () => {
    it('creates a like and increments counter', async () => {
      prisma.postInteraction.create.mockResolvedValue({ id: 'i1' });
      prisma.post.update.mockResolvedValue({ likes: 5, authorId: 'author-1' });

      const result = await service.toggleLike('u1', 'post-1');
      expect(result).toEqual({ liked: true, count: 5 });
      expect(notifications.create).toHaveBeenCalledWith(
        'author-1', 'u1', 'POST_LIKE', 'post-1',
      );
    });

    it('removes a like on duplicate (P2002) and decrements counter', async () => {
      prisma.postInteraction.create.mockRejectedValue({ code: 'P2002' });
      prisma.postInteraction.delete.mockResolvedValue({});
      prisma.post.update.mockResolvedValue({ likes: 3 });

      const result = await service.toggleLike('u1', 'post-1');
      expect(result).toEqual({ liked: false, count: 3 });
    });

    it('records analytics event on like', async () => {
      prisma.postInteraction.create.mockResolvedValue({ id: 'i1' });
      prisma.post.update.mockResolvedValue({ likes: 1, authorId: 'a1' });

      await service.toggleLike('u1', 'post-1');
      expect(analytics.recordCanonicalEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'post.like' }),
      );
    });
  });

  describe('interact', () => {
    it('records a SHARE interaction and increments shares counter', async () => {
      prisma.postInteraction.create.mockResolvedValue({ id: 'i1' });
      prisma.post.update.mockResolvedValue({});
      prisma.post.findUnique.mockResolvedValue({ shares: 2 });

      const result = await service.interact('u1', 'post-1', InteractionType.SHARE);
      expect(result).toEqual({ type: InteractionType.SHARE, count: 2 });
    });

    it('throws ConflictException on duplicate interaction', async () => {
      prisma.postInteraction.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.interact('u1', 'post-1', InteractionType.SHARE),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('records a REPOST interaction and creates repost copy', async () => {
      prisma.postInteraction.create.mockResolvedValue({ id: 'i1' });
      prisma.post.update.mockResolvedValue({});
      prisma.post.findUnique
        .mockResolvedValueOnce({
          title: 't', body: 'b', imageUrl: null, youtubeUrl: null,
          linkUrl: null, linkTitle: null, linkDescription: null,
          linkImageUrl: null, linkSiteName: null, loungeId: null,
          authorId: 'original-author',
        })
        .mockResolvedValueOnce({ reposts: 3 });
      prisma.post.create.mockResolvedValue({ id: 'repost-1' });

      const result = await service.interact('u1', 'post-1', InteractionType.REPOST);
      expect(result).toEqual({ type: InteractionType.REPOST, count: 3 });
      expect(prisma.post.create).toHaveBeenCalled();
    });
  });

  describe('savePost', () => {
    it('saves a post and returns count', async () => {
      prisma.savedPost.create.mockResolvedValue({});
      prisma.savedPost.count.mockResolvedValue(5);

      const result = await service.savePost('u1', 'post-1');
      expect(result).toEqual({ saved: true, count: 5 });
    });

    it('is idempotent on duplicate save (P2002 ignored)', async () => {
      prisma.savedPost.create.mockRejectedValue({ code: 'P2002' });
      prisma.savedPost.count.mockResolvedValue(5);

      const result = await service.savePost('u1', 'post-1');
      expect(result).toEqual({ saved: true, count: 5 });
    });
  });

  describe('unsavePost', () => {
    it('unsaves a post and returns count', async () => {
      prisma.savedPost.delete.mockResolvedValue({});
      prisma.savedPost.count.mockResolvedValue(4);

      const result = await service.unsavePost('u1', 'post-1');
      expect(result).toEqual({ saved: false, count: 4 });
    });

    it('handles unsaving a post that was not saved (P2025 ignored)', async () => {
      prisma.savedPost.delete.mockRejectedValue({ code: 'P2025' });
      prisma.savedPost.count.mockResolvedValue(0);

      const result = await service.unsavePost('u1', 'post-1');
      expect(result).toEqual({ saved: false, count: 0 });
    });
  });

  describe('deletePost', () => {
    it('deletes post and all related records in transaction', async () => {
      prisma.$transaction.mockResolvedValue([
        {}, {}, {}, {}, {}, { count: 1 },
      ]);

      await expect(service.deletePost('u1', 'post-1')).resolves.toBeUndefined();
    });

    it('throws ForbiddenException when user does not own the post', async () => {
      prisma.$transaction.mockResolvedValue([
        {}, {}, {}, {}, {}, { count: 0 },
      ]);

      await expect(
        service.deletePost('u1', 'post-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getPostById', () => {
    const basePost = {
      id: 'post-1',
      authorId: 'a1',
      originalAuthorId: 'a1',
      title: 'Test',
      body: 'body text',
      imageUrl: null,
      youtubeUrl: null,
      linkUrl: null,
      linkTitle: null,
      linkDescription: null,
      linkImageUrl: null,
      linkSiteName: null,
      loungeId: null,
      likes: 3,
      shares: 1,
      reposts: 0,
      createdAt: new Date('2024-06-01'),
      author: { username: 'alice', avatarUrl: 'a.png', createdAt: new Date(), _count: { posts: 5 } },
      originalAuthor: null,
      _count: { comments: 2, savedBy: 1 },
    };

    it('returns shaped post data for existing post', async () => {
      prisma.post.findUnique.mockResolvedValue(basePost);

      const result = await service.getPostById('post-1');
      expect(result.id).toBe('post-1');
      expect(result.username).toBe('alice');
      expect(result.stars).toBe(3);
      expect(result.likedByMe).toBe(false);
    });

    it('throws NotFoundException for missing post', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(
        service.getPostById('nonexistent'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('includes likedByMe=true when user has liked the post', async () => {
      prisma.post.findUnique.mockResolvedValue(basePost);
      prisma.postInteraction.findUnique.mockResolvedValue({ id: 'like-1' });

      const result = await service.getPostById('post-1', 'u1');
      expect(result.likedByMe).toBe(true);
    });
  });

  describe('getWeightedFeed', () => {
    it('returns paginated feed sorted by computed score', async () => {
      const now = new Date();
      prisma.post.findMany.mockResolvedValue([
        {
          id: 'p1', authorId: 'a1', originalAuthorId: 'a1',
          title: '', body: 'hi', imageUrl: null, youtubeUrl: null,
          linkUrl: null, linkTitle: null, linkDescription: null,
          linkImageUrl: null, linkSiteName: null, loungeId: null,
          likes: 10, shares: 0, reposts: 0, createdAt: now,
          author: { id: 'a1', username: 'alice', avatarUrl: 'a.png' },
          originalAuthor: null,
          _count: { comments: 0, savedBy: 0 },
          interactions: [],
        },
      ]);

      const result = await service.getWeightedFeed(null, 1, 20);
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].caption).toBe('hi');
      expect(result.page).toBe(1);
    });

    it('returns empty feed when no posts exist', async () => {
      prisma.post.findMany.mockResolvedValue([]);

      const result = await service.getWeightedFeed(null, 1, 20);
      expect(result.posts).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
