import { Module } from '@nestjs/common';
import { PostsModule } from '../posts/post.module';
import { BotService } from './bot.service';

@Module({
  imports: [PostsModule],
  providers: [BotService],
})
export class BotModule {}
