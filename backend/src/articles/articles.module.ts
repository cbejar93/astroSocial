import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { StorageService } from '../storage/storage.service';

@Module({
  imports: [PrismaModule, SupabaseModule.forRoot()],
  providers: [ArticlesService, StorageService],
  controllers: [ArticlesController],
  exports: [ArticlesService],
})
export class ArticlesModule {}
