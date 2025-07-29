import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: { text: dto.text, authorId: userId, postId },
    });
  }

  async getCommentsForPost(postId: string) {
    const list = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { username: true, avatarUrl: true } },
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
    }));
  }

  async toggleLike(userId: string, commentId: string) {
    try {
      await this.prisma.commentLike.create({ data: { userId, commentId } });
      const updated = await this.prisma.comment.update({
        where: { id: commentId },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      });
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
      throw e;
    }
  }
}
