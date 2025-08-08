// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  
} from "react";
import type { ReactNode } from 'react';
import { apiFetch, setAccessToken, followLounge, unfollowLounge } from "../lib/api";

export interface User {
  id: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  profileComplete: boolean;
  followedLounges?: string[];
}

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // on mount, rehydrate access token + fetch current user
  useEffect(() => {
    const saved = localStorage.getItem("ACCESS_TOKEN");
    if (saved) {
      setAccessToken(saved);
      apiFetch("/users/me")
        .then((res) => {
          if (!res.ok) throw new Error("Not authenticated");
          return res.json();
        })
        .then(setUser)
        .catch(() => {
          setUser(null);
          setAccessToken("");
          localStorage.removeItem("ACCESS_TOKEN");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

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
    setLoading(false);
    return me;
  };

  const logout = () => {
    // drop everything
    setUser(null);
    setAccessToken("");
    localStorage.removeItem("ACCESS_TOKEN");
    // optionally call your backend /logout endpoint to clear the refresh cookie
  };

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
        return { ...prev, followedLounges };
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      loading: false,
      // provide stubs that warn when used without provider
      login: async () => {
        throw new Error('AuthProvider is missing');
      },
      logout: () => {
        throw new Error('AuthProvider is missing');
      },
      updateFollowedLounge: async () => {
        throw new Error('AuthProvider is missing');
      },
    };
  }
  return ctx;
}
