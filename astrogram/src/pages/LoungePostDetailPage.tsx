import React, { useEffect, useState, useRef } from "react";
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
      .then(res => res.json())
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

  const imageSources = React.useMemo(() => {
    if (!post) return [] as string[];

    const fromArray = Array.isArray(post.images)
      ? post.images.filter((src): src is string => typeof src === "string" && src.trim().length > 0)
      : [];

    if (fromArray.length > 0) {
      return fromArray.slice(0, 4);
    }

    if (post.imageUrl && typeof post.imageUrl === "string" && post.imageUrl.trim().length > 0) {
      return [post.imageUrl];
    }

    return [] as string[];
  }, [post]);

  if (loading)
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="w-full max-w-3xl px-0 sm:px-4">Loading...</div>
      </div>
    );
  if (error)
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="w-full max-w-3xl px-0 sm:px-4">{error}</div>
      </div>
    );
  if (!post)
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="w-full max-w-3xl px-0 sm:px-4">Post not found.</div>
      </div>
    );

  const isOwn = user?.username === post.username;

  const authorJoined = post.authorJoinedAt
    ? formatDistanceToNow(new Date(post.authorJoinedAt), { addSuffix: true })
    : null;
  const encodedAuthorUsername = encodeURIComponent(post.username);

  const handleQuotePost = () => {
    if (!post) return;
    commentsRef.current?.quote({
      username: post.username,
      text: post.caption,
    });
  };

  const handleReplyToPost = () => {
    commentsRef.current?.focusEditor();
  };

  const goToImage = (index: number) => {
    if (imageSources.length === 0) return;
    const wrapped = (index + imageSources.length) % imageSources.length;
    setActiveImageIndex(wrapped);
  };

  const handlePreviousImage = () => {
    goToImage(activeImageIndex - 1);
  };

  const handleNextImage = () => {
    goToImage(activeImageIndex + 1);
  };

  return (
    <div className="w-full py-8 flex justify-center">
      <div className="w-full max-w-3xl px-0 sm:px-4 space-y-8">
        {loungeName && (
          <div className="flex">
            <Link
              to={`/lounge/${encodeURIComponent(loungeName)}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {loungeName}
            </Link>
          </div>
        )}
        <article className="rounded-2xl border border-white/10 bg-gray-950/80 shadow-2xl backdrop-blur">
          <div className="flex flex-col md:flex-row">
            <aside className="md:w-60 border-b md:border-b-0 md:border-r border-white/10 bg-gray-950/60 p-5 text-center">
              <img
                src={post.avatarUrl ?? '/defaultPfp.png'}
                alt={`${post.username} avatar`}
                className="mx-auto h-20 w-20 rounded-full object-cover"
              />
              <Link
                to={`/users/${encodedAuthorUsername}/posts`}
                className="mt-3 block text-sm font-semibold text-teal-400 hover:underline"
              >
                @{post.username}
              </Link>
              <div className="mt-4 space-y-2 text-xs text-gray-400">
                <div>
                  Joined{' '}
                  <span className="font-semibold text-gray-200">
                    {authorJoined ?? '—'}
                  </span>
                </div>
                <div>
                  Posts{' '}
                  <span className="font-semibold text-gray-200">
                    {post.authorPostCount ?? 0}
                  </span>
                </div>
              </div>
            </aside>
            <div className="flex-1 p-6 space-y-6">
              <header className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-100">{post.title}</h1>
                    <p className="text-xs text-gray-400">
                      Posted {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
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
                        <div className="absolute right-0 mt-2 w-36 rounded-lg border border-white/10 bg-gray-900 shadow-lg">
                          <button
                            onClick={handleDelete}
                            className="block w-full px-4 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                          >
                            Delete Post
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleQuotePost}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-white/10"
                  >
                    <Quote className="h-4 w-4" /> Quote
                  </button>
                  <button
                    type="button"
                    onClick={handleReplyToPost}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-white/10"
                  >
                    <Reply className="h-4 w-4" /> Reply
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-white/10"
                  >
                    <Flag className="h-4 w-4" /> Report
                  </button>
                </div>
              </header>
              {imageSources.length > 0 && (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/50">
                    <img
                      src={imageSources[activeImageIndex]}
                      alt={`Lounge post image ${activeImageIndex + 1} of ${imageSources.length}`}
                      className="h-full w-full max-h-[28rem] object-cover"
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
                        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                          {imageSources.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => goToImage(idx)}
                              className={`h-2 w-2 rounded-full transition ${
                                idx === activeImageIndex ? "bg-white" : "bg-white/50"
                              }`}
                              aria-label={`Go to image ${idx + 1}`}
                              aria-current={idx === activeImageIndex}
                            />
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
                          className={`overflow-hidden rounded-xl border transition ${
                            idx === activeImageIndex
                              ? "border-teal-400 ring-2 ring-teal-400/50"
                              : "border-white/10 hover:border-white/30"
                          }`}
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
                </div>
              )}
              <div
                className="prose prose-invert max-w-none text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.caption }}
              />
            </div>
          </div>
        </article>
        <Comments ref={commentsRef} postId={post.id} pageSize={10} />
      </div>
    </div>
  );
};

export default LoungePostDetailPage;
