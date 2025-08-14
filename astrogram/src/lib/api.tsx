// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
// Some endpoints like the lounges API live at the root without the `/api` prefix.
// Strip a trailing `/api` segment from the base URL so we can reuse the origin
// when constructing those absolute URLs.

let accessToken = '';  // in‑memory only

export function setAccessToken(token: string) {
  accessToken = token;
}

// call this on login success:
export async function handleLogin(token: string) {
  setAccessToken(token);
  // optionally persist in localStorage
  localStorage.setItem('jwt', token);
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
    const res = await fetch(url, init);

    // 2) handle unauthorized responses by clearing auth state and notifying listeners
    if (res.status === 401) {
      setAccessToken('');
      localStorage.removeItem('ACCESS_TOKEN');
      localStorage.removeItem('jwt');
      window.dispatchEvent(new Event('auth-logout'));

      let text: string;
      try {
        text = await res.text();
      } catch {
        text = res.statusText;
      }
      throw new Error(`API error ${res.status} ${res.statusText}: ${text}`);
    }

    // 3) throw on any other non‑2xx
    if (!res.ok) {
      let text: string;
      try {
        text = await res.text();
      } catch {
        text = res.statusText;
      }
      throw new Error(`API error ${res.status} ${res.statusText}: ${text}`);
    }

    return res;
  }

// // the wrapper you use everywhere instead of bare fetch:
// export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
//   // 1) attach Authorization header
//   init.headers = {
//     ...(init.headers || {}),
//     Authorization: `Bearer ${accessToken}`,
//   };
//   init.credentials = 'include';

//   let res = await fetch(API_BASE + input, init);

//   // 2) if access token expired → try a refresh + retry
//   if (res.status === 401) {
//     try {
//       const newToken = await refreshToken();
//       // retry original request with new token
//       init.headers = {
//         ...(init.headers as Record<string,string>),
//         Authorization: `Bearer ${newToken}`,
//       };
//       res = await fetch(API_BASE + input, init);
//     } catch {
//       // refresh failed → redirect to login
//       window.location.href = '/signup';
//       throw new Error('Not authenticated');
//     }
//   }

//   return res;
// }

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
   * Fetch the paginated, weighted feed.
   * @param page  1‑based page number (default: 1)
   * @param limit items per page (default: 20)
   */
  export async function fetchFeed<Item = unknown>(
    page: number = 1,
    limit: number = 20
  ): Promise<FeedResponse<Item>> {
    const res = await apiFetch(`/posts/feed?page=${page}&limit=${limit}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch feed (status ${res.status})`);
    }
    return res.json();
  }

export async function fetchSavedPosts<Item = unknown>(
  page: number = 1,
  limit: number = 20,
): Promise<FeedResponse<Item>> {
  const res = await apiFetch(`/posts/saved?page=${page}&limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch saved posts (status ${res.status})`);
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
}

export async function unfollowLounge(name: string) {
  await apiFetch(
    `${API_BASE}/lounges/${encodeURIComponent(name)}/follow`,
    { method: 'DELETE' },
    false,
  );
}

export async function createLounge(form: FormData) {
  const res = await apiFetch(`${API_BASE}/lounges`, { method: 'POST', body: form }, false);
  return res.json();
}


export async function updateLounge(id: string, form: FormData) {
  const res = await apiFetch(
    `${API_BASE}/lounges/${id}`,
    { method: 'PATCH', body: form },
    false,
  );
  return res.json();
}

export async function deleteLounge(id: string) {
  await apiFetch(`${API_BASE}/lounges/${id}`, { method: 'DELETE' }, false);
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

  export async function toggleSave(
    postId: string,
  ): Promise<{ saved: boolean }> {
    const res = await apiFetch(`/posts/${postId}/save`, { method: 'POST' });
    return res.json();
  }

// --------------------------------------------------
// Comments API helpers

export async function fetchComments<T = unknown>(postId: string): Promise<T[]> {
  const res = await apiFetch(`/posts/${postId}/comments`);
  if (!res.ok) {
    throw new Error(`Failed to fetch comments (${res.status})`);
  }
  return res.json();
}

export async function createComment<T = unknown>(postId: string, text: string, parentId?: string): Promise<T> {
  const res = await apiFetch(`/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, parentId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create comment (${res.status})`);
  }
  return res.json();
}

export async function deleteComment(commentId: string): Promise<void> {
  const res = await apiFetch(`/comments/${commentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete comment (${res.status})`);
  }
}


export async function toggleCommentLike(
  commentId: string,
): Promise<{ liked: boolean; count: number }> {
  const res = await apiFetch(`/comments/${commentId}/like`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Failed to like comment (${res.status})`);
  }
  return res.json();
}


// --------------------------------------------------
// Notifications API helpers

export interface NotificationItem {
  id: string;
  type: 'POST_LIKE' | 'COMMENT' | 'COMMENT_LIKE';
  timestamp: string;
  actor: { username: string; avatarUrl: string };
  postId?: string;
  commentId?: string;
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

export async function fetchUser(username: string) {
  const res = await apiFetch(`/users/${username}`);
  return res.json();
}

export async function fetchUserPosts<T = unknown>(username: string): Promise<T[]> {
  const res = await apiFetch(`/users/${username}/posts`);
  return res.json();
}

export async function fetchUserComments<T = unknown>(username: string): Promise<T[]> {
  const res = await apiFetch(`/users/${username}/comments`);
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
