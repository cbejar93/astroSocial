// src/lib/api.ts
import { trackEvent, setAnalyticsFetcher } from './analytics';

const API_BASE = import.meta.env?.VITE_API_BASE_URL || '/api';
const storage = typeof window !== 'undefined' ? window.localStorage : null;
// Some endpoints like the lounges API live at the root without the `/api` prefix.
// Strip a trailing `/api` segment from the base URL so we can reuse the origin
// when constructing those absolute URLs.

let accessToken = storage?.getItem('ACCESS_TOKEN') || '';


export function setAccessToken(token: string) {
  accessToken = token;
}

// call this on login success:
export async function handleLogin(token: string) {
  setAccessToken(token);
  // optionally persist in localStorage
  storage?.setItem('ACCESS_TOKEN', token);
}

export async function logout(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Logout failed (${res.status})`);
    }
  } finally {
    setAccessToken('');
    storage?.removeItem('ACCESS_TOKEN');
    storage?.removeItem('jwt');
    storage?.removeItem('USER_SNAPSHOT');
    window.dispatchEvent(new Event('auth-logout'));
  }
}

let refreshPromise: Promise<string> | null = null;

async function refreshToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Refresh failed (${res.status})`);
        }
        const { accessToken: newToken } = await res.json();
        setAccessToken(newToken);
        storage?.setItem('ACCESS_TOKEN', newToken);
        storage?.setItem('jwt', newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function getErrorText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return res.statusText;
  }
}

export async function apiFetch(
    input: RequestInfo,
    init: RequestInit = {},
    useBase: boolean = true
  ): Promise<Response> {
    // 1) attach Authorization header + credentials
    init.headers = {
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    };
    init.credentials = 'include';

    const url = useBase ? `${API_BASE}${input}` : (input as string);
    let res = await fetch(url, init);

    if (res.status === 401) {
      try {
        const newToken = await refreshToken();
        init.headers = {
          ...(init.headers as Record<string, string>),
          Authorization: `Bearer ${newToken}`,
        };
        res = await fetch(url, init);
      } catch {
        setAccessToken('');
        storage?.removeItem('ACCESS_TOKEN');
        storage?.removeItem('jwt');
        window.dispatchEvent(new Event('auth-logout'));
        const text = await getErrorText(res);
        throw new Error(`API error ${res.status} ${res.statusText}: ${text}`);
      }
    }

    if (!res.ok) {
      const text = await getErrorText(res);
      throw new Error(`API error ${res.status} ${res.statusText}: ${text}`);
    }

    return res;
  }

// ----------------------------------------------------------------------------------
// NEW: helper to fetch our weighted, paginated feed.
// This won’t break any existing usage of apiFetch or handleLogin.
export interface FeedResponse<T> {
    posts: T[];
    total: number;
    page: number;
    limit: number;
  }
  
  /**
   * Fetch the paginated feed.
   * @param page  1‑based page number (default: 1)
   * @param limit items per page (default: 20)
   * @param mode  'foryou' (personalized algorithmic) or 'following' (chronological)
   */
  export async function fetchFeed<Item = unknown>(
    page: number = 1,
    limit: number = 20,
    mode: 'foryou' | 'following' = 'foryou',
  ): Promise<FeedResponse<Item>> {
    const res = await apiFetch(`/posts/feed?page=${page}&limit=${limit}&mode=${mode}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch feed (status ${res.status})`);
    }
    return res.json();
  }

