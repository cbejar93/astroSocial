import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameScoreDto } from './dto/create-game-score.dto';
import { OptionalAuthGuard } from '../auth/jwt-optional.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post('scores')
  @UseGuards(OptionalAuthGuard)
  async submitScore(@Body() dto: CreateGameScoreDto, @Request() req: any) {
    const user = req.user as
      | { sub: string; username?: string }
      | null
      | undefined;
    return this.gamesService.submitScore(dto, user?.sub, user?.username ?? undefined);
  }

  @Get(':gameId/leaderboard')
  @UseGuards(OptionalAuthGuard)
  async getLeaderboard(@Param('gameId') gameId: string, @Request() req: any) {
    const user = req.user as { sub: string } | null | undefined;
    return this.gamesService.getLeaderboard(gameId, user?.sub);
  }

  @Get(':gameId/my-scores')
  @UseGuards(JwtAuthGuard)
  async getMyScores(@Param('gameId') gameId: string, @Request() req: any) {
    const user = req.user as { sub: string };
    return this.gamesService.getMyScores(gameId, user.sub);
  }
}
