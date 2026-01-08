import { SocialPlatform } from '@prisma/client';

export interface CreateUserSocialAccountDto {
  platform: SocialPlatform | string;
  url: string;
  metadata?: Record<string, unknown>;
}
