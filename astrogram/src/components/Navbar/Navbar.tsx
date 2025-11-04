import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";

/* ---- Brand Icons ---- */
const GoogleG: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.25-1.67 3.67-5.5 3.67A6.35 6.35 0 0 1 5.6 11.9 6.35 6.35 0 0 1 12 5.56c1.82 0 3.05.78 3.75 1.44l2.56-2.56C16.86 2.68 14.63 1.8 12 1.8 6.98 1.8 2.9 5.88 2.9 11S6.98 20.2 12 20.2c6.04 0 9.1-4.24 9.1-8.56 0-.58-.06-1.02-.14-1.44H12z" />
    <path fill="#34A853" d="M3.96 7.35l3.2 2.34A6.35 6.35 0 0 1 12 5.56c1.82 0 3.05.78 3.75 1.44l2.56-2.56C16.86 2.68 14.63 1.8 12 1.8 8.45 1.8 5.36 3.82 3.96 7.35z" />
    <path fill="#FBBC05" d="M12 22.2c3.18 0 5.85-1.04 7.8-2.82l-3.6-2.95c-1 .68-2.3 1.13-4.2 1.13a6.35 6.35 0 0 1-5.88-4.47l-3.2 2.34A9.98 9.98 0 0 0 12 22.2z" />
    <path fill="#4285F4" d="M21.1 11.64c0-.58-.06-1.02-.14-1.44H12v3.9h5.5c-.24 1.25-1.67 3.67-5.5 3.67-2.65 0-4.88-1.8-5.67-4.2l-3.2 2.34A9.98 9.98 0 0 0 12 22.2c6.04 0 9.1-4.24 9.1-8.56z" />
  </svg>
);

const FacebookF: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M22 12.06C22 6.55 17.52 2.08 12 2.08S2 6.55 2 12.06c0 4.98 3.66 9.11 8.44 9.88v-6.99H7.9V12.1h2.55V9.83c0-2.52 1.5-3.92 3.8-3.92 1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.25 0-1.64.78-1.64 1.58v1.94h2.79l-.45 2.85h-2.34v6.99C18.34 21.17 22 17.04 22 12.06z" />
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

        {/* Google Button */}
        <button
          ref={firstButtonRef}
          onClick={handleGoogle}
          className="relative w-full flex items-center justify-center px-4 py-3 mb-4 rounded-lg bg-white text-gray-800 font-medium shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out hover:-translate-y-0.5 animate-floatUp active:scale-95"
        >
          <GoogleG className="absolute left-6 w-6 h-6" />
          <span className="w-full text-center">Continue with Google</span>
        </button>

        {/* Facebook Button */}
        <button
          onClick={handleFacebook}
          className="relative w-full flex items-center justify-center px-4 py-3 rounded-lg bg-[#1877F2] text-white font-medium shadow-[0_4px_10px_rgba(24,119,242,0.3)] hover:shadow-[0_6px_20px_rgba(24,119,242,0.5)] transition-all duration-300 ease-out hover:-translate-y-0.5 animate-slideIn active:scale-95"
        >
          <FacebookF className="absolute left-6 w-6 h-6 text-white" />
          <span className="w-full text-center">Continue with Facebook</span>
        </button>

        <div className="text-center text-gray-300 mt-6 text-sm">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
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
              Already have an account?{" "}
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
const Navbar = () => {
  const { user } = useAuth();
  const { count } = useNotifications();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [accountOpen, setAccountOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  // ✅ Handles closing popover when clicking outside
  useEffect(() => {
    setAuthOpen(false);

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
  }, [location.pathname, accountOpen]);

  const email =
    (user as any)?.email ||
    (user as any)?.profile?.email ||
    (user as any)?.emails?.[0]?.email ||
    (user as any)?.emails?.[0]?.value ||
    "";

  return (
    <>
      <nav className="fixed top-0 right-0 z-[80] px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-end gap-4 text-white">
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

            {/* Avatar */}
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
                      {(user as any)?.name || user.username || "User"}
                    </div>
                    <div className="text-xs text-sky-300">@{user.username}</div>
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
            className="rounded-lg bg-gradient-to-r from-[#f04bb3] to-[#5aa2ff] px-4 py-2 text-sm font-semibold text-white shadow ring-1 ring-white/20 hover:brightness-110"
          >
            Sign up / Login
          </button>
        )}
      </nav>

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
