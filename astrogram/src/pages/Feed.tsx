import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard/PostCard";
import PostSkeleton from "../components/PostCard/PostSkeleton";
import { fetchFeed, search, type SearchResponse } from "../lib/api";
import type { PostCardProps } from "../components/PostCard/PostCard";

const PAGE_SIZE = 20;

// Toggle these if you have a fixed top navbar (~64px tall):
const NAV_PUSH_CLASS = "pt-0";    // change to "pt-16" if your nav is fixed
const STICKY_TOP_CLASS = "top-0"; // change to "top-16" to sit right under a fixed nav

const Feed: React.FC = () => {
  // ---- FEED STATE ----
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ---- SEARCH STATE ----
  const [query, setQuery] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function performSearch(newPage: number) {
    if (!query.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const data = await search(query, newPage);
      setResults(data);
      setSearchPage(newPage);
    } catch (err) {
      setSearchError((err as Error).message);
      setResults(null);
    } finally {
      setSearchLoading(false);
    }
  }

  const onSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await performSearch(1);
  };

  const hasSearchResults =
    !!results &&
    (((results.users?.results.length ?? 0) > 0) ||
      ((results.lounges?.results.length ?? 0) > 0));

  const hasPrev = searchPage > 1;
  const hasNext =
    !!results &&
    (((results.users &&
      results.users.total > results.users.page * results.users.limit) ||
      (results.lounges &&
        results.lounges.total >
          results.lounges.page * results.lounges.limit)));

  // ---- FEED LOGIC ----
  const loadPage = useCallback(async (nextPage: number) => {
    if (nextPage === 1) setLoading(true);
    setIsFetchingNext(true);

    try {
      const response = await fetchFeed<PostCardProps>(nextPage, PAGE_SIZE);

      setPosts((prev) => {
        if (nextPage === 1) return response.posts;
        const existingIds = new Set(prev.map((post) => post.id));
        const appendedPosts = response.posts.filter((post) => !existingIds.has(post.id));
        return [...prev, ...appendedPosts];
      });

      setPage(nextPage);
      setHasMore(response.posts.length > 0 && nextPage * PAGE_SIZE < response.total);
    } catch (error) {
      console.error(error);
    } finally {
      if (nextPage === 1) setLoading(false);
      setIsFetchingNext(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMore && !isFetchingNext) {
        loadPage(page + 1);
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetchingNext, loadPage, page]);

  return (
    <div className={`w-full ${NAV_PUSH_CLASS} pb-0 flex justify-center`}>
      <div className="w-full max-w-3xl px-0 sm:px-4">
        {/* Sticky search header (solid background prevents posts showing behind) */}
        <div className={`sticky ${STICKY_TOP_CLASS} z-30 bg-[#0A0F1F] border-b border-white/10`}>
          {/* NEW: inner padding wrapper for left/right spacing */}
          <div className="px-2 sm:px-4">
            <form onSubmit={onSearchSubmit} className="flex gap-2 py-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users & lounges…"
                className="flex-grow rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 px-3 py-1.5 text-xs sm:py-2 sm:text-sm"
                aria-label="Search"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#f04bb3] to-[#5aa2ff] px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap shadow-[0_12px_28px_rgba(15,23,42,0.45)] ring-1 ring-white/20 transition hover:brightness-110 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70 sm:px-4 sm:py-2 sm:text-sm"
                disabled={searchLoading}
              >
                {searchLoading ? "Searching…" : "Search"}
              </button>

              {results && (
                <button
                  type="button"
                  onClick={() => setResults(null)}
                  className="px-3 py-1.5 text-xs sm:py-2 sm:text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-gray-100"
                  title="Clear results"
                >
                  Clear
                </button>
              )}
            </form>

            {searchLoading && <p className="mt-1 text-sm text-gray-300">Loading…</p>}
            {searchError && <p className="mt-1 text-sm text-red-500">{searchError}</p>}

            {results && (
              <div className="mt-2 rounded-2xl border border-white/10 bg-[#0E1626] text-white p-4">
                {hasSearchResults ? (
                  <div className="space-y-6">
                    {results.users?.results.length ? (
                      <div>
                        <h2 className="text-base font-semibold mb-2">Users</h2>
                        <ul className="space-y-2">
                          {results.users.results.map((u) => (
                            <li key={u.id} className="flex items-center gap-2">
                              <img
                                src={u.avatarUrl ?? "/defaultPfp.png"}
                                alt={u.username ?? "user"}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <span className="text-sm">@{u.username}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {results.lounges?.results.length ? (
                      <div>
                        <h2 className="text-base font-semibold mb-2">Lounges</h2>
                        <ul className="space-y-2">
                          {results.lounges.results.map((l) => (
                            <li key={l.id} className="flex items-center gap-2">
                              {l.bannerUrl && (
                                <img
                                  src={l.bannerUrl}
                                  alt={l.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <Link
                                to={`/lounge/${encodeURIComponent(l.name)}`}
                                className="text-sm text-sky-300 hover:underline"
                              >
                                {l.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {(hasPrev || hasNext) && (
                      <div className="flex justify-between pt-1">
                        <button
                          onClick={() => performSearch(searchPage - 1)}
                          disabled={!hasPrev || searchLoading}
                          className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => performSearch(searchPage + 1)}
                          disabled={!hasNext || searchLoading}
                          className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  !searchLoading && <p className="text-sm text-gray-300">No results found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Space between the sticky search and posts */}
        <div className="h-4" />

        {/* Feed list */}
        <div className="w-full max-w-3xl space-y-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
            : (
              <>
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="animate-fadeIn cursor-pointer"
                    onClick={() => navigate(`/posts/${post.id}`)}
                  >
                    <PostCard
                      {...post}
                      onDeleted={(id) => setPosts((ps) => ps.filter((p) => p.id !== id))}
                    />
                  </div>
                ))}
                <div ref={sentinelRef} />
                {isFetchingNext && (
                  <div className="py-4 text-center text-sm text-gray-500">
                    Loading more...
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default Feed;
