import { IsEnum } from 'class-validator';
import { AccentColor } from '@prisma/client';

export class UpdateAccentDto {
  @IsEnum(AccentColor)
  accent: AccentColor;
}
