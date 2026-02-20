import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Anthropic from '@anthropic-ai/sdk';
import { PostsService } from '../posts/post.service';

type ContentType = 'fact' | 'news' | 'quote';

const PROMPTS: Record<ContentType, string> = {
  fact: 'Share one fascinating astronomy fact. Be engaging and educational. Reply with only the post text, no preamble.',
  news: 'Describe a notable recent space exploration development or discovery in an exciting way. Reply with only the post text, no preamble.',
  quote:
    'Share an inspiring quote or thought about space, the cosmos, or exploration. Reply with only the post text, no preamble.',
};

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly postsService: PostsService) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  @Cron('0 12 * * *')
  async postDaily(): Promise<void> {
    const botUserId = process.env.BOT_USER_ID;
    if (!botUserId) {
      this.logger.warn('BOT_USER_ID not set — skipping daily bot post');
      return;
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      this.logger.warn('ANTHROPIC_API_KEY not set — skipping daily bot post');
      return;
    }

    try {
      const body = await this.generateContent();
      await this.postsService.create(botUserId, { body });
      this.logger.log('Bot posted successfully');
    } catch (err: any) {
      this.logger.error(`Bot post failed: ${err.message}`, err.stack);
    }
  }

  private async generateContent(): Promise<string> {
    const types: ContentType[] = ['fact', 'news', 'quote'];
    const type = types[Math.floor(Math.random() * types.length)];

    const message = await this.anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 256,
      messages: [{ role: 'user', content: PROMPTS[type] }],
    });

    const block = message.content[0];
    const text = block.type === 'text' ? block.text.trim() : '';
    return text.slice(0, 314);
  }
}
