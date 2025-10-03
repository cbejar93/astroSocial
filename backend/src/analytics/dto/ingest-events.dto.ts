import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AnalyticsEventInputDto {
  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsInt()
  durationMs?: number;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class IngestAnalyticsEventsDto {
  @IsOptional()
  @IsString()
  sessionKey?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  startedAt?: string;

  @IsOptional()
  @IsString()
  endedAt?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalyticsEventInputDto)
  events: AnalyticsEventInputDto[] = [];
}
