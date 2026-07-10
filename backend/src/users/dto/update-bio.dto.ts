import { IsString, MaxLength } from 'class-validator';

export class UpdateBioDto {
  @IsString()
  @MaxLength(1600)
  bio: string;
}
