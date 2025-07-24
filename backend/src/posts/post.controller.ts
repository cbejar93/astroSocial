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
  } from '@nestjs/common'
  import { JwtAuthGuard }    from '../auth/jwt-auth.guard'
  import { PostsService }    from './post.service'
  import { InteractionType } from '@prisma/client'
import { CreatePostDto } from './dto/create-post.dto'
import { FileInterceptor } from '@nestjs/platform-express'
  
  @Controller('api/posts')
  export class PostsController {
    private readonly logger = new Logger(PostsController.name)
  
    constructor(private readonly posts: PostsService) {}

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    @Post()
    async createPost(
      @Req()  req: any,
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
    @Post(':id/like')
    async likePost(@Req() req: any, @Param('id') postId: string) {
      const userId = req.user.sub as string
      this.logger.log(`User ${userId} → LIKE → post ${postId}`)
  
      try {
        const result = await this.posts.interact(
          userId,
          postId,
          InteractionType.LIKE,
        )
        this.logger.log(
          `LIKE successful for post ${postId}, new likes = ${result.count}`,
        )
        return result
      } catch (err: any) {
        this.logger.error(
          `LIKE failed for post ${postId}: ${err.message}`,
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
  }
  