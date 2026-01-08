-- CreateTable
CREATE TABLE "RequestMetric" (
    "id" TEXT NOT NULL,
    "route" TEXT,
    "method" TEXT,
    "statusCode" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT,
    "userId" TEXT,

    CONSTRAINT "RequestMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestMetric_occurredAt_idx" ON "RequestMetric"("occurredAt");

-- CreateIndex
CREATE INDEX "RequestMetric_statusCode_idx" ON "RequestMetric"("statusCode");

-- AddForeignKey
ALTER TABLE "RequestMetric" ADD CONSTRAINT "RequestMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
