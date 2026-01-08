import { Prisma, SocialPlatform } from '@prisma/client';

export interface UserSocialAccountDto {
  id: string;
  platform: SocialPlatform;
  url: string;
  metadata?: Prisma.JsonValue | null;
  createdAt: string;
  updatedAt: string;
}
