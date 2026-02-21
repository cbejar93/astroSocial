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

@Controller('games')
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
  async getLeaderboard(@Param('gameId') gameId: string) {
    return this.gamesService.getLeaderboard(gameId);
  }
}
