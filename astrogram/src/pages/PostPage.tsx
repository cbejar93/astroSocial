// src/pages/PostPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  apiFetch,
  repostPost,
  savePost as savePostRequest,
  sharePost,
  unsavePost,
} from "../lib/api";
import HomeFeedComments, {
  type HomeFeedCommentsHandle,
} from "../components/Comments/HomeFeedComments";
import { useAuth } from "../hooks/useAuth";
import { useAnalytics } from "../hooks/useAnalytics";
import { MessageCircle, MoreVertical, Repeat2, Star } from "lucide-react";
import PageContainer from "../components/Layout/PageContainer";

/* ---------------------------- Types ---------------------------- */
interface Post {
  id: string;
  title?: string;
  caption: string;
  username: string;
  avatarUrl?: string;
  timestamp: string;
  authorJoinedAt?: string;
  authorPostCount?: number;
  imageUrl?: string;
  images?: string[];
  stars?: number;
  comments?: number;
  shares?: number;
  reposts?: number;
  saves?: number;
  likedByMe?: boolean;
  repostedByMe?: boolean;
  savedByMe?: boolean;
}

/* ------------------------- Aurora Wrapper ------------------------- */
const AuroraBorder: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <div
    className={[
      "rounded-2xl border border-white/10",
      "bg-white/[0.04] backdrop-blur-xl backdrop-saturate-150",
      "shadow-[0_6px_30px_rgba(0,0,0,0.35)] min-w-0 overflow-hidden",
      className,
    ].join(" ")}
    style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
  >
    {children}
  </div>
);

