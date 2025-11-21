// src/pages/PostPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { apiFetch } from "../lib/api";
import HomeFeedComments, {
  type HomeFeedCommentsHandle,
} from "../components/Comments/HomeFeedComments";
import { useAuth } from "../hooks/useAuth";
import { MoreVertical, ArrowLeft } from "lucide-react";

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

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  /* ---------------------- Back button behavior ---------------------- */
  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
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
  const timeSincePost = formatDistanceToNow(new Date(post.timestamp), {
    addSuffix: true,
  });

  /* ---------------------- Render ---------------------- */
  return (
    <div className="relative w-full flex justify-center lg:fixed lg:inset-0 lg:h-full overflow-x-hidden">
      {/* On mobile it's a single column; on desktop it's a 2-col grid */}
      <div className="w-full max-w-6xl mx-auto px-0 sm:px-3 lg:px-6 lg:h-full lg:grid lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-6">
        {/* LEFT COLUMN (Post) */}
        <div className="lg:h-full lg:flex lg:flex-col lg:justify-center lg:min-w-0">
          <AuroraBorder>
            <div className="relative flex flex-col h-full min-w-0">
              <button
                onClick={handleBack}
                className="hidden sm:inline-flex absolute top-2 left-4 items-center justify-center h-9 w-9 rounded-full border border-white/10 text-gray-200 hover:bg-white/10 transition backdrop-blur-sm bg-black/30"
                aria-label="Back"
                title="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="p-3 sm:p-5 pt-4 sm:pt-6 overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={post.avatarUrl ?? "/defaultPfp.png"}
                      alt={post.username}
                      className="w-10 h-10 rounded-full ring-1 ring-white/10 shrink-0"
                    />
                    <Link
                      to={`/profile/${post.username}`}
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

                <div className="min-w-0 space-y-2">
                  {post.title && (
                    <h1 className="text-lg font-bold text-gray-100 mb-2 break-words">{post.title}</h1>
                  )}
                  <p className="text-sm text-gray-300 leading-relaxed break-words [overflow-wrap:anywhere]">
                    <span dangerouslySetInnerHTML={{ __html: post.caption }} />
                  </p>
                </div>

                {imageSources.length > 0 && (
                  <div className="rounded-xl overflow-hidden ring-1 ring-white/10 w-full mt-4">
                    <img
                      src={imageSources[0]}
                      alt="Post"
                      className="w-full object-cover max-h-[45vh]"
                    />
                  </div>
                )}
              </div>
            </div>
          </AuroraBorder>

          {/* MOBILE THREAD (stacked under the post) */}
          <div className="mt-4 lg:hidden">
            <HomeFeedComments ref={commentsRef} postId={String(post.id)} pageSize={10} />
          </div>
        </div>

        {/* RIGHT COLUMN (desktop thread) */}
        <aside className="hidden lg:flex lg:h-full lg:flex-col lg:justify-center lg:min-w-0">
          <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl backdrop-saturate-150 shadow-[0_6px_30px_rgba(0,0,0,0.35)] p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
            <HomeFeedComments ref={commentsRef} postId={String(post.id)} pageSize={10} />
          </div>
        </aside>
      </div>

    </div>
  );
};

export default PostPage;