export async function fetchLoungePosts<Item = unknown>(
  loungeName: string,
  page: number = 1,
  limit: number = 20,
): Promise<FeedResponse<Item>> {
  const res = await apiFetch(
    `${API_BASE}/lounges/${encodeURIComponent(loungeName)}/posts?page=${page}&limit=${limit}`,
    {},
    false,
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch lounge posts (${res.status})`);
  }
  return res.json();
}

setAnalyticsFetcher((path, requestInit = {}) => apiFetch(path, requestInit));

export async function fetchLounges<T = unknown>(): Promise<T[]> {
  const res = await apiFetch(`${API_BASE}/lounges`, {}, false);
  if (!res.ok) {
    throw new Error(`Failed to fetch lounges (${res.status})`);
  }
  return res.json();
}

export async function fetchLounge<T = unknown>(name: string): Promise<T> {
  const res = await apiFetch(`${API_BASE}/lounges/${encodeURIComponent(name)}`, {}, false);
  if (!res.ok) {
    throw new Error(`Failed to fetch lounge (${res.status})`);
  }
  return res.json();
}

export async function followLounge(name: string) {
  await apiFetch(
    `${API_BASE}/lounges/${encodeURIComponent(name)}/follow`,
    { method: 'POST' },
    false,
  );
  void trackEvent({
    type: 'lounge_follow',
    targetType: 'lounge',
    targetId: name,
  });
}

export async function unfollowLounge(name: string) {
  await apiFetch(
    `${API_BASE}/lounges/${encodeURIComponent(name)}/follow`,
    { method: 'DELETE' },
    false,
  );
  void trackEvent({
    type: 'lounge_unfollow',
    targetType: 'lounge',
    targetId: name,
  });
}

export async function createLounge(form: FormData) {
  const res = await apiFetch(`${API_BASE}/lounges`, { method: 'POST', body: form }, false);
  const data = await res.json();
  void trackEvent({
    type: 'lounge_create',
    targetType: 'lounge',
    targetId: (data as { id?: string })?.id ?? form.get('name')?.toString(),
    metadata: { name: form.get('name') ?? undefined },
  });
  return data;
}


export async function updateLounge(id: string, form: FormData) {
  const res = await apiFetch(
    `${API_BASE}/lounges/${id}`,
    { method: 'PATCH', body: form },
    false,
  );
  const data = await res.json();
  void trackEvent({
    type: 'lounge_update',
    targetType: 'lounge',
    targetId: id,
  });
  return data;
}

export async function deleteLounge(id: string) {
  await apiFetch(`${API_BASE}/lounges/${id}`, { method: 'DELETE' }, false);
  void trackEvent({
    type: 'lounge_delete',
    targetType: 'lounge',
    targetId: id,
  });
}


export type InteractionType = 'like' | 'share' | 'repost';

export interface InteractionResult {
  type: InteractionType;
  count: number;
}

/**
 * Generic helper to POST an interaction to /posts/:id/:action
 */
export async function interactWithPost(
    postId: string,
    action: InteractionType
  ): Promise<InteractionResult> {
    // POST returns { type, count }
    const res = await apiFetch(`/posts/${postId}/${action}`, {
      method: 'POST',
    });
    return res.json();
  }
  
  /** Convenience wrappers: */
  export function likePost(postId: string) {
    return interactWithPost(postId, 'like');
  }
  
  export function sharePost(postId: string) {
    return interactWithPost(postId, 'share');
  }
  
export function repostPost(postId: string) {
  return interactWithPost(postId, 'repost');
}

export async function savePost(postId: string) {
  const res = await apiFetch(`/posts/${postId}/save`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Failed to save post (${res.status})`);
  }
  return res.json();
}

export interface AnalyticsSummary {
  rangeDays: number;
  generatedAt: string;
  totals: {
    events: number;
    uniqueUsers: number;
  };
  operationalMetrics: {
    totalServerErrors: number;
    averageLatencyMs: number;
    p95LatencyMs: number | null;
    totalRequests: number;
  };
  interactionCounts: { type: string; count: number }[];
  sessions: {
    count: number;
    totalDurationMs: number;
    averageDurationMs: number;
  };
  dailyActiveUsers: { date: string; count: number }[];
  platformActivity: {
    postInteractions: { type: string; count: number }[];
    commentLikes: number;
  };
  visitsByLocation: { location: string; count: number }[];
}

export async function fetchAnalyticsSummary(
  rangeDays: number,
): Promise<AnalyticsSummary> {
  const res = await apiFetch(`/analytics/summary?rangeDays=${rangeDays}`);
  const data = await res.json();

  return {
    ...data,
    operationalMetrics: {
      totalServerErrors: data.operationalMetrics?.totalServerErrors ?? 0,
      averageLatencyMs: data.operationalMetrics?.averageLatencyMs ?? 0,
      p95LatencyMs:
        data.operationalMetrics?.p95LatencyMs ??
        (data.operationalMetrics?.p95LatencyMs === 0 ? 0 : null),
      totalRequests: data.operationalMetrics?.totalRequests ?? 0,
    },
  };
}

