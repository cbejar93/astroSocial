import { IsOptional, IsString } from 'class-validator';

export class UpdateLoungeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
