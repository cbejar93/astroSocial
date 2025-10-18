import { IsArray, IsOptional, IsString } from 'class-validator';

export class CheckModerationDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  texts?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageBase64?: string[];
}
