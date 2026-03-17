import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PostOgData {
  title: string;
  description: string;
  imageUrl: string | null;
  authorUsername: string;
  url: string;
}

export interface LoungeOgData {
  name: string;
  description: string;
  imageUrl: string | null;
  url: string;
}

const PROD_URL = 'https://astrosocial.fly.dev';

@Injectable()
export class OgService {
  private readonly logger = new Logger(OgService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPostData(postId: string): Promise<PostOgData | null> {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: {
          title: true,
          body: true,
          imageUrl: true,
          linkImageUrl: true,
          author: { select: { username: true } },
        },
      });
      if (!post) return null;

      const description = stripHtml(post.body).slice(0, 160) || post.title;
      const imageUrl = post.imageUrl ?? post.linkImageUrl ?? null;
      const username = post.author.username ?? 'unknown';

      return {
        title: post.title || `@${username}'s post`,
        description,
        imageUrl,
        authorUsername: username,
        url: `${PROD_URL}/post/${postId}`,
      };
    } catch (err: unknown) {
      this.logger.error('Failed to fetch post OG data', (err as Error).stack);
      return null;
    }
  }

  async getLoungeData(loungeName: string): Promise<LoungeOgData | null> {
    try {
      const lounge = await this.prisma.lounge.findUnique({
        where: { name: loungeName },
        select: {
          name: true,
          description: true,
          profileUrl: true,
          bannerUrl: true,
        },
      });
      if (!lounge) return null;

      return {
        name: lounge.name,
        description: lounge.description?.slice(0, 160) || `Explore the ${lounge.name} community`,
        imageUrl: lounge.profileUrl ?? lounge.bannerUrl ?? null,
        url: `${PROD_URL}/lounge/${encodeURIComponent(loungeName)}`,
      };
    } catch (err: unknown) {
      this.logger.error('Failed to fetch lounge OG data', (err as Error).stack);
      return null;
    }
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
