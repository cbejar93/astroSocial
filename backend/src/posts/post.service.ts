// src/posts/posts.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InteractionType, Post, NotificationType } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedResponseDto } from './dto/feed.dto';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ModerationService } from '../moderation/moderation.service';
import { CheckModerationDto } from '../moderation/dto/check-moderation.dto';
import type { Moderation } from 'openai/resources/moderations';
import { promises as fs } from 'fs';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  private computeScore(post: {
    createdAt: Date;
    commentsCount: number;
    likes: number;
    shares: number;
    reposts: number;
  }): number {
    this.logger.verbose(
      `Computing score for post created ${post.createdAt.toISOString()} ` +
        `(comments=${post.commentsCount}, likes=${post.likes}, ` +
        `shares=${post.shares}, reposts=${post.reposts})`,
    );
    const ageHours = (Date.now() - post.createdAt.getTime()) / 1000 / 60 / 60;
    const halfLifeHours = 6; // every 6 hours the recency influence halves
    const recencyWeight = Math.pow(2, -ageHours / halfLifeHours);

    const engagementScore =
      post.commentsCount * 3 +
      post.likes * 1 +
      post.shares * 2 +
      post.reposts * 2;

    const freshnessBoost = recencyWeight * 10; // give new posts a big initial push
    const weightedEngagement = engagementScore * (1 + recencyWeight);
    const score = weightedEngagement + freshnessBoost;

    this.logger.verbose(
      `Score computed: ${score.toFixed(2)} (ageHours=${ageHours.toFixed(
        2,
      )}, recencyWeight=${recencyWeight.toFixed(2)})`,
    );
    return score;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
    private readonly analytics: AnalyticsService,
    private readonly moderation: ModerationService,
  ) {}

  async create(
    userId: string,
    dto: CreatePostDto,
    file?: Express.Multer.File,
  ): Promise<Post> {
    this.logger.log(`Creating post for user ${userId}: "${dto.title}"`);

    if (dto.loungeId && (!dto.title?.trim() || !dto.body?.trim())) {
      throw new BadRequestException(
        'Title and body are required for lounge posts',
      );
    }

    if (!dto.loungeId && !dto.body?.trim()) {
      throw new BadRequestException('Caption is required');
    }

    if (!dto.loungeId && dto.body && dto.body.length > 314) {
      throw new BadRequestException(
        'Post body must be 314 characters or fewer',
      );
    }

    const moderationResult = await this.runModerationCheck(dto, file);

    const flaggedCategories = this.extractFlaggedCategories(
      moderationResult.results,
    );
    const isFlagged = flaggedCategories.length > 0;

    // 1) if they sent a file, upload it and grab the public URL
    let imageUrl: string | undefined;
    if (file) {
      try {
        imageUrl = await this.storage.uploadFile(
          'posts',
          `${userId}/${Date.now()}_${file.originalname}`,
          file,
        );
        this.logger.log(`Uploaded post image, URL=${imageUrl}`);
      } catch (err: any) {
        this.logger.error(`Failed to upload post image`, err.stack);
        throw new InternalServerErrorException('Could not upload post image');
      }
    }

    // 2) now create the Post record, only including imageUrl if we got one
    let post: Post;
    try {
      post = await this.prisma.post.create({
        data: {
          authorId: userId,
          originalAuthorId: userId,
          title: dto.title ?? '',
          body: dto.body,
          loungeId: dto.loungeId,
          flagged: isFlagged,
          ...(imageUrl ? { imageUrl } : {}),
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to create post for user ${userId}`, err.stack);
      throw new InternalServerErrorException('Could not create post');
    }

    if (isFlagged) {
      this.logger.warn(
        `Post flagged by moderation for user ${userId}: ${flaggedCategories.join(', ')}`,
      );
      throw new ForbiddenException({
        message: 'Post failed content moderation',
        categories: flaggedCategories,
        moderation: moderationResult,
        postId: post.id,
      });
    }

    this.logger.log(`Post created (id=${post.id})`);
    return post;
  }

  private extractFlaggedCategories(results: Moderation[]): string[] {
    const categories = new Set<string>();
    for (const result of results) {
      if (!result.flagged) {
        continue;
      }

      Object.entries(result.categories).forEach(([category, flagged]) => {
        if (flagged) {
          categories.add(category);
        }
      });
    }

    return Array.from(categories);
  }

  private async runModerationCheck(
    dto: CreatePostDto,
    file?: Express.Multer.File,
  ) {
    const payload: CheckModerationDto = {};

    const textInputs = [dto.title, dto.body]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value?.length));

    if (textInputs.length) {
      payload.texts = textInputs;
    }

    if (file) {
      const base64 = await this.encodeFileToBase64(file);
      if (base64) {
        payload.imageBase64 = [base64];
      }
    }

    this.logger.verbose(
      `Running moderation check (texts=${payload.texts?.length ?? 0}, images=${
        payload.imageBase64?.length ?? 0
      })`,
    );

    try {
      return await this.moderation.checkContent(payload);
    } catch (err: any) {
      this.logger.error(
        `Moderation check failed: ${err?.message ?? err}`,
        err?.stack,
      );
      throw new InternalServerErrorException(
        'Could not verify post content for moderation',
      );
    }
  }

  private async encodeFileToBase64(
    file: Express.Multer.File,
  ): Promise<string | undefined> {
    if (file.buffer) {
      return file.buffer.toString('base64');
    }

    if (file.path) {
      try {
        const data = await fs.readFile(file.path);
        return data.toString('base64');
      } catch (err: any) {
        this.logger.error(
          `Failed to read uploaded file for moderation: ${err?.message ?? err}`,
          err?.stack,
        );
        throw new InternalServerErrorException(
          'Could not process post image for moderation',
        );
      }
    }

    this.logger.warn('Uploaded file missing buffer/path for moderation.');
    return undefined;
  }

  async interact(
    userId: string,
    postId: string,
    type: InteractionType,
  ): Promise<{ type: InteractionType; count: number }> {
    this.logger.log(`User ${userId} → ${type} → post ${postId}`);

    // 1) record the interaction
    try {
      const inter = await this.prisma.postInteraction.create({
        data: { userId, postId, type },
      });
      this.logger.verbose(`✅ interaction recorded: ${inter.id}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        this.logger.warn(`⚠️ duplicate ${type} by ${userId} on ${postId}`);
        throw new ConflictException(`Already ${type.toLowerCase()}d`);
      }
      this.logger.error(`❌ failed to create interaction`, e.stack);
      throw new InternalServerErrorException('Could not record interaction');
    }

    // 2) bump the post counter
    const field =
      type === InteractionType.LIKE
        ? 'likes'
        : type === InteractionType.SHARE
          ? 'shares'
          : 'reposts';

    try {
      this.logger.verbose(`🔄 incrementing ${field} counter on ${postId}`);
      // @ts-ignore
      await this.prisma.post.update({
        where: { id: postId },
        data: { [field]: { increment: 1 } },
      });
    } catch (e: any) {
      this.logger.error(`❌ failed to increment ${field}`, e.stack);
      throw new InternalServerErrorException('Could not update post counter');
    }

    // 2b) if this is a repost, duplicate the post so it appears in feeds/profile
    if (type === InteractionType.REPOST) {
      try {
        const original = await this.prisma.post.findUnique({
          where: { id: postId, flagged: false },
          select: {
            title: true,
            body: true,
            imageUrl: true,
            loungeId: true,
            authorId: true,
          },
        });

        if (!original) {
          this.logger.error(
            `❌ original post ${postId} not found for repost copy`,
          );
          throw new NotFoundException('Original post not found');
        }

        await this.prisma.post.create({
          data: {
            authorId: userId,
            originalAuthorId: original.authorId,
            title: original.title,
            body: original.body,
            loungeId: original.loungeId,
            ...(original.imageUrl ? { imageUrl: original.imageUrl } : {}),
          },
        });
        this.logger.verbose(`✅ repost copy created for user ${userId}`);
      } catch (e: any) {
        this.logger.error(`❌ failed to create repost copy`, e.stack);
        throw new InternalServerErrorException(
          'Could not create reposted post',
        );
      }
    }

    // 3) fetch the fresh total
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId, flagged: false },
        select: { [field]: true },
      });

      if (!post) {
        this.logger.error(`❌ post ${postId} not found when fetching ${field}`);
        throw new InternalServerErrorException('Post disappeared?');
      }

      const count = (post as any)[field] as number;
      this.logger.log(`📊 post ${postId} has now ${count} ${field}`);
      await this.analytics.recordCanonicalEvent({
        userId,
        type: `post.${type.toLowerCase()}`,
        targetType: 'post',
        targetId: postId,
        metadata: { count },
      });
      return { type, count };
    } catch (e: any) {
      this.logger.error(`❌ failed to fetch updated ${field}`, e.stack);
      throw new InternalServerErrorException('Could not fetch updated count');
    }
  }

  /**
   * Fetch feed ordered by our custom score
   */
  async getWeightedFeed(
    userId: string | null,
    page = 1,
    limit = 20,
  ): Promise<FeedResponseDto> {
    this.logger.log(`Fetching weighted feed (page=${page}, limit=${limit})`);
    try {
      // 1) fetch raw posts + counts
      const posts = await this.prisma.post.findMany({
        where: { loungeId: null, flagged: false },
        orderBy: { createdAt: 'desc' },
        take: page * limit,
        include: {
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
          originalAuthor: {
            select: { id: true, username: true, avatarUrl: true },
          },
          _count: {
            select: { comments: true, savedBy: true },
          },
          // always include an interactions array (it'll just be empty if userId is falsy)
          interactions: {
            where: {
              // if userId is undefined this just becomes `where: { userId: undefined, … }`
              // which yields an empty array rather than dropping the field entirely
              userId: userId || undefined,
              type: { in: [InteractionType.LIKE, InteractionType.REPOST] },
            },
            select: { id: true, type: true },
          },
          ...(userId
            ? {
                savedBy: {
                  where: { userId },
                  select: { id: true },
                },
              }
            : {}),
        },
      });

      this.logger.verbose(`Fetched ${posts.length} posts from DB`);

      // 2) score them
      const scored = posts.map((p) => ({
        ...p,
        likedByMe: p.interactions.some((i) => i.type === InteractionType.LIKE),
        repostedByMe: p.interactions.some(
          (i) => i.type === InteractionType.REPOST,
        ),
        savedByMe: Boolean((p as any).savedBy?.length),
        score: this.computeScore({
          createdAt: p.createdAt,
          commentsCount: p._count.comments,
          likes: p.likes,
          shares: p.shares,
          reposts: p.reposts,
        }),
      }));
      this.logger.verbose(`Computed scores for posts`);

      // 3) sort by score descending
      scored.sort((a, b) => b.score - a.score);
      this.logger.verbose(`Sorted posts by score`);

      // 4) paginate
      const start = (page - 1) * limit;
      const pageItems = scored.slice(start, start + limit).map((p) => ({
        id: p.id,
        authorId: p.author.id,
        username: p.originalAuthor?.username || p.author.username!,
        ...(p.title ? { title: p.title } : {}),
        ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}),
        avatarUrl:
          p.originalAuthor?.avatarUrl ||
          p.author.avatarUrl ||
          '/defaultPfp.png',
        caption: p.body,
        timestamp: p.createdAt.toISOString(),
        stars: p.likes,
        comments: p._count.comments,
        shares: p.shares,
        reposts: p.reposts,
        likedByMe: p.likedByMe,
        savedByMe: p.savedByMe,
        saves: p._count.savedBy,
        repostedByMe: p.repostedByMe,
        ...(p.originalAuthorId && p.originalAuthorId !== p.authorId
          ? { repostedBy: p.author.username! }
          : {}),
      }));
      this.logger.log(`Returning ${pageItems.length} posts for page ${page}`);

      return {
        posts: pageItems,
        total: posts.length,
        page,
        limit,
      };
    } catch (err: any) {
      this.logger.error(`Failed to fetch weighted feed`, err.stack);
      throw new InternalServerErrorException('Could not fetch feed');
    }
  }

  async getLoungePosts(
    loungeId: string,
    userId: string | null,
    page = 1,
    limit = 20,
  ) {
    this.logger.log(`Fetching posts for lounge ${loungeId}`);
    try {
      const [total, posts] = await this.prisma.$transaction([
        this.prisma.post.count({ where: { loungeId, flagged: false } }),
        this.prisma.post.findMany({
          where: { loungeId, flagged: false },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            author: {
              select: { id: true, username: true, avatarUrl: true },
            },
            originalAuthor: {
              select: { username: true, avatarUrl: true },
            },
            comments: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                author: { select: { username: true } },
              },
            },
            _count: { select: { comments: true, savedBy: true } },
            interactions: {
              where: {
                userId: userId || undefined,
                type: InteractionType.LIKE,
              },
              select: { id: true },
            },
            ...(userId
              ? {
                  savedBy: {
                    where: { userId },
                    select: { id: true },
                  },
                }
              : {}),
          },
        }),
      ]);

      const items = posts.map((p) => ({
        id: p.id,
        authorId: p.author.id,
        username: p.originalAuthor?.username || p.author.username!,
        title: p.title,
        ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}),
        avatarUrl:
          p.originalAuthor?.avatarUrl ||
          p.author.avatarUrl ||
          '/defaultPfp.png',
        caption: p.body,
        timestamp: p.createdAt.toISOString(),
        stars: p.likes,
        comments: p._count.comments,
        shares: p.shares,
        likedByMe: p.interactions.length > 0,
        savedByMe: Boolean((p as any).savedBy?.length),
        saves: p._count.savedBy,
        ...(p.originalAuthorId && p.originalAuthorId !== p.authorId
          ? { repostedBy: p.author.username! }
          : {}),
        lastReplyUsername: p.comments[0]?.author.username,
        lastReplyTimestamp: p.comments[0]?.createdAt.toISOString(),
      }));

      return { posts: items, total, page, limit };
    } catch (err: any) {
      this.logger.error(`Failed to fetch lounge posts`, err.stack);
      throw new InternalServerErrorException('Could not fetch lounge posts');
    }
  }

  async getPostById(
    postId: string,
    currentUserId?: string,
  ): Promise<{
    id: string;
    username: string;
    authorId: string;
    avatarUrl: string;
    imageUrl?: string;
    title?: string;
    caption: string;
    timestamp: string;
    stars: number;
    comments: number;
    shares: number;
    reposts: number;
    likedByMe: boolean;
    savedByMe: boolean;
    saves: number;
  }> {
    this.logger.log(
      `Fetching post ${postId}` +
        (currentUserId ? ` for user ${currentUserId}` : ''),
    );

    // 1) Fetch the post (with counts + author)
    const post = await this.prisma.post.findUnique({
      where: { id: postId, flagged: false },
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
            createdAt: true,
            _count: { select: { posts: true } },
          },
        },
        originalAuthor: {
          select: {
            username: true,
            avatarUrl: true,
            createdAt: true,
            _count: { select: { posts: true } },
          },
        },
        _count: { select: { comments: true, savedBy: true } },
        ...(currentUserId
          ? {
              savedBy: {
                where: { userId: currentUserId },
                select: { id: true },
              },
            }
          : {}),
      },
    });
    if (!post) {
      this.logger.warn(`Post ${postId} not found`);
      throw new NotFoundException(`Post ${postId} not found`);
    }

    let likedByMe = false;
    let savedByMe = false;

    // 2) Check if this user has a LIKE interaction on it
    if (currentUserId) {
      const like = await this.prisma.postInteraction.findUnique({
        where: {
          one_interaction_per_user_per_post: {
            postId,
            userId: currentUserId,
            type: 'LIKE',
          },
        },
        select: { id: true },
      });
      likedByMe = Boolean(like);
    }

    savedByMe = Boolean((post as any).savedBy?.length);

    // 3) Shape and return
    const displayAuthor = post.originalAuthor ?? post.author;

    const result = {
      id: post.id,
      username: post.originalAuthor?.username || post.author.username!,
      authorId: post.authorId,

      avatarUrl:
        post.originalAuthor?.avatarUrl ||
        post.author.avatarUrl ||
        '/defaultPfp.png',
      ...(post.imageUrl ? { imageUrl: post.imageUrl } : {}),
      ...(post.loungeId || post.title ? { title: post.title } : {}),
      caption: post.body,
      timestamp: post.createdAt.toISOString(),
      stars: post.likes,
      comments: post._count.comments,
      shares: post.shares,
      reposts: post.reposts,
      likedByMe,
      savedByMe,
      saves: post._count.savedBy,
      ...(displayAuthor?.createdAt
        ? { authorJoinedAt: displayAuthor.createdAt.toISOString() }
        : {}),
      authorPostCount: displayAuthor?._count?.posts ?? 0,
      ...(post.originalAuthorId && post.originalAuthorId !== post.authorId
        ? { repostedBy: post.author.username! }
        : {}),
    };
    this.logger.log(`Returning post ${postId}`);
    return result;
  }

  async toggleLike(
    userId: string,
    postId: string,
  ): Promise<{ liked: boolean; count: number }> {
    this.logger.log(`User ${userId} → TOGGLE LIKE (service) → post ${postId}`);
    const LIKE = InteractionType.LIKE;
    const counterOp = { likes: {} as any };

    try {
      // Try to create a new LIKE
      await this.prisma.postInteraction.create({
        data: { userId, postId, type: LIKE },
      });
      counterOp.likes = { increment: 1 };
      this.logger.verbose(`Like created for ${postId} by ${userId}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Already liked → remove it
        await this.prisma.postInteraction.delete({
          where: {
            one_interaction_per_user_per_post: {
              postId,
              userId,
              type: LIKE,
            },
          },
        });
        counterOp.likes = { decrement: 1 };
        this.logger.verbose(`Removed like for ${postId} by ${userId}`);
        const updated = await this.prisma.post.update({
          where: { id: postId },
          data: counterOp,
          select: { likes: true },
        });
        this.logger.log(
          `User ${userId} unliked ${postId}, total=${updated.likes}`,
        );
        await this.analytics.recordCanonicalEvent({
          userId,
          type: 'post.unlike',
          targetType: 'post',
          targetId: postId,
          metadata: { count: updated.likes },
        });
        return { liked: false, count: updated.likes };
      }
      throw e;
    }

    // If we got here, we just “liked” it
    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: counterOp,
      select: { likes: true, authorId: true },
    });
    await this.notifications.create(
      updated.authorId,
      userId,
      NotificationType.POST_LIKE,
      postId,
    );
    this.logger.log(`User ${userId} liked ${postId}, total=${updated.likes}`);
    await this.analytics.recordCanonicalEvent({
      userId,
      type: 'post.like',
      targetType: 'post',
      targetId: postId,
      metadata: { count: updated.likes },
    });
    return { liked: true, count: updated.likes };
  }

  async savePost(
    userId: string,
    postId: string,
  ): Promise<{ saved: boolean; count: number }> {
    this.logger.log(`User ${userId} → SAVE POST (service) → ${postId}`);

    try {
      await this.prisma.savedPost.create({ data: { userId, postId } });
    } catch (e: any) {
      if (e.code !== 'P2002') {
        this.logger.error(
          `Failed to save post ${postId} for ${userId}: ${e?.message ?? e}`,
          e?.stack,
        );
        throw new InternalServerErrorException('Could not save post');
      }
      this.logger.verbose(`Post ${postId} already saved by ${userId}`);
    }

    const count = await this.prisma.savedPost.count({ where: { postId } });
    this.logger.log(`Post ${postId} saved by ${userId}, total=${count}`);
    return { saved: true, count };
  }

  async unsavePost(
    userId: string,
    postId: string,
  ): Promise<{ saved: boolean; count: number }> {
    this.logger.log(`User ${userId} → UNSAVE POST (service) → ${postId}`);

    try {
      await this.prisma.savedPost.delete({
        where: {
          one_save_per_user_per_post: { userId, postId },
        },
      });
    } catch (e: any) {
      if (e.code !== 'P2025') {
        this.logger.error(
          `Failed to unsave post ${postId} for ${userId}: ${e?.message ?? e}`,
          e?.stack,
        );
        throw new InternalServerErrorException('Could not unsave post');
      }
      this.logger.verbose(`Post ${postId} was not saved by ${userId}`);
    }

    const count = await this.prisma.savedPost.count({ where: { postId } });
    this.logger.log(`Post ${postId} unsaved by ${userId}, total=${count}`);
    return { saved: false, count };
  }

  async getSavedPosts(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<FeedResponseDto> {
    this.logger.log(
      `Fetching saved posts for ${userId} (page=${page}, limit=${limit})`,
    );

    try {
      const [total, saves] = await this.prisma.$transaction([
        this.prisma.savedPost.count({
          where: { userId, post: { flagged: false } },
        }),
        this.prisma.savedPost.findMany({
          where: { userId, post: { flagged: false } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            post: {
              include: {
                author: {
                  select: { id: true, username: true, avatarUrl: true },
                },
                originalAuthor: {
                  select: { id: true, username: true, avatarUrl: true },
                },
                _count: { select: { comments: true, savedBy: true } },
                interactions: {
                  where: {
                    userId,
                    type: {
                      in: [InteractionType.LIKE, InteractionType.REPOST],
                    },
                  },
                  select: { type: true },
                },
              },
            },
          },
        }),
      ]);

      const posts = saves
        .filter((entry) => entry.post)
        .map((entry) => {
          const post = entry.post!;
          const likedByMe = post.interactions.some(
            (interaction) => interaction.type === InteractionType.LIKE,
          );
          const repostedByMe = post.interactions.some(
            (interaction) => interaction.type === InteractionType.REPOST,
          );

          return {
            id: post.id,
            authorId: post.author.id,
            username: post.originalAuthor?.username || post.author.username!,
            ...(post.title ? { title: post.title } : {}),
            ...(post.imageUrl ? { imageUrl: post.imageUrl } : {}),
            avatarUrl:
              post.originalAuthor?.avatarUrl ||
              post.author.avatarUrl ||
              '/defaultPfp.png',
            caption: post.body,
            timestamp: post.createdAt.toISOString(),
            stars: post.likes,
            comments: post._count.comments,
            shares: post.shares,
            reposts: post.reposts,
            likedByMe,
            savedByMe: true,
            saves: post._count.savedBy,
            repostedByMe,
            ...(post.originalAuthorId && post.originalAuthorId !== post.authorId
              ? { repostedBy: post.author.username! }
              : {}),
          };
        });

      return {
        posts,
        total,
        page,
        limit,
      };
    } catch (err: any) {
      this.logger.error(
        `Failed to fetch saved posts for ${userId}: ${err?.message ?? err}`,
        err?.stack,
      );
      throw new InternalServerErrorException('Could not fetch saved posts');
    }
  }

  async deletePost(userId: string, postId: string) {
    this.logger.log(`User ${userId} → DELETE POST → ${postId}`);
    const [, , , , , { count }] = await this.prisma.$transaction([
      this.prisma.savedPost.deleteMany({ where: { postId } }),
      this.prisma.commentLike.deleteMany({ where: { comment: { postId } } }),
      this.prisma.postInteraction.deleteMany({ where: { postId } }),
      this.prisma.notification.deleteMany({
        where: { OR: [{ postId }, { comment: { postId } }] },
      }),
      this.prisma.comment.deleteMany({ where: { postId } }),
      this.prisma.post.deleteMany({ where: { id: postId, authorId: userId } }),
    ]);
    if (count === 0) {
      this.logger.warn(`User ${userId} cannot delete post ${postId}`);
      throw new ForbiddenException(`Cannot delete post ${postId}`);
    }
    this.logger.log(`Post ${postId} deleted`);
  }

  async getFlaggedPosts(
    page = 1,
    limit = 20,
  ): Promise<{
    posts: {
      id: string;
      title: string;
      body: string;
      createdAt: string;
      imageUrl?: string;
      author: {
        id: string;
        username?: string | null;
        avatarUrl?: string | null;
      };
    }[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log(`Fetching flagged posts (page=${page}, limit=${limit})`);

    const take = Math.max(1, limit);
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where: { flagged: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.post.count({ where: { flagged: true } }),
    ]);

    return {
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        body: post.body,
        createdAt: post.createdAt.toISOString(),
        ...(post.imageUrl ? { imageUrl: post.imageUrl } : {}),
        author: {
          id: post.author.id,
          username: post.author.username,
          avatarUrl: post.author.avatarUrl,
        },
      })),
      total,
      page: Math.max(1, page),
      limit: take,
    };
  }

  async deletePostAsAdmin(postId: string) {
    this.logger.warn(`Admin deleting post ${postId}`);
    const [, , , , , { count }] = await this.prisma.$transaction([
      this.prisma.savedPost.deleteMany({ where: { postId } }),
      this.prisma.commentLike.deleteMany({ where: { comment: { postId } } }),
      this.prisma.postInteraction.deleteMany({ where: { postId } }),
      this.prisma.notification.deleteMany({
        where: { OR: [{ postId }, { comment: { postId } }] },
      }),
      this.prisma.comment.deleteMany({ where: { postId } }),
      this.prisma.post.deleteMany({ where: { id: postId } }),
    ]);

    if (count === 0) {
      this.logger.warn(`Admin attempted to delete non-existent post ${postId}`);
      throw new NotFoundException(`Post ${postId} not found`);
    }

    this.logger.log(`Post ${postId} deleted by admin`);
  }
}
