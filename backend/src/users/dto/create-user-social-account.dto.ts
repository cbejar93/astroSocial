import { Prisma, SocialPlatform } from '@prisma/client';

export interface CreateUserSocialAccountDto {
  platform: SocialPlatform | string;
  url: string;
  metadata?: Prisma.InputJsonValue | null;
}
