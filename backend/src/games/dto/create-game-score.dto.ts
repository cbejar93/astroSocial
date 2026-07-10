import { IsString, IsInt, IsNumber, Max, MaxLength, Min } from 'class-validator';

export class CreateGameScoreDto {
  @IsString()
  gameId: string;

  @IsString()
  @MaxLength(50)
  displayName: string;

  @IsInt()
  @Min(0)
  @Max(100_000)
  score: number;

  @IsInt()
  @Min(1)
  @Max(500)
  rounds: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  avgAccuracy: number;
}
