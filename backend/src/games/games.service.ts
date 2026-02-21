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
        displayName: true,
        score: true,
        rounds: true,
        avgAccuracy: true,
        playedAt: true,
      },
    });
  }

  async getLeaderboard(gameId: string) {
    return this.prisma.gameScore.findMany({
      where: { gameId },
      orderBy: [{ score: 'desc' }, { playedAt: 'asc' }],
      take: 20,
      select: {
        id: true,
        displayName: true,
        score: true,
        rounds: true,
        avgAccuracy: true,
        playedAt: true,
      },
    });
  }
}
