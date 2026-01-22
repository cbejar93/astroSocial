// src/components/Navbar/Navbar.tsx
import React, { useEffect, useRef, useState } from "react";
import { Bell, X, Search, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { search, type SearchResponse } from "../../lib/api";
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "../../lib/supabaseClient";
import { fireAccountCreationConversion } from "../../lib/googleAds";

/* ---- Brand Icons ---- */
const GoogleG: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.24 1.25-1.67 3.67-5.5 3.67A6.35 6.35 0 0 1 5.6 11.9 6.35 6.35 0 0 1 12 5.56c1.82 0 3.05.78 3.75 1.44l2.56-2.56C16.86 2.68 14.63 1.8 12 1.8 6.98 1.8 2.9 5.88 2.9 11S6.98 20.2 12 20.2c6.04 0 9.1-4.24 9.1-8.56 0-.58-.06-1.02-.14-1.44H12z"
    />
    <path
      fill="#34A853"
      d="M3.96 7.35l3.2 2.34A6.35 6.35 0 0 1 12 5.56c1.82 0 3.05.78 3.75 1.44l2.56-2.56C16.86 2.68 14.63 1.8 12 1.8 8.45 1.8 5.36 3.82 3.96 7.35z"
    />
    <path
      fill="#FBBC05"
      d="M12 22.2c3.18 0 5.85-1.04 7.8-2.82l-3.6-2.95c-1 .68-2.3 1.13-4.2 1.13a6.35 6.35 0 0 1-5.88-4.47l-3.2 2.34A9.98 9.98 0 0 0 12 22.2z"
    />
    <path
      fill="#4285F4"
      d="M21.1 11.64c0-.58-.06-1.02-.14-1.44H12v3.9h5.5c-.24 1.25-1.67 3.67-5.5 3.67-2.65 0-4.88-1.8-5.67-4.2l-3.2 2.34A9.98 9.98 0 0 0 12 22.2c6.04 0 9.1-4.24 9.1-8.56z"
    />
  </svg>
);

/* ---- Auth Modal ---- */
type AuthMode = "signup" | "login";

