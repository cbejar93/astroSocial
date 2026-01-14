import { IsUrl } from 'class-validator';

export class UnfurlRequestDto {
  @IsUrl({ require_protocol: true })
  url: string;
}

export interface UnfurlResponseDto {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
}
