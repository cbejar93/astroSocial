-- Migration: add_scalability_indexes
-- Adds indexes to core social tables that were missing, causing full table
-- scans on high-traffic queries (feed, comments, notifications, saved posts).

-- Post: feed queries order by createdAt; user-profile and lounge queries filter
--       by authorId/loungeId then order by createdAt.
CREATE INDEX IF NOT EXISTS "Post_createdAt_idx"        ON "Post" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Post_authorId_createdAt_idx" ON "Post" ("authorId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Post_loungeId_createdAt_idx" ON "Post" ("loungeId", "createdAt" DESC);

-- Comment: thread queries filter by postId + parentId IS NULL and order by createdAt;
--          reply loading filters by parentId; user-comment queries filter by authorId.
CREATE INDEX IF NOT EXISTS "Comment_postId_createdAt_idx"   ON "Comment" ("postId", "createdAt" ASC);
CREATE INDEX IF NOT EXISTS "Comment_parentId_idx"           ON "Comment" ("parentId");
CREATE INDEX IF NOT EXISTS "Comment_authorId_createdAt_idx" ON "Comment" ("authorId", "createdAt" DESC);

-- Notification: feed queries filter by userId and order by createdAt;
--               unread-count queries filter by userId + read = false.
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx"      ON "Notification" ("userId", "read");

-- SavedPost: saved-posts timeline queries filter by userId and order by createdAt.
CREATE INDEX IF NOT EXISTS "SavedPost_userId_createdAt_idx" ON "SavedPost" ("userId", "createdAt" DESC);
