import { SocialPlatform } from '@prisma/client';

export interface UserSocialAccountDto {
  id: string;
  platform: SocialPlatform;
  url: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
