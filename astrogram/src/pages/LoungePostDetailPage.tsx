// src/pages/LoungePostDetailPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { apiFetch } from "../lib/api";
import Comments, { type CommentsHandle } from "../components/Comments/Comments";
import { useAuth } from "../hooks/useAuth";
import {
  MoreVertical,
  Quote,
  Reply,
  Flag,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
// Optional: if you already use the themed comments styles
// import "../styles/comments-theme.css";

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

/* ------------------------- UI Primitives ------------------------ */
const AuroraBorder: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <div
    className={[
      "rounded-2xl p-[1px]",
      "bg-[conic-gradient(at_20%_0%,rgba(240,75,179,.25),rgba(90,162,255,.25),rgba(34,197,94,.18),rgba(240,75,179,.25))]",
      className,
    ].join(" ")}
  >
    <div className="rounded-2xl bg-[#0E1626]/80 ring-1 ring-white/10 backdrop-blur-md shadow-[0_16px_60px_rgba(2,6,23,.55)]">
      {children}
    </div>
  </div>
);

const PillButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode;
    variant?: "primary" | "outline" | "danger";
  }
> = ({ className = "", icon, children, variant = "primary", ...props }) => {
  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition focus:outline-none";
  const styles =
    variant === "primary"
      ? "text-white border-0 bg-[linear-gradient(90deg,#f04bb3,#5aa2ff)] hover:shadow-lg hover:brightness-[1.05]"
      : variant === "danger"
      ? "text-red-300 border border-red-400/30 hover:bg-red-500/10"
      : "text-gray-200 border border-white/10 hover:bg-white/10";
  return (
    <button {...props} className={[base, styles, className].join(" ")}>
      {icon}
      {children}
    </button>
  );
};

const Dot = ({ active }: { active: boolean }) => (
  <span className={["h-2 w-2 rounded-full", active ? "bg-white" : "bg-white/50"].join(" ")} />
);

