import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Eye } from "lucide-react";

import {
  Star,
  MessageCircle,
  Share2,
  Repeat2,
  Bookmark,
  MoreVertical,
  Trash2,
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
  id: string;
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
  /** UI-only: total views for the post (for the single meta item) */
  views?: number;
  onDeleted?: (id: string) => void;
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
}) => {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();
  const isOwn = user?.id === authorId;

  const [liked, setLiked] = useState(likedByMe);
  const [starCount, setStarCount] = useState(stars);
  const [commentCount] = useState(comments);
  const [shareCount, setShareCount] = useState(shares);
  const [reposted, setReposted] = useState(Boolean(repostedByMe));
  const [repostCount, setRepostCount] = useState(reposts);
  const [saved, setSaved] = useState(Boolean(savedByMe));
  const [saveCount, setSaveCount] = useState(saves);

  const [menuOpen, setMenuOpen] = useState(false);
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

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await apiFetch(`/posts/${id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Like toggle failed");
      const { liked: nextLiked, count } = await res.json();
      setLiked(nextLiked);
      setStarCount(count);
      void trackEvent({
        type: nextLiked ? "post_like" : "post_unlike",
        targetType: "post",
        targetId: id,
        value: count,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${id}`;

    try {
      const { count } = await sharePost(id);
      setShareCount(count);
      void trackEvent({
        type: "post_share",
        targetType: "post",
        targetId: id,
        value: count,
      });
    } catch (err) {
      console.error("Failed to share:", err);
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s post`,
          text: caption,
          url: postUrl,
        });
      } catch (err) {
        console.warn("User cancelled share or error:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        alert("Link copied to clipboard!");
      } catch {
        prompt("Copy this link to share:", postUrl);
      }
    }
  };

  const handleRepost = async () => {
    if (!user || reposted) return;
    try {
      const { count } = await repostPost(id);
      setRepostCount(count);
      setReposted(true);
      void trackEvent({
        type: "post_repost",
        targetType: "post",
        targetId: id,
        value: count,
      });
    } catch (err: unknown) {
      console.error("Failed to repost:", err);
    }
  };

  const toggleSave = async () => {
    if (!user) return;
    try {
      if (saved) {
        const { saved: isSaved, count } = await unsavePost(id);
        setSaved(isSaved);
        setSaveCount(count);
        void trackEvent({
          type: "post_unsave",
          targetType: "post",
          targetId: id,
          value: count,
        });
      } else {
        const { saved: isSaved, count } = await savePostRequest(id);
        setSaved(isSaved);
        setSaveCount(count);
        void trackEvent({
          type: "post_save",
          targetType: "post",
          targetId: id,
          value: count,
        });
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
    }
  };

  // close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleDelete = async () => {
    setMenuOpen(false);
    try {
      const res = await apiFetch(`/posts/delete/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete post");
      }
      onDeleted?.(id);
    } catch (err: unknown) {
      console.error("Delete post error:", err);
    }
  };

  // simple UI formatter like "241K"
  const formatCount = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`
    : `${n}`;

  return (
    <div className="w-full py-0 sm:py-2 sm:px-2">
      {/* Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0A0F1F] via-[#0F1B2E] to-[#0A0F1C] text-white shadow-[0_20px_45px_rgba(2,6,23,0.45)]">
        {/* star field */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[.12]"
          style={{
            backgroundImage: `
              radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,.9) 1px, transparent 1px),
              radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,.7) 1px, transparent 1px),
              radial-gradient(1px 1px at 70% 30%, rgba(255,255,255,.8) 1px, transparent 1px),
              radial-gradient(1px 1px at 90% 60%, rgba(255,255,255,.6) 1px, transparent 1px)
            `,
            backgroundSize:
              "120px 120px, 160px 160px, 140px 140px, 180px 180px",
          }}
        />

        {/* 3-dot menu — fixed anchor */}
        <div className="absolute right-2 top-2 z-20" onClick={stop}>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg p-2 text-slate-300/90 hover:text-white hover:bg-white/10 transition"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Post options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.5rem)] w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0E1626]/95 backdrop-blur-md shadow-2xl"
              >
                <button
                  role="menuitem"
                  onClick={toggleSave}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Save({saveCount})</span>
                </button>

                <div className="mx-2 my-1 h-px bg-white/10" />

                <button
                  role="menuitem"
                  onClick={handleShare}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
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
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/10"
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
          <div className="px-4 sm:px-6 pt-4 text-xs text-slate-300/80">
            Reposted by {repostedBy}
          </div>
        )}

        {/* Header */}
        <div className="relative z-[1] px-4 sm:px-6 pt-4 pb-3 flex justify-between items-start">
          <Link
            to={`/users/${encodedUsername}/posts`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3"
          >
            <img
              src={avatarUrl ?? "/defaultPfp.png"}
              alt={`${username}'s profile`}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/15"
            />
            <div className="leading-tight">
              <div className="font-semibold text-white/95">@{username}</div>
              {timestamp && (
                <div className="text-[11px] text-slate-400">
                  {formatDistanceToNow(new Date(timestamp), {
                    addSuffix: true,
                  })}
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Caption */}
        <div className="relative z-[1] px-4 sm:px-6 pb-3 text-[15px] text-slate-200/95">
          {caption}
        </div>

        {/* Media */}
        {imageUrl && (
          <div className="relative z-[1] w-full px-4 sm:px-6 pb-2">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="aspect-video">
                <img
                  src={imageUrl}
                  alt={`Post by ${username}: ${caption}`}
                  className="object-cover w-full h-full"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "/fallback.jpg.png";
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Meta row — views with eye icon */}
<div className="relative z-[1] px-4 sm:px-6 py-2">
  <div className="flex items-center gap-2 text-[13px] text-slate-300" aria-label="Views">
    <Eye className="w-4 h-4 opacity-90" aria-hidden="true" />
    <span className="tabular-nums">{formatCount(views)}</span>
  </div>
</div>


        {/* Action buttons */}
        <div onClick={stop} className="relative z-[1] px-3 sm:px-6 pb-5 pt-2">
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {/* Like */}
    <button
      type="button"
      onClick={handleLike}
      className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-[#0E1626]/80 px-3.5 py-2.5 text-xs sm:text-sm hover:bg-white/10 transition"
    >
      <Star className="w-4 h-4" fill={user && liked ? "currentColor" : "none"} />
      <span className="font-medium leading-none">Like({starCount})</span>
    </button>

    {/* Retweet */}
    <button
      type="button"
      onClick={handleRepost}
      className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-[#0E1626]/80 px-3.5 py-2.5 text-xs sm:text-sm hover:bg-white/10 transition"
    >
      <Repeat2 className="w-4 h-4" />
      <span className="font-medium leading-none">Retweet({repostCount})</span>
    </button>

    {/* Comment */}
    <button
      type="button"
      onClick={() => navigate(`/posts/${id}`)}
      className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-[#0E1626]/80 px-3.5 py-2.5 text-xs sm:text-sm hover:bg-white/10 transition"
    >
      <MessageCircle className="w-4 h-4" />
      <span className="font-medium leading-none">Comment({commentCount})</span>
    </button>
  </div>
</div>

      </div>
    </div>
  );
};

export default PostCard;
