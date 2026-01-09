import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

export type AccentKey = "brand" | "ocean" | "mint";
type AccentServerValue = "BRAND" | "OCEAN" | "MINT";

const ACCENTS: Record<AccentKey, { from: string; to: string }> = {
  brand: { from: "#f04bb3", to: "#5aa2ff" },
  ocean: { from: "#06b6d4", to: "#8b5cf6" },
  mint: { from: "#22c55e", to: "#06b6d4" },
};

const SERVER_TO_ACCENT: Record<AccentServerValue, AccentKey> = {
  BRAND: "brand",
  OCEAN: "ocean",
  MINT: "mint",
};

const ACCENT_TO_SERVER = {
  brand: "BRAND",
  ocean: "OCEAN",
  mint: "MINT",
} as const;

type ThemeContextValue = {
  accent: AccentKey;
  setAccent: (accent: AccentKey) => Promise<void>;
  gradients: typeof ACCENTS;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateAccentPreference } = useAuth();
  const [accent, setAccentState] = useState<AccentKey>(() => {
    if (user?.accent) return SERVER_TO_ACCENT[user.accent];
    return "brand";
  });

  useEffect(() => {
    if (user?.accent) {
      setAccentState(SERVER_TO_ACCENT[user.accent]);
    }
  }, [user?.accent]);

  useEffect(() => {
    const { from, to } = ACCENTS[accent];
    const root = document.documentElement;
    root.style.setProperty("--accent-from", from);
    root.style.setProperty("--accent-to", to);
  }, [accent]);

  const setAccent = useCallback(
    async (nextAccent: AccentKey) => {
      setAccentState(nextAccent);
      if (!user) return;
      try {
        await updateAccentPreference(ACCENT_TO_SERVER[nextAccent]);
      } catch {
        // Keep optimistic UI even if persistence fails.
      }
    },
    [updateAccentPreference, user],
  );

  const value = useMemo(
    () => ({ accent, setAccent, gradients: ACCENTS }),
    [accent, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("ThemeProvider is missing");
  }
  return ctx;
};
