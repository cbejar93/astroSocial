import { Module } from '@nestjs/common';
import { SitemapController } from './sitemap.controller';
import { ArticlesModule } from '../articles/articles.module';

@Module({
  imports: [ArticlesModule],
  controllers: [SitemapController],
})
export class SitemapModule {}
