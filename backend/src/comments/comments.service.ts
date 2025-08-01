import { Injectable, Logger, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class CommentsService {

  private readonly logger = new Logger(CommentsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    this.logger.log(`User ${userId} creating comment on post ${postId}`);

    const comment = await this.prisma.comment.create({
      data: { text: dto.text, authorId: userId, postId },
      include: { author: { select: { username: true, avatarUrl: true } } },
    });

    const post = await this.prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (post) {
      await this.notifications.create(post.authorId, userId, NotificationType.COMMENT, postId, comment.id);
    }

    return {
      id: comment.id,
      text: comment.text,
      authorId: comment.authorId,
      username: comment.author.username!,
      avatarUrl: comment.author.avatarUrl ?? '',
      timestamp: comment.createdAt.toISOString(),
      likes: comment.likes,
      likedByMe: false,
    };
  }

  async getCommentsForPost(postId: string, currentUserId?: string) {

    this.logger.log(`Fetching comments for post ${postId}`);

    const list = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { username: true, avatarUrl: true } },
        likedBy: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
      },
    });
    return list.map(c => ({
      id: c.id,
      text: c.text,
      authorId: c.authorId,
      username: c.author.username!,
      avatarUrl: c.author.avatarUrl ?? '',
      timestamp: c.createdAt.toISOString(),
      likes: c.likes,
      likedByMe: currentUserId ? c.likedBy.length > 0 : false,
    }));
  }

  async toggleLike(userId: string, commentId: string) {
    this.logger.log(`User ${userId} toggling like on comment ${commentId}`);

    try {
      await this.prisma.commentLike.create({ data: { userId, commentId } });
      const updated = await this.prisma.comment.update({
        where: { id: commentId },
        data: { likes: { increment: 1 } },
        select: { likes: true, authorId: true, postId: true },
      });
      await this.notifications.create(
        updated.authorId,
        userId,
        NotificationType.COMMENT_LIKE,
        updated.postId,
        commentId,
      );
      return { liked: true, count: updated.likes };
    } catch (e: any) {
      if (e.code === 'P2002') {
        await this.prisma.commentLike.delete({
          where: {
            one_like_per_user_per_comment: { commentId, userId },
          },
        });
        const updated = await this.prisma.comment.update({
          where: { id: commentId },
          data: { likes: { decrement: 1 } },
          select: { likes: true },
        });
        return { liked: false, count: updated.likes };
      }

      this.logger.error(`Failed to toggle like on ${commentId}`, e.stack);

      throw e;
    }
  }

  async deleteComment(userId: string, commentId: string) {
    await this.prisma.commentLike.deleteMany({ where: { commentId } });
    const { count } = await this.prisma.comment.deleteMany({
      where: { id: commentId, authorId: userId },
    });
    if (count === 0) {
      throw new ForbiddenException(`Cannot delete comment ${commentId}`);
    }
    return { success: true };
  }
}
