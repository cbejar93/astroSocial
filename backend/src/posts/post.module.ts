// posts.module.ts
import { Module }         from '@nestjs/common'
import { PrismaModule }   from '../prisma/prisma.module'
import { PostsService }   from './post.service'
import { PostsController }from './post.controller'
import { StorageService } from 'src/storage/storage.service';
import { SupabaseModule }  from '../supabase/supabase.module';



@Module({
  imports: [PrismaModule,
    SupabaseModule.forRoot(),

  ],
  providers: [PostsService, StorageService],
  controllers: [PostsController],
})
export class PostsModule {}