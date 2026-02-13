import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  createMockPrisma,
  createMockNotifications,
  createMockAnalytics,
} from '../test-utils/mocks';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let notifications: ReturnType<typeof createMockNotifications>;
  let analytics: ReturnType<typeof createMockAnalytics>;

  beforeEach(() => {
    prisma = createMockPrisma();
    notifications = createMockNotifications();
    analytics = createMockAnalytics();
    service = new CommentsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      analytics as unknown as AnalyticsService,
    );
  });

  describe('createComment', () => {
    const baseComment = {
      id: 'c1',
      text: 'hello',
      authorId: 'u1',
      postId: 'p1',
      parentId: null,
      likes: 0,
      createdAt: new Date('2024-06-01'),
      author: { username: 'alice', avatarUrl: 'a.png' },
    };

    it('creates a top-level comment and returns shaped response', async () => {
      prisma.comment.create.mockResolvedValue(baseComment);
      prisma.post.findUnique.mockResolvedValue({ authorId: 'author-1' });

      const result = await service.createComment('u1', 'p1', { text: 'hello' });
      expect(result.id).toBe('c1');
      expect(result.text).toBe('hello');
      expect(result.likedByMe).toBe(false);
    });

    it('creates a reply to a parent comment', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        authorId: 'parent-author',
        postId: 'p1',
        parentId: null,
      });
      prisma.comment.create.mockResolvedValue({
        ...baseComment,
        parentId: 'parent-1',
      });
      prisma.post.findUnique.mockResolvedValue({ authorId: 'author-1' });

      const result = await service.createComment('u1', 'p1', {
        text: 'reply',
        parentId: 'parent-1',
      });
      expect(result.parentId).toBe('parent-1');
      expect(notifications.create).toHaveBeenCalledTimes(2);
    });

    it('throws BadRequestException for invalid parentId (wrong post)', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        authorId: 'a1',
        postId: 'other-post',
        parentId: null,
      });

      await expect(
        service.createComment('u1', 'p1', { text: 'reply', parentId: 'bad-parent' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException for nested reply (parent has parentId)', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        authorId: 'a1',
        postId: 'p1',
        parentId: 'some-other-parent',
      });

      await expect(
        service.createComment('u1', 'p1', { text: 'reply', parentId: 'nested' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sends notification to post author', async () => {
      prisma.comment.create.mockResolvedValue(baseComment);
      prisma.post.findUnique.mockResolvedValue({ authorId: 'author-1' });

      await service.createComment('u1', 'p1', { text: 'hello' });
      expect(notifications.create).toHaveBeenCalledWith(
        'author-1', 'u1', 'COMMENT', 'p1', 'c1',
      );
    });

    it('records analytics event', async () => {
      prisma.comment.create.mockResolvedValue(baseComment);
      prisma.post.findUnique.mockResolvedValue({ authorId: 'author-1' });

      await service.createComment('u1', 'p1', { text: 'hello' });
      expect(analytics.recordCanonicalEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'comment.create' }),
      );
    });
  });

  describe('getCommentById', () => {
    it('returns shaped comment for existing comment', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        id: 'c1',
        text: 'hello',
        authorId: 'u1',
        createdAt: new Date('2024-06-01'),
        likes: 2,
        parentId: null,
        author: { username: 'alice', avatarUrl: null },
        likedBy: [],
      });

      const result = await service.getCommentById('c1');
      expect(result.id).toBe('c1');
      expect(result.avatarUrl).toBe('/defaultPfp.png');
    });

    it('throws NotFoundException for missing comment', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.getCommentById('nonexistent'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('toggleLike', () => {
    it('likes a comment and increments counter', async () => {
      prisma.commentLike.create.mockResolvedValue({});
      prisma.comment.update.mockResolvedValue({
        likes: 5,
        authorId: 'comment-author',
        postId: 'p1',
      });

      const result = await service.toggleLike('u1', 'c1');
      expect(result).toEqual({ liked: true, count: 5 });
      expect(notifications.create).toHaveBeenCalled();
    });

    it('unlikes a comment on duplicate (P2002) and decrements counter', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('', {
        code: 'P2002',
        clientVersion: '0',
      });
      prisma.commentLike.create.mockRejectedValue(error);
      prisma.commentLike.delete.mockResolvedValue({});
      prisma.comment.update.mockResolvedValue({ likes: 3 });

      const result = await service.toggleLike('u1', 'c1');
      expect(result).toEqual({ liked: false, count: 3 });
    });

    it('sends notification on like', async () => {
      prisma.commentLike.create.mockResolvedValue({});
      prisma.comment.update.mockResolvedValue({
        likes: 1,
        authorId: 'author-1',
        postId: 'p1',
      });

      await service.toggleLike('u1', 'c1');
      expect(notifications.create).toHaveBeenCalledWith(
        'author-1', 'u1', 'COMMENT_LIKE', 'p1', 'c1',
      );
    });
  });

  describe('deleteComment', () => {
    it('deletes comment when user is author', async () => {
      prisma.commentLike.deleteMany.mockResolvedValue({});
      prisma.comment.deleteMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      const result = await service.deleteComment('u1', 'c1');
      expect(result).toEqual({ success: true });
    });

    it('throws ForbiddenException when user is not the author', async () => {
      prisma.commentLike.deleteMany.mockResolvedValue({});
      prisma.comment.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.deleteComment('u1', 'c1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('records analytics event on deletion', async () => {
      prisma.commentLike.deleteMany.mockResolvedValue({});
      prisma.comment.deleteMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      await service.deleteComment('u1', 'c1');
      expect(analytics.recordCanonicalEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'comment.delete' }),
      );
    });
  });

  describe('getCommentsForPost', () => {
    it('returns paginated top-level comments with replies', async () => {
      prisma.comment.count.mockResolvedValue(1);
      prisma.comment.findMany.mockResolvedValue([
        {
          id: 'c1',
          text: 'hello',
          authorId: 'u1',
          createdAt: new Date('2024-06-01'),
          likes: 0,
          parentId: null,
          author: { username: 'alice', avatarUrl: null },
          likedBy: [],
          replies: [
            {
              id: 'c2',
              text: 'reply',
              authorId: 'u2',
              createdAt: new Date('2024-06-02'),
              likes: 0,
              parentId: 'c1',
              author: { username: 'bob', avatarUrl: null },
              likedBy: [],
            },
          ],
        },
      ]);

      const result = await service.getCommentsForPost(
        'p1',
        { page: 1, limit: 20, cursor: null },
      );
      expect(result.comments).toHaveLength(1);
      expect(result.replies).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('throws BadRequestException for invalid cursor', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        id: 'c1',
        postId: 'other-post',
        createdAt: new Date(),
        parentId: null,
      });

      await expect(
        service.getCommentsForPost('p1', { cursor: 'c1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
