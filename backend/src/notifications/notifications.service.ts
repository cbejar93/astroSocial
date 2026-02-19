import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    actorId: string,
    type: NotificationType,
    postId?: string,
    commentId?: string,
  ) {
    if (userId === actorId) return; // don't notify self

    // Deduplicate POST_LIKE: suppress if an unread like notification already
    // exists for the same post within the last hour to avoid notification floods
    if (type === NotificationType.POST_LIKE && postId) {
      const recent = await this.prisma.notification.count({
        where: {
          userId,
          type: NotificationType.POST_LIKE,
          postId,
          read: false,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      });
      if (recent > 0) return;
    }

    return this.prisma.notification.create({
      data: { userId, actorId, type, postId, commentId },
    });
  }

  async list(userId: string) {
    const list = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { username: true, avatarUrl: true } },
        post: {
          select: {
            lounge: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return list.map((n) => ({
      id: n.id,
      type: n.type,
      timestamp: n.createdAt.toISOString(),
      postId: n.postId || undefined,
      commentId: n.commentId || undefined,
      loungeName: n.post?.lounge?.name || undefined,
      actor: {
        username: n.actor.username!,
        avatarUrl: n.actor.avatarUrl || '/defaultPfp.png',
      },
    }));
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }
}