export async function unsavePost(postId: string) {
  const res = await apiFetch(`/posts/${postId}/save`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Failed to unsave post (${res.status})`);
  }
  return res.json();
}

export async function fetchSavedPosts<Item = unknown>(
  page: number = 1,
  limit: number = 20,
): Promise<FeedResponse<Item>> {
  const res = await apiFetch(`/posts/saved?page=${page}&limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch saved posts (${res.status})`);
  }
  return res.json();
}

// --------------------------------------------------
// Comments API helpers

export interface CommentResponse {
  id: string;
  text: string;
  authorId: string;
  username: string;
  avatarUrl: string;
  timestamp: string;
  likes: number;
  likedByMe?: boolean;
  parentId?: string | null;
}

export interface PaginatedCommentsResponse<T = CommentResponse> {
  comments: T[];
  replies: T[];
  total: number;
  page?: number;
  limit: number;
  nextCursor?: string | null;
  hasMore?: boolean;
}

export async function fetchCommentPage<T = CommentResponse>(
  postId: string,
  options?: { page?: number; limit?: number; cursor?: string | null },
): Promise<PaginatedCommentsResponse<T>> {
  const { page = 1, limit = 20, cursor } = options ?? {};
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (cursor) {
    params.set("cursor", cursor);
  } else {
    params.set("page", String(page));
  }

  const res = await apiFetch(`/posts/${postId}/comments?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch comments (${res.status})`);
  }
  return res.json();
}

export async function fetchCommentById<T = CommentResponse>(commentId: string): Promise<T> {
  const res = await apiFetch(`/comments/${commentId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch comment (${res.status})`);
  }
  return res.json();
}

export async function createComment<T = CommentResponse>(
  postId: string,
  text: string,
  parentId?: string,
): Promise<T> {
  const res = await apiFetch(`/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, parentId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create comment (${res.status})`);
  }
  const data = await res.json();
  void trackEvent({
    type: 'comment_create',
    targetType: 'post',
    targetId: postId,
    metadata: {
      commentId: (data as CommentResponse)?.id,
      parentId: parentId ?? null,
    },
  });
  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  const res = await apiFetch(`/comments/${commentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete comment (${res.status})`);
  }
  void trackEvent({
    type: 'comment_delete',
    targetType: 'comment',
    targetId: commentId,
  });
}


export async function toggleCommentLike(
  commentId: string,
): Promise<{ liked: boolean; count: number }> {
  const res = await apiFetch(`/comments/${commentId}/like`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Failed to like comment (${res.status})`);
  }
  const data = await res.json();
  void trackEvent({
    type: data.liked ? 'comment_like' : 'comment_unlike',
    targetType: 'comment',
    targetId: commentId,
    value: data.count,
  });
  return data;
}


// --------------------------------------------------
// Notifications API helpers

export interface NotificationItem {
  id: string;
  type: 'POST_LIKE' | 'COMMENT' | 'COMMENT_LIKE' | 'FOLLOW' | 'REPOST';
  timestamp: string;
  actor: { username: string; avatarUrl: string };
  postId?: string;
  commentId?: string;
  loungeName?: string;
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await apiFetch('/notifications');
  return res.json();
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiFetch('/notifications/unread-count');
  const data = await res.json();
  return data.count as number;
}

// --------------------------------------------------
// Profile helpers

export async function fetchMyPosts<T = unknown>(): Promise<T[]> {
  const res = await apiFetch('/users/me/posts');
  return res.json();
}

export async function fetchMyComments<T = unknown>(): Promise<T[]> {
  const res = await apiFetch('/users/me/comments');
  return res.json();
}

export type SocialPlatform =
  | 'TWITTER'
  | 'INSTAGRAM'
  | 'TIKTOK'
  | 'YOUTUBE'
  | 'LINKEDIN'
  | 'GITHUB'
  | 'WEBSITE'
  | 'OTHER';

export interface UserSocialAccount {
  id: string;
  platform: SocialPlatform;
  url: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserSummary {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  role: string;
  profileComplete: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminUsersResponse {
  results: AdminUserSummary[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchMySocialAccounts(): Promise<UserSocialAccount[]> {
  const res = await apiFetch('/users/me/social-accounts');
  return res.json();
}

export async function fetchUserSocialAccounts(
  username: string,
): Promise<UserSocialAccount[]> {
  const encoded = encodeURIComponent(username);
  const res = await apiFetch(`/users/${encoded}/social-accounts`);
  return res.json();
}

export async function addUserSocialAccount(payload: {
  platform: SocialPlatform;
  url: string;
  metadata?: Record<string, unknown>;
}): Promise<UserSocialAccount> {
  const res = await apiFetch('/users/me/social-accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to add social link (${res.status})`);
  }
  return res.json();
}

export async function deleteUserSocialAccount(id: string): Promise<void> {
  const res = await apiFetch(`/users/me/social-accounts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete social link (${res.status})`);
  }
}

export async function fetchAdminUsers(
  page: number = 1,
  limit: number = 20,
): Promise<AdminUsersResponse> {
  const res = await apiFetch(`/users/admin?page=${page}&limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch admin users (${res.status})`);
  }
  return res.json();
}

export async function fetchUser<T = unknown>(username: string): Promise<T> {
  const encoded = encodeURIComponent(username);
  const res = await apiFetch(`/users/${encoded}`);
  return res.json();
}

export interface UserStats {
  followerCount: number;
  followingCount: number;
  postCount: number;
  currentStreak: number;
  longestStreak: number;
  postMilestone: number;
  joinedAt: string;
}

export async function fetchUserStats(username: string): Promise<UserStats> {
  const encoded = encodeURIComponent(username);
  const res = await apiFetch(`/users/${encoded}/stats`);
  return res.json();
}

export async function followUser(username: string) {
  await apiFetch(`/users/${encodeURIComponent(username)}/follow`, {
    method: 'POST',
  });
  void trackEvent({
    type: 'user_follow',
    targetType: 'user',
    targetId: username,
  });
}

export async function unfollowUser(username: string) {
  await apiFetch(`/users/${encodeURIComponent(username)}/follow`, {
    method: 'DELETE',
  });
  void trackEvent({
    type: 'user_unfollow',
    targetType: 'user',
    targetId: username,
  });
}

export async function fetchUserPosts<T = unknown>(username: string): Promise<T[]> {
  const encoded = encodeURIComponent(username);
  const res = await apiFetch(`/users/${encoded}/posts`);
  return res.json();
}

export async function fetchUserComments<T = unknown>(username: string): Promise<T[]> {
  const encoded = encodeURIComponent(username);
  const res = await apiFetch(`/users/${encoded}/comments`);
  return res.json();
}

export async function updateAvatar(username: string, file: File) {
  const form = new FormData();
  form.append('username', username);
  form.append('avatar', file);
  const res = await apiFetch('/users/me', { method: 'PUT', body: form });
  return res.json();
}

export async function deleteProfile() {
  const res = await apiFetch('/users/me', { method: 'DELETE' });
  return res.json();
}

export async function updateTemperaturePreference(temperature: 'C' | 'F') {
  const res = await apiFetch('/users/me/temperature', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temperature }),
  });
  return res.json();
}

