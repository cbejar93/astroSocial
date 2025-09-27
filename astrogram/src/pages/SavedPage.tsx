import { useCallback, useEffect, useRef, useState } from 'react';
import PostCard, { type PostCardProps } from '../components/PostCard/PostCard';
import PostSkeleton from '../components/PostCard/PostSkeleton';
import { fetchSavedPosts } from '../lib/api';

const PAGE_SIZE = 20;

const SavedPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(async (nextPage: number) => {
    if (nextPage === 1) {
      setLoading(true);
    }

    setIsFetchingNext(true);

    try {
      const response = await fetchSavedPosts<PostCardProps>(nextPage, PAGE_SIZE);

      setPosts((prev) => {
        if (nextPage === 1) {
          return response.posts;
        }

        const existingIds = new Set(prev.map((post) => post.id));
        const appendedPosts = response.posts.filter(
          (post) => !existingIds.has(post.id),
        );

        return [...prev, ...appendedPosts];
      });

      setPage(nextPage);
      setHasMore(
        response.posts.length > 0 && nextPage * PAGE_SIZE < response.total,
      );
    } catch (error) {
      console.error('Failed to load saved posts', error);
    } finally {
      if (nextPage === 1) {
        setLoading(false);
      }

      setIsFetchingNext(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return () => {};
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isFetchingNext && hasMore) {
          loadPage(page + 1);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadPage, hasMore, isFetchingNext, page]);

  const handleDeleted = useCallback((id: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
  }, []);

  return (
    <div className="w-full py-8 lg:pl-64 flex justify-center">
      <div className="w-full max-w-3xl px-0 sm:px-4 space-y-4">
        <h1 className="text-2xl font-semibold text-white">Saved posts</h1>

        {loading ? (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-neutral-400 py-12">
            You haven't saved any posts yet.
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} {...post} onDeleted={handleDeleted} />
          ))
        )}

        {!loading && posts.length > 0 && (
          <div ref={sentinelRef} className="h-10" aria-hidden="true">
            {isFetchingNext && <PostSkeleton />}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPage;
