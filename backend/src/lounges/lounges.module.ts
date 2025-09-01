import { Module } from '@nestjs/common';
import { LoungesService } from './lounges.service';
import { LoungesController } from './lounges.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { StorageService } from '../storage/storage.service';
import { PostsModule } from '../posts/post.module';

@Module({
  imports: [PrismaModule, SupabaseModule.forRoot(), PostsModule],
  providers: [LoungesService, StorageService],
  controllers: [LoungesController],
  exports: [LoungesService],
})
export class LoungesModule {}
