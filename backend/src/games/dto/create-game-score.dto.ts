import { IsString, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateGameScoreDto {
  @IsString()
  gameId: string;

  @IsString()
  displayName: string;

  @IsInt()
  @Min(0)
  score: number;

  @IsInt()
  @Min(1)
  rounds: number;

  @IsNumber()
  @Min(0)
  avgAccuracy: number;
}
