// src/pages/Feed.tsx
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard/PostCard";
import PostSkeleton from "../components/PostCard/PostSkeleton";
import {
  fetchFeed,
  search,
  type SearchResponse,
  apiFetch,
  fetchMyPosts,
  fetchMyComments,
  toggleCommentLike,
} from "../lib/api";
import type { PostCardProps } from "../components/PostCard/PostCard";
import { UploadCloud, Image as ImageIcon, X, Star, Search as SearchIcon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { trackEvent } from "../lib/analytics";

const PAGE_SIZE = 20;
// If you have a fixed top navbar (~64px), switch these:
// const NAV_PUSH_CLASS = "pt-16";
// const STICKY_TOP_CLASS = "top-16";
const NAV_PUSH_CLASS = "pt-0";
const STICKY_TOP_CLASS = "top-0";

/* =========================================
   Hook: only render the right panel on desktop
   ========================================= */
function useIsDesktop(minWidth = 1024) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

    // initial
    setIsDesktop(mql.matches);

    // add listener (modern + fallback)
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addListener(handler);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, [minWidth]);

  return isDesktop;
}

/* =========================
   Types (right panel)
   ========================= */
interface CommentItem {
  id: string;
  text: string;
  authorId: string;
  username: string;
  avatarUrl: string;
  timestamp: string;
  likes: number;
  likedByMe?: boolean;
}
interface MyPost extends PostCardProps {
  loungeId?: string;
  loungeName?: string;
  title?: string;
}

/* =========================================================
   RIGHT SIDEBAR: Profile + Tabs (desktop only, Instagram-ish)
   ========================================================= */
const RightProfilePanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");
  const [postSubTab, setPostSubTab] = useState<"all" | "posts" | "lounges">(
    "all"
  );

  // data
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  // UI state
  const [showMorePosts, setShowMorePosts] = useState(false);
  const [showMoreLounge, setShowMoreLounge] = useState(false);
  const [openLoungeGroups, setOpenLoungeGroups] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    let mounted = true;

    fetchMyPosts<MyPost>()
      .then((data) => {
        if (mounted) setMyPosts(data ?? []);
      })
      .finally(() => mounted && setLoadingPosts(false));

    fetchMyComments<CommentItem>()
      .then((data) => {
        if (mounted) setComments(data ?? []);
      })
      .finally(() => mounted && setLoadingComments(false));

    return () => {
      mounted = false;
    };
  }, []);

  if (!user) return null;

  const trackers = user.followers?.length ?? 0;
  const tracking = user.following?.length ?? 0;
  const username = user.username ?? "user";

  const generalPosts = useMemo(
    () => myPosts.filter((p) => !p.loungeId),
    [myPosts]
  );
  const loungePosts = useMemo(
    () => myPosts.filter((p) => p.loungeId),
    [myPosts]
  );

  const loungeGroups = useMemo(() => {
    const map = new Map<string, MyPost[]>();
    for (const p of loungePosts) {
      const name = p.loungeName ?? "Unknown";
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [loungePosts]);

  const toggleGroup = (name: string) =>
    setOpenLoungeGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  // tiny regular post (reuses PostCard, scaled)
  const TinyPost: React.FC<{ post: MyPost }> = ({ post }) => (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-gray-900/30 hover:bg-gray-900/50 transition">
      <div
        className="transform scale-[0.92] origin-top-left"
        onClick={() => navigate(`/posts/${post.id}`)}
      >
        <PostCard
          {...post}
          onDeleted={(id) => setMyPosts((ps) => ps.filter((p) => p.id !== id))}
        />
      </div>
    </div>
  );

  // compact lounge post row
  const LoungeRow: React.FC<{ post: MyPost }> = ({ post }) => (
    <div
      className="rounded-lg border border-white/10 bg-gray-900/30 hover:bg-gray-900/50 transition cursor-pointer p-3"
      onClick={() =>
        navigate(
          `/lounge/${encodeURIComponent(post.loungeName ?? "")}/posts/${post.id}`
        )
      }
    >
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <img
          src={post.avatarUrl ?? "/defaultPfp.png"}
          alt={`${post.username} avatar`}
          className="w-6 h-6 rounded-full object-cover"
        />
        <span className="font-medium text-gray-200">{post.username}</span>
        <span>•</span>
        <span>
          {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
        </span>
      </div>
      {post.title && (
        <div className="mt-1 text-sm font-semibold text-gray-100 line-clamp-2">
          {post.title}
        </div>
      )}
      {"body" in post && (post as any).body && (
        <div className="text-xs text-gray-300 line-clamp-2 mt-1">
          {(post as any).body}
        </div>
      )}
      <div className="mt-1 text-xs text-gray-400">{post.comments} replies</div>
    </div>
  );

  const handleToggleLike = async (id: string) => {
    try {
      const { liked, count } = await toggleCommentLike(id);
      setComments((cs) =>
        cs.map((c) => (c.id === id ? { ...c, likes: count, likedByMe: liked } : c))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const postsCount = generalPosts.length;
  const loungesCount = loungePosts.length;
  const allCount = postsCount + loungesCount;

  return (
    <aside className={`hidden lg:block sticky ${STICKY_TOP_CLASS} z-20`}>
      <div className="rounded-2xl border border-white/10 bg-[#0E1626] text-white overflow-hidden shadow-[0_8px_28px_rgba(2,6,23,0.45)]">
        {/* Banner */}
        <div className="h-20 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(240,75,179,0.35),transparent),radial-gradient(120%_80%_at_90%_10%,rgba(90,162,255,0.35),transparent)]" />
        {/* Header */}
        <div className="px-4 pb-4">
          <div className="-mt-8">
            <img
              src={user.avatarUrl ?? "/defaultPfp.png"}
              alt="avatar"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white/30"
            />
          </div>

          <div className="mt-3">
            <div className="text-lg font-semibold">{username}</div>
            <div className="text-sm text-sky-300">@{username}</div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
              <div className="text-xs text-gray-400">Trackers</div>
              <div className="text-lg font-bold">{trackers.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
              <div className="text-xs text-gray-400">Tracking</div>
              <div className="text-lg font-bold">{tracking.toLocaleString()}</div>
            </div>
          </div>

          {/* Primary Tabs */}
          <div className="mt-4 grid grid-cols-2 rounded-lg border border-white/10 p-1 bg-gray-900/40">
            <button
              onClick={() => setActiveTab("posts")}
              className={`py-1.5 rounded-md text-sm ${
                activeTab === "posts"
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800/50"
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`py-1.5 rounded-md text-sm ${
                activeTab === "comments"
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800/50"
              }`}
            >
              Comments
            </button>
          </div>

          {/* Content */}
          <div className="mt-3 space-y-3">
            {activeTab === "posts" ? (
              <>
                {/* Sub-tabs for categorization */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setPostSubTab("all")}
                    className={`px-2.5 py-1 rounded-md border ${
                      postSubTab === "all"
                        ? "border-white/20 bg-gray-800 text-white"
                        : "border-white/10 text-gray-300 hover:bg-gray-800/40"
                    }`}
                  >
                    All <span className="ml-1 text-[10px] opacity-75">({allCount})</span>
                  </button>
                  <button
                    onClick={() => setPostSubTab("posts")}
                    className={`px-2.5 py-1 rounded-md border ${
                      postSubTab === "posts"
                        ? "border-white/20 bg-gray-800 text-white"
                        : "border-white/10 text-gray-300 hover:bg-gray-800/40"
                    }`}
                  >
                    Posts{" "}
                    <span className="ml-1 text-[10px] opacity-75">({postsCount})</span>
                  </button>
                  <button
                    onClick={() => setPostSubTab("lounges")}
                    className={`px-2.5 py-1 rounded-md border ${
                      postSubTab === "lounges"
                        ? "border-white/20 bg-gray-800 text-white"
                        : "border-white/10 text-gray-300 hover:bg-gray-800/40"
                    }`}
                  >
                    Lounges{" "}
                    <span className="ml-1 text-[10px] opacity-75">({loungesCount})</span>
                  </button>
                </div>

                {/* ALL: Your Posts + Lounge Posts sections with show more/less */}
                {postSubTab === "all" && (
                  <>
                    <section className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs uppercase tracking-wide text-gray-400">
                          Your Posts
                        </h4>
                        {postsCount > 3 && (
                          <button
                            className="text-xs text-sky-300 hover:underline"
                            onClick={() => setShowMorePosts((s) => !s)}
                          >
                            {showMorePosts ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>
                      {loadingPosts ? (
                        <div className="text-sm text-gray-400">Loading…</div>
                      ) : postsCount === 0 ? (
                        <div className="text-sm text-gray-400">No posts yet.</div>
                      ) : (
                        (showMorePosts ? generalPosts : generalPosts.slice(0, 3)).map((p) => (
                          <TinyPost key={p.id} post={p} />
                        ))
                      )}
                    </section>

                    <section className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs uppercase tracking-wide text-gray-400">
                          Lounge Posts
                        </h4>
                        {loungesCount > 3 && (
                          <button
                            className="text-xs text-sky-300 hover:underline"
                            onClick={() => setShowMoreLounge((s) => !s)}
                          >
                            {showMoreLounge ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>
                      {loadingPosts ? (
                        <div className="text-sm text-gray-400">Loading…</div>
                      ) : loungesCount === 0 ? (
                        <div className="text-sm text-gray-400">No lounge posts yet.</div>
                      ) : (
                        (showMoreLounge ? loungePosts : loungePosts.slice(0, 3)).map((p) => (
                          <LoungeRow key={p.id} post={p} />
                        ))
                      )}
                    </section>
                  </>
                )}

                {/* POSTS only */}
                {postSubTab === "posts" && (
                  <section className="space-y-2">
                    {loadingPosts ? (
                      <div className="text-sm text-gray-400">Loading…</div>
                    ) : postsCount === 0 ? (
                      <div className="text-sm text-gray-400">No posts yet.</div>
                    ) : (
                      generalPosts.map((p) => <TinyPost key={p.id} post={p} />)
                    )}
                  </section>
                )}

                {/* LOUNGES only — grouped by lounge with accordions */}
                {postSubTab === "lounges" && (
                  <section className="space-y-2">
                    {loadingPosts ? (
                      <div className="text-sm text-gray-400">Loading…</div>
                    ) : loungeGroups.length === 0 ? (
                      <div className="text-sm text-gray-400">No lounge posts yet.</div>
                    ) : (
                      loungeGroups.map(([name, posts]) => {
                        const open = openLoungeGroups.has(name);
                        return (
                          <div key={name} className="rounded-xl border border-white/10">
                            <button
                              type="button"
                              onClick={() => toggleGroup(name)}
                              className="w-full flex items-center justify-between px-3 py-2 bg-gray-900/40 hover:bg-gray-900/60"
                            >
                              <span className="text-sm font-medium">{name}</span>
                              <span className="text-xs text-gray-400">{posts.length}</span>
                            </button>
                            {open && (
                              <div className="p-2 space-y-2">
                                {posts.map((p) => (
                                  <LoungeRow key={p.id} post={p} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </section>
                )}
              </>
            ) : (
              // COMMENTS tab
              <section className="space-y-3">
                {loadingComments ? (
                  <div className="text-sm text-gray-400">Loading…</div>
                ) : comments.length === 0 ? (
                  <div className="text-sm text-gray-400">No comments yet.</div>
                ) : (
                  comments.slice(0, 8).map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-white/10 bg-gray-900/30 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <img
                          src={c.avatarUrl ?? "/defaultPfp.png"}
                          alt="avatar"
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="text-xs text-gray-400">
                            <span className="font-medium text-gray-200">@{c.username}</span>{" "}
                            • {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                          </div>
                          <div className="text-sm text-gray-100 mt-1">{c.text}</div>
                          <div className="mt-2 text-xs text-gray-400 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleLike(c.id)}
                              className={`inline-flex items-center gap-1 ${
                                c.likedByMe ? "text-white" : "text-gray-300"
                              } hover:text-white`}
                              title={c.likedByMe ? "Unlike" : "Like"}
                            >
                              <Star
                                className="w-4 h-4"
                                fill={c.likedByMe ? "currentColor" : "none"}
                              />
                              <span>{c.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

/* =========================
   Sticky Post Composer (left column)
   ========================= */
const PostComposer: React.FC<{ onPosted: () => void }> = ({ onPosted }) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captionError, setCaptionError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && !f.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const onClearImage = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!caption.trim()) {
      setCaptionError("Caption is required");
      return;
    }
    setCaptionError(null);
    setError(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("body", caption);
      if (file) form.append("image", file);

      const res = await apiFetch("/posts", { method: "POST", body: form });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      const data = await res.json().catch(() => null);
      try {
        await trackEvent?.({
          type: "post_upload",
          targetType: "post",
          targetId: data?.id,
          metadata: { hasImage: Boolean(file) },
        });
      } catch {}

      // reset and refresh feed
      setCaption("");
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      onPosted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <form
      onSubmit={onSubmit}
      className="mt-2 rounded-2xl border border-white/10 bg-[#0E1626]/95 text-white p-3 sm:p-4 shadow-[0_8px_28px_rgba(2,6,23,0.45)]"
      aria-label="Create post"
    >
      {/* Top row: avatar + input */}
      <div className="flex items-start gap-3">
        <img
          src={user.avatarUrl ?? "/defaultPfp.png"}
          alt="Your avatar"
          className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20"
        />
        <div className="flex-1">
          <textarea
            rows={2}
            placeholder={`What's on your mind${user.username ? `, @${user.username}` : ""}?`}
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              if (captionError && e.target.value.trim()) setCaptionError(null);
            }}
            className="w-full resize-y rounded-lg bg-gray-800/70 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 px-3 py-2 text-sm"
          />
          {captionError && (
            <p className="mt-1 text-xs text-red-400">{captionError}</p>
          )}

          {/* Image preview */}
          {preview && (
            <div className="mt-3 relative inline-block">
              <img
                src={preview}
                alt="preview"
                className="max-h-52 rounded-lg object-cover border border-white/10"
              />
              <button
                type="button"
                onClick={onClearImage}
                className="absolute -top-2 -right-2 inline-flex items-center justify-center rounded-full bg-gray-800/90 hover:bg-gray-700 p-1 shadow ring-1 ring-white/20"
                aria-label="Remove image"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            {/* Image picker */}
            <label
              htmlFor="composer-image"
              className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-white/10 bg-gray-800/70 hover:bg-gray-700/70 px-3 py-1.5 text-xs sm:text-sm"
              title="Add image"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{file ? "Change image" : "Add image"}</span>
              <input
                id="composer-image"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onFileChange}
              />
            </label>

            <div className="ml-auto" />

            {/* Post button */}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#f04bb3] to-[#5aa2ff] px-4 py-1.5 text-xs sm:text-sm font-semibold text-white whitespace-nowrap shadow-[0_12px_28px_rgba(15,23,42,0.45)] ring-1 ring-white/20 transition hover:brightness-110 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70"
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <UploadCloud className="w-4 h-4 animate-pulse" />
                  <span className="ml-2">Posting…</span>
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <UploadCloud className="w-4 h-4" />
                  <span className="ml-2">Post</span>
                </span>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-2 rounded-md bg-red-600/90 px-3 py-2 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

/* =========================
   Feed (two columns on lg+: Feed + Right Profile)
   ========================= */
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
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // header scroll effect
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Quick focus shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      const isSlash = e.key === "/";
      if (isCmdK || isSlash) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Layout knowledge
  const isDesktop = useIsDesktop(); // ← only render right panel when true
  const { user } = useAuth();       // ← know if signed in
  const showRightPanel = isDesktop && !!user; // ← only show & allocate space when signed in

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
      {/* Container width depends on whether right panel is shown */}
      <div className={`w-full ${showRightPanel ? "max-w-6xl" : "max-w-3xl"} px-0 sm:px-4 lg:px-6`}>
        {/* Desktop: two columns ONLY when right panel is shown; otherwise single column centered */}
        <div className={showRightPanel ? "lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6" : ""}>
          {/* LEFT COLUMN */}
          <div className="min-w-0">
            {/* Sticky search header */}
            <div
              className={`sticky ${STICKY_TOP_CLASS} z-30 border-b border-white/10 transition-shadow ${
                scrolled ? "shadow-[0_8px_28px_rgba(2,6,23,0.35)]" : "shadow-none"
              } bg-[#101828]/90 backdrop-blur-xl`}
            >
              {/* subtle background glow */}
              <div className="pointer-events-none select-none absolute inset-0 opacity-[0.35] bg-[radial-gradient(90%_60%_at_20%_0%,rgba(240,75,179,0.18),transparent),radial-gradient(90%_60%_at_90%_10%,rgba(90,162,255,0.18),transparent)]" />

              <div className="relative px-2 sm:px-4">
                {/* SEARCH */}
                <form onSubmit={onSearchSubmit} className="flex gap-2 py-2">
                  <div className="relative flex-1">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search users & lounges…  ( /  or  ⌘K / Ctrl+K )"
                      className="w-full pl-9 pr-3 rounded-lg bg-gray-800/80 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 px-3 py-2 text-sm"
                      aria-label="Search"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#f04bb3] to-[#5aa2ff] px-4 py-2 text-sm font-semibold text-white whitespace-nowrap shadow-[0_12px_28px_rgba(15,23,42,0.45)] ring-1 ring-white/20 transition hover:brightness-110 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70"
                    disabled={searchLoading}
                  >
                    {searchLoading ? "Searching…" : "Search"}
                  </button>

                  {results && (
                    <button
                      type="button"
                      onClick={() => setResults(null)}
                      className="px-3 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-gray-100"
                      title="Clear results"
                    >
                      Clear
                    </button>
                  )}
                </form>

                {searchLoading && <p className="mt-1 text-sm text-gray-300">Loading…</p>}
                {searchError && <p className="mt-1 text-sm text-red-500">{searchError}</p>}

                {/* Sticky Post Composer (right under search) */}
                <PostComposer onPosted={() => loadPage(1)} />

                {/* Optional: Search results card */}
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

            {/* Space between the sticky header and posts */}
            <div className="h-2" />

            {/* Feed list */}
            <div className="space-y-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
                : (
                  <>
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="animate-fadeIn cursor-pointer rounded-2xl transition hover:bg-white/5"
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
                    {!hasMore && posts.length > 0 && (
                      <div className="py-8 text-center">
                        <div className="inline-flex items-center rounded-full border border-white/10 bg-gray-800/60 px-4 py-2 text-xs text-gray-300">
                          You’re all caught up ✨
                        </div>
                      </div>
                    )}
                    {!loading && posts.length === 0 && (
                      <div className="py-12 text-center text-gray-400">
                        No posts yet.
                      </div>
                    )}
                  </>
                )}
            </div>
          </div>

          {/* RIGHT COLUMN (desktop only) — only shown when signed in */}
          {showRightPanel && (
            <div className="mt-4 lg:mt-0">
              <RightProfilePanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;
