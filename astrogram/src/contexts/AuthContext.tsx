// src/contexts/AuthContext.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
  } from 'react';
  import type { ReactNode } from 'react';

  declare global {
    interface ImportMetaEnv {
      readonly VITE_API_BASE_URL: string
      // add other VITE_️_ vars if you use them here…
    }
    interface ImportMeta {
      readonly env: ImportMetaEnv
    }
  }

  
  interface User {
    id: string;
    email: string;
  }
  
  interface AuthContextType {
    token: string | null;
    user: User | null;
    login: (token: string) => Promise<void>;
    logout: () => void;
  }
  
  const AuthContext = createContext<AuthContextType | undefined>(undefined);
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user,  setUser]  = useState<User | null>(null);
    const API_BASE          = import.meta.env.VITE_API_BASE_URL;
  
    // helper to GET /auth/me
    async function fetchMe(jwt: string): Promise<User> {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error('Failed to fetch /auth/me');
      return res.json();
    }
  
    // on app load, rehydrate token
    useEffect(() => {
      const saved = localStorage.getItem('AUTH_TOKEN');
      if (saved) {
        setToken(saved);
        fetchMe(saved)
          .then(setUser)
          .catch(() => {
            localStorage.removeItem('AUTH_TOKEN');
            setToken(null);
          });
      }
    }, []);
  
    const login = async (rawToken: string) => {
      localStorage.setItem('AUTH_TOKEN', rawToken);
      setToken(rawToken);
      const me = await fetchMe(rawToken);
      setUser(me);
    };
  
    const logout = () => {
      localStorage.removeItem('AUTH_TOKEN');
      setToken(null);
      setUser(null);
    };
  
    return (
      <AuthContext.Provider value={{ token, user, login, logout }}>
        {children}
      </AuthContext.Provider>
    );
  }
  
  export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
  }
  