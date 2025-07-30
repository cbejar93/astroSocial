import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, actorId: string, type: NotificationType, postId?: string, commentId?: string) {
    if (userId === actorId) return; // don't notify self
    return this.prisma.notification.create({
      data: { userId, actorId, type, postId, commentId }
    });
  }

  async list(userId: string) {
    const list = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { username: true, avatarUrl: true } },
      },
    });
    await this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return list.map(n => ({
      id: n.id,
      type: n.type,
      timestamp: n.createdAt.toISOString(),
      postId: n.postId || undefined,
      commentId: n.commentId || undefined,
      actor: { username: n.actor.username!, avatarUrl: n.actor.avatarUrl || '' },
    }));
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }
}