export async function updateBio(bio: string) {
  const res = await apiFetch('/users/me/bio', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bio }),
  });
  return res.json();
}

export async function updateAccentPreference(
  accent: 'BRAND' | 'OCEAN' | 'MINT',
) {
  const res = await apiFetch('/users/me/accent', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accent }),
  });
  return res.json();
}

// --------------------------------------------------
// Search API helpers

export interface SearchUser {
  id: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface SearchLounge {
  id: string;
  name: string;
  bannerUrl: string;
}

export interface SearchArticle {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
}

export interface PaginatedResults<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchResponse {
  users?: PaginatedResults<SearchUser>;
  lounges?: PaginatedResults<SearchLounge>;
  articles?: PaginatedResults<SearchArticle>;
}

export async function search(
  query: string,
  page: number = 1,
  limit: number = 20,
): Promise<SearchResponse> {
  const res = await apiFetch(
    `/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
  );
  return res.json();
}

// --------------------------------------------------
// Articles API helpers

export interface Article {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt?: string;
  coverImageUrl?: string;
  status: 'DRAFT' | 'PUBLISHED';
  authorId: string;
  author?: { username: string; avatarUrl: string };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticlesListResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchPublishedArticles(
  page = 1,
  limit = 10,
): Promise<ArticlesListResponse> {
  const res = await apiFetch(`/articles?page=${page}&limit=${limit}`);
  return res.json();
}

export async function fetchArticleBySlug(slug: string): Promise<Article> {
  const res = await apiFetch(`/articles/${encodeURIComponent(slug)}`);
  return res.json();
}

export async function fetchAdminArticles(
  page = 1,
  limit = 20,
): Promise<ArticlesListResponse> {
  const res = await apiFetch(`/articles/admin?page=${page}&limit=${limit}`);
  return res.json();
}

export async function fetchAdminArticleById(id: string): Promise<Article> {
  const res = await apiFetch(`/articles/admin/${id}`);
  return res.json();
}

export async function createArticle(form: FormData): Promise<Article> {
  const res = await apiFetch('/articles', { method: 'POST', body: form });
  return res.json();
}

export async function updateArticle(
  id: string,
  form: FormData,
): Promise<Article> {
  const res = await apiFetch(`/articles/${id}`, {
    method: 'PATCH',
    body: form,
  });
  return res.json();
}

export async function deleteArticle(id: string): Promise<void> {
  await apiFetch(`/articles/${id}`, { method: 'DELETE' });
}

export async function uploadArticleImage(
  file: File,
): Promise<{ url: string }> {
  const form = new FormData();
  form.append('image', file);
  const res = await apiFetch('/articles/upload-image', {
    method: 'POST',
    body: form,
  });
  return res.json();
}
