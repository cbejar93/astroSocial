-- CreateEnum
CREATE TYPE "AccentColor" AS ENUM ('BRAND', 'OCEAN', 'MINT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accent" "AccentColor" NOT NULL DEFAULT 'BRAND';
