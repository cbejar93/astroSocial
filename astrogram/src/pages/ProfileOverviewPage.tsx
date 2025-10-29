// src/pages/ProfileOverviewPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit2,
  UploadCloud,
  LogOut,
  ChevronDown,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { updateAvatar, deleteProfile, apiFetch } from "../lib/api";
import ConfirmModal from "../components/Modal/ConfirmModal";

/* Username validation */
const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;

/* ---------- Brand Logos (inline SVGs) ---------- */
const InstagramLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="igGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F58529" />
        <stop offset="30%" stopColor="#DD2A7B" />
        <stop offset="60%" stopColor="#8134AF" />
        <stop offset="100%" stopColor="#515BD4" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#igGrad)" />
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" strokeWidth="2" />
    <circle cx="16.5" cy="7.5" r="1.2" fill="#fff" />
  </svg>
);

const FacebookLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#1877F2" />
    <path
      fill="#fff"
      d="M13.5 8.5h1.9V6h-1.9c-2.2 0-3.7 1.3-3.7 3.6v1.5H8v2.5h1.8V18h2.6v-4.4h2l.4-2.5h-2.4V9.8c0-.9.3-1.3 1.1-1.3Z"
    />
  </svg>
);

const TikTokLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#000" />
    <path d="M12.5 6v7.2a3.2 3.2 0 1 1-2.6-3.1v2.1a1.2 1.2 0 1 0 1.3 1.2V6h1.3Z" fill="#fff" />
    <path d="M14.8 7.3c.8 1.4 2.1 2.2 3.5 2.4v1.6c-1.6-.1-3-.8-4.3-2V7.3Z" fill="#fff" />
  </svg>
);

/* ---------- Shared Card ---------- */
const Card: React.FC<
  React.PropsWithChildren<{ className?: string; title?: string; onEdit?: () => void }>
> = ({ className = "", title, onEdit, children }) => (
  <div
    className={[
      "rounded-2xl border border-white/10 bg-[#0E1626]/90 text-white shadow-[0_8px_28px_rgba(2,6,23,0.45)]",
      "backdrop-blur-md",
      className,
    ].join(" ")}
  >
    {(title || onEdit) && (
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        {title ? <h3 className="text-sm font-semibold tracking-wide">{title}</h3> : <div />}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs bg-gray-800/70 hover:bg-gray-700 ring-1 ring-white/10"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>
    )}
    {children}
  </div>
);

/* ---------- Edit Sheet ---------- */
type EditSheetProps = {
  open: boolean;
  onClose: () => void;
  initialName: string;
  initialUsername: string;
  initialEmail: string;
  onSaved: () => void;
};

const EditAccountSheet: React.FC<EditSheetProps> = ({
  open,
  onClose,
  initialName,
  initialUsername,
  initialEmail,
  onSaved,
}) => {
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setUsername(initialUsername);
      setEmail(initialEmail);
      setError(null);
    }
  }, [open, initialName, initialUsername, initialEmail]);

  const validateUsername = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return "Username is required";
    if (trimmed.length < USERNAME_MIN_LENGTH || trimmed.length > USERNAME_MAX_LENGTH) {
      return `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters`;
    }
    if (!USERNAME_PATTERN.test(trimmed)) {
      return "Only letters, numbers, periods, and underscores are allowed";
    }
    return null;
  };

  const handleSave = async () => {
    const uErr = validateUsername(username);
    if (uErr) {
      setError(uErr);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const form = new FormData();
      form.append("username", username.trim());
      if (name.trim()) form.append("name", name.trim());
      if (email.trim()) form.append("email", email.trim());

      const res = await apiFetch("/users/me", { method: "PUT", body: form });
      if (!res.ok) {
        let message = "Failed to update profile";
        try {
          const body = await res.json();
          if (Array.isArray(body?.message)) message = body.message[0];
          else if (body?.message) message = body.message;
        } catch {}
        throw new Error(message);
      }
      onSaved();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } z-40`}
        onClick={onClose}
      />
      <div
        className={[
          "fixed inset-y-0 right-0 w-full max-w-md bg-[#0E1626] text-white",
          "shadow-2xl ring-1 ring-white/10",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
          "z-50",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editAccountTitle"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 id="editAccountTitle" className="text-sm font-semibold tracking-wide">
            Edit account
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg bg-gray-800/70 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={USERNAME_MAX_LENGTH}
              placeholder="username"
              className="w-full rounded-lg bg-gray-800/70 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Use {USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters (letters, numbers, periods, underscores).
            </p>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-lg bg-gray-800/70 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-600/90 px-3 py-2 text-xs">{error}</div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 ring-1 ring-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#f04bb3] to-[#5aa2ff] px-4 py-1.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.45)] ring-1 ring-white/20 transition hover:brightness-110 active:translate-y-px disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ---------- Avatar Presets ---------- */
const EMOJI_PRESETS = [
  { e: "🚀", a: "#f04bb3", b: "#5aa2ff" },
  { e: "🌙", a: "#6366f1", b: "#22d3ee" },
  { e: "⭐️", a: "#f59e0b", b: "#ef4444" },
  { e: "🔥", a: "#ef4444", b: "#f59e0b" },
  { e: "🐱", a: "#16a34a", b: "#22c55e" },
  { e: "🐶", a: "#a78bfa", b: "#60a5fa" },
  { e: "🦊", a: "#f97316", b: "#f43f5e" },
  { e: "🦄", a: "#ec4899", b: "#8b5cf6" },
  { e: "🎧", a: "#0ea5e9", b: "#22d3ee" },
  { e: "🎮", a: "#64748b", b: "#0ea5e9" },
  { e: "🎨", a: "#22c55e", b: "#a78bfa" },
  { e: "📚", a: "#f59e0b", b: "#10b981" },
];

function svgEmojiAvatar(emoji: string, a: string, b: string): Blob {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="100%" stop-color="${b}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="256" fill="url(#g)"/>
  <text x="50%" y="58%" text-anchor="middle" font-size="240" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
</svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

const AvatarPickerModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onPick: (file: File) => Promise<void>;
}> = ({ open, onClose, onPick }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-[92%] max-w-lg rounded-2xl border border-white/10 bg-[#0E1626] text-white shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-sm font-semibold tracking-wide">Choose an avatar</h3>
          <button className="rounded-md p-1.5 hover:bg-white/10" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
          {EMOJI_PRESETS.map(({ e, a, b }, idx) => (
            <button
              key={idx}
              type="button"
              className="aspect-square rounded-2xl ring-1 ring-white/10 flex items-center justify-center text-4xl hover:brightness-110 transition"
              style={{ background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)` }}
              onClick={async () => {
                const blob = svgEmojiAvatar(e, a, b);
                const file = new File([blob], "avatar.svg", { type: "image/svg+xml" });
                await onPick(file);
                onClose();
              }}
              title={`Use ${e}`}
            >
              <span className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]">{e}</span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-gray-400">
          These avatars are generated locally as SVGs and uploaded as your profile picture.
        </p>
      </div>
    </div>
  );
};

/* ---------- Page ---------- */
const ProfileOverviewPage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [avatarBust, setAvatarBust] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!avatarMenuOpen) return;
      const target = e.target as Node;
      if (menuBtnRef.current?.contains(target)) return;
      setAvatarMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [avatarMenuOpen]);

  if (!user) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <div className="grid h-full w-full place-items-center px-4">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_600px_at_20%_-10%,rgba(168,85,247,0.18),transparent),radial-gradient(800px_500px_at_80%_110%,rgba(59,130,246,0.12),transparent)]" />
          <div className="rounded-2xl border border-white/10 bg-[#0E1626]/80 backdrop-blur-md px-6 py-10 text-center shadow-[0_8px_28px_rgba(2,6,23,0.45)]">
            <h2 className="text-xl font-semibold">You’re signed out</h2>
            <p className="mt-2 text-sm text-gray-300">Sign in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  const displayName =
    (user as any).name || (user as any).fullName || user.username || "User";
  const username = user.username || "user";
  const email =
    (user as any)?.email ||
    (user as any)?.profile?.email ||
    (user as any)?.emails?.[0]?.email ||
    (user as any)?.emails?.[0]?.value ||
    "";

  const handlePickAvatar = () => fileInputRef.current?.click();

  const finishAvatarUpdate = async () => {
    await refreshUser();
    setAvatarBust(Date.now());
    setAvatarMenuOpen(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed.");
      return;
    }
    try {
      setUploading(true);
      await updateAvatar(username, file);
      await finishAvatarUpdate();
    } catch (err) {
      console.error(err);
      alert("Failed to update avatar.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handlePickPreset = async (file: File) => {
    try {
      setUploading(true);
      await updateAvatar(username, file);
      await finishAvatarUpdate();
    } catch (err) {
      console.error(err);
      alert("Failed to update avatar.");
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteProfile();
      logout();
      navigate("/signup");
    } catch (e) {
      console.error(e);
      alert("Failed to delete account.");
    }
  };

  const avatarSrc =
    (user.avatarUrl ?? "/defaultPfp.png") + (avatarBust ? `?t=${avatarBust}` : "");
  const trackers = user.followers?.length ?? 0;
  const tracking = user.following?.length ?? 0;

  return (
    // Full viewport, no vertical page scroll
    <div className="fixed inset-0 overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12%] h-[36vh] w-[64vw] -translate-x-1/2 rounded-[999px] bg-gradient-to-br from-sky-500/15 via-fuchsia-500/10 to-emerald-500/15 blur-3xl" />
        <div className="absolute left-[-10%] bottom-[-20%] h-[30vh] w-[38vw] rounded-[999px] bg-gradient-to-tr from-emerald-500/10 via-sky-500/10 to-transparent blur-3xl" />
      </div>

      {/* Center the content card; it scrolls internally if needed */}
      <div className="grid h-full w-full place-items-center px-4">
        <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          {/* Hero */}
          <div className="relative">
            <div className="h-28 sm:h-36 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(240,75,179,0.35),transparent),radial-gradient(120%_80%_at_90%_10%,rgba(90,162,255,0.35),transparent)]" />
            <div className="px-5 sm:px-7 pb-6 -mt-10">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="relative">
                  <div className="p-[3px] rounded-full bg-gradient-to-br from-[#f04bb3] to-[#5aa2ff]">
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-2 ring-white/20"
                    />
                  </div>
                  <button
                    ref={menuBtnRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAvatarMenuOpen((s) => !s);
                    }}
                    className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r from-[#f04bb3] to-[#5aa2ff] shadow-lg ring-2 ring-white/20"
                    title="Avatar options"
                  >
                    <Edit2 className="w-4.5 h-4.5 text-white" />
                  </button>

                  {avatarMenuOpen && (
                    <div className="absolute top-24 right-0 w-44 rounded-lg border border-white/10 bg-gray-900/95 shadow-xl overflow-hidden z-10">
                      <button
                        type="button"
                        onClick={handlePickAvatar}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-800/80"
                      >
                        <UploadCloud className="w-4 h-4" />
                        Upload photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPickerOpen(true);
                          setAvatarMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-800/80"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Choose avatar
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarChange}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      {displayName}
                    </h1>
                    <span className="text-xs sm:text-sm text-sky-300 bg-sky-500/10 ring-1 ring-sky-400/30 px-2 py-0.5 rounded-md">
                      @{username}
                    </span>
                    {email ? (
                      <span className="text-xs sm:text-sm text-fuchsia-200 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/30 px-2 py-0.5 rounded-md truncate max-w-[14rem]">
                        {email}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="text-xs sm:text-sm text-gray-200 bg-gray-700/50 ring-1 ring-white/15 px-2 py-0.5 rounded-md"
                        onClick={() => setEditOpen(true)}
                      >
                        Add email
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center">
                      <div className="text-[11px] text-gray-400">Trackers</div>
                      <div className="text-base font-bold">{trackers.toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center">
                      <div className="text-[11px] text-gray-400">Tracking</div>
                      <div className="text-base font-bold">{tracking.toLocaleString()}</div>
                    </div>

                    <div className="ml-auto">
                      <button
                        type="button"
                        onClick={() => setEditOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#f04bb3] to-[#5aa2ff] px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.45)] ring-1 ring-white/20 transition hover:brightness-110 active:translate-y-px"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit profile
                      </button>
                    </div>

                    {uploading && (
                      <p className="ml-2 text-xs text-gray-300">Updating avatar…</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="px-5 sm:px-7 pb-8">
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* About / Social */}
              <div className="space-y-6 lg:col-span-1">
                <Card title="About you">
                  <div className="p-5">
                    <p className="text-sm text-gray-300">
                      Add a short bio or tagline about yourself. Keep it fun and simple.
                    </p>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setEditOpen(true)}
                        className="text-xs rounded-md px-2.5 py-1.5 bg-gray-800/70 hover:bg-gray-700 ring-1 ring-white/10"
                      >
                        Add bio
                      </button>
                    </div>
                  </div>
                </Card>

                <Card title="Social Links">
                  <div className="p-5">
                    <div className="flex items-center gap-4">
                      <a
                        href="#"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full ring-1 ring-white/20 overflow-hidden"
                        title="Instagram"
                        aria-label="Instagram"
                      >
                        <InstagramLogo className="w-6 h-6" />
                      </a>
                      <a
                        href="#"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full ring-1 ring-white/20 overflow-hidden"
                        title="Facebook"
                        aria-label="Facebook"
                      >
                        <FacebookLogo className="w-6 h-6" />
                      </a>
                      <a
                        href="#"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full ring-1 ring-white/20 overflow-hidden"
                        title="TikTok"
                        aria-label="TikTok"
                      >
                        <TikTokLogo className="w-6 h-6" />
                      </a>
                      <div className="ml-auto">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs rounded-md px-2.5 py-1.5 bg-gray-800/70 hover:bg-gray-700 ring-1 ring-white/10"
                          onClick={() => alert("Hook up fields to save social links if you have them")}
                        >
                          Manage Links
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Account + Actions */}
              <div className="space-y-6 lg:col-span-2">
                <Card title="Account info" onEdit={() => setEditOpen(true)}>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="text-sm text-gray-400">Name</div>
                      <div className="sm:col-span-2 text-sm text-gray-100">{displayName}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="text-sm text-gray-400">Username</div>
                      <div className="sm:col-span-2 text-sm">
                        <span className="text-sky-300">@{username}</span>
                      </div>
                    </div>

                    {email ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="text-sm text-gray-400">Email</div>
                        <div className="sm:col-span-2 text-sm text-gray-100 break-all">{email}</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="text-sm text-gray-400">Email</div>
                        <div className="sm:col-span-2 text-sm text-gray-400 flex items-center gap-3">
                          Not set
                          <button
                            type="button"
                            onClick={() => setEditOpen(true)}
                            className="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs bg-gray-800/70 hover:bg-gray-700 ring-1 ring-white/10"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-white/10" />

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          navigate("/");
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 text-gray-200 hover:text-white hover:bg-white/10 px-3 py-2 text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>

                      {/* Subtle “More actions” discloser */}
                      <button
                        type="button"
                        onClick={() => setShowAdvanced((s) => !s)}
                        className="text-xs text-gray-400 hover:text-gray-200"
                        aria-expanded={showAdvanced}
                      >
                        More actions
                        <ChevronDown
                          className={`ml-1 inline h-4 w-4 transition-transform ${
                            showAdvanced ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Low-emphasis danger area */}
                    {showAdvanced && (
                      <div className="mt-3 rounded-lg bg-gray-900/40 ring-1 ring-white/10 p-3">
                        <p className="text-xs text-gray-400 mb-2">
                          Deleting your account is permanent. This option is intentionally tucked away.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowConfirm(true)}
                          className="text-xs text-red-300 hover:text-red-200 underline underline-offset-2"
                        >
                          Delete account
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm delete */}
      {showConfirm && (
        <ConfirmModal
          message="Delete your account? This cannot be undone."
          onCancel={() => setShowConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}

      {/* Edit sheet */}
      <EditAccountSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialName={displayName === username ? "" : displayName}
        initialUsername={username}
        initialEmail={email}
        onSaved={refreshUser}
      />

      {/* Avatar picker */}
      <AvatarPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePickPreset}
      />
    </div>
  );
};

export default ProfileOverviewPage;
