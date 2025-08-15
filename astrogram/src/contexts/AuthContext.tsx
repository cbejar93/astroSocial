// src/contexts/AuthContext.tsx
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useEffect,
  useState,
  useCallback,

} from "react";
import type { ReactNode } from 'react';
import { apiFetch, setAccessToken, followLounge, unfollowLounge } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export interface User {
  id: string;
  username?: string;
  avatarUrl?: string;
  profileComplete: boolean;
  role: string;
  followedLounges?: string[];
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessToken: string) => Promise<User>;
  logout: () => void;
  updateFollowedLounge: (
    loungeId: string,
    loungeName: string,
    follow: boolean,
  ) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // on mount, rehydrate access token + user snapshot then validate
  useEffect(() => {
    const savedToken = localStorage.getItem("ACCESS_TOKEN");
    const savedUser = localStorage.getItem("USER_SNAPSHOT");
    if (savedToken) {
      setAccessToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem("USER_SNAPSHOT");
        }
      }
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${savedToken}` },
            credentials: "include",
          });
          if (!res.ok) throw new Error("Not authenticated");
          const me = await res.json();
          setUser(me);
          localStorage.setItem("USER_SNAPSHOT", JSON.stringify(me));
        } catch {
          try {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
              method: "POST",
              credentials: "include",
            });
            if (!refreshRes.ok) throw new Error("Refresh failed");
            const { accessToken: newToken } = await refreshRes.json();
            setAccessToken(newToken);
            localStorage.setItem("ACCESS_TOKEN", newToken);
            const userRes = await fetch(`${API_BASE}/users/me`, {
              headers: { Authorization: `Bearer ${newToken}` },
              credentials: "include",
            });
            if (!userRes.ok) throw new Error("Not authenticated");
            const me = await userRes.json();
            setUser(me);
            localStorage.setItem("USER_SNAPSHOT", JSON.stringify(me));
          } catch {
            setUser(null);
            setAccessToken("");
            localStorage.removeItem("ACCESS_TOKEN");
            localStorage.removeItem("USER_SNAPSHOT");
          }
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('AuthContext user', user);
  }, [user]);

  const login = async (accessToken: string) => {
    // 1) store new access token
    setAccessToken(accessToken);
    localStorage.setItem("ACCESS_TOKEN", accessToken);

    // 2) fetch the user profile
    setLoading(true);
    const res = await apiFetch("/users/me");
    if (!res.ok) {
      throw new Error("Login failed");
    }
    const me: User = await res.json();
    setUser(me);
    localStorage.setItem("USER_SNAPSHOT", JSON.stringify(me));
    setLoading(false);
    return me;
  };

  const logout = useCallback(() => {
    // drop everything
    setUser(null);
    setAccessToken("");
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("USER_SNAPSHOT");
    // optionally call your backend /logout endpoint to clear the refresh cookie
  }, []);

  const updateFollowedLounge = async (
    loungeId: string,
    loungeName: string,
    follow: boolean,
  ) => {
    try {
      if (follow) await followLounge(loungeName);
      else await unfollowLounge(loungeName);
      setUser((prev) => {
        if (!prev) return prev;
        const current = prev.followedLounges ?? [];
        const followedLounges = follow
          ? [...current, loungeId]
          : current.filter((id) => id !== loungeId);
        const updated = { ...prev, followedLounges };
        localStorage.setItem("USER_SNAPSHOT", JSON.stringify(updated));
        return updated;
      });
    } catch {
      // silently ignore for now
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateFollowedLounge }}>
      {children}
    </AuthContext.Provider>
  );
};

