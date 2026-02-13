import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma } from '../test-utils/mocks';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a notification in the database', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'n1' });

      await service.create(
        'recipient',
        'actor',
        NotificationType.POST_LIKE,
        'p1',
      );
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'recipient',
          actorId: 'actor',
          type: NotificationType.POST_LIKE,
          postId: 'p1',
          commentId: undefined,
        },
      });
    });

    it('skips notification when userId === actorId (self-notification)', async () => {
      const result = await service.create(
        'user-1',
        'user-1',
        NotificationType.COMMENT,
        'p1',
      );
      expect(result).toBeUndefined();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('creates notification with optional commentId', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'n1' });

      await service.create(
        'recipient',
        'actor',
        NotificationType.COMMENT_LIKE,
        'p1',
        'c1',
      );
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ commentId: 'c1' }),
      });
    });
  });

  describe('list', () => {
    it('returns formatted notification list and marks as read', async () => {
      prisma.notification.findMany.mockResolvedValue([
        {
          id: 'n1',
          type: NotificationType.POST_LIKE,
          createdAt: new Date('2024-06-01'),
          postId: 'p1',
          commentId: null,
          actor: { username: 'alice', avatarUrl: 'a.png' },
          post: { lounge: null },
        },
      ]);
      prisma.notification.updateMany.mockResolvedValue({});

      const result = await service.list('u1');
      expect(result).toHaveLength(1);
      expect(result[0].actor.username).toBe('alice');
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', read: false },
        data: { read: true },
      });
    });

    it('returns empty array when no notifications exist', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.updateMany.mockResolvedValue({});

      const result = await service.list('u1');
      expect(result).toEqual([]);
    });
  });

  describe('countUnread', () => {
    it('returns count of unread notifications', async () => {
      prisma.notification.count.mockResolvedValue(7);

      const result = await service.countUnread('u1');
      expect(result).toBe(7);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'u1', read: false },
      });
    });
  });
});
