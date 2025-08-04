-- Add optional parentId column to comments and set up self-relation
ALTER TABLE "Comment" ADD COLUMN "parentId" TEXT;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
