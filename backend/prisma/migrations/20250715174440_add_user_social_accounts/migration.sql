-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM (
    'TWITTER',
    'INSTAGRAM',
    'TIKTOK',
    'YOUTUBE',
    'LINKEDIN',
    'GITHUB',
    'WEBSITE',
    'OTHER'
);

-- CreateTable
CREATE TABLE "UserSocialAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSocialAccount_unique_user_social_url" ON "UserSocialAccount"("userId", "platform", "url");

-- CreateIndex
CREATE INDEX "UserSocialAccount_userId_idx" ON "UserSocialAccount"("userId");

-- CreateIndex
CREATE INDEX "UserSocialAccount_platform_idx" ON "UserSocialAccount"("platform");

-- AddForeignKey
ALTER TABLE "UserSocialAccount" ADD CONSTRAINT "UserSocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
