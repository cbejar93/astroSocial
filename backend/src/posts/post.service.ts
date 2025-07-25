// src/posts/posts.service.ts
import {
    Injectable,
    ConflictException,
    InternalServerErrorException,
    Logger
  } from '@nestjs/common'
  import { PrismaService }   from '../prisma/prisma.service'
  import { InteractionType, Post } from '@prisma/client'
  import { CreatePostDto }       from './dto/create-post.dto'
import { StorageService } from 'src/storage/storage.service'

  
  @Injectable()
  export class PostsService {
    private readonly logger = new Logger(PostsService.name)
  
    constructor(private readonly prisma: PrismaService, private readonly storage: StorageService,) {}

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
              title:     '',
              body:      dto.body,
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
        type === InteractionType.LIKE   ? 'likes'
      : type === InteractionType.SHARE  ? 'shares'
      :                                    'reposts'
  
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
  }
  