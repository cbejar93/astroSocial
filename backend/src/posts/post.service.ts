// src/posts/posts.service.ts
import {
    Injectable,
    ConflictException,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    ForbiddenException
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { InteractionType, Post, NotificationType } from '@prisma/client'
import { CreatePostDto } from './dto/create-post.dto'
import { StorageService } from 'src/storage/storage.service'
import { NotificationsService } from '../notifications/notifications.service'


@Injectable()
export class PostsService {
    private readonly logger = new Logger(PostsService.name)

    private computeScore(post: {
        createdAt: Date;
        commentsCount: number;
        likes: number;
        shares: number;
        reposts: number;
    }): number {
        const ageHours = (Date.now() - post.createdAt.getTime()) / 1000 / 60 / 60;
        const recencyScore = Math.exp(-0.1 * ageHours);    // decays over ~10h
        const engagementScore =
            post.commentsCount * 3 +
            post.likes * 1 +
            post.shares * 2 +
            post.reposts * 2;
        return recencyScore + engagementScore;
    }

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly notifications: NotificationsService,
    ) { }

    async create(
        userId: string,
        dto: CreatePostDto,
        file?: Express.Multer.File,
    ): Promise<Post> {
        this.logger.log(`Creating post for user ${userId}: "${dto.title}"`)

        // 1) if they sent a file, upload it and grab the public URL
        let imageUrl: string | undefined
        if (file) {
            try {
                imageUrl = await this.storage.uploadFile(
                    'posts',
                    `${userId}/${Date.now()}_${file.originalname}`,
                    file,
                )
                this.logger.log(`Uploaded post image, URL=${imageUrl}`)
            } catch (err: any) {
                this.logger.error(`Failed to upload post image`, err.stack)
                throw new InternalServerErrorException('Could not upload post image')
            }
        }

        // 2) now create the Post record, only including imageUrl if we got one
        try {
            const post = await this.prisma.post.create({
                data: {
                    authorId: userId,
                    title: '',
                    body: dto.body,
                    ...(imageUrl ? { imageUrl } : {}),
                },
            })
            this.logger.log(`Post created (id=${post.id})`)
            return post
        } catch (err: any) {
            this.logger.error(
                `Failed to create post for user ${userId}`,
                err.stack,
            )
            throw new InternalServerErrorException('Could not create post')
        }
    }

    async interact(
        userId: string,
        postId: string,
        type: InteractionType,
    ): Promise<{ type: InteractionType; count: number }> {
        this.logger.log(`User ${userId} → ${type} → post ${postId}`)

        // 1) record the interaction
        try {
            const inter = await this.prisma.postInteraction.create({
                data: { userId, postId, type },
            })
            this.logger.verbose(`✅ interaction recorded: ${inter.id}`)
        } catch (e: any) {
            if (e.code === 'P2002') {
                this.logger.warn(`⚠️ duplicate ${type} by ${userId} on ${postId}`)
                throw new ConflictException(`Already ${type.toLowerCase()}d`)
            }
            this.logger.error(`❌ failed to create interaction`, e.stack)
            throw new InternalServerErrorException('Could not record interaction')
        }

        // 2) bump the post counter
        const field =
            type === InteractionType.LIKE ? 'likes'
                : type === InteractionType.SHARE ? 'shares'
                    : 'reposts'

        try {
            this.logger.verbose(`🔄 incrementing ${field} counter on ${postId}`)
            // @ts-ignore
            await this.prisma.post.update({
                where: { id: postId },
                data: { [field]: { increment: 1 } },
            })
        } catch (e: any) {
            this.logger.error(`❌ failed to increment ${field}`, e.stack)
            throw new InternalServerErrorException('Could not update post counter')
        }

        // 3) fetch the fresh total
        try {
            const post = await this.prisma.post.findUnique({
                where: { id: postId },
                select: { [field]: true },
            })

            if (!post) {
                this.logger.error(`❌ post ${postId} not found when fetching ${field}`)
                throw new InternalServerErrorException('Post disappeared?')
            }

            const count = (post as any)[field] as number
            this.logger.log(`📊 post ${postId} has now ${count} ${field}`)
            return { type, count }
        } catch (e: any) {
            this.logger.error(`❌ failed to fetch updated ${field}`, e.stack)
            throw new InternalServerErrorException('Could not fetch updated count')
        }
    }


    /**
     * Fetch feed ordered by our custom score
     */
    async getWeightedFeed(userId: string, page = 1, limit = 20) {
        this.logger.log(`Fetching weighted feed (page=${page}, limit=${limit})`);
        try {
            // 1) fetch raw posts + counts
            const posts = await this.prisma.post.findMany({
                orderBy: { createdAt: 'desc' },
                take: page * limit,
                include: {
                  author: {
                    select: { id: true, username: true, avatarUrl: true },
                  },
                  _count: {
                    select: { comments: true },
                  },
                  // always include an interactions array (it'll just be empty if userId is falsy)
                  interactions: {
                    where: {
                      // if userId is undefined this just becomes `where: { userId: undefined, … }`
                      // which yields an empty array rather than dropping the field entirely
                      userId: userId || undefined,
                      type:   InteractionType.LIKE,
                    },
                    select: { id: true },
                  },
                },
              });
              
            this.logger.verbose(`Fetched ${posts.length} posts from DB`);

            // 2) score them
            const scored = posts.map(p => ({
                ...p,
                likedByMe: p.interactions.length > 0,
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
            const pageItems = scored.slice(start, start + limit).map(p => ({
                id:        p.id,
                authorId:    p.author.id,
                username:  p.author.username!,          // unwrap since it’s required for feed
                imageUrl:  p.imageUrl ?? '',            // fallback if you didn’t upload an image
                avatarUrl: p.author.avatarUrl || '',
                caption:   p.body,
                timestamp: p.createdAt.toISOString(),
                stars:     p.likes,
                comments:  p._count.comments,
                shares:    p.shares,
                likedByMe: p.likedByMe
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

async getPostById(
    postId: string,
    currentUserId?: string
  ): Promise<{
    id:          string;
    username:    string;
    authorId: string;
    avatarUrl:   string;
    imageUrl:    string;
    caption:     string;
    timestamp:   string;
    stars:       number;
    comments:    number;
    shares:      number;
    reposts:     number;
    likedByMe:   boolean;
  }> {
    // 1) Fetch the post (with counts + author)
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author:  { select: { username: true, avatarUrl: true } },
        _count:  { select: { comments: true } },
      },
    });
    if (!post) {
      throw new NotFoundException(`Post ${postId} not found`);
    }
  
    let likedByMe = false;

    // 2) Check if this user has a LIKE interaction on it
    if (currentUserId) {
        const like = await this.prisma.postInteraction.findUnique({
          where: {
            one_interaction_per_user_per_post: {
              postId,
              userId: currentUserId,
              type:   'LIKE',
            },
          },
          select: { id: true },
        });
        likedByMe = Boolean(like);
      }
  
    // 3) Shape and return
    return {
      id:        post.id,
      username:  post.author.username!,
      authorId:    post.authorId,

      avatarUrl: post.author.avatarUrl ?? '',
      imageUrl:  post.imageUrl  ?? '',
      caption:   post.body,
      timestamp: post.createdAt.toISOString(),
      stars:     post.likes,
      comments:  post._count.comments,
      shares:    post.shares,
      reposts:   post.reposts,
      likedByMe,
    };
  }

  async toggleLike(
    userId: string,
    postId: string,
  ): Promise<{ liked: boolean; count: number }> {
    const LIKE      = InteractionType.LIKE;
    const compound  = { postId_userId_type: { postId, userId, type: LIKE } };
    const counterOp = { likes: {} as any };
  
    try {
      // Try to create a new LIKE
      await this.prisma.postInteraction.create({
        data: { userId, postId, type: LIKE },
      });
      counterOp.likes = { increment: 1 };
      // report back “now liked”
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Already liked → remove it
        await this.prisma.postInteraction.delete({ where: 
            {
                one_interaction_per_user_per_post: {
                  postId,
                  userId,
                  type: LIKE,
                },
              },
         });
        counterOp.likes = { decrement: 1 };
        // report back “now unliked”
        const updated = await this.prisma.post.update({
          where: { id: postId },
          data: counterOp,
          select: { likes: true },
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
    return { liked: true, count: updated.likes };
  }

  async deletePost(userId: string, postId: string) {
    const { count } = await this.prisma.post.deleteMany({
      where: { id: postId, authorId: userId }
    });
    if (count === 0) {
      throw new ForbiddenException(`Cannot delete post ${postId}`);
    }
  }
}
