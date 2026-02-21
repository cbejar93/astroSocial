import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGameScoreDto } from './dto/create-game-score.dto';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async submitScore(
    dto: CreateGameScoreDto,
    userId?: string,
    username?: string,
  ) {
    return this.prisma.gameScore.create({
      data: {
        gameId: dto.gameId,
        userId: userId ?? null,
        displayName: userId && username ? username : dto.displayName,
        score: dto.score,
        rounds: dto.rounds,
        avgAccuracy: dto.avgAccuracy,
      },
      select: {
        id: true,
        userId: true,
        displayName: true,
        score: true,
        rounds: true,
        avgAccuracy: true,
        playedAt: true,
      },
    });
  }

  async getLeaderboard(gameId: string, userId?: string) {
    const entries = await this.prisma.gameScore.findMany({
      where: { gameId },
      orderBy: [{ score: 'desc' }, { playedAt: 'asc' }],
      take: 10,
      select: {
        id: true,
        userId: true,
        displayName: true,
        score: true,
        rounds: true,
        avgAccuracy: true,
        playedAt: true,
      },
    });

    let userRank: number | null = null;
    if (userId) {
      const userInTop10 = entries.some((e) => e.userId === userId);
      if (!userInTop10) {
        userRank = await this.getUserRank(gameId, userId);
      }
    }

    return { entries, userRank };
  }

  private async getUserRank(gameId: string, userId: string): Promise<number | null> {
    const best = await this.prisma.gameScore.findFirst({
      where: { gameId, userId },
      orderBy: { score: 'desc' },
      select: { score: true },
    });
    if (!best) return null;
    const better = await this.prisma.gameScore.count({
      where: { gameId, score: { gt: best.score } },
    });
    return better + 1;
  }

  async getMyScores(gameId: string, userId: string) {
    return this.prisma.gameScore.findMany({
      where: { gameId, userId },
      orderBy: { score: 'desc' },
      take: 10,
      select: {
        id: true,
        score: true,
        rounds: true,
        avgAccuracy: true,
        playedAt: true,
      },
    });
  }
}
