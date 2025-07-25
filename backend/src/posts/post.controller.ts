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
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PostsService } from './post.service'
import { InteractionType } from '@prisma/client'
import { CreatePostDto } from './dto/create-post.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { OptionalAuthGuard } from 'src/auth/jwt-optional.guard'

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
    ) {
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
    @UseInterceptors(FileInterceptor('image'))
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
}
