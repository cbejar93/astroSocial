import { IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  /** Short headline for the post */
  @IsString()
  @IsOptional()
  title?: string;

  /** Body / caption text */
  @IsString()
  body: string;

  /** Optional link to an image */
  @IsString()
  @IsOptional()
  imageUrl?: string;

  /** Lounge to post into */
  @IsString()
  @IsOptional()
  loungeId?: string;
}
