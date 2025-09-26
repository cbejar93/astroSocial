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

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
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
    page: number,
    limit: number,
    currentUserId?: string,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(limit, 100));

    this.logger.log(
      `Fetching comments for post ${postId} (page=${safePage}, limit=${safeLimit})`,
    );

    const skip = (safePage - 1) * safeLimit;

    const [total, list] = await Promise.all([
      this.prisma.comment.count({ where: { postId, parentId: null } }),
      this.prisma.comment.findMany({
        where: { postId, parentId: null },
        orderBy: { createdAt: 'asc' },
        skip,
        take: safeLimit,
        include: {
          author: { select: { username: true, avatarUrl: true } },
          likedBy: currentUserId
            ? { where: { userId: currentUserId }, select: { id: true } }
            : false,
          replies: {
            orderBy: { createdAt: 'asc' },
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
    const replies = list.flatMap((c) => c.replies.map((r) => formatComment(r)));

    return {
      total,
      page: safePage,
      limit: safeLimit,
      comments,
      replies,
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
    return { success: true };
  }
}
