export interface FeedPostDto {
  id: string;
  authorId: string;
  username: string;
  avatarUrl: string;
  caption: string;
  timestamp: string;
  stars: number;
  comments: number;
  shares: number;
  reposts: number;
  likedByMe: boolean;
  savedByMe: boolean;
  saves: number;
  repostedByMe: boolean;
  repostedBy?: string;
  title?: string;
  imageUrl?: string;
  youtubeUrl?: string;
}

export interface FeedResponseDto {
  posts: FeedPostDto[];
  total: number;
  page: number;
  limit: number;
}
