// src/components/PostCard/PostCard.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Star,
  MessageCircle,
  Share2,
  Repeat2,
  Bookmark,
  MoreVertical,
  Trash2,
  Eye,
} from "lucide-react";
import {
  sharePost,
  repostPost,
  apiFetch,
  savePost as savePostRequest,
  unsavePost,
} from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { useAnalytics } from "../../hooks/useAnalytics";

export interface PostCardProps {
  id: string | number;
  authorId: string;
  username: string;
  title?: string;
  imageUrl?: string;
  caption: string;
  timestamp: string;
  stars?: number;
  comments?: number;
  shares?: number;
  reposts?: number;
  avatarUrl: string;
  likedByMe?: boolean;
  repostedByMe?: boolean;
  repostedBy?: string;
  savedByMe?: boolean;
  saves?: number;
  views?: number;
  onDeleted?: (id: string | number) => void;
  onSavedChange?: (id: string | number, saved: boolean, count: number) => void;
  onLikeChange?: (id: string | number, liked: boolean, count: number) => void;
  onRepostChange?: (id: string | number, reposted: boolean, count: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  username,
  imageUrl,
  avatarUrl,
  caption,
  timestamp,
  stars = 0,
  comments = 0,
  shares = 0,
  reposts = 0,
  likedByMe,
  repostedByMe,
  repostedBy,
  savedByMe,
  saves = 0,
  authorId,
  views = 0,
  onDeleted,
  onSavedChange,
  onLikeChange,
  onRepostChange,
}) => {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();
  const isOwn = user?.id === authorId;

  const [liked, setLiked] = useState(Boolean(likedByMe));
  const [starCount, setStarCount] = useState(stars);
  const [commentCount] = useState(comments);
  const [shareCount, setShareCount] = useState(shares);
  const [reposted, setReposted] = useState(Boolean(repostedByMe));
  const [repostCount, setRepostCount] = useState(reposts);
  const [saved, setSaved] = useState(Boolean(savedByMe));
  const [saveCount, setSaveCount] = useState(saves);

  const [menuOpen, setMenuOpen] = useState(false);
  const [repostPending, setRepostPending] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const encodedUsername = encodeURIComponent(username);

  useEffect(() => {
    setSaveCount(saves ?? 0);
    if (!user) {
      setLiked(false);
      setReposted(false);
      setSaved(false);
      return;
    }
    setLiked(Boolean(likedByMe));
    setReposted(Boolean(repostedByMe));
    setSaved(Boolean(savedByMe));
  }, [user, likedByMe, repostedByMe, savedByMe, saves]);

  const safeTrack = (payload: Parameters<NonNullable<typeof trackEvent>>[0]) => {
    try {
      trackEvent?.(payload);
    } catch {}
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleLike = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;
    try {
      const res = await apiFetch(`/posts/${id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Like toggle failed");
      const { liked: nextLiked, count } = await res.json();
      setLiked(nextLiked);
      setStarCount(count);
      onLikeChange?.(id, nextLiked, count);
      safeTrack({
        type: nextLiked ? "post_like" : "post_unlike",
        targetType: "post",
        targetId: String(id),
        value: count,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const postUrl = `${window.location.origin}/posts/${id}`;
    try {
      const { count } = await sharePost(String(id));
      setShareCount(count);
      safeTrack({
        type: "post_share",
        targetType: "post",
        targetId: String(id),
        value: count,
      });
    } catch (err) {
      console.error("Failed to share:", err);
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: `${username}'s post`, text: caption, url: postUrl });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        alert("Link copied to clipboard!");
      } catch {
        prompt("Copy this link to share:", postUrl);
      }
    }
  };

  const handleRepost = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user || repostPending) return;

    setRepostPending(true);
    try {
      const data: any = await repostPost(String(id));

      const nextReposted =
        typeof data?.reposted === "boolean"
          ? data.reposted
          : typeof data?.repostedByMe === "boolean"
          ? data.repostedByMe
          : true;

      const nextCount =
        typeof data?.count === "number"
          ? data.count
          : typeof data?.reposts === "number"
          ? data.reposts
          : repostCount + (reposted ? 0 : 1);

      setReposted(nextReposted);
      setRepostCount(nextCount);
      onRepostChange?.(id, nextReposted, nextCount);
      safeTrack({
        type: "post_repost",
        targetType: "post",
        targetId: String(id),
        value: nextCount,
      });
    } catch (e: unknown) {
      type WithResponse = { response?: { status?: number } };
      const err = e as (Error & { statusCode?: number; status?: number }) & WithResponse;
      const msg = typeof err?.message === "string" ? err.message : "";
      const match = msg.match(/\b(\d{3})\b/);
      const status =
        (typeof err?.statusCode === "number" ? err.statusCode : undefined) ??
        (typeof err?.status === "number" ? err.status : undefined) ??
        (typeof err?.response?.status === "number" ? err.response.status : undefined) ??
        (match ? parseInt(match[1], 10) : 0);

      if (status === 409) {
        if (!reposted) {
          setReposted(true);
          onRepostChange?.(id, true, repostCount);
        }
        console.info("Already reposted — updating UI.");
      } else if (status === 401) {
        alert("Please sign in again to repost.");
      } else {
        console.error("Failed to toggle repost:", err);
      }
    } finally {
      setRepostPending(false);
    }
  };

  const toggleSave = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;
    try {
      if (saved) {
        const { saved: isSaved, count } = await unsavePost(String(id));
        setSaved(isSaved);
        setSaveCount(count);
        onSavedChange?.(id, isSaved, count);
        safeTrack({
          type: "post_unsave",
          targetType: "post",
          targetId: String(id),
          value: count,
        });
      } else {
        const { saved: isSaved, count } = await savePostRequest(String(id));
        setSaved(isSaved);
        setSaveCount(count);
        onSavedChange?.(id, isSaved, count);
        safeTrack({
          type: "post_save",
          targetType: "post",
          targetId: String(id),
          value: count,
        });
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
    }
  };

  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(ev.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = async () => {
    setMenuOpen(false);
    try {
      const res = await apiFetch(`/posts/delete/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete post");
      }
      onDeleted?.(id);
    } catch (err) {
      console.error("Delete post error:", err);
    }
  };

  const formatK = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`
    : `${n}`;

  return (
    <div className="w-full py-0 sm:py-1 sm:px-1">
      <div
        className={[
          "relative overflow-hidden rounded-lg",
          "border border-white/10",
          // LIGHTER: glassy slate gradient + stronger blur
          "bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/20",
          "backdrop-blur-xl text-slate-100",
          "shadow-[0_16px_36px_rgba(2,6,23,0.35)]",
        ].join(" ")}
      >
        {/* 3-dot menu */}
        <div className="absolute right-2 top-2 z-20" onClick={stop}>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-md p-2 text-slate-200/90 hover:text-white hover:bg-white/10 transition"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Post options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.5rem)] w-44 overflow-hidden rounded-md border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl"
              >
                <button
                  role="menuitem"
                  onClick={toggleSave}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-100 hover:bg-white/10"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{saved ? "Unsave" : "Save"}({saveCount})</span>
                </button>

                <div className="mx-2 my-1 h-px bg-white/10" />

                <button
                  role="menuitem"
                  onClick={handleShare}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-100 hover:bg-white/10"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share({shareCount})</span>
                </button>

                {isOwn && (
                  <>
                    <div className="mx-2 my-1 h-px bg-white/10" />
                    <button
                      role="menuitem"
                      onClick={handleDelete}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-white/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reposted badge */}
        {repostedBy && (
          <div className="px-0 sm:px-6 pt-3 text-xs text-slate-300">
            Reposted by {repostedBy}
          </div>
        )}

        {/* Header */}
        <div className="relative z-[1] px-0 sm:px-6 pt-3 pb-2 flex justify-between items-start">
          <Link
            to={`/users/${encodedUsername}/posts`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3"
          >
            <img
              src={avatarUrl ?? "/defaultPfp.png"}
              alt={`${username}'s profile`}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white/15"
            />
            <div className="leading-tight">
              <div className="font-semibold text-white/95">@{username}</div>
              {timestamp && (
                <div className="text-[11px] text-slate-400">
                  {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Caption */}
        <div className="relative z-[1] px-0 sm:px-6 pb-2 text-[14px] leading-snug text-slate-200/95">
          {caption}
        </div>

        {/* Media */}
        {imageUrl && (
          <div className="relative z-[1] w-full px-0 sm:px-6 pb-1.5">
            <div className="overflow-hidden rounded-md border border-white/10 bg-black/10">
              <div className="aspect-[2/1] md:aspect-[21/9]">
                <img
                  src={imageUrl}
                  alt={`Post by ${username}: ${caption}`}
                  className="object-cover w-full h-full"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/fallback.jpg.png";
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Views */}
        <div className="relative z-[1] px-0 sm:px-6 py-1">
          <div className="flex items-center gap-2 text-[13px] text-slate-300" aria-label="Views">
            <Eye className="w-4 h-4 opacity-90" aria-hidden="true" />
            <span className="tabular-nums">{formatK(views)}</span>
          </div>
        </div>

        {/* Actions */}
        <div onClick={stop} className="relative z-[1] px-0 sm:px-6 pb-3 pt-1">
          <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-3">
            <button
              type="button"
              onClick={handleLike}
              className="group flex-1 sm:w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm hover:border-white/25 hover:bg-white/10 transition"
            >
              <Star
                className="w-4 h-4"
                fill={user && liked ? "currentColor" : "none"}
                strokeWidth={liked ? 2.5 : 1.5}
              />
              <span className="font-medium leading-none flex items-center gap-2">
                Star
                <span className="flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] leading-none">
                  {starCount}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={handleRepost}
              disabled={repostPending}
              className="group flex-1 sm:w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm hover:border-white/25 hover:bg-white/10 transition disabled:opacity-60"
            >
              <Repeat2 className="w-4 h-4" />
              <span className="font-medium leading-none flex items-center gap-2">
                {reposted ? "Reposted" : "Repost"}
                <span className="flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] leading-none">
                  {repostCount}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/posts/${id}`)}
              className="group flex-1 sm:w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm hover:border-white/25 hover:bg-white/10 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium leading-none flex items-center gap-2">
                Comment
                <span className="flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] leading-none">
                  {commentCount}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
