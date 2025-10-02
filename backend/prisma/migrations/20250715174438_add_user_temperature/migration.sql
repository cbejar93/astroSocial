-- CreateEnum
CREATE TYPE "TemperatureUnit" AS ENUM ('C', 'F');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "temperature" "TemperatureUnit" NOT NULL DEFAULT 'F';
