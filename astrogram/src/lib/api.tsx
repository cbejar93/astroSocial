// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

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

// internal: actually do the refresh
async function refreshToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',       // send the jid cookie
  });
  if (!res.ok) {
    throw new Error('Refresh failed');
  }
  const { accessToken: newToken } = await res.json();
  setAccessToken(newToken);
  return newToken;
}

export async function apiFetch(
    input: RequestInfo,
    init: RequestInit = {}
  ): Promise<Response> {
    // 1) attach Authorization header + credentials
    init.headers = {
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    };
    init.credentials = 'include';
  
    const url = `${API_BASE}${input}`;
    let res = await fetch(url, init);
  
    // 2) on 401, try to refresh once
    // if (res.status === 401) {
    //   try {
    //     const newToken = await refreshToken();
    //     init.headers = {
    //       ...(init.headers as Record<string, string>),
    //       Authorization: `Bearer ${newToken}`,
    //     };
    //     res = await fetch(url, init);
    //   } catch {
    //     // give up → redirect to login
    //     window.location.href = '/signup';
    //     throw new Error('Not authenticated');
    //   }
    // }
  
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
  export async function fetchFeed<Item = any>(
    page: number = 1,
    limit: number = 20
  ): Promise<FeedResponse<Item>> {
    const res = await apiFetch(`/posts/feed?page=${page}&limit=${limit}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch feed (status ${res.status})`);
    }
    return res.json();
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

// --------------------------------------------------
// Comments API helpers

export async function fetchComments<T = any>(postId: string): Promise<T[]> {
  const res = await apiFetch(`/posts/${postId}/comments`);
  if (!res.ok) {
    throw new Error(`Failed to fetch comments (${res.status})`);
  }
  return res.json();
}

export async function createComment<T = any>(postId: string, text: string): Promise<T> {
  const res = await apiFetch(`/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
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
