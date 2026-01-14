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

  /** Optional URL for link preview unfurling */
  @IsUrl()
  @IsOptional()
  linkUrl?: string;

  /** Optional preview title */
  @IsString()
  @IsOptional()
  linkTitle?: string;

  /** Optional preview description */
  @IsString()
  @IsOptional()
  linkDescription?: string;

  /** Optional preview image URL */
  @IsUrl()
  @IsOptional()
  linkImageUrl?: string;

  /** Optional preview site name */
  @IsString()
  @IsOptional()
  linkSiteName?: string;

  /** Lounge to post into */
  @IsString()
  @IsOptional()
  loungeId?: string;
}
