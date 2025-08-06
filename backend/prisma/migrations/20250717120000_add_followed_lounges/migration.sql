-- Add followedLounges column to User
ALTER TABLE "User" ADD COLUMN "followedLounges" TEXT[] DEFAULT ARRAY[]::TEXT[];
