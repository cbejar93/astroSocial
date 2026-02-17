import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsEnum(['DRAFT', 'PUBLISHED'])
  @IsOptional()
  status?: 'DRAFT' | 'PUBLISHED';
}
