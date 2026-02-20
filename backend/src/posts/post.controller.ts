// src/posts/posts.controller.ts
import {
    Controller,
    Post,
    Param,
    Req,
    UseGuards,
    Logger,
    Body,
    UseInterceptors,
    UploadedFile,
    Get,
    Query,
    InternalServerErrorException,
    Delete,
    UseFilters,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PostsService } from './post.service'
import { InteractionType } from '@prisma/client'
import { CreatePostDto } from './dto/create-post.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { OptionalAuthGuard } from '../auth/jwt-optional.guard'
import { FeedResponseDto } from './dto/feed.dto'
import { MulterExceptionFilter } from '../common/filters/multer-exception.filter'

@Controller('api/posts')
export class PostsController {
    private readonly logger = new Logger(PostsController.name)

    constructor(private readonly posts: PostsService) { }

    /**
 * Public feed endpoint, no auth required.
 * Supports ?page=1&limit=20 query params.
 */
    @UseGuards(OptionalAuthGuard)
    @Get('feed')
    async getFeed(
        @Req() req: any,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('mode') mode = 'foryou',
    ): Promise<FeedResponseDto> {
        const p = parseInt(page, 10) || 1;
        const l = parseInt(limit, 10) || 20;
        const feedMode = mode === 'following' ? 'following' : 'foryou';
        this.logger.log(`Fetching feed (mode=${feedMode}, page=${p}, limit=${l})`);

        const id = req.user ? req.user.sub : null;

        try {
            const feed = await this.posts.getWeightedFeed(id, p, l, feedMode);
            this.logger.log(`Feed retrieved: ${feed.posts.length} post(s)`);
            return feed;
        } catch (err: any) {
            this.logger.error(`Failed to retrieve feed: ${err.message}`, err.stack);
            throw new InternalServerErrorException('Could not fetch feed');
        }
    }

    @UseGuards(JwtAuthGuard)
    @UseFilters(new MulterExceptionFilter())
    @UseInterceptors(
        FileInterceptor('image', {
            fileFilter: (_req, file, cb) => {
                const allowed = [
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'image/tiff',
                ]
                if (allowed.includes(file.mimetype)) cb(null, true)
                else
                    cb(
                        new Error(
                            'Unsupported file type. Allowed: JPEG, PNG, GIF, TIFF.',
                        ),
                        false,
                    )
            },
            limits: { fileSize: 100 * 1024 * 1024 },
        }),
    )
    @Post()
    async createPost(
        @Req() req: any,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CreatePostDto,
    ) {
        const userId = req.user.sub as string
        this.logger.log(`Creating post for user ${userId}`)
        try {
            const post = await this.posts.create(userId, dto, file)
            this.logger.log(`Post created successfully: ${post.id}`)
            return post
        } catch (err: any) {
            this.logger.error(
                `Failed to create post for user ${userId}: ${err.message}`,
                err.stack,
            )
            throw err
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/share')
    async sharePost(@Req() req: any, @Param('id') postId: string) {
        const userId = req.user.sub as string
        this.logger.log(`Sharing post ${postId} for user ${userId}`)

        try {
            const result = await this.posts.interact(
                userId,
                postId,
                InteractionType.SHARE,
            )
            this.logger.log(
                `Post ${postId} shared successfully (total shares: ${result.count})`,
            )
            return result
        } catch (err: any) {
            this.logger.error(
                `Failed to share post ${postId}: ${err.message}`,
                err.stack,
            )
            throw err
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/repost')
    async repostPost(@Req() req: any, @Param('id') postId: string) {
        const userId = req.user.sub as string
        this.logger.log(`Reposting post ${postId} for user ${userId}`)

        try {
            const result = await this.posts.interact(
                userId,
                postId,
                InteractionType.REPOST,
            )
            this.logger.log(
                `Post ${postId} reposted successfully (total reposts: ${result.count})`,
            )
            return result
        } catch (err: any) {
            this.logger.error(
                `Failed to repost post ${postId}: ${err.message}`,
                err.stack,
            )
            throw err
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/like')
    async toggleLikePost(@Req() req: any, @Param('id') postId: string) {
        const userId = req.user.sub as string;
        this.logger.log(`Toggling like on post ${postId} for user ${userId}`);
        try {
            const { liked, count } = await this.posts.toggleLike(userId, postId);
            this.logger.log(`Like toggled on post ${postId}: liked=${liked}, total=${count}`);
            return { liked, count };
        } catch (err: any) {
            this.logger.error(`Failed to toggle like on post ${postId}: ${err.message}`, err.stack);
            throw err;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/save')
    async savePost(@Req() req: any, @Param('id') postId: string) {
        const userId = req.user.sub as string;
        this.logger.log(`Saving post ${postId} for user ${userId}`);
        try {
            const result = await this.posts.savePost(userId, postId);
            this.logger.log(`Post ${postId} saved: saved=${result.saved}, total=${result.count}`);
            return result;
        } catch (err: any) {
            this.logger.error(`Failed to save post ${postId}: ${err.message}`, err.stack);
            throw err;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/save')
    async unsavePost(@Req() req: any, @Param('id') postId: string) {
        const userId = req.user.sub as string;
        this.logger.log(`Removing saved post ${postId} for user ${userId}`);
        try {
            const result = await this.posts.unsavePost(userId, postId);
            this.logger.log(`Post ${postId} unsaved: saved=${result.saved}, total=${result.count}`);
            return result;
        } catch (err: any) {
            this.logger.error(`Failed to unsave post ${postId}: ${err.message}`, err.stack);
            throw err;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('saved')
    async getSavedPosts(
        @Req() req: any,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ): Promise<FeedResponseDto> {
        const userId = req.user.sub as string;
        const p = parseInt(page, 10) || 1;
        const l = parseInt(limit, 10) || 20;
        this.logger.log(`Fetching saved posts for user ${userId} (page=${p}, limit=${l})`);

        try {
            return await this.posts.getSavedPosts(userId, p, l);
        } catch (err: any) {
            this.logger.error(
                `Failed to fetch saved posts for user ${userId}: ${err.message}`,
                err.stack,
            );
            throw err;
        }
    }

    @Get(':id')
    @UseGuards(OptionalAuthGuard)  // if you want only logged‑in users, otherwise drop this
    async getPost(
        @Req() req: any,
        @Param('id') postId: string
    ) {
        const userId = req.user?.sub as string ? req.user.sub : null;
        this.logger.log(`Fetching post ${postId} for user ${userId}`);
        try {
            const post = await this.posts.getPostById(postId, userId);
            this.logger.log(`Post ${postId} fetched successfully`);
            return post;
        } catch (err) {
            this.logger.error(`Failed to fetch post ${postId}: ${err.message}`);
            throw err;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Delete('delete/:id')
    async deletePost(
        @Req() req: { user: { sub: string } },
        @Param('id') postId: string
    ) {
        await this.posts.deletePost(req.user.sub, postId);
        return { success: true };
    }
}
