-- Alter User table to support encrypted emails
ALTER TABLE "User" RENAME COLUMN "email" TO "emailEncrypted";
ALTER TABLE "User" ADD COLUMN "emailHash" TEXT;
DROP INDEX IF EXISTS "User_email_key";
CREATE UNIQUE INDEX "User_emailHash_key" ON "User"("emailHash");
