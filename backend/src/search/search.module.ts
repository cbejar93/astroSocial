import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { UsersModule } from '../users/users.module';
import { LoungesModule } from '../lounges/lounges.module';

@Module({
  imports: [UsersModule, LoungesModule],
  controllers: [SearchController],
})
export class SearchModule {}
