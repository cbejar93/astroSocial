import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { UsersModule } from '../users/users.module';
import { LoungesModule } from '../lounges/lounges.module';
import { ArticlesModule } from '../articles/articles.module';

@Module({
  imports: [UsersModule, LoungesModule, ArticlesModule],
  controllers: [SearchController],
})
export class SearchModule {}
