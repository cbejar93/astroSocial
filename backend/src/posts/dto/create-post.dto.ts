import { IsOptional, IsString, IsUrl } from 'class-validator';

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

  /** Optional link to a YouTube video */
  @IsUrl()
  @IsOptional()
  youtubeUrl?: string;

  /** Lounge to post into */
  @IsString()
  @IsOptional()
  loungeId?: string;
}
