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
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PostsService } from './post.service'
import { InteractionType } from '@prisma/client'
import { CreatePostDto } from './dto/create-post.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { OptionalAuthGuard } from '../auth/jwt-optional.guard'
import { FeedResponseDto } from './dto/feed.dto'

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
    ): Promise<FeedResponseDto> {
        const p = parseInt(page, 10) || 1;
        const l = parseInt(limit, 10) || 20;
        this.logger.log(`Fetching public feed (page=${p}, limit=${l})`);

        console.log(req.user);

        const id = req.user ? req.user.sub : null

        try {
            const feed = await this.posts.getWeightedFeed(id, p, l);
            this.logger.log(`Feed fetched: ${feed.posts.length} items`);
            return feed;
        } catch (err: any) {
            this.logger.error(`Failed to fetch feed`, err.stack);
            throw new InternalServerErrorException('Could not fetch feed');
        }
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('image', {
            fileFilter: (_req, file, cb) => {
                const allowed = ['image/jpeg', 'image/png', 'image/gif']
                if (allowed.includes(file.mimetype)) cb(null, true)
                else cb(new Error('Invalid file type'), false)
            },
            limits: { fileSize: 31 * 1024 * 1024 }, 
        }),
    )
    @Post()
    async createPost(
        @Req() req: any,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CreatePostDto,
    ) {
        const userId = req.user.sub as string
        this.logger.log(`User ${userId} → CREATE POST`)
        try {
            const post = await this.posts.create(userId, dto, file)
            this.logger.log(`CREATE POST success: ${post.id}`)
            return post
        } catch (err: any) {
            this.logger.error(
                `CREATE POST failed for user ${userId}: ${err.message}`,
                err.stack,
            )
            throw err
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/share')
    async sharePost(@Req() req: any, @Param('id') postId: string) {
        const userId = req.user.sub as string
        this.logger.log(`User ${userId} → SHARE → post ${postId}`)

        try {
            const result = await this.posts.interact(
                userId,
                postId,
                InteractionType.SHARE,
            )
            this.logger.log(
                `SHARE successful for post ${postId}, new shares = ${result.count}`,
            )
            return result
        } catch (err: any) {
            this.logger.error(
                `SHARE failed for post ${postId}: ${err.message}`,
                err.stack,
            )
            throw err
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/repost')
    async repostPost(@Req() req: any, @Param('id') postId: string) {
        const userId = req.user.sub as string
        this.logger.log(`User ${userId} → REPOST → post ${postId}`)

        try {
            const result = await this.posts.interact(
                userId,
                postId,
                InteractionType.REPOST,
            )
            this.logger.log(
                `REPOST successful for post ${postId}, new reposts = ${result.count}`,
            )
            return result
        } catch (err: any) {
            this.logger.error(
                `REPOST failed for post ${postId}: ${err.message}`,
                err.stack,
            )
            throw err
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/like')
    async toggleLikePost(@Req() req: any, @Param('id') postId: string) {
        const userId = req.user.sub as string;
        this.logger.log(`User ${userId} → TOGGLE LIKE → post ${postId}`);
        try {
            const { liked, count } = await this.posts.toggleLike(userId, postId);
            this.logger.log(`TOGGLE LIKE: liked=${liked}, total=${count}`);
            return { liked, count };
        } catch (err: any) {
            this.logger.error(`TOGGLE LIKE failed for ${postId}: ${err.message}`, err.stack);
            throw err;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/save')
    async savePost(@Req() req: any, @Param('id') postId: string) {
        const userId = req.user.sub as string;
        this.logger.log(`User ${userId} → SAVE POST → ${postId}`);
        try {
            const result = await this.posts.savePost(userId, postId);
            this.logger.log(`SAVE POST: saved=${result.saved}, total=${result.count}`);
            return result;
        } catch (err: any) {
            this.logger.error(`SAVE POST failed for ${postId}: ${err.message}`, err.stack);
            throw err;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/save')
    async unsavePost(@Req() req: any, @Param('id') postId: string) {
        const userId = req.user.sub as string;
        this.logger.log(`User ${userId} → UNSAVE POST → ${postId}`);
        try {
            const result = await this.posts.unsavePost(userId, postId);
            this.logger.log(`UNSAVE POST: saved=${result.saved}, total=${result.count}`);
            return result;
        } catch (err: any) {
            this.logger.error(`UNSAVE POST failed for ${postId}: ${err.message}`, err.stack);
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
        this.logger.log(`User ${userId} → FETCH SAVED POSTS (page=${p}, limit=${l})`);

        try {
            return await this.posts.getSavedPosts(userId, p, l);
        } catch (err: any) {
            this.logger.error(
                `FETCH SAVED POSTS failed for ${userId}: ${err.message}`,
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
        this.logger.log(`User ${userId} → FETCH POST → ${postId}`);
        try {
            const post = await this.posts.getPostById(postId, userId);
            this.logger.log(`FETCH POST success: ${postId}`);
            return post;
        } catch (err) {
            this.logger.error(`FETCH POST failed for ${postId}: ${err.message}`);
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
