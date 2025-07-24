// posts.module.ts
import { Module }         from '@nestjs/common'
import { PrismaModule }   from '../prisma/prisma.module'
import { PostsService }   from './post.service'
import { PostsController }from './post.controller'

@Module({
  imports: [PrismaModule],
  providers: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}