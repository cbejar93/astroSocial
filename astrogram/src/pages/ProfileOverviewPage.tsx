// src/pages/ProfileOverviewPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  Edit2,
  UploadCloud,
  LogOut,
  ChevronDown,
  X,
  Image as ImageIcon,
  Star,
  Link2,
  Trash2,
} from "lucide-react";
import {
  FaGithub,
  FaGlobe,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { useAuth } from "../hooks/useAuth";
import {
  updateAvatar,
  deleteProfile,
  apiFetch,
  fetchMyPosts,
  fetchMyComments,
  fetchSavedPosts,
  toggleCommentLike,
  deleteUserSocialAccount,
  addUserSocialAccount,
  fetchMySocialAccounts,
  type SocialPlatform,
  type UserSocialAccount,
} from "../lib/api";
import ConfirmModal from "../components/Modal/ConfirmModal";
import PostCard, { type PostCardProps } from "../components/PostCard/PostCard";
import PostSkeleton from "../components/PostCard/PostSkeleton";
import { formatDistanceToNow } from "date-fns";

/* ======================= Username validation ======================= */
const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;

/* =================== Safe HTML helpers (decode → sanitize) =================== */
function decodeHtmlEntitiesDeep(value: string): string {
  if (!value) return "";
  let prev = value;
  for (let i = 0; i < 5; i++) {
    const ta = document.createElement("textarea");
    ta.innerHTML = prev;
    const next = ta.value;
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

function sanitizeHtml(value: string): string {
  if (typeof window === "undefined" || !value) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  const body = doc.body;
  if (!body) return "";

  const allowedTags = new Set([
    "a",
    "blockquote",
    "br",
    "code",
    "em",
    "i",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "ul",
  ]);
  const allowedAttrs = new Set(["href", "title", "rel", "target"]);

  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_ELEMENT, null);
  const nodesToRemove: Element[] = [];
  const nodesToUnwrap: Element[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Element;
    const tag = node.tagName.toLowerCase();

    if (!allowedTags.has(tag)) {
      if (tag === "script" || tag === "style") {
        nodesToRemove.push(node);
        continue;
      }
      nodesToUnwrap.push(node);
      continue;
    }

    [...node.attributes].forEach((attr) => {
      if (!allowedAttrs.has(attr.name.toLowerCase())) node.removeAttribute(attr.name);
    });

    if (tag === "a") {
      if (!node.hasAttribute("rel")) node.setAttribute("rel", "noopener noreferrer");
      if (!node.hasAttribute("target")) node.setAttribute("target", "_blank");
    }
  }

  nodesToRemove.forEach((n) => n.remove());
  nodesToUnwrap.forEach((n) => {
    const frag = document.createDocumentFragment();
    while (n.firstChild) frag.appendChild(n.firstChild);
    n.replaceWith(frag);
  });

  return body.innerHTML;
}
const toSafeHtml = (value: string) => sanitizeHtml(decodeHtmlEntitiesDeep(value));

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "TWITTER",
  "INSTAGRAM",
  "TIKTOK",
  "YOUTUBE",
  "LINKEDIN",
  "GITHUB",
  "WEBSITE",
  "OTHER",
];

const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  TWITTER: "X / Twitter",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  LINKEDIN: "LinkedIn",
  GITHUB: "GitHub",
  WEBSITE: "Website",
  OTHER: "Other",
};

const SOCIAL_PLATFORM_BASE_URLS: Record<SocialPlatform, string | null> = {
  TWITTER: "https://x.com/",
  INSTAGRAM: "https://instagram.com/",
  TIKTOK: "https://www.tiktok.com/",
  YOUTUBE: "https://www.youtube.com/",
  LINKEDIN: "https://www.linkedin.com/in/",
  GITHUB: "https://github.com/",
  WEBSITE: null,
  OTHER: null,
};

const SOCIAL_PLATFORM_DOMAINS: Record<SocialPlatform, string[]> = {
  TWITTER: ["x.com", "twitter.com"],
  INSTAGRAM: ["instagram.com"],
  TIKTOK: ["tiktok.com"],
  YOUTUBE: ["youtube.com", "youtu.be"],
  LINKEDIN: ["linkedin.com"],
  GITHUB: ["github.com"],
  WEBSITE: [],
  OTHER: [],
};

/* =============================== Shared Card =============================== */
const Card: React.FC<
  React.PropsWithChildren<{ className?: string; title?: string; onEdit?: () => void }>
> = ({ className = "", title, onEdit, children }) => (
  <div
    className={[
      "rounded-2xl border border-white/10 bg-[#0E1626]/90 text-white",
      "shadow-[0_8px_28px_rgba(2,6,23,0.45)] backdrop-blur-md",
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

/* ============================= Edit Account Sheet ============================= */
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
          "shadow-2xl ring-1 ring-white/10 transition-transform duration-300 ease-out",
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

          {error && <div className="rounded-md bg-red-600/90 px-3 py-2 text-xs">{error}</div>}

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

/* ============================== Avatar Presets ============================== */
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

/* ========================= Avatar Picker (Portaled) ========================= */
const AvatarPickerModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onPick: (file: File) => Promise<void>;
}> = ({ open, onClose, onPick }) => {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
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
    </div>,
    document.body
  );
};

/* ====================== Activity (Mobile-only, internal) ===================== */
type ActivityComment = {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  likes: number;
  likedByMe?: boolean;
  avatarUrl?: string;
  parentId?: string | null;
  parentUsername?: string;
};

interface MyPost extends PostCardProps {
  loungeId?: string;
  loungeName?: string;
  title?: string;
}

const MobileActivityBox: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"posts" | "comments" | "saved">("posts");
  const [postSubTab, setPostSubTab] = useState<"all" | "posts" | "lounges">("all");

  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  // SAVED
  const [savedPosts, setSavedPosts] = useState<MyPost[]>([]);
  const [savedPage, setSavedPage] = useState(0);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [isFetchingSaved, setIsFetchingSaved] = useState(false);
  const [hasMoreSaved, setHasMoreSaved] = useState(true);

  const [showMorePosts, setShowMorePosts] = useState(false);
  const [showMoreLounge, setShowMoreLounge] = useState(false);
  const [openLoungeGroups, setOpenLoungeGroups] = useState<Set<string>>(new Set<string>());

  // initial loads
  useEffect(() => {
    let mounted = true;

    fetchMyPosts<MyPost>()
      .then((data) => mounted && setMyPosts(data ?? []))
      .finally(() => mounted && setLoadingPosts(false));

    fetchMyComments<ActivityComment>()
      .then((data) => mounted && setComments(data ?? []))
      .finally(() => mounted && setLoadingComments(false));

    return () => {
      mounted = false;
    };
  }, []);

  const PAGE_SIZE = 20;

  // lazy-load saved
  const loadSavedPage = async (nextPage: number) => {
    if (isFetchingSaved) return;
    if (nextPage === 1) setLoadingSaved(true);
    setIsFetchingSaved(true);
    try {
      const res = await fetchSavedPosts<MyPost>(nextPage, PAGE_SIZE);
      setSavedPosts((prev) => {
        if (nextPage === 1) return res.posts ?? [];
        const seen = new Set(prev.map((p) => String(p.id)));
        const appended = (res.posts ?? []).filter((p) => !seen.has(String(p.id)));
        return [...prev, ...appended];
      });
      setSavedPage(nextPage);
      setHasMoreSaved((res.posts?.length ?? 0) > 0 && nextPage * PAGE_SIZE < (res.total ?? 0));
    } catch (e) {
      console.error("Failed to load saved posts", e);
    } finally {
      if (nextPage === 1) setLoadingSaved(false);
      setIsFetchingSaved(false);
    }
  };

  useEffect(() => {
    if (activeTab === "saved" && savedPage === 0 && !loadingSaved) {
      loadSavedPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const generalPosts = myPosts.filter((p) => !p.loungeId);
  const loungePosts = myPosts.filter((p) => p.loungeId);

  const loungeGroups = (() => {
    const map = new Map<string, MyPost[]>();
    for (const p of loungePosts) {
      const name = p.loungeName ?? "Unknown";
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  })();

  const toggleGroup = (name: string) =>
    setOpenLoungeGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const handleToggleLike = async (id: string) => {
    try {
      const { liked, count } = await toggleCommentLike(id);
      setComments((cs) => cs.map((c) => (c.id === id ? { ...c, likes: count, likedByMe: liked } : c)));
    } catch (e) {
      console.error(e);
    }
  };

  function TinyPost({
    post,
    onDeleted,
  }: {
    post: MyPost;
    onDeleted?: (id: string | number) => void;
  }) {
    return (
      <div className="rounded-md border border-white/10 bg-gray-900/30 hover:bg-gray-900/50 transition">
        <div className="w-full" onClick={() => navigate(`/posts/${post.id}`)}>
          <PostCard
            {...post}
            onDeleted={(id) => {
              setMyPosts((ps) => ps.filter((p) => p.id !== id));
              onDeleted?.(id);
            }}
          />
        </div>
      </div>
    );
  }

  function LoungeRow({ post }: { post: MyPost }) {
    return (
      <div
        className="rounded-lg border border-white/10 bg-gray-900/30 hover:bg-gray-900/50 transition cursor-pointer p-3"
        onClick={() =>
          navigate(`/lounge/${encodeURIComponent(post.loungeName ?? "")}/posts/${post.id}`)
        }
      >
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <img
            src={post.avatarUrl ?? "/defaultPfp.png"}
            alt={`${post.username} avatar`}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="font-medium text-gray-200">{post.username}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</span>
        </div>
        {post.title && (
          <div className="mt-1 text-sm font-semibold text-gray-100 line-clamp-2">{post.title}</div>
        )}
        {"body" in post && (post as any).body && (
          <div
            className="text-xs text-gray-300 line-clamp-2 mt-1"
            dangerouslySetInnerHTML={{ __html: toSafeHtml(String((post as any).body)) }}
          />
        )}
        <div className="mt-1 text-xs text-gray-400">{post.comments} replies</div>
      </div>
    );
  }

  return (
    <Card title="Your Activity" className="lg:hidden">
      <div className="p-4">
        {/* Tabs */}
        <div className="grid grid-cols-3 rounded-lg border border-white/10 p-1 bg-gray-900/40">
          <button
            onClick={() => setActiveTab("posts")}
            className={`py-1.5 rounded-md text-sm ${
              activeTab === "posts" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800/50"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`py-1.5 rounded-md text-sm ${
              activeTab === "comments" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800/50"
            }`}
          >
            Comments
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`py-1.5 rounded-md text-sm ${
              activeTab === "saved" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800/50"
            }`}
            title="Saved posts"
          >
            Saved
          </button>
        </div>

        {/* Content (mobile scroll) */}
        <div className="pretty-scroll mt-3 max-h-[60vh] overflow-y-auto overflow-x-hidden pt-1 pb-2">
          {activeTab === "posts" ? (
            <>
              {/* Sub-tabs */}
              <div className="flex items-center justify-center gap-2 text-xs mb-2">
                <button
                  onClick={() => setPostSubTab("all")}
                  className={`px-2.5 py-1 rounded-md border ${
                    postSubTab === "all"
                      ? "border-white/20 bg-gray-800 text-white"
                      : "border-white/10 text-gray-300 hover:bg-gray-800/40"
                  }`}
                >
                  All <span className="ml-1 text-[10px] opacity-75">({myPosts.length})</span>
                </button>
                <button
                  onClick={() => setPostSubTab("posts")}
                  className={`px-2.5 py-1 rounded-md border ${
                    postSubTab === "posts"
                      ? "border-white/20 bg-gray-800 text-white"
                      : "border-white/10 text-gray-300 hover:bg-gray-800/40"
                  }`}
                >
                  Posts{" "}
                  <span className="ml-1 text-[10px] opacity-75">({myPosts.filter((p) => !p.loungeId).length})</span>
                </button>
                <button
                  onClick={() => setPostSubTab("lounges")}
                  className={`px-2.5 py-1 rounded-md border ${
                    postSubTab === "lounges"
                      ? "border-white/20 bg-gray-800 text-white"
                      : "border-white/10 text-gray-300 hover:bg-gray-800/40"
                  }`}
                >
                  Lounges{" "}
                  <span className="ml-1 text-[10px] opacity-75">({myPosts.filter((p) => p.loungeId).length})</span>
                </button>
              </div>

              {/* ALL */}
              {postSubTab === "all" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase tracking-wide text-gray-400">Your Posts</h4>
                    {myPosts.filter((p) => !p.loungeId).length > 3 && (
                      <button
                        className="text-xs text-sky-300 hover:underline"
                        onClick={() => setShowMorePosts((s) => !s)}
                      >
                        {showMorePosts ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                  {loadingPosts ? (
                    <div className="space-y-2">
                      <PostSkeleton />
                      <PostSkeleton />
                    </div>
                  ) : myPosts.filter((p) => !p.loungeId).length === 0 ? (
                    <div className="text-sm text-gray-400">No posts yet.</div>
                  ) : (
                    (showMorePosts
                      ? myPosts.filter((p) => !p.loungeId)
                      : myPosts.filter((p) => !p.loungeId).slice(0, 3)
                    ).map((p) => (
                      <TinyPost key={p.id} post={p} />
                    ))
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <h4 className="text-xs uppercase tracking-wide text-gray-400">Lounge Posts</h4>
                    {myPosts.filter((p) => p.loungeId).length > 3 && (
                      <button
                        className="text-xs text-sky-300 hover:underline"
                        onClick={() => setShowMoreLounge((s) => !s)}
                      >
                        {showMoreLounge ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                  {loadingPosts ? (
                    <div className="space-y-2">
                      <PostSkeleton />
                      <PostSkeleton />
                    </div>
                  ) : myPosts.filter((p) => p.loungeId).length === 0 ? (
                    <div className="text-sm text-gray-400">No lounge posts yet.</div>
                  ) : (
                    (showMoreLounge
                      ? myPosts.filter((p) => p.loungeId)
                      : myPosts.filter((p) => p.loungeId).slice(0, 3)
                    ).map((p) => (
                      <LoungeRow key={p.id} post={p} />
                    ))
                  )}
                </div>
              )}

              {/* POSTS only */}
              {postSubTab === "posts" && (
                <div className="space-y-2">
                  {loadingPosts ? (
                    <div className="space-y-2">
                      <PostSkeleton />
                      <PostSkeleton />
                    </div>
                  ) : myPosts.filter((p) => !p.loungeId).length === 0 ? (
                    <div className="text-sm text-gray-400">No posts yet.</div>
                  ) : (
                    myPosts
                      .filter((p) => !p.loungeId)
                      .map((p) => <TinyPost key={p.id} post={p} />)
                  )}
                </div>
              )}

              {/* LOUNGES only */}
              {postSubTab === "lounges" && (
                <div className="space-y-2">
                  {loadingPosts ? (
                    <div className="space-y-2">
                      <PostSkeleton />
                      <PostSkeleton />
                    </div>
                  ) : loungeGroups.length === 0 ? (
                    <div className="text-sm text-gray-400">No lounge posts yet.</div>
                  ) : (
                    loungeGroups.map(([name, posts]) => {
                      const open = openLoungeGroups.has(name);
                      return (
                        <div key={name} className="rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => toggleGroup(name)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-gray-900/40 hover:bg-gray-900/60"
                          >
                            <span className="text-sm font-medium">{name}</span>
                            <span className="text-xs text-gray-400">{posts.length}</span>
                          </button>
                          {open && (
                            <div className="p-2 space-y-2">
                              {posts.map((p) => (
                                <LoungeRow key={p.id} post={p} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          ) : activeTab === "comments" ? (
            <section className="space-y-2">
              {loadingComments ? (
                <div className="text-sm text-gray-400">Loading…</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-gray-400">No comments yet.</div>
              ) : (
                comments.slice(0, 200).map((c) => (
                  <div key={c.id} className="rounded-xl border border-white/10 bg-gray-900/30 p-3">
                    <div className="flex items-start gap-2">
                      <img
                        src={c.avatarUrl ?? "/defaultPfp.png"}
                        alt="avatar"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="text-xs text-gray-400">
                          <span className="font-medium text-gray-200">@{c.username}</span> •{" "}
                          {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                        </div>
                        <div
                          className="prose prose-invert max-w-none text-sm text-gray-100 mt-1 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: toSafeHtml(c.text) }}
                        />
                        <div className="mt-2 text-xs text-gray-400 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(c.id)}
                            className={`inline-flex items-center gap-1 ${
                              c.likedByMe ? "text-white" : "text-gray-300"
                            } hover:text-white`}
                            title={c.likedByMe ? "Unlike" : "Like"}
                          >
                            <Star className="w-4 h-4" fill={c.likedByMe ? "currentColor" : "none"} />
                            <span>{c.likes}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          ) : (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wide text-gray-400">Saved posts</h4>
                <Link to="/saved" className="text-xs text-sky-300 hover:underline" title="Open full Saved page">
                  View all
                </Link>
              </div>

              {loadingSaved && savedPage <= 1 ? (
                <div className="space-y-2">
                  <PostSkeleton />
                  <PostSkeleton />
                </div>
              ) : savedPosts.length === 0 ? (
                <div className="text-sm text-gray-400">You haven’t saved any posts yet.</div>
              ) : (
                <>
                  {savedPosts.map((p, i) => (
                    <div key={p.id} className={i === savedPosts.length - 1 ? "mb-3" : ""}>
                      <TinyPost
                        post={p}
                        onDeleted={(id) =>
                          setSavedPosts((prev) => prev.filter((sp) => String(sp.id) !== String(id)))
                        }
                      />
                    </div>
                  ))}
                </>
              )}

              {savedPosts.length > 0 && hasMoreSaved && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => loadSavedPage(savedPage + 1)}
                    disabled={isFetchingSaved}
                    className="w-full rounded-md border border-white/10 bg-gray-900/40 hover:bg-gray-900/60 px-3 py-1.5 text-xs text-gray-200 disabled:opacity-60"
                  >
                    {isFetchingSaved ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Pretty scrollbar */}
      <style>{`
        .pretty-scroll{
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,.7) rgba(2,6,23,.35);
        }
        .pretty-scroll::-webkit-scrollbar{ width: 10px; }
        .pretty-scroll::-webkit-scrollbar-track{
          background: linear-gradient(180deg, rgba(2,6,23,.4), rgba(2,6,23,.15));
          border-radius: 9999px;
        }
        .pretty-scroll::-webkit-scrollbar-thumb{
          background: linear-gradient(180deg, rgba(99,102,241,.8), rgba(244,63,94,.75));
          border-radius: 9999px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .pretty-scroll::-webkit-scrollbar-thumb:hover{
          background: linear-gradient(180deg, rgba(59,130,246,.95), rgba(236,72,153,.9));
        }
      `}</style>
    </Card>
  );
};

/* =================================== Page =================================== */
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
  const [socialAccounts, setSocialAccounts] = useState<UserSocialAccount[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>("INSTAGRAM");
  const [socialUrl, setSocialUrl] = useState("");

  // small avatar menu (portaled)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Close menu on outside click (respect menuRef since it’s portaled)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!avatarMenuOpen) return;
      const t = e.target as Node;
      if (menuBtnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setAvatarMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [avatarMenuOpen]);

  // Position the small menu so it never overflows the viewport
  const positionSmallMenu = () => {
    const btn = menuBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const GAP = 8;
    const MENU_W = 176; // w-44
    const prefLeft = r.right - MENU_W; // align right edges (opens left)
    const altLeft = r.left; // align left edges (opens right)
    let left = prefLeft;
    const minLeft = 8;
    const maxLeft = window.innerWidth - MENU_W - 8;
    if (prefLeft < minLeft) left = altLeft;
    left = Math.max(minLeft, Math.min(left, maxLeft));
    const top = Math.min(window.innerHeight - 8 - 90, r.bottom + GAP);
    setMenuPos({ top, left });
  };

  useEffect(() => {
    if (!avatarMenuOpen) return;
    positionSmallMenu();
    const onResize = () => positionSmallMenu();
    const onAnyScroll = () => positionSmallMenu();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onAnyScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onAnyScroll, true);
    };
  }, [avatarMenuOpen]);

  useEffect(() => {
    if (!user) return;
    setSocialLoading(true);
    setSocialError(null);
    fetchMySocialAccounts()
      .then((accounts) => setSocialAccounts(accounts))
      .catch(() => setSocialError("Unable to load social links."))
      .finally(() => setSocialLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="fixed inset-0 overflow-hidden pt-[88px] sm:pt-[96px]">
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

  const displayName = (user as any).name || (user as any).fullName || user.username || "User";
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

  const normalizeSocialUrl = (
    platform: SocialPlatform,
    value: string,
  ): string | null => {
    const trimmed = value.trim();
    const base = SOCIAL_PLATFORM_BASE_URLS[platform];
    const ensureProtocol = (url: string) =>
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    const cleanHandle = trimmed.replace(/^@/, "").replace(/^\/+/, "");

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      try {
        const parsed = new URL(trimmed);
        const allowedDomains = SOCIAL_PLATFORM_DOMAINS[platform];
        if (allowedDomains.length > 0) {
          const matches = allowedDomains.some((domain) =>
            parsed.hostname.endsWith(domain),
          );
          if (!matches) {
            setSocialError(
              `Please use a ${SOCIAL_PLATFORM_LABELS[platform]} link.`,
            );
            return null;
          }
        }
        return trimmed;
      } catch {
        setSocialError("Please enter a valid URL.");
        return null;
      }
    }

    if (!base) {
      return ensureProtocol(cleanHandle);
    }

    if (platform === "TIKTOK") {
      const handle = cleanHandle.startsWith("@")
        ? cleanHandle
        : `@${cleanHandle}`;
      return `${base}${handle}`;
    }

    if (platform === "YOUTUBE") {
      const handle = cleanHandle.startsWith("@")
        ? cleanHandle
        : `@${cleanHandle}`;
      return `${base}${handle}`;
    }

    return `${base}${cleanHandle}`;
  };

  const handleAddSocialAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedUrl = socialUrl.trim();
    if (!trimmedUrl) {
      setSocialError("Please enter a URL.");
      return;
    }
    const normalizedUrl = normalizeSocialUrl(socialPlatform, trimmedUrl);
    if (!normalizedUrl) {
      return;
    }
    setSocialSaving(true);
    setSocialError(null);
    try {
      const created = await addUserSocialAccount({
        platform: socialPlatform,
        url: normalizedUrl,
      });
      setSocialAccounts((prev) => [created, ...prev]);
      setSocialUrl("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add social link.";
      setSocialError(message);
    } finally {
      setSocialSaving(false);
    }
  };

  const handleDeleteSocialAccount = async (accountId: string) => {
    setSocialError(null);
    const previousAccounts = socialAccounts;
    setSocialAccounts((prev) => prev.filter((account) => account.id !== accountId));
    try {
      await deleteUserSocialAccount(accountId);
    } catch (error) {
      setSocialAccounts(previousAccounts);
      const message =
        error instanceof Error ? error.message : "Failed to delete social link.";
      setSocialError(message);
    }
  };

  const renderSocialIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case "TWITTER":
        return <FaXTwitter className="w-5 h-5 text-white" />;
      case "INSTAGRAM":
        return <FaInstagram className="w-5 h-5 text-white" />;
      case "TIKTOK":
        return <FaTiktok className="w-5 h-5 text-white" />;
      case "YOUTUBE":
        return <FaYoutube className="w-5 h-5 text-white" />;
      case "LINKEDIN":
        return <FaLinkedin className="w-5 h-5 text-white" />;
      case "GITHUB":
        return <FaGithub className="w-5 h-5 text-white" />;
      case "WEBSITE":
        return <FaGlobe className="w-5 h-5 text-white" />;
      case "OTHER":
        return <FaGlobe className="w-5 h-5 text-white" />;
      default:
        return <Link2 className="w-5 h-5 text-gray-200" />;
    }
  };

  const avatarSrc = (user.avatarUrl ?? "/defaultPfp.png") + (avatarBust ? `?t=${avatarBust}` : "");
  const trackers = user.followers?.length ?? 0;
  const tracking = user.following?.length ?? 0;

  return (
    // Give space below fixed navbar
    <div className="fixed inset-0 overflow-hidden pt-[88px] sm:pt-[96px]">
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
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r from-[#f04bb3] to-[#5aa2ff] shadow-lg ring-2 ring-white/20"
                    title="Avatar options"
                  >
                    <Edit2 className="w-4.5 h-4.5 text-white" />
                  </button>

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
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{displayName}</h1>
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

                    {uploading && <p className="ml-2 text-xs text-gray-300">Updating avatar…</p>}
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
                    <div className="space-y-4">
                      {socialLoading ? (
                        <p className="text-xs text-gray-400">Loading social links...</p>
                      ) : socialAccounts.length > 0 ? (
                        <ul className="space-y-2">
                          {socialAccounts.map((account) => (
                            <li
                              key={account.id}
                              className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
                            >
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full ring-1 ring-white/15">
                                {renderSocialIcon(account.platform)}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs text-gray-400">
                                  {SOCIAL_PLATFORM_LABELS[account.platform]}
                                </p>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSocialAccount(account.id)}
                                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-gray-900/70 p-1 text-rose-200 hover:text-rose-100 hover:bg-gray-800"
                                    title={`Remove ${SOCIAL_PLATFORM_LABELS[account.platform]}`}
                                    aria-label={`Remove ${SOCIAL_PLATFORM_LABELS[account.platform]}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                  <a
                                    href={account.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-sm font-semibold text-sky-300 hover:text-sky-200"
                                  >
                                    {SOCIAL_PLATFORM_LABELS[account.platform]}
                                    <Link2 className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400">
                          Add social links so people can find you elsewhere.
                        </p>
                      )}

                      <form
                        onSubmit={handleAddSocialAccount}
                        className="flex flex-col gap-3 rounded-lg border border-white/10 bg-gray-900/40 p-3"
                      >
                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-gray-400">Platform</label>
                          <select
                            value={socialPlatform}
                            onChange={(event) =>
                              setSocialPlatform(event.target.value as SocialPlatform)
                            }
                            className="rounded-md border border-white/10 bg-gray-900/80 px-3 py-2 text-sm text-white"
                          >
                            {SOCIAL_PLATFORMS.map((platform) => (
                              <option key={platform} value={platform}>
                                {SOCIAL_PLATFORM_LABELS[platform]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-gray-400">URL</label>
                          <input
                            type="url"
                            value={socialUrl}
                            onChange={(event) => setSocialUrl(event.target.value)}
                            placeholder="https://"
                            className="rounded-md border border-white/10 bg-gray-900/80 px-3 py-2 text-sm text-white placeholder-gray-500"
                          />
                        </div>
                        {socialError && (
                          <p className="text-xs text-rose-300">{socialError}</p>
                        )}
                        <button
                          type="submit"
                          disabled={socialSaving}
                          className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-[#f04bb3] to-[#5aa2ff] px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(15,23,42,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {socialSaving ? "Saving..." : "Add social link"}
                        </button>
                      </form>
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

                {/* Mobile activity (desktop unaffected) */}
                <MobileActivityBox />
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

      {/* Avatar small menu — PORTALED + viewport-aware */}
      {avatarMenuOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[95] w-44 rounded-lg border border-white/10 bg-gray-900/95 shadow-xl overflow-hidden"
            style={{ top: menuPos?.top ?? 0, left: menuPos?.left ?? 0 }}
          >
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
          </div>,
          document.body
        )}

      {/* Avatar picker */}
      <AvatarPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={handlePickPreset} />
    </div>
  );
};

export default ProfileOverviewPage;
