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

// the wrapper you use everywhere instead of bare fetch:
export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  // 1) attach Authorization header
  init.headers = {
    ...(init.headers || {}),
    Authorization: `Bearer ${accessToken}`,
  };
  init.credentials = 'include';

  let res = await fetch(API_BASE + input, init);

  // 2) if access token expired → try a refresh + retry
  if (res.status === 401) {
    try {
      const newToken = await refreshToken();
      // retry original request with new token
      init.headers = {
        ...(init.headers as Record<string,string>),
        Authorization: `Bearer ${newToken}`,
      };
      res = await fetch(API_BASE + input, init);
    } catch {
      // refresh failed → redirect to login
      window.location.href = '/signup';
      throw new Error('Not authenticated');
    }
  }

  return res;
}
