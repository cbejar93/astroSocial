-- Baseline sync: captures all schema changes applied via db push
-- that are not tracked by prior migrations.
-- This migration is marked as "already applied" and will NOT be executed.

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('LIKE', 'SHARE', 'REPOST');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('POST_LIKE', 'COMMENT', 'COMMENT_LIKE');

-- AlterTable: User additions
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "profileComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- AlterTable: Make emailHash required (was nullable)
ALTER TABLE "User" ALTER COLUMN "emailHash" SET NOT NULL;

-- CreateIndex: User unique indexes
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");

-- AlterTable: Post additions
ALTER TABLE "Post" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN "likes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Post" ADD COLUMN "shares" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Post" ADD COLUMN "reposts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Post" ADD COLUMN "originalAuthorId" TEXT;
ALTER TABLE "Post" ADD COLUMN "loungeId" TEXT;

-- AlterTable: Comment additions
ALTER TABLE "Comment" ADD COLUMN "likes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: CommentLike
CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PostInteraction
CREATE TABLE "PostInteraction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "type" "NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Lounge
CREATE TABLE "Lounge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bannerUrl" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    CONSTRAINT "Lounge_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AnalyticsSession
CREATE TABLE "AnalyticsSession" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "userId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AnalyticsEvent
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "durationMs" INTEGER,
    "value" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: _LoungeFollowers (implicit many-to-many)
CREATE TABLE "_LoungeFollowers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_commentId_userId_key" ON "CommentLike"("commentId", "userId");
CREATE UNIQUE INDEX "PostInteraction_postId_userId_type_key" ON "PostInteraction"("postId", "userId", "type");
CREATE UNIQUE INDEX "Lounge_name_key" ON "Lounge"("name");
CREATE UNIQUE INDEX "AnalyticsSession_sessionKey_key" ON "AnalyticsSession"("sessionKey");
CREATE INDEX "AnalyticsEvent_type_idx" ON "AnalyticsEvent"("type");
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");
CREATE UNIQUE INDEX "_LoungeFollowers_AB_unique" ON "_LoungeFollowers"("A", "B");
CREATE INDEX "_LoungeFollowers_B_index" ON "_LoungeFollowers"("B");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_originalAuthorId_fkey" FOREIGN KEY ("originalAuthorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_loungeId_fkey" FOREIGN KEY ("loungeId") REFERENCES "Lounge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PostInteraction" ADD CONSTRAINT "PostInteraction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PostInteraction" ADD CONSTRAINT "PostInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_LoungeFollowers" ADD CONSTRAINT "_LoungeFollowers_A_fkey" FOREIGN KEY ("A") REFERENCES "Lounge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_LoungeFollowers" ADD CONSTRAINT "_LoungeFollowers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
