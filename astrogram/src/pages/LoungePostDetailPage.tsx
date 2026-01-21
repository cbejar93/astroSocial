// src/pages/LoungePostDetailPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { apiFetch } from "../lib/api";
import Comments, { type CommentsHandle } from "../components/Comments/Comments";
import { useAuth } from "../hooks/useAuth";
import { MoreVertical, ArrowLeft } from "lucide-react";

/* ---------------------------- Types ---------------------------- */
interface Post {
  id: string;
  title: string;
  caption: string;
  username: string;
  avatarUrl: string;
  timestamp: string;
  authorJoinedAt?: string;
  authorPostCount?: number;
  imageUrl?: string;
  images?: string[];
}

/* ------------------------- Aurora Wrapper ------------------------- */
const AuroraBorder: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <div
    className={[
      "rounded-2xl p-[1px]",
      "bg-[conic-gradient(at_20%_0%,rgba(240,75,179,.25),rgba(90,162,255,.25),rgba(34,197,94,.18),rgba(240,75,179,.25))]",
      "min-w-0",
      className,
    ].join(" ")}
  >
    <div className="rounded-2xl bg-[#0E1626]/80 ring-1 ring-white/10 backdrop-blur-md shadow-[0_16px_60px_rgba(2,6,23,.55)] h-full flex flex-col min-w-0 overflow-hidden">
      {children}
    </div>
  </div>
);

/* ----------------------------- Page ---------------------------- */
const LoungePostDetailPage: React.FC = () => {
  const { loungeName, postId } = useParams<{ loungeName?: string; postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<CommentsHandle>(null);

  /* ---------------------- Fetch Post ---------------------- */
  useEffect(() => {
    if (!postId) return;
    apiFetch(`/posts/${postId}`)
      .then((res) => res.json())
      .then((data) => setPost(data))
      .catch(() => setError("Could not load post."))
      .finally(() => setLoading(false));
  }, [postId]);

  /* ---------------------- Close menu when clicking outside ---------------------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------------------- Back button behavior ---------------------- */
  const handleBack = () => {
    if (loungeName) navigate(`/lounge/${encodeURIComponent(loungeName)}`);
    else if (window.history.length > 1) navigate(-1);
    else navigate("/feed");
  };

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
  const authorJoined = post.authorJoinedAt
    ? formatDistanceToNow(new Date(post.authorJoinedAt), { addSuffix: true })
    : null;

  /* ---------------------- Render ---------------------- */
  return (
    <div className="relative w-full lg:fixed lg:inset-0 lg:h-full overflow-x-hidden">
      <div className="w-full max-w-[var(--page-content-max)] [--page-content-max:72rem] mx-auto px-3 sm:px-4 lg:px-6 lg:h-full">
        <AuroraBorder>
          <div className="flex flex-col min-w-0 rounded-2xl backdrop-blur-xl backdrop-saturate-150 border border-white/10 shadow-[0_6px_30px_rgba(0,0,0,0.35)] bg-white/[0.04]">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-[#0E1626]/60 backdrop-blur-sm rounded-t-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/10 text-gray-200 hover:bg-white/10 transition backdrop-blur-sm bg-black/30"
                  aria-label="Back"
                  title="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-gray-100 tracking-wide truncate">
                    Thread
                  </h2>
                  <p className="text-xs text-gray-400 truncate">{post.title}</p>
                </div>
              </div>

              {isOwn && (
                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="rounded-full p-2 text-gray-400 hover:text-gray-200"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-36 rounded-lg border border-white/10 bg-[#0B1220] shadow-xl overflow-hidden">
                      <button
                        onClick={() => navigate(-1)}
                        className="block w-full px-4 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/10"
                      >
                        Delete Post
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4 sm:gap-6 p-4 sm:p-6">
              <aside className="flex flex-row lg:flex-col gap-4 min-w-0 rounded-xl border border-white/10 bg-[#0E1626]/70 p-4">
                <div className="relative w-14 h-14 flex-none rounded-full overflow-hidden ring-1 ring-white/10">
                  <img
                    src={post.avatarUrl ?? "/defaultPfp.png"}
                    alt={post.username}
                    className="absolute inset-0 w-full h-full object-cover block"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-100 truncate">
                    @{post.username}
                  </h3>
                  <p className="text-xs text-gray-400">Joined {authorJoined ?? "—"}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    Posted {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </aside>

              <section className="min-w-0 space-y-5">
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-gray-100 mb-2 break-words">
                    {post.title}
                  </h1>
                  <p className="text-sm text-gray-300 leading-relaxed break-words [overflow-wrap:anywhere]">
                    <span dangerouslySetInnerHTML={{ __html: post.caption }} />
                  </p>
                </div>

                {imageSources.length > 0 && (
                  <div className="rounded-xl overflow-hidden ring-1 ring-white/10">
                    <img
                      src={imageSources[0]}
                      alt="Post"
                      className="w-full object-cover max-h-[45vh]"
                    />
                  </div>
                )}

                <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-[#0E1626]/60 backdrop-blur-sm">
                  <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-100 tracking-wide">
                      Thread Replies
                    </h2>
                  </div>
                  <div className="px-5 py-4 space-y-4 min-w-0">
                    <div className="min-w-0 max-w-full break-words [overflow-wrap:anywhere] [&_*]:min-w-0 [&_img]:max-w-full [&_img]:h-auto [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:w-full [&_td]:break-words">
                      <Comments ref={commentsRef} postId={post.id} pageSize={10} />
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-white/10 text-xs text-gray-500 text-center">
                    Be kind and respectful in your replies 💬
                  </div>
                </div>
              </section>
            </div>
          </div>
        </AuroraBorder>
      </div>
    </div>
  );
};

export default LoungePostDetailPage;
