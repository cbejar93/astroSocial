// src/pages/SavedPage.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import PostCard, { type PostCardProps } from "../components/PostCard/PostCard";
import PostSkeleton from "../components/PostCard/PostSkeleton";
import { fetchSavedPosts } from "../lib/api";

const PAGE_SIZE = 20;

const SavedPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(async (nextPage: number) => {
    if (nextPage === 1) setLoading(true);
    setIsFetchingNext(true);

    try {
      const response = await fetchSavedPosts<PostCardProps>(nextPage, PAGE_SIZE);

      setPosts((prev) => {
        if (nextPage === 1) return response.posts;
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...response.posts.filter((p) => !ids.has(p.id))];
      });

      setTotal(response.total ?? null);
      setPage(nextPage);
      setHasMore(response.posts.length > 0 && nextPage * PAGE_SIZE < response.total);
    } catch (err) {
      console.error("Failed to load saved posts", err);
    } finally {
      if (nextPage === 1) setLoading(false);
      setIsFetchingNext(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNext && hasMore) {
          loadPage(page + 1);
        }
      },
      { threshold: 0.1, rootMargin: "200px 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [loadPage, hasMore, isFetchingNext, page]);

  const handleDeleted = useCallback((id: string | number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setTotal((t) => (typeof t === "number" ? Math.max(0, t - 1) : t));
  }, []);

  const handleSavedChange = useCallback(
    (id: string | number, saved: boolean) => {
      if (!saved) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        setTotal((t) => (typeof t === "number" ? Math.max(0, t - 1) : t));
      }
    },
    []
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[var(--desktop-nav-current-width)_minmax(0,1fr)_var(--desktop-nav-current-width)]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:col-start-2">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400/90" />
            <span className="text-xs font-medium text-slate-200">Saved</span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <h1 className="text-2xl font-semibold text-slate-100">Saved posts</h1>
            {typeof total === "number" && (
              <span className="text-sm text-slate-400">{total} total</span>
            )}
          </div>
          <div className="mt-2 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-neutral-400/90 py-16">
            <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-white/5 ring-1 ring-white/10" />
            <p className="text-sm">You haven&apos;t saved any posts yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                {...post}
                onDeleted={handleDeleted}
                onSavedChange={handleSavedChange}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {!loading && posts.length > 0 && (
          <div ref={sentinelRef} className="h-16 flex items-center justify-center">
            {isFetchingNext && (
              <div className="w-full">
                <PostSkeleton />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPage;