/* ----------------------------- Page ---------------------------- */
const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [starCount, setStarCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [repostPending, setRepostPending] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HomeFeedCommentsHandle>(null);

  /* ---------------------- Fetch Post ---------------------- */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch(`/posts/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const normalized: Post = {
          id: String(data.id),
          title: data.title ?? undefined,
          caption: data.caption,
          username: data.username,
          avatarUrl: data.avatarUrl ?? undefined,
          imageUrl: data.imageUrl ?? undefined,
          images: Array.isArray(data.images) ? data.images : undefined,
          timestamp: data.timestamp,
          authorJoinedAt: data.authorJoinedAt ?? undefined,
          authorPostCount: data.authorPostCount ?? undefined,
          stars: typeof data.stars === "number" ? data.stars : data.likes ?? 0,
          comments:
            typeof data.comments === "number"
              ? data.comments
              : typeof data.commentCount === "number"
              ? data.commentCount
              : 0,
          shares: typeof data.shares === "number" ? data.shares : data.shareCount ?? 0,
          reposts:
            typeof data.reposts === "number"
              ? data.reposts
              : typeof data.retweetCount === "number"
              ? data.retweetCount
              : 0,
          saves: typeof data.saves === "number" ? data.saves : data.saveCount ?? 0,
          likedByMe: Boolean(data.likedByMe ?? data.liked),
          repostedByMe: Boolean(data.repostedByMe ?? data.reposted),
          savedByMe: Boolean(data.savedByMe ?? data.saved),
        };
        setPost(normalized);
        setError(null);
      })
      .catch(() => setError("Could not load post."))
      .finally(() => setLoading(false));
  }, [id]);

  /* ---------------------- Close menu when clicking outside ---------------------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!post) return;
    setLiked(Boolean(post.likedByMe));
    setStarCount(post.stars ?? 0);
    setCommentCount(post.comments ?? 0);
    setReposted(Boolean(post.repostedByMe));
    setRepostCount(post.reposts ?? 0);
    setShareCount(post.shares ?? 0);
    setSaved(Boolean(post.savedByMe));
    setSaveCount(post.saves ?? 0);
  }, [post]);

  const safeTrack = (payload: Parameters<NonNullable<typeof trackEvent>>[0]) => {
    try {
      trackEvent?.(payload);
    } catch {}
  };

  const buildSharePayload = async () => {
    if (!post) return null;

    const postUrl = `${window.location.origin}/posts/${post.id}`;
    const candidateImage = post.images?.[0] ?? post.imageUrl;
    const combinedText = post.caption
      ? `${post.caption}\n\n${postUrl}`
      : postUrl;

    const shareData: ShareData = {
      title: `${post.username}'s post`,
      text: combinedText,
    };

    if (candidateImage) {
      try {
        const response = await fetch(candidateImage);
        if (response.ok) {
          const blob = await response.blob();
          const extension = blob.type.split("/")[1] || "png";
          const filename = `post-${post.id}.${extension}`;
          const file = new File([blob], filename, { type: blob.type });

          if (navigator.canShare?.({ files: [file] })) {
            shareData.files = [file];
          }
        }
      } catch (err) {
        console.error("Failed to fetch share image:", err);
      }
    } else {
      shareData.url = postUrl;
    }

    return { shareData, postUrl, shareImageUrl: candidateImage, combinedText };
  };

  const buildClipboardMarkup = (postUrl: string, shareImageUrl?: string) => {
    const safeCaption =
      post?.caption.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />") ??
      "";
    const safeTitle =
      post?.title?.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />") ??
      "";
    const logoUrl = `${window.location.origin}/logo.png`;
    const sourceDomain = new URL(postUrl).hostname;

    return `
      <a href="${postUrl}" style="text-decoration: none; color: #111827; display: block; max-width: 520px;">
        <article style="font-family: system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff; box-shadow: 0 8px 28px rgba(0,0,0,0.05); overflow: hidden;">
          ${
            shareImageUrl
              ? `<div style="background: #f8fafc;">
                  <img src="${shareImageUrl}" alt="Shared post image" style="width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 16px 16px 0 0;" />
                </div>`
              : ""
          }
          <div style="padding: 14px 14px 12px;">
            <div style="font-size: 15px; line-height: 1.5; font-weight: 600; color: #0f172a; margin: 0 0 6px 0;">${safeTitle || safeCaption}</div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 10px;">${sourceDomain}</div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 34px; height: 34px; border-radius: 999px; background: #f3f4f6; border: 1px solid #e5e7eb; display: inline-flex; align-items: center; justify-content: center;">
                  <img src="${logoUrl}" alt="Astrolounge" style="width: 18px; height: 18px; object-fit: contain;" />
                </span>
                <span style="font-size: 14px; font-weight: 600; color: #0f172a;">Astrolounge</span>
              </div>
              <div style="display: inline-flex; align-items: center; gap: 8px; margin-left: auto; flex-wrap: wrap;">
                <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: #f3f4f6; color: #111827; font-size: 13px; border: 1px solid #e5e7eb;">▲ ${starCount.toLocaleString()}</span>
                <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: #f3f4f6; color: #111827; font-size: 13px; border: 1px solid #e5e7eb;">💬 ${commentCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </article>
      </a>
    `;
  };

  const handleLike = async () => {
    if (!user || !post) return;
    try {
      const res = await apiFetch(`/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Like toggle failed");
      const { liked: nextLiked, count } = await res.json();
      setLiked(nextLiked);
      setStarCount(count);
      safeTrack({
        type: nextLiked ? "post_like" : "post_unlike",
        targetType: "post",
        targetId: String(post.id),
        value: count,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const sharePayload = await buildSharePayload();
    if (!sharePayload) return;

    try {
      const { count } = await sharePost(String(post.id));
      const nextCount = typeof count === "number" ? count : shareCount + 1;
      setShareCount(nextCount);
      safeTrack({
        type: "post_share",
        targetType: "post",
        targetId: String(post.id),
        value: nextCount,
      });
    } catch (err) {
      console.error("Failed to share:", err);
    }

    if (navigator.share) {
      try {
        await navigator.share(sharePayload.shareData);
      } catch {}
    } else {
      try {
        const clipboardImageUrl =
          sharePayload.shareData.files?.length
            ? URL.createObjectURL(sharePayload.shareData.files[0])
            : sharePayload.shareImageUrl;

        const htmlPreview = buildClipboardMarkup(
          sharePayload.postUrl,
          clipboardImageUrl,
        );
        const plaintext = sharePayload.combinedText;

        if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
          await navigator.clipboard.write([
            new ClipboardItem({
              "text/html": new Blob([htmlPreview], { type: "text/html" }),
              "text/plain": new Blob([plaintext], { type: "text/plain" }),
            }),
          ]);
          alert("Link copied with preview!");
        } else {
          await navigator.clipboard.writeText(plaintext);
          alert("Post copied to clipboard!");
        }

        if (clipboardImageUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(clipboardImageUrl);
        }
      } catch {
        prompt("Copy this link to share:", sharePayload.combinedText);
      }
    }
  };

  const handleRepost = async () => {
    if (!user || !post || repostPending) return;

    setRepostPending(true);
    try {
      const data: any = await repostPost(String(post.id));

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
      safeTrack({
        type: "post_repost",
        targetType: "post",
        targetId: String(post.id),
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

  const toggleSave = async () => {
    if (!user || !post) return;
    try {
      if (saved) {
        const { saved: isSaved, count } = await unsavePost(String(post.id));
        setSaved(isSaved);
        setSaveCount(count);
        safeTrack({
          type: "post_unsave",
          targetType: "post",
          targetId: String(post.id),
          value: count,
        });
      } else {
        const { saved: isSaved, count } = await savePostRequest(String(post.id));
        setSaved(isSaved);
        setSaveCount(count);
        safeTrack({
          type: "post_save",
          targetType: "post",
          targetId: String(post.id),
          value: count,
        });
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
    }
  };

  const handleCommentClick = () => {
    const target =
      document.getElementById("post-comments-mobile") ??
      document.getElementById("post-comments-desktop");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    commentsRef.current?.focusEditor();
  };

  const formatK = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`
    : `${n}`;

  if (loading || error || !post) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400">
        {error || "Loading..."}
      </div>
    );
  }

  const imageSources =
    post.images?.filter((src) => src && src.trim().length > 0) ||
    (post.imageUrl ? [post.imageUrl] : []);

  const isOwn = user?.username === post.username;
  const timeSincePost = formatDistanceToNow(new Date(post.timestamp), {
    addSuffix: true,
  });

  /* ---------------------- Render ---------------------- */
  return (
    <div className="relative w-full overflow-x-hidden pt-3 sm:pt-8">
      {/* On mobile it's a single column; on desktop it's a 2-col grid */}
      <PageContainer size="standard" className="lg:h-full lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
        {/* LEFT COLUMN (Post) */}
        <div className="lg:h-full lg:flex lg:flex-col lg:min-w-0">
          <AuroraBorder>
            <div className="relative flex flex-col h-full min-w-0">
              <div className="p-3 sm:p-5 overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={post.avatarUrl ?? "/defaultPfp.png"}
                      alt={post.username}
                      className="w-10 h-10 rounded-full ring-1 ring-white/10 shrink-0"
                    />
                    <Link
                      to={`/users/${post.username}`}
                      className="min-w-0 flex items-center gap-2 hover:text-white transition"
                    >
                      <h3 className="text-sm font-semibold text-gray-100 truncate">
                        @{post.username}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        • {timeSincePost}
                      </span>
                    </Link>
                  </div>

                  <div ref={menuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpen((o) => !o)}
                      className="rounded-full p-2 text-gray-400 hover:text-gray-200"
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-44 rounded-lg border border-white/10 bg-[#0B1220] shadow-xl overflow-hidden" role="menu">
                        <button
                          onClick={toggleSave}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-200 transition hover:bg-white/10"
                          role="menuitem"
                        >
                          {saved ? "Unsave" : "Save"} ({formatK(saveCount)})
                        </button>
                        <div className="mx-2 my-1 h-px bg-white/10" />
                        <button
                          onClick={handleShare}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-200 transition hover:bg-white/10"
                          role="menuitem"
                        >
                          Share ({formatK(shareCount)})
                        </button>
                        {isOwn && (
                          <>
                            <div className="mx-2 my-1 h-px bg-white/10" />
                            <button
                              onClick={() => navigate(-1)}
                              className="block w-full px-4 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/10"
                              role="menuitem"
                            >
                              Delete Post
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0 space-y-2">
                  {post.title && (
                    <h1 className="text-lg font-bold text-gray-100 mb-2 break-words">{post.title}</h1>
                  )}
                  <p className="text-sm text-gray-300 leading-relaxed break-words [overflow-wrap:anywhere]">
                    <span dangerouslySetInnerHTML={{ __html: post.caption }} />
                  </p>
                </div>

                {imageSources.length > 0 && (
                  <div className="rounded-xl overflow-hidden ring-1 ring-white/10 w-full mt-2 sm:mt-4">
                    <img
                      src={imageSources[0]}
                      alt="Post"
                      className="w-full object-cover max-h-[45vh]"
                    />
                  </div>
                )}

                <div className="mt-4">
                  <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={handleLike}
                      aria-label="Star post"
                      className="flex-1 sm:w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs sm:text-sm font-semibold text-white/90 backdrop-blur-lg shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:bg-white/20 transition"
                    >
                      <Star
                        className="w-4 h-4 text-amber-200"
                        fill={user && liked ? "currentColor" : "none"}
                      />
                      <span className="tabular-nums leading-none">{formatK(starCount)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRepost}
                      aria-label="Repost"
                      disabled={repostPending}
                      className="flex-1 sm:w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs sm:text-sm font-semibold text-white/90 backdrop-blur-lg shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:bg-white/20 transition disabled:opacity-60"
                    >
                      <Repeat2 className="w-4 h-4" />
                      <span className="tabular-nums leading-none">{formatK(repostCount)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCommentClick}
                      aria-label="Comments"
                      className="flex-1 sm:w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs sm:text-sm font-semibold text-white/90 backdrop-blur-lg shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:bg-white/20 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="tabular-nums leading-none">{formatK(commentCount)}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </AuroraBorder>

          {/* MOBILE THREAD (stacked under the post) */}
          <div className="mt-4 lg:hidden" id="post-comments-mobile">
            <HomeFeedComments ref={commentsRef} postId={String(post.id)} pageSize={10} />
          </div>
        </div>

        {/* RIGHT COLUMN (desktop thread) */}
        <aside className="hidden lg:flex lg:h-full lg:flex-col lg:min-w-0">
          <div
            id="post-comments-desktop"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl backdrop-saturate-150 shadow-[0_6px_30px_rgba(0,0,0,0.35)] p-4"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <HomeFeedComments ref={commentsRef} postId={String(post.id)} pageSize={10} />
          </div>
        </aside>
      </PageContainer>

    </div>
  );
};

export default PostPage;
