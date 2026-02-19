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

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  private computeScore(post: {
    createdAt: Date;
    commentsCount: number;
    likes: number;
    shares: number;
    reposts: number;
    saves: number;
    authorIsFollowed?: boolean;
    loungeIsFollowed?: boolean;
  }): number {
    const ageHours = (Date.now() - post.createdAt.getTime()) / 1000 / 60 / 60;
    const halfLifeHours = 6; // increased from 4h — less punishing to quality older content
    const minRecencyWeight = 0.05;
    const recencyWeight = Math.max(
      minRecencyWeight,
      Math.pow(2, -ageHours / halfLifeHours),
    );

    // saves added as intentional-bookmark signal; comments weighted higher (deepest engagement)
    const engagementScore =
      post.commentsCount * 4 +
      post.likes * 1 +
      post.saves * 3 +
      post.reposts * 2 +
      post.shares * 1;

    const authorBoost = post.authorIsFollowed ? 1.5 : 1.0;
    const loungeBoost = post.loungeIsFollowed ? 1.3 : 1.0;

    const score =
      engagementScore * (1 + recencyWeight) * authorBoost * loungeBoost +
      recencyWeight * 8;

    return score;
  }

  /** Diversity filter: at most `maxPerAuthor` posts per author in any `windowSize` posts */
  private diversifyFeed<T extends { authorId: string }>(
    posts: T[],
    windowSize = 10,
    maxPerAuthor = 2,
  ): T[] {
    const result: T[] = [];
    const pending = [...posts];

    while (pending.length > 0) {
      const window = result.slice(-windowSize);
      const authorCount = new Map<string, number>();
      for (const p of window) {
        authorCount.set(p.authorId, (authorCount.get(p.authorId) ?? 0) + 1);
      }
      const idx = pending.findIndex(
        (p) => (authorCount.get(p.authorId) ?? 0) < maxPerAuthor,
      );
      if (idx === -1) {
        // All remaining authors over limit — append the rest as-is
        result.push(...pending.splice(0));
      } else {
        result.push(...pending.splice(idx, 1));
      }
    }
    return result;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
    private readonly analytics: AnalyticsService,
  ) {}

  private isValidYoutubeUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      const allowedHosts = new Set([
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'youtu.be',
        'www.youtu.be',
        'youtube-nocookie.com',
        'www.youtube-nocookie.com',
      ]);
      return allowedHosts.has(hostname);
    } catch {
      return false;
    }
  }

  private isValidHttpUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

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

    if (dto.youtubeUrl && !this.isValidYoutubeUrl(dto.youtubeUrl)) {
      throw new BadRequestException('Only YouTube URLs are allowed');
    }

    if (dto.linkUrl && !this.isValidHttpUrl(dto.linkUrl)) {
      throw new BadRequestException('Only HTTP/HTTPS link URLs are allowed');
    }

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
    try {
      const post = await this.prisma.post.create({
        data: {
          authorId: userId,
          originalAuthorId: userId,
          title: dto.title ?? '',
          body: dto.body,
          loungeId: dto.loungeId,
          ...(imageUrl ? { imageUrl } : {}),
          ...(dto.youtubeUrl ? { youtubeUrl: dto.youtubeUrl } : {}),
          ...(dto.linkUrl ? { linkUrl: dto.linkUrl } : {}),
          ...(dto.linkTitle ? { linkTitle: dto.linkTitle } : {}),
          ...(dto.linkDescription ? { linkDescription: dto.linkDescription } : {}),
          ...(dto.linkImageUrl ? { linkImageUrl: dto.linkImageUrl } : {}),
          ...(dto.linkSiteName ? { linkSiteName: dto.linkSiteName } : {}),
        },
      });
      this.logger.log(`Post created (id=${post.id})`);
      // Update posting streak in the background (non-blocking)
      void this.updateStreak(userId);
      return post;
    } catch (err: any) {
      this.logger.error(`Failed to create post for user ${userId}`, err.stack);
      throw new InternalServerErrorException('Could not create post');
    }
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
          where: { id: postId },
          select: {
            title: true,
            body: true,
            imageUrl: true,
            youtubeUrl: true,
            linkUrl: true,
            linkTitle: true,
            linkDescription: true,
            linkImageUrl: true,
            linkSiteName: true,
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
            ...(original.youtubeUrl ? { youtubeUrl: original.youtubeUrl } : {}),
            ...(original.linkUrl ? { linkUrl: original.linkUrl } : {}),
            ...(original.linkTitle ? { linkTitle: original.linkTitle } : {}),
            ...(original.linkDescription
              ? { linkDescription: original.linkDescription }
              : {}),
            ...(original.linkImageUrl
              ? { linkImageUrl: original.linkImageUrl }
              : {}),
            ...(original.linkSiteName
              ? { linkSiteName: original.linkSiteName }
              : {}),
          },
        });
        this.logger.verbose(`✅ repost copy created for user ${userId}`);

        // Notify the original author about the repost
        await this.notifications.create(
          original.authorId,
          userId,
          NotificationType.REPOST,
          postId,
        );
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
        where: { id: postId },
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
   * Build the standard post include block for feed queries.
   */
  private buildPostInclude(userId: string | null) {
    return {
      author: { select: { id: true, username: true, avatarUrl: true } },
      originalAuthor: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { comments: true, savedBy: true } },
      interactions: {
        where: {
          userId: userId || undefined,
          type: { in: [InteractionType.LIKE, InteractionType.REPOST] as InteractionType[] },
        },
        select: { id: true, type: true },
      },
      ...(userId
        ? { savedBy: { where: { userId }, select: { id: true } } }
        : {}),
    };
  }

  /** Shape a raw DB post record into the feed DTO shape */
  private shapePost(p: any) {
    return {
      id: p.id,
      authorId: p.author.id,
      username: p.originalAuthor?.username || p.author.username!,
      ...(p.title ? { title: p.title } : {}),
      ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}),
      ...(p.youtubeUrl ? { youtubeUrl: p.youtubeUrl } : {}),
      ...(p.linkUrl ? { linkUrl: p.linkUrl } : {}),
      ...(p.linkTitle ? { linkTitle: p.linkTitle } : {}),
      ...(p.linkDescription ? { linkDescription: p.linkDescription } : {}),
      ...(p.linkImageUrl ? { linkImageUrl: p.linkImageUrl } : {}),
      ...(p.linkSiteName ? { linkSiteName: p.linkSiteName } : {}),
      avatarUrl:
        p.originalAuthor?.avatarUrl || p.author.avatarUrl || '/defaultPfp.png',
      caption: p.body,
      timestamp: p.createdAt.toISOString(),
      stars: p.likes,
      comments: p._count.comments,
      shares: p.shares,
      reposts: p.reposts,
      likedByMe: p.interactions?.some(
        (i: any) => i.type === InteractionType.LIKE,
      ) ?? false,
      savedByMe: Boolean(p.savedBy?.length),
      saves: p._count.savedBy,
      repostedByMe: p.interactions?.some(
        (i: any) => i.type === InteractionType.REPOST,
      ) ?? false,
      ...(p.originalAuthorId && p.originalAuthorId !== p.authorId
        ? { repostedBy: p.author.username! }
        : {}),
    };
  }

  /**
   * Fetch feed with two modes:
   *  - "foryou"    : personalized algorithmic feed (default, works unauthenticated too)
   *  - "following" : chronological posts from followed users only (requires auth)
   */
  async getWeightedFeed(
    userId: string | null,
    page = 1,
    limit = 20,
    mode: 'foryou' | 'following' = 'foryou',
  ): Promise<FeedResponseDto> {
    this.logger.log(
      `Fetching feed (mode=${mode}, page=${page}, limit=${limit}, userId=${userId ?? 'anon'})`,
    );

    try {
      if (mode === 'following' && userId) {
        return await this.getFollowingFeed(userId, page, limit);
      }
      return await this.getForYouFeed(userId, page, limit);
    } catch (err: any) {
      this.logger.error(`Failed to fetch feed`, err.stack);
      throw new InternalServerErrorException('Could not fetch feed');
    }
  }

  /** Chronological feed of posts from followed users */
  private async getFollowingFeed(
    userId: string,
    page: number,
    limit: number,
  ): Promise<FeedResponseDto> {
    // Resolve the IDs of users that this user follows
    const viewer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { following: { select: { id: true } } },
    });
    const followingIds = viewer?.following.map((u) => u.id) ?? [];

    if (followingIds.length === 0) {
      return { posts: [], total: 0, page, limit };
    }

    const [total, posts] = await this.prisma.$transaction([
      this.prisma.post.count({
        where: { loungeId: null, authorId: { in: followingIds } },
      }),
      this.prisma.post.findMany({
        where: { loungeId: null, authorId: { in: followingIds } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: this.buildPostInclude(userId),
      }),
    ]);

    return {
      posts: posts.map((p) => this.shapePost(p)),
      total,
      page,
      limit,
    };
  }

  /** Personalized algorithmic feed */
  private async getForYouFeed(
    userId: string | null,
    page: number,
    limit: number,
  ): Promise<FeedResponseDto> {
    // Cap the candidate pool at limit*5 (max 100) to avoid unbounded memory use
    const candidateLimit = Math.min(limit * 5, 100);

    // Resolve viewer's social graph so we can apply personalization boosts
    let followingIds: string[] = [];
    let followedLoungeIds: string[] = [];

    if (userId) {
      const viewer = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          following: { select: { id: true } },
          followedLounges: { select: { id: true } },
        },
      });
      followingIds = viewer?.following.map((u) => u.id) ?? [];
      followedLoungeIds = viewer?.followedLounges.map((l) => l.id) ?? [];
    }

    // Fetch the candidate pool: most recent non-lounge posts
    const posts = await this.prisma.post.findMany({
      where: { loungeId: null },
      orderBy: { createdAt: 'desc' },
      take: candidateLimit,
      include: this.buildPostInclude(userId),
    });

    const followingSet = new Set(followingIds);
    const followedLoungeSet = new Set(followedLoungeIds);

    // Score each candidate
    const scored = posts.map((p) => ({
      ...p,
      score: this.computeScore({
        createdAt: p.createdAt,
        commentsCount: p._count.comments,
        likes: p.likes,
        shares: p.shares,
        reposts: p.reposts,
        saves: p._count.savedBy,
        authorIsFollowed: followingSet.has(p.authorId),
        loungeIsFollowed: p.loungeId
          ? followedLoungeSet.has(p.loungeId)
          : false,
      }),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Apply diversity filter then paginate
    const diversified = this.diversifyFeed(
      scored.map((p) => ({ ...p, authorId: p.authorId })),
    );
    const start = (page - 1) * limit;
    const pageItems = diversified.slice(start, start + limit);

    return {
      posts: pageItems.map((p) => this.shapePost(p)),
      total: diversified.length,
      page,
      limit,
    };
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
        this.prisma.post.count({ where: { loungeId } }),
        this.prisma.post.findMany({
          where: { loungeId },
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
        ...(p.youtubeUrl ? { youtubeUrl: p.youtubeUrl } : {}),
        ...(p.linkUrl ? { linkUrl: p.linkUrl } : {}),
        ...(p.linkTitle ? { linkTitle: p.linkTitle } : {}),
        ...(p.linkDescription ? { linkDescription: p.linkDescription } : {}),
        ...(p.linkImageUrl ? { linkImageUrl: p.linkImageUrl } : {}),
        ...(p.linkSiteName ? { linkSiteName: p.linkSiteName } : {}),
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
    youtubeUrl?: string;
    linkUrl?: string;
    linkTitle?: string;
    linkDescription?: string;
    linkImageUrl?: string;
    linkSiteName?: string;
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
      where: { id: postId },
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
      ...(post.youtubeUrl ? { youtubeUrl: post.youtubeUrl } : {}),
      ...(post.linkUrl ? { linkUrl: post.linkUrl } : {}),
      ...(post.linkTitle ? { linkTitle: post.linkTitle } : {}),
      ...(post.linkDescription ? { linkDescription: post.linkDescription } : {}),
      ...(post.linkImageUrl ? { linkImageUrl: post.linkImageUrl } : {}),
      ...(post.linkSiteName ? { linkSiteName: post.linkSiteName } : {}),
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
    this.logger.log(`Fetching saved posts for ${userId} (page=${page}, limit=${limit})`);

    try {
      const [total, saves] = await this.prisma.$transaction([
        this.prisma.savedPost.count({ where: { userId } }),
        this.prisma.savedPost.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            post: {
              include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                originalAuthor: {
                  select: { id: true, username: true, avatarUrl: true },
                },
                _count: { select: { comments: true, savedBy: true } },
                interactions: {
                  where: {
                    userId,
                    type: { in: [InteractionType.LIKE, InteractionType.REPOST] },
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
            ...(post.youtubeUrl ? { youtubeUrl: post.youtubeUrl } : {}),
            ...(post.linkUrl ? { linkUrl: post.linkUrl } : {}),
            ...(post.linkTitle ? { linkTitle: post.linkTitle } : {}),
            ...(post.linkDescription ? { linkDescription: post.linkDescription } : {}),
            ...(post.linkImageUrl ? { linkImageUrl: post.linkImageUrl } : {}),
            ...(post.linkSiteName ? { linkSiteName: post.linkSiteName } : {}),
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

  /** Update posting streak and milestone for a user after they create a post */
  private async updateStreak(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          currentStreak: true,
          longestStreak: true,
          lastPostDate: true,
          postMilestone: true,
        },
      });
      if (!user) return;

      const now = new Date();
      const startOfToday = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

      let newStreak = 1;
      if (user.lastPostDate) {
        const lastUTC = new Date(
          Date.UTC(
            user.lastPostDate.getUTCFullYear(),
            user.lastPostDate.getUTCMonth(),
            user.lastPostDate.getUTCDate(),
          ),
        );
        if (lastUTC.getTime() === startOfToday.getTime()) {
          // Already posted today — keep streak unchanged
          newStreak = user.currentStreak;
        } else if (lastUTC.getTime() === startOfYesterday.getTime()) {
          // Consecutive day — extend streak
          newStreak = user.currentStreak + 1;
        }
        // else: gap in posting — streak resets to 1
      }

      const totalPosts = await this.prisma.post.count({
        where: { authorId: userId },
      });
      const milestones = [1, 10, 25, 50, 100, 250, 500];
      const newMilestone =
        milestones.filter((m) => totalPosts >= m).pop() ?? 0;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, user.longestStreak),
          lastPostDate: now,
          postMilestone: Math.max(newMilestone, user.postMilestone),
        },
      });
    } catch (err: any) {
      // Non-critical — log and continue so the post creation isn't blocked
      this.logger.error(`Failed to update streak for user ${userId}`, err.stack);
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
}
