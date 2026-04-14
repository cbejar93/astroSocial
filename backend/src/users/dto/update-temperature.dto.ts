import { IsEnum } from 'class-validator';
import { TemperatureUnit } from '@prisma/client';

export class UpdateTemperatureDto {
  @IsEnum(TemperatureUnit)
  temperature: TemperatureUnit;
}
