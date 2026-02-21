-- Prisma migrate: disable-transaction
-- (ALTER TYPE ... ADD VALUE cannot run inside a transaction in PostgreSQL)

-- Add FOLLOW and REPOST to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FOLLOW';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REPOST';

-- Add streak and milestone fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastPostDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "postMilestone" INTEGER NOT NULL DEFAULT 0;
