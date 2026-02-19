-- Add FOLLOW and REPOST to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE 'FOLLOW';
ALTER TYPE "NotificationType" ADD VALUE 'REPOST';

-- Add streak and milestone fields to User
ALTER TABLE "User" ADD COLUMN "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "longestStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastPostDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "postMilestone" INTEGER NOT NULL DEFAULT 0;
