export interface ReposterDto {
  id: string;
  username: string;
  avatarUrl: string;
}

export interface FeedPostDto {
  id: string;
  authorId: string;
  username: string;
  title?: string;
  imageUrl?: string;
  avatarUrl: string;
  caption: string;
  timestamp: string;
  stars: number;
  comments: number;
  shares: number;
  likedByMe: boolean;
  repostedBy?: ReposterDto;
}

export interface FeedResponseDto {
  posts: FeedPostDto[];
  total: number;
  page: number;
  limit: number;
}
