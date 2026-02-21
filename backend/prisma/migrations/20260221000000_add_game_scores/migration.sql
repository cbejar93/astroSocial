-- CreateTable
CREATE TABLE "GameScore" (
    "id"          TEXT NOT NULL,
    "gameId"      TEXT NOT NULL,
    "userId"      TEXT,
    "displayName" TEXT NOT NULL,
    "score"       INTEGER NOT NULL,
    "rounds"      INTEGER NOT NULL,
    "avgAccuracy" DOUBLE PRECISION NOT NULL,
    "playedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameScore_gameId_score_idx" ON "GameScore"("gameId", "score");

-- CreateIndex
CREATE INDEX "GameScore_gameId_playedAt_idx" ON "GameScore"("gameId", "playedAt");

-- AddForeignKey
ALTER TABLE "GameScore" ADD CONSTRAINT "GameScore_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