const AuthModal: React.FC<{
  open: boolean;
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
  onClose: () => void;
}> = ({ open, mode, setMode, onClose }) => {
  const base = import.meta.env.VITE_API_BASE_URL || "/api";
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<
    | null
    | {
        tone: "error" | "info" | "success";
        text: string;
      }
  >(null);

  const emailInputId = `auth-email-${mode}`;
  const passwordInputId = `auth-password-${mode}`;
  const confirmPasswordInputId = `auth-confirm-password-${mode}`;
  const isSignupMode = mode === "signup";
  const passwordCharacterClass = "A-Za-z0-9!@#$%";
  const passwordPattern = new RegExp(`^[${passwordCharacterClass}]{8,20}$`);
  const passwordPatternAttribute = `[${passwordCharacterClass}]{8,20}`;
  const passwordRequirementsMessage =
    "Passwords must be 8-20 characters and can include letters, numbers, and !@#$%";
  const isPasswordValid = !isSignupMode || passwordPattern.test(password);
  const isSignupDisabled =
    isSignupMode &&
    (!password.trim() || !confirmPassword.trim() || confirmPassword !== password || !isPasswordValid);
  const isSubmitDisabled = submitting || isSignupDisabled || (emailTouched && Boolean(emailError));

  const validateEmail = (value: string, shouldShowError = false) => {
    const trimmed = value.trim();
    if (!trimmed) {
      if (shouldShowError) {
        setEmailError("Email is required.");
      } else {
        setEmailError(null);
      }
      return false;
    }

    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (shouldShowError) {
      setEmailError(isValid ? null : "Please enter a valid email address.");
    } else if (isValid) {
      setEmailError(null);
    }
    return isValid;
  };

  const handleGoogle = () => (window.location.href = `${base}/auth/google`);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => firstButtonRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setEmailError(null);
      setEmailTouched(false);
      setPassword("");
      setMessage(null);
      setConfirmPassword("");
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    setMessage(null);
    setEmailError(null);
    setEmailTouched(false);
    setConfirmPassword("");
  }, [mode]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailTouched(true);
    console.log('[AuthModal] Email auth submit', {
      mode,
      emailProvided: Boolean(email.trim()),
      supabaseConfigured: isSupabaseConfigured(),
    });
    if (!validateEmail(email, true)) {
      return;
    }

    if (!password.trim()) {
      setMessage({ tone: "error", text: "Password is required." });
      return;
    }

    if (isSignupMode && !passwordPattern.test(password)) {
      setMessage({
        tone: "error",
        text: passwordRequirementsMessage,
      });
      return;
    }

    if (isSignupMode && password !== confirmPassword) {
      setMessage({ tone: "error", text: "Passwords must match." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setMessage({
        tone: "error",
        text:
          "Email/password authentication is not available. Please configure Supabase credentials and try again.",
      });
      setSubmitting(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      console.log('[AuthModal] Obtained Supabase client. Beginning auth flow.');
      const callbackPath = "/auth/supabase";
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}${callbackPath}`
          : callbackPath;
      console.log('[AuthModal] Email redirect URL', { emailRedirectTo });

      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo },
            });
      console.log('[AuthModal] Supabase response received', {
        error: result.error?.message,
        hasSession: Boolean(result.data.session?.access_token),
      });

      if (result.error) {
        throw result.error;
      }

      if (mode === "signup") {
        fireAccountCreationConversion();
      }

      const session = result.data.session;
      if (!session?.access_token) {
        setMessage({
          tone: "info",
          text:
            mode === "signup"
              ? "Check your inbox to confirm your email before signing in."
              : "Unable to retrieve a Supabase session. Please try again.",
        });
        return;
      }

      const response = await fetch(`${base}/auth/supabase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accessToken: session.access_token }),
      });
      console.log('[AuthModal] Backend /auth/supabase response', {
        status: response.status,
        ok: response.ok,
      });
      const payload = (await response
        .json()
        .catch(() => null)) as { accessToken?: string; message?: string } | null;
      console.log('[AuthModal] Backend payload parsed', {
        hasAccessToken: Boolean(payload?.accessToken),
        message: payload?.message,
      });

      if (!response.ok || !payload?.accessToken) {
        throw new Error(payload?.message ?? "Unable to complete authentication.");
      }

      const authedUser = await login(payload.accessToken);
      setEmail("");
      setPassword("");
      setMessage(null);
      onClose();

      if (!authedUser?.profileComplete) {
        navigate("/completeProfile");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error('[AuthModal] Error during Supabase flow', err);
      setMessage({
        tone: "error",
        text:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-[rgba(6,10,24,0.75)] backdrop-blur-xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_-10%,rgba(168,85,247,0.2),transparent),radial-gradient(900px_500px_at_50%_110%,rgba(59,130,246,0.15),transparent)] animate-bgShift" />

      <div className="relative z-[101] w-[92%] max-w-md rounded-3xl border border-white/10 bg-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.5)] p-6 sm:p-8 backdrop-blur-2xl transform animate-scaleIn">
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate("/");
          }}
          className="absolute top-3 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h1 className="text-2xl font-semibold text-center text-white mb-6 tracking-wide">
          {mode === "login" ? "Welcome Back" : "Create Your Account"}
        </h1>

        <form onSubmit={handleEmailSubmit} className="space-y-4 mt-2">
          <div>
            <label
              htmlFor={emailInputId}
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Email
            </label>
            <input
              id={emailInputId}
              type="email"
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                setEmail(value);
                validateEmail(value, emailTouched);
              }}
              onBlur={(e) => {
                setEmailTouched(true);
                validateEmail(e.target.value, true);
              }}
              onInvalid={(e) => {
                e.preventDefault();
                setEmailTouched(true);
                validateEmail(e.currentTarget.value, true);
              }}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent disabled:opacity-60"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={submitting}
              required
            />
            {emailError && emailTouched && (
              <p className="mt-1 text-sm text-red-300" aria-live="polite">
                {emailError}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor={passwordInputId}
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Password
            </label>
            <input
              id={passwordInputId}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent disabled:opacity-60"
              placeholder="Enter a secure password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              disabled={submitting}
              minLength={8}
              maxLength={20}
              pattern={passwordPatternAttribute}
              required
            />
            {isSignupMode && password && !isPasswordValid && (
              <p className="mt-1 text-sm text-red-300" aria-live="polite">
                {passwordRequirementsMessage}
              </p>
            )}
          </div>
          {isSignupMode && (
            <div>
              <label
                htmlFor={confirmPasswordInputId}
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Confirm password
              </label>
              <input
                id={confirmPasswordInputId}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent disabled:opacity-60"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={submitting}
                minLength={8}
                maxLength={20}
                pattern={passwordPatternAttribute}
                required
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="mt-1 text-sm text-red-300" aria-live="polite">
                  Passwords do not match.
                </p>
              )}
            </div>
          )}

          {message && (
            <p
              className={`text-sm ${
                message.tone === "error"
                  ? "text-red-300"
                  : message.tone === "info"
                    ? "text-amber-200"
                    : "text-emerald-200"
              }`}
              aria-live="polite"
            >
              {message.text}
            </p>
          )}

          <button
            ref={firstButtonRef}
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-fuchsia-500 px-4 py-3 font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition-all duration-200 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "login" ? "Signing you in…" : "Creating your account…"}
              </>
            ) : (
              <span>{mode === "login" ? "Log in" : "Create account"}</span>
            )}
          </button>
        </form>

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          className="relative w-full flex items-center justify-center px-4 py-3 mt-4 rounded-lg bg-white text-gray-800 font-medium shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out hover:-translate-y-0.5 animate-floatUp active:scale-95"
        >
          <GoogleG className="absolute left-6 w-6 h-6" />
          <span className="w-full text-center">Continue with Google</span>
        </button>

        <div className="text-center text-gray-300 mt-6 text-sm">
          {mode === "login" ? (
            <>
              Not a user?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-sky-400 hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already a user?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sky-400 hover:underline"
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---- Navbar ---- */
const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { count } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [accountOpen, setAccountOpen] = useState(false);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Search state
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // --- Added Search States (logic only; nothing removed) ---
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close account popover on outside click and on route change
  useEffect(() => {
    const isProfileRoute = location.pathname.startsWith("/profile");
    if (!user && isProfileRoute) {
      setAuthMode("login");
      setAuthOpen(true);
    } else {
      setAuthOpen(false);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popRef.current &&
        !popRef.current.contains(event.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    };

    if (accountOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [location.pathname, accountOpen, user]);

  // Keyboard shortcut: / or Cmd/Ctrl+K focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as any).isContentEditable);

      if (isTyping) return;

      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // --- Search Logic (reuses SearchPage behavior) ---
  async function performSearch(newPage = 1) {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await search(query, newPage);
      setResults(data);
      setPage(newPage);
      setShowDropdown(true);
    } catch (err) {
      setError((err as Error).message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  const hasResults =
    results &&
    ((results.users?.results.length ?? 0) > 0 ||
      (results.lounges?.results.length ?? 0) > 0);

  const hasPrev = page > 1;
  const hasNext =
    results &&
    ((results.users &&
      results.users.total > results.users.page * results.users.limit) ||
      (results.lounges &&
        results.lounges.total >
          results.lounges.page * results.lounges.limit));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  // Keep your original custom-event behavior AND run dropdown search
  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    // Original behavior (kept)
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("app:search", { detail: { query: q } }));
      }, 0);
    } else {
      window.dispatchEvent(new CustomEvent("app:search", { detail: { query: q } }));
    }

    // New: also show dropdown results
    void performSearch(1);
  };

  const email =
    (user as any)?.email ||
    (user as any)?.profile?.email ||
    (user as any)?.emails?.[0]?.email ||
    (user as any)?.emails?.[0]?.value ||
    "";

  return (
    <>
      {/* Unified translucent, blurred strip across ALL breakpoints */}
      <nav className="fixed inset-x-0 top-0 z-[80] text-white">
        <div
          className="
            px-3 sm:px-6 py-2
            border-b border-white/10
            bg-transparent backdrop-blur-2xl
            shadow-[0_10px_30px_rgba(2,6,23,0.15)]
            flex items-center gap-3 justify-between
          "
        >
          {/* Search (left; constrained width on large screens) */}
          <form onSubmit={onSubmitSearch} className="flex-1 min-w-0" aria-label="Search">
            <div className="mx-auto w-full lg:max-w-[520px] xl:max-w-[640px] relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300/80" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users & lounges…  ( /  or  ⌘K / Ctrl+K )"
                className="w-full pl-9 pr-9 rounded-full
                           bg-white/[0.07] backdrop-blur-md
                           border border-white/10
                           text-gray-100 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 focus:border-white/20
                           py-1.5 text-sm transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults(null);
                    setShowDropdown(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/15 border border-white/10"
                  aria-label="Clear search"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* 🔍 Dropdown search results */}
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 mt-2 w-full rounded-xl border border-white/10 bg-[#0E1626]/95 shadow-xl backdrop-blur-2xl p-4 max-h-[60vh] overflow-y-auto space-y-4 z-[90]"
                >
                  {loading && (
                    <div className="flex items-center justify-center text-gray-400 text-sm">
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Searching...
                    </div>
                  )}

                  {error && <p className="text-red-400 text-sm">Error: {error}</p>}

                  {!loading && hasResults && (
                    <>
                      {results?.users?.results.length ? (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 text-teal-300">
                            Users
                          </h3>
                          <ul className="space-y-2">
                            {results.users.results.map((u) => (
                              <li
                                key={u.id}
                                className="flex items-center gap-2 text-sm hover:bg-white/5 p-1.5 rounded-md transition cursor-pointer"
                                onClick={() => {
                                  navigate(`/users/${u.username}`);
                                  setShowDropdown(false);
                                }}
                              >
                                <img
                                  src={u.avatarUrl ?? "/defaultPfp.png"}
                                  alt={u.username ?? "user"}
                                  className="w-7 h-7 rounded-full"
                                />
                                <span>@{u.username}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {results?.lounges?.results.length ? (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 text-indigo-300">
                            Lounges
                          </h3>
                          <ul className="space-y-2">
                            {results.lounges.results.map((l) => (
                              <li
                                key={l.id}
                                className="flex items-center gap-2 text-sm hover:bg-white/5 p-1.5 rounded-md cursor-pointer transition"
                                onClick={() => {
                                  navigate(`/lounges/${l.name}`);
                                  setShowDropdown(false);
                                }}
                              >
                                {l.bannerUrl && (
                                  <img
                                    src={l.bannerUrl}
                                    alt={l.name}
                                    className="w-7 h-7 rounded"
                                  />
                                )}
                                <span>{l.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {(hasPrev || hasNext) && (
                        <div className="flex justify-between mt-3 text-xs text-gray-400">
                          <button
                            onClick={() => performSearch(page - 1)}
                            disabled={!hasPrev || loading}
                            className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => performSearch(page + 1)}
                            disabled={!hasNext || loading}
                            className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {!loading && !hasResults && !error && (
                    <p className="text-gray-400 text-sm text-center">No results found</p>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Right controls */}
          {user ? (
            <div className="relative flex items-center gap-4">
              <Link to="/notifications" aria-label="Notifications">
                <div className="relative">
                  <Bell className="w-6 h-6" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </div>
              </Link>

              {/* Avatar button */}
              <button
                ref={btnRef}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((o) => !o)}
                className="btn-unstyled"
              >
                <img
                  src={user?.avatarUrl ?? "/defaultPfp.png"}
                  alt="Your avatar"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                />
              </button>

              {/* Popover */}
              {accountOpen && (
                <div
                  ref={popRef}
                  className="absolute right-0 top-[calc(100%+10px)] w-64 rounded-2xl border border-white/10 bg-[#0E1626]/95 text-white shadow-[0_12px_40px_rgba(2,6,23,0.5)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.avatarUrl ?? "/defaultPfp.png"}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10"
                    />
                    <div>
                      <div className="text-sm font-semibold">
                        {(user as any)?.name || (user as any)?.username || "User"}
                      </div>
                      <div className="text-xs text-sky-300">
                        @{(user as any)?.username ?? "username"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-300">
                    <div className="text-[11px] text-gray-400 mb-0.5">Email</div>
                    <div className="break-all">{email || "Not set"}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                // Always show the login form first when opening the auth modal
                setAuthMode("login");
                setAuthOpen(true);
              }}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow ring-1 ring-white/20 hover:brightness-110"
              style={{ background: "linear-gradient(90deg, var(--accent-from), var(--accent-to))" }}
            >
              Sign up / Login
            </button>
          )}
        </div>
      </nav>

      {/* Spacer so content isn't hidden under the fixed bar on mobile */}
      <div className="block sm:hidden h-12" aria-hidden />

      <AuthModal
        open={authOpen}
        mode={authMode}
        setMode={setAuthMode}
        onClose={() => setAuthOpen(false)}
      />
    </>
  );
};

export default Navbar;
