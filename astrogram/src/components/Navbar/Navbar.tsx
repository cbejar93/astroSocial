// src/components/Navbar/Navbar.tsx
import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";

/* ---- Brand-correct icons ---- */
const GoogleG: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.25-1.67 3.67-5.5 3.67A6.35 6.35 0 0 1 5.6 11.9 6.35 6.35 0 0 1 12 5.56c1.82 0 3.05.78 3.75 1.44l2.56-2.56C16.86 2.68 14.63 1.8 12 1.8 6.98 1.8 2.9 5.88 2.9 11S6.98 20.2 12 20.2c6.04 0 9.1-4.24 9.1-8.56 0-.58-.06-1.02-.14-1.44H12z"/>
    <path fill="#34A853" d="M3.96 7.35l3.2 2.34A6.35 6.35 0 0 1 12 5.56c1.82 0 3.05.78 3.75 1.44l2.56-2.56C16.86 2.68 14.63 1.8 12 1.8 8.45 1.8 5.36 3.82 3.96 7.35z"/>
    <path fill="#FBBC05" d="M12 22.2c3.18 0 5.85-1.04 7.8-2.82l-3.6-2.95c-1 .68-2.3 1.13-4.2 1.13a6.35 6.35 0 0 1-5.88-4.47l-3.2 2.34A9.98 9.98 0 0 0 12 22.2z"/>
    <path fill="#4285F4" d="M21.1 11.64c0-.58-.06-1.02-.14-1.44H12v3.9h5.5c-.24 1.25-1.67 3.67-5.5 3.67-2.65 0-4.88-1.8-5.67-4.2l-3.2 2.34A9.98 9.98 0 0 0 12 22.2c6.04 0 9.1-4.24 9.1-8.56z"/>
  </svg>
);
const FacebookF: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M22 12.06C22 6.55 17.52 2.08 12 2.08S2 6.55 2 12.06c0 4.98 3.66 9.11 8.44 9.88v-6.99H7.9V12.1h2.55V9.83c0-2.52 1.5-3.92 3.8-3.92 1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.25 0-1.64.78-1.64 1.58v1.94h2.79l-.45 2.85h-2.34v6.99C18.34 21.17 22 17.04 22 12.06z"/>
  </svg>
);

/* ---- Modal ---- */
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

  const handleGoogle = () => (window.location.href = `${base}/auth/google`);
  const handleFacebook = () => (window.location.href = `${base}/auth/facebook`);

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop + glow */}
      <div className="absolute inset-0 bg-[rgba(6,10,24,0.75)] backdrop-blur-xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_600px_at_20%_-10%,rgba(168,85,247,0.25),transparent),radial-gradient(800px_500px_at_80%_110%,rgba(59,130,246,0.18),transparent)]" />

      {/* Card */}
      <div className="relative z-[101] w-[92%] max-w-md rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] p-6 sm:p-8 backdrop-blur-2xl">
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

        <div className="mt-4 sm:mt-2 text-white">
          <h1 id="auth-title" className="text-3xl font-extrabold tracking-tight">
            {mode === "signup" ? "Get Started Now!" : "Log in"}
          </h1>
          <p className="mt-2 text-sm text-white/80">Continue with …</p>

          {/* Google */}
          <button
            ref={firstButtonRef}
            onClick={handleGoogle}
            className="mt-6 w-full inline-flex items-center justify-center gap-3 rounded-xl bg-white text-gray-800 px-4 py-3 font-medium shadow-[0_6px_24px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.16)] transition focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70"
          >
            <GoogleG className="h-5 w-5" />
            <span>Google</span>
          </button>

          {/* Facebook */}
          <button
            onClick={handleFacebook}
            className="mt-3 w-full inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#3b82f6] text-white px-4 py-3 font-medium shadow-[0_6px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_10px_32px_rgba(99,102,241,0.45)] transition focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70"
          >
            <FacebookF className="h-5 w-5" />
            <span>Facebook</span>
          </button>

          {/* Toggle footer */}
          {mode === "signup" ? (
            <p className="mt-6 text-center text-xs text-white/80">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sky-300 hover:underline"
              >
                Log in
              </button>
            </p>
          ) : (
            <p className="mt-6 text-center text-xs text-white/80">
              Don’t have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-sky-300 hover:underline"
              >
                Sign up
              </button>
            </p>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
      </div>
    </div>
  );
};

/* ---- Navbar ---- */
const Navbar = () => {
  const { user } = useAuth();
  const { count } = useNotifications();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");

  // Account popover state
  const [accountOpen, setAccountOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Close modal & popover on route changes
  useEffect(() => {
    setAuthOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // Click outside for account popover
  useEffect(() => {
    if (!accountOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  // derive email robustly
  const email =
    (user as any)?.email ||
    (user as any)?.profile?.email ||
    (user as any)?.emails?.[0]?.email ||
    (user as any)?.emails?.[0]?.value ||
    "";

  return (
    <>
      <nav className="fixed top-0 left-0 z-[80] w-full bg-transparent text-white">
        <div className="flex items-center justify-end px-4 py-3 sm:px-6 sm:py-4">
          {user ? (
            <div className="relative flex items-center gap-3 sm:gap-5">
              <Link to="/notifications" className="btn-unstyled" aria-label="Notifications">
                <div className="relative">
                  <Bell className="w-6 h-6" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </div>
              </Link>

              {/* Avatar button toggles popover (no navigation) */}
              <button
                ref={btnRef}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={accountOpen}
                aria-controls="account-popover"
                onClick={() => setAccountOpen((o) => !o)}
                className="btn-unstyled"
                title="Account"
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
                  id="account-popover"
                  role="dialog"
                  aria-label="Account info"
                  className="absolute right-0 top-[calc(100%+10px)] w-64 rounded-2xl border border-white/10 bg-[#0E1626]/95 text-white shadow-[0_12px_40px_rgba(2,6,23,0.5)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.avatarUrl ?? "/defaultPfp.png"}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {(user as any)?.name || (user as any)?.fullName || user.username || "User"}
                      </div>
                      <div className="text-xs text-sky-300 truncate">@{user.username}</div>
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
                setAuthMode("signup");
                setAuthOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#f04bb3] to-[#5aa2ff] px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap shadow-[0_12px_28px_rgba(15,23,42,0.45)] ring-1 ring-white/20 transition hover:brightness-110 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70 sm:px-4 sm:py-2 sm:text-sm"
              aria-label="Sign up or Log in"
            >
              Sign up/Login
            </button>
          )}
        </div>
      </nav>

      <AuthModal open={authOpen} mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
