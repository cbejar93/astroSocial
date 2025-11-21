import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, Prisma } from '@prisma/client';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly analytics: AnalyticsService,
  ) {}

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    this.logger.log(`User ${userId} creating comment on post ${postId}`);

    let parentAuthorId: string | null = null;
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { authorId: true, postId: true, parentId: true },
      });
      if (!parent || parent.postId !== postId || parent.parentId) {
        throw new BadRequestException('Invalid parent comment');
      }
      parentAuthorId = parent.authorId;
    }

    const comment = await this.prisma.comment.create({
      data: {
        text: dto.text,
        authorId: userId,
        postId,
        parentId: dto.parentId,
      },
      include: { author: { select: { username: true, avatarUrl: true } } },
    });

    await this.analytics.recordCanonicalEvent({
      userId,
      type: 'comment.create',
      targetType: 'post',
      targetId: postId,
      metadata: {
        commentId: comment.id,
        parentId: comment.parentId ?? null,
      },
    });

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (post) {
      await this.notifications.create(
        post.authorId,
        userId,
        NotificationType.COMMENT,
        postId,
        comment.id,
      );
    }
    if (parentAuthorId) {
      await this.notifications.create(
        parentAuthorId,
        userId,
        NotificationType.COMMENT,
        postId,
        comment.id,
      );
    }

    return {
      id: comment.id,
      text: comment.text,
      authorId: comment.authorId,
      username: comment.author.username!,
      avatarUrl: comment.author.avatarUrl ?? '/defaultPfp.png',
      timestamp: comment.createdAt.toISOString(),
      likes: comment.likes,
      likedByMe: false,
      parentId: comment.parentId,
    };
  }

  async getCommentsForPost(
    postId: string,
    options: { page?: number; limit?: number; cursor?: string | null },
    currentUserId?: string,
  ) {
    const safePage = Math.max(1, options.page ?? 1);
    const safeLimit = Math.max(1, Math.min(options.limit ?? 20, 100));
    const useCursor = Boolean(options.cursor);
    const skip = useCursor ? 0 : (safePage - 1) * safeLimit;
    const take = useCursor ? safeLimit + 1 : safeLimit;

    const cursorComment = options.cursor
      ? await this.prisma.comment.findUnique({
          where: { id: options.cursor },
          select: { id: true, postId: true, createdAt: true, parentId: true },
        })
      : null;

    if (cursorComment && (cursorComment.postId !== postId || cursorComment.parentId)) {
      throw new BadRequestException('Invalid cursor');
    }

    const cursorFilter: Prisma.CommentWhereInput = cursorComment
      ? {
          OR: [
            { createdAt: { gt: cursorComment.createdAt } },
            { createdAt: cursorComment.createdAt, id: { gt: cursorComment.id } },
          ],
        }
      : {};

    const [total, list] = await Promise.all([
      this.prisma.comment.count({ where: { postId, parentId: null } }),
      this.prisma.comment.findMany({
        where: { postId, parentId: null, ...cursorFilter },
        orderBy: [
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
        skip,
        take,
        include: {
          author: { select: { username: true, avatarUrl: true } },
          likedBy: currentUserId
            ? { where: { userId: currentUserId }, select: { id: true } }
            : false,
          replies: {
            orderBy: [
              { createdAt: 'asc' },
              { id: 'asc' },
            ],
            include: {
              author: { select: { username: true, avatarUrl: true } },
              likedBy: currentUserId
                ? { where: { userId: currentUserId }, select: { id: true } }
                : false,
            },
          },
        },
      }),
    ]);

    const formatComment = (comment: {
      id: string;
      text: string;
      authorId: string;
      createdAt: Date;
      likes: number;
      parentId: string | null;
      author: { username: string | null; avatarUrl: string | null };
      likedBy?: { id: string }[];
    }) => ({
      id: comment.id,
      text: comment.text,
      authorId: comment.authorId,
      username: comment.author.username ?? '',
      avatarUrl: comment.author.avatarUrl ?? '/defaultPfp.png',
      timestamp: comment.createdAt.toISOString(),
      likes: comment.likes,
      likedByMe: currentUserId ? (comment.likedBy?.length ?? 0) > 0 : false,
      parentId: comment.parentId,
    });

    const comments = list.map((c) => formatComment(c));
    const replies = list
      .slice(0, safeLimit)
      .flatMap((c) => c.replies.map((r) => formatComment(r)));

    const hasMore = useCursor
      ? list.length > safeLimit
      : skip + list.length < total;
    const nextCursor = hasMore
      ? comments[Math.min(safeLimit - 1, comments.length - 1)]?.id ?? null
      : null;

    return {
      total,
      page: useCursor ? undefined : safePage,
      limit: safeLimit,
      comments: comments.slice(0, safeLimit),
      replies,
      nextCursor,
      hasMore,
    };
  }

  async getCommentById(commentId: string, currentUserId?: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: { select: { username: true, avatarUrl: true } },
        likedBy: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    return {
      id: comment.id,
      text: comment.text,
      authorId: comment.authorId,
      username: comment.author.username ?? '',
      avatarUrl: comment.author.avatarUrl ?? '/defaultPfp.png',
      timestamp: comment.createdAt.toISOString(),
      likes: comment.likes,
      likedByMe: currentUserId ? comment.likedBy.length > 0 : false,
      parentId: comment.parentId,
    };
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
      await this.analytics.recordCanonicalEvent({
        userId,
        type: 'comment.like',
        targetType: 'comment',
        targetId: commentId,
        metadata: { count: updated.likes },
      });
      return { liked: true, count: updated.likes };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
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
        await this.analytics.recordCanonicalEvent({
          userId,
          type: 'comment.unlike',
          targetType: 'comment',
          targetId: commentId,
          metadata: { count: updated.likes },
        });
        return { liked: false, count: updated.likes };
      }

      this.logger.error(
        `Failed to toggle like on ${commentId}`,
        e instanceof Error ? e.stack : undefined,
      );

      throw e;
    }
  }

  async deleteComment(userId: string, commentId: string) {
    await this.prisma.commentLike.deleteMany({
      where: {
        OR: [{ commentId }, { comment: { parentId: commentId } }],
      },
    });

    const { count } = await this.prisma.comment.deleteMany({
      where: { id: commentId, authorId: userId },
    });
    if (count === 0) {
      throw new ForbiddenException(`Cannot delete comment ${commentId}`);
    }

    await this.prisma.comment.deleteMany({ where: { parentId: commentId } });
    await this.analytics.recordCanonicalEvent({
      userId,
      type: 'comment.delete',
      targetType: 'comment',
      targetId: commentId,
    });
    return { success: true };
  }
}
