// posts.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PostsService } from './post.service';
import { PostsController } from './post.controller';
import { StorageService } from '../storage/storage.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    PrismaModule,
    SupabaseModule.forRoot(),
    NotificationsModule,
    AnalyticsModule,
    ModerationModule,
  ],
  providers: [PostsService, StorageService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
