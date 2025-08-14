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
  repostedByMe: boolean;
  savedByMe: boolean;
  repostedBy?: string;
  title?: string;
  imageUrl?: string;
}

export interface FeedResponseDto {
  posts: FeedPostDto[];
  total: number;
  page: number;
  limit: number;
}