/* ----------------------------- Page ---------------------------- */
const LoungePostDetailPage: React.FC = () => {
  const { loungeName, postId } = useParams<{ loungeName: string; postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<CommentsHandle>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!postId) return;
    apiFetch(`/posts/${postId}`)
      .then((res) => res.json())
      .then((data) => {
        setPost(data);
        setActiveImageIndex(0);
      })
      .catch(() => setError("Could not load post."))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const imageSources = React.useMemo(() => {
    if (!post) return [] as string[];
    const fromArray = Array.isArray(post.images)
      ? post.images.filter(
          (src): src is string => typeof src === "string" && src.trim().length > 0
        )
      : [];
    if (fromArray.length > 0) return fromArray.slice(0, 4);
    if (post.imageUrl && post.imageUrl.trim().length > 0) return [post.imageUrl];
    return [] as string[];
  }, [post]);

  const goToImage = (index: number) => {
    if (imageSources.length === 0) return;
    const wrapped = (index + imageSources.length) % imageSources.length;
    setActiveImageIndex(wrapped);
  };
  const handlePreviousImage = () => goToImage(activeImageIndex - 1);
  const handleNextImage = () => goToImage(activeImageIndex + 1);

  const handleDelete = async () => {
    if (!post) return;
    setMenuOpen(false);
    try {
      const res = await apiFetch(`/posts/delete/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete post");
      }
      navigate(`/lounge/${encodeURIComponent(loungeName ?? "")}`);
    } catch (err) {
      console.error("Delete post error:", err);
    }
  };

  const handleQuotePost = () => {
    if (!post) return;
    commentsRef.current?.quote({ username: post.username, text: post.caption });
  };
  const handleReplyToPost = () => commentsRef.current?.focusEditor();

  if (loading) {
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="w-full max-w-6xl px-0 sm:px-4">
          <AuroraBorder>
            <div className="p-6 animate-pulse space-y-4">
              <div className="h-6 w-2/3 bg-white/10 rounded"></div>
              <div className="h-4 w-1/3 bg-white/10 rounded"></div>
              <div className="h-64 w-full bg-white/10 rounded-xl"></div>
              <div className="h-4 w-1/2 bg-white/10 rounded"></div>
            </div>
          </AuroraBorder>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="w-full max-w-6xl px-0 sm:px-4">
          <AuroraBorder>
            <div className="p-6 text-sm text-red-300">{error}</div>
          </AuroraBorder>
        </div>
      </div>
    );
  }
  if (!post) {
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="w-full max-w-6xl px-0 sm:px-4">
          <AuroraBorder>
            <div className="p-6 text-sm text-gray-300">Post not found.</div>
          </AuroraBorder>
        </div>
      </div>
    );
  }

  const isOwn = user?.username === post.username;
  const authorJoined = post.authorJoinedAt
    ? formatDistanceToNow(new Date(post.authorJoinedAt), { addSuffix: true })
    : null;
  const encodedAuthorUsername = encodeURIComponent(post.username);

  return (
    <div className="w-full py-8 flex justify-center">
      <div className="w-full max-w-6xl px-0 sm:px-4 space-y-6">
        {/* Back button (icon-only pill) */}
        {loungeName && (
          <div className="flex">
            <Link
              to={`/lounge/${encodeURIComponent(loungeName)}`}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/10 text-gray-200 hover:bg-white/10"
              aria-label="Back"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Layout: Main + Thread to the right */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_30rem] xl:grid-cols-[minmax(0,1fr)_32rem] gap-6 items-start">
          {/* LEFT / MAIN */}
          <div className="lg:sticky lg:top-24 self-start">
            <AuroraBorder>
              <div className="lg:max-h-[calc(100vh-8rem)] overflow-y-auto">
                <article>
                  <div className="flex flex-col md:flex-row">
                    {/* Author side card */}
                    <aside className="md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-[#0E1626]/60 p-6">
                      <div className="text-center">
                        <div className="mx-auto h-20 w-20 rounded-full ring-1 ring-white/10 overflow-hidden">
                          <img
                            src={post.avatarUrl ?? "/defaultPfp.png"}
                            alt={`${post.username} avatar`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <Link
                          to={`/users/${encodedAuthorUsername}/posts`}
                          className="mt-3 inline-block text-sm font-semibold text-sky-300 hover:underline"
                        >
                          @{post.username}
                        </Link>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-gray-300">
                          <div className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-2">
                            <div className="text-gray-400">Joined</div>
                            <div className="font-semibold text-gray-100">
                              {authorJoined ?? "—"}
                            </div>
                          </div>
                          <div className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-2">
                            <div className="text-gray-400">Posts</div>
                            <div className="font-semibold text-gray-100">
                              {post.authorPostCount ?? 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    </aside>

                    {/* Content */}
                    <div className="flex-1">
                      {/* Header */}
                      <section className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-gray-100">
                              {post.title}
                            </h1>
                            <p className="text-xs text-gray-400">
                              Posted{" "}
                              {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                            </p>
                          </div>

                          {isOwn && (
                            <div ref={menuRef} className="relative">
                              <button
                                type="button"
                                onClick={() => setMenuOpen((o) => !o)}
                                className="rounded-full p-2 text-gray-400 transition hover:text-gray-200"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              {menuOpen && (
                                <div className="absolute right-0 mt-2 w-36 rounded-lg border border-white/10 bg-[#0B1220] shadow-xl overflow-hidden">
                                  <button
                                    onClick={handleDelete}
                                    className="block w-full px-4 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/10"
                                  >
                                    Delete Post
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Caption ABOVE media (like your mock) */}
                      <section className="px-6 -mt-2">
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {/* Render the HTML caption as plain text feel:
                              If your caption uses HTML, keep the next block instead:
                          */}
                          <span dangerouslySetInnerHTML={{ __html: post.caption }} />
                        </p>
                      </section>

                      <div className="h-px bg-white/10 mx-6 my-4" />

                      {/* Media (big, rounded, soft shadow) */}
                      {imageSources.length > 0 && (
                        <section className="px-6 pb-2 space-y-3">
                          <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10 bg-black/40 shadow-xl">
                            <img
                              src={imageSources[activeImageIndex]}
                              alt={`Lounge post image ${activeImageIndex + 1} of ${imageSources.length}`}
                              className="w-full object-cover max-h-[62vh] lg:max-h-[calc(100vh-16rem)]"
                              loading="lazy"
                            />
                            {imageSources.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={handlePreviousImage}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-gray-100 transition hover:bg-black/80"
                                  aria-label="Previous image"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleNextImage}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-gray-100 transition hover:bg-black/80"
                                  aria-label="Next image"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                                  {imageSources.map((_, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => goToImage(idx)}
                                      aria-label={`Go to image ${idx + 1}`}
                                      aria-current={idx === activeImageIndex}
                                      className="focus:outline-none focus:ring-2 focus:ring-white/40 rounded-full"
                                    >
                                      <Dot active={idx === activeImageIndex} />
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          {imageSources.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                              {imageSources.map((src, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => goToImage(idx)}
                                  className={[
                                    "overflow-hidden rounded-lg border transition focus:outline-none",
                                    idx === activeImageIndex
                                      ? "border-sky-400 ring-2 ring-sky-400/50"
                                      : "border-white/10 hover:border-white/30",
                                  ].join(" ")}
                                  aria-label={`Select image ${idx + 1}`}
                                >
                                  <img
                                    src={src}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="h-20 w-full object-cover"
                                    loading="lazy"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </section>
                      )}

                      {/* Action row like in mock (Quote / Reply / Report) */}
                      <section className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <PillButton variant="primary" onClick={handleQuotePost} icon={<Quote className="h-4 w-4" />}>
                            Quote
                          </PillButton>
                          <PillButton variant="primary" onClick={handleReplyToPost} icon={<Reply className="h-4 w-4" />}>
                            Reply
                          </PillButton>
                          <PillButton variant="outline" icon={<Flag className="h-4 w-4" />}>
                            Report
                          </PillButton>
                        </div>
                      </section>
                    </div>
                  </div>
                </article>
              </div>
            </AuroraBorder>
          </div>

          {/* RIGHT / THREAD (glass panel, “Thread Replies” header) */}
          <div className="lg:sticky lg:top-24 self-start">
            <AuroraBorder>
              <div className="p-4 sm:p-5">
                <div className="mb-3 rounded-xl bg-white/[0.03] ring-1 ring-white/10 px-4 py-2">
                  <h2 className="text-sm font-semibold text-gray-100">Thread Replies</h2>
                </div>
                <div className="lg:max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 rounded-xl">
                  {/* If you themed your Comments component, keep this wrapper class (no green) */}
                  <div className="comments-accent">
                    <Comments ref={commentsRef} postId={post.id} pageSize={10} />
                  </div>
                </div>
              </div>
            </AuroraBorder>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoungePostDetailPage;
