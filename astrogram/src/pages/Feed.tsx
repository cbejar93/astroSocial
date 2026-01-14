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
import PostCard, { type PostCardProps } from "../components/PostCard/PostCard";
import PostSkeleton from "../components/PostCard/PostSkeleton";
import LinkPreviewCard from "../components/LinkPreviewCard";
import {
  fetchFeed,
  search,
  type SearchResponse,
  apiFetch,
  fetchMyPosts,
  fetchMyComments,
  toggleCommentLike,
  fetchSavedPosts, // for Saved tab
} from "../lib/api";
import { UploadCloud, Image as ImageIcon, X, Star, ChevronUp } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { trackEvent } from "../lib/analytics";

const PAGE_SIZE = 20;

/** Match Post detail page top padding */
const NAV_PUSH_CLASS = "pt-3 sm:pt-8";

/** Sticky anchor */
const STICKY_TOP_CLASS = "top-0";

/* ---------------- Safe HTML helpers (deep-decode → sanitize) ---------------- */
function decodeHtmlEntitiesDeep(value: string): string {
  if (!value) return "";
  let prev = value;
  for (let i = 0; i < 5; i++) {
    const ta = document.createElement("textarea");
    ta.innerHTML = prev;
    const next = ta.value;
    if (next === prev) break;
    prev = next;
  }
  return prev;
}
function sanitizeHtml(value: string): string {
  if (typeof window === "undefined" || !value) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  const body = doc.body;
  if (!body) return "";

  const allowedTags = new Set([
    "a",
    "blockquote",
    "br",
    "code",
    "em",
    "i",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "ul",
  ]);
  const allowedAttrs = new Set(["href", "title", "rel", "target"]);

  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_ELEMENT, null);
  const nodesToRemove: Element[] = [];
  const nodesToUnwrap: Element[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Element;
    const tag = node.tagName.toLowerCase();

    if (!allowedTags.has(tag)) {
      if (tag === "script" || tag === "style") {
        nodesToRemove.push(node);
        continue;
      }
      nodesToUnwrap.push(node);
      continue;
    }

    [...node.attributes].forEach((attr) => {
      if (!allowedAttrs.has(attr.name.toLowerCase())) node.removeAttribute(attr.name);
    });

    if (tag === "a") {
      if (!node.hasAttribute("rel")) node.setAttribute("rel", "noopener noreferrer");
      if (!node.hasAttribute("target")) node.setAttribute("target", "_blank");
    }
  }

  nodesToRemove.forEach((n) => n.remove());
  nodesToUnwrap.forEach((n) => {
    const frag = document.createDocumentFragment();
    while (n.firstChild) frag.appendChild(n.firstChild);
    n.replaceWith(frag);
  });

  return body.innerHTML;
}
const toSafeHtml = (value: string) => sanitizeHtml(decodeHtmlEntitiesDeep(value));

/* ---------------------------------
   Desktop detection for right panel
----------------------------------- */
function useIsDesktop(minWidth = 1024) {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, [minWidth]);
  return isDesktop;
}

/* ---------- Right-panel types ---------- */
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

/* ---------------------------------
   RIGHT SIDEBAR (desktop only)
----------------------------------- */
function RightProfilePanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"posts" | "comments" | "saved">(
    "posts"
  );
  const [postSubTab, setPostSubTab] = useState<"all" | "posts" | "lounges">(
    "all"
  );

  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  // SAVED
  const [savedPosts, setSavedPosts] = useState<MyPost[]>([]);
  const [savedPage, setSavedPage] = useState(0);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [isFetchingSaved, setIsFetchingSaved] = useState(false);
  const [hasMoreSaved, setHasMoreSaved] = useState(true);

  const [showMorePosts, setShowMorePosts] = useState(false);
  const [showMoreLounge, setShowMoreLounge] = useState(false);
  const [openLoungeGroups, setOpenLoungeGroups] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    let mounted = true;
    fetchMyPosts<MyPost>()
      .then((data) => mounted && setMyPosts(data ?? []))
      .finally(() => mounted && setLoadingPosts(false));
    fetchMyComments<CommentItem>()
      .then((data) => mounted && setComments(data ?? []))
      .finally(() => mounted && setLoadingComments(false));
    return () => {
      mounted = false;
    };
  }, []);

  // lazy-load Saved
  const loadSavedPage = useCallback(
    async (nextPage: number) => {
      if (isFetchingSaved) return;
      if (nextPage === 1) setLoadingSaved(true);
      setIsFetchingSaved(true);
      try {
        const res = await fetchSavedPosts<MyPost>(nextPage, PAGE_SIZE);
        setSavedPosts((prev) => {
          if (nextPage === 1) return res.posts ?? [];
          const seen = new Set(prev.map((p) => String(p.id)));
          const appended = (res.posts ?? []).filter(
            (p) => !seen.has(String(p.id))
          );
          return [...prev, ...appended];
        });
        setSavedPage(nextPage);
        setHasMoreSaved(
          (res.posts?.length ?? 0) > 0 &&
            nextPage * PAGE_SIZE < (res.total ?? 0)
        );
      } catch (e) {
        console.error("Failed to load saved posts", e);
      } finally {
        if (nextPage === 1) setLoadingSaved(false);
        setIsFetchingSaved(false);
      }
    },
    [isFetchingSaved]
  );

  useEffect(() => {
    if (activeTab === "saved" && savedPage === 0 && !loadingSaved) {
      loadSavedPage(1);
    }
  }, [activeTab, savedPage, loadingSaved, loadSavedPage]);

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

  function TinyPost({
    post,
    onDeleted,
  }: {
    post: MyPost;
    onDeleted?: (id: string | number) => void;
  }) {
    return (
      <div
        className="
          post-compact
          rounded-md border border-white/10
          bg-gray-900/30 hover:bg-gray-900/50 transition
          leading-snug text-[13px]
          [&_p]:text-[12px] [&_span]:text-[12px] [&_small]:text-[11px]
          [&_h1]:text-[14px] [&_h2]:text-[13px]
          [&_footer]:text-[10px] [&_footer_button]:text-[10px] [&_footer_span]:text-[10px]
          [&_.rounded-3xl]:rounded-lg [&_.rounded-2xl]:rounded-lg [&_.rounded-xl]:rounded-lg
        "
      >
        <div className="w-full" onClick={() => navigate(`/posts/${post.id}`)}>
          <PostCard
            {...post}
            onDeleted={(id) => {
              setMyPosts((ps) => ps.filter((p) => p.id !== id));
              onDeleted?.(id);
            }}
          />
        </div>
      </div>
    );
  }

  function LoungeRow({ post }: { post: MyPost }) {
    return (
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
  }

  const handleToggleLike = async (id: string) => {
    try {
      const { liked, count } = await toggleCommentLike(id);
      setComments((cs) =>
        cs.map((c) =>
          c.id === id ? { ...c, likes: count, likedByMe: liked } : c
        )
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
      <div className="rounded-2xl border border-white/10 bg-[#0E1626] text-white overflow-hidden shadow-[0_8px_28px_rgba(2,6,23,0.45)] flex flex-col">
        {/* Banner */}
        <div className="h-20 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(240,75,179,0.35),transparent),radial-gradient(120%_80%_at_90%_10%,rgba(90,162,255,0.35),transparent)]" />

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
              <div className="text-lg font-bold">
                {trackers.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
              <div className="text-xs text-gray-400">Tracking</div>
              <div className="text-lg font-bold">
                {tracking.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 grid grid-cols-3 rounded-lg border border-white/10 p-1 bg-gray-900/40">
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
            <button
              onClick={() => setActiveTab("saved")}
              className={`py-1.5 rounded-md text-sm ${
                activeTab === "saved"
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800/50"
              }`}
              title="Saved posts"
            >
              Saved
            </button>
          </div>

          {/* Scrollable body (ADD-ONLY: scrollbar-cute + scrollbar-gutter) */}
          <div className="mt-3 flex-1 min-h-0">
            <div className="pretty-scroll scrollbar-cute [scrollbar-gutter:stable] space-y-3 max-h-[66vh] overflow-y-auto overflow-x-hidden pt-3 pb-16 px-2 mx-auto w-full max-w-[360px]">
              {activeTab === "posts" ? (
                <>
                  {/* Sub-tabs */}
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <button
                      onClick={() => setPostSubTab("all")}
                      className={`px-2.5 py-1 rounded-md border ${
                        postSubTab === "all"
                          ? "border-white/20 bg-gray-800 text-white"
                          : "border-white/10 text-gray-300 hover:bg-gray-800/40"
                      }`}
                    >
                      All{" "}
                      <span className="ml-1 text-[10px] opacity-75">
                        ({allCount})
                      </span>
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
                      <span className="ml-1 text-[10px] opacity-75">
                        ({generalPosts.length})
                      </span>
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
                      <span className="ml-1 text-[10px] opacity-75">
                        ({loungePosts.length})
                      </span>
                    </button>
                  </div>

                  {/* ALL */}
                  {postSubTab === "all" && (
                    <>
                      <section className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs uppercase tracking-wide text-gray-400">
                            Your Posts
                          </h4>
                          {generalPosts.length > 3 && (
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
                        ) : generalPosts.length === 0 ? (
                          <div className="text-sm text-gray-400">
                            No posts yet.
                          </div>
                        ) : (
                          (showMorePosts
                            ? generalPosts
                            : generalPosts.slice(0, 3)
                          ).map((p) => <TinyPost key={p.id} post={p} />)
                        )}
                      </section>

                      <section className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs uppercase tracking-wide text-gray-400">
                            Lounge Posts
                          </h4>
                          {loungePosts.length > 3 && (
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
                        ) : loungePosts.length === 0 ? (
                          <div className="text-sm text-gray-400">
                            No lounge posts yet.
                          </div>
                        ) : (
                          (showMoreLounge
                            ? loungePosts
                            : loungePosts.slice(0, 3)
                          ).map((p) => <LoungeRow key={p.id} post={p} />)
                        )}
                      </section>
                    </>
                  )}

                  {/* POSTS only */}
                  {postSubTab === "posts" && (
                    <section className="space-y-2">
                      {loadingPosts ? (
                        <div className="text-sm text-gray-400">Loading…</div>
                      ) : generalPosts.length === 0 ? (
                        <div className="text-sm text-gray-400">
                          No posts yet.
                        </div>
                      ) : (
                        generalPosts.map((p) => <TinyPost key={p.id} post={p} />)
                      )}
                    </section>
                  )}

                  {/* LOUNGES only */}
                  {postSubTab === "lounges" && (
                    <section className="space-y-2">
                      {loadingPosts ? (
                        <div className="text-sm text-gray-400">Loading…</div>
                      ) : loungeGroups.length === 0 ? (
                        <div className="text-sm text-gray-400">
                          No lounge posts yet.
                        </div>
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
                                <span className="text-sm font-medium">
                                  {name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {posts.length}
                                </span>
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
              ) : activeTab === "comments" ? (
                // COMMENTS
                <section className="space-y-3">
                  {loadingComments ? (
                    <div className="text-sm text-gray-400">Loading…</div>
                  ) : comments.length === 0 ? (
                    <div className="text-sm text-gray-400">No comments yet.</div>
                  ) : (
                    comments.slice(0, 50).map((c) => (
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
                              <span className="font-medium text-gray-200">
                                @{c.username}
                              </span>{" "}
                              •{" "}
                              {formatDistanceToNow(new Date(c.timestamp), {
                                addSuffix: true,
                              })}
                            </div>
                            {/* FIX: render HTML safely (deep-decode + sanitize) */}
                            <div
                              className="prose prose-invert max-w-none text-sm text-gray-100 mt-1 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: toSafeHtml(c.text) }}
                            />
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
              ) : (
                // SAVED
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase tracking-wide text-gray-400">
                      Saved posts
                    </h4>
                    <Link
                      to="/saved"
                      className="text-xs text-sky-300 hover:underline"
                      title="Open full Saved page"
                    >
                      View all
                    </Link>
                  </div>

                  {loadingSaved && savedPage <= 1 ? (
                    <div className="space-y-2">
                      <PostSkeleton />
                      <PostSkeleton />
                    </div>
                  ) : savedPosts.length === 0 ? (
                    <div className="text-sm text-gray-400">
                      You haven’t saved any posts yet.
                    </div>
                  ) : (
                    <>
                      {savedPosts.map((p, i) => (
                        <div key={p.id} className={i === savedPosts.length - 1 ? "mb-20" : ""}>
                          <TinyPost
                            post={p}
                            onDeleted={(id) =>
                              setSavedPosts((prev) =>
                                prev.filter((sp) => String(sp.id) !== String(id))
                              )
                            }
                          />
                        </div>
                      ))}
                      {/* bottom spacer so last one is fully visible */}
                      <div aria-hidden className={`${hasMoreSaved ? "h-5" : "h-12"}`} />
                    </>
                  )}

                  {savedPosts.length > 0 && hasMoreSaved && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => loadSavedPage(savedPage + 1)}
                        disabled={isFetchingSaved}
                        className="w-full rounded-md border border-white/10 bg-gray-900/40 hover:bg-gray-900/60 px-3 py-1.5 text-xs text-gray-200 disabled:opacity-60"
                      >
                        {isFetchingSaved ? "Loading…" : "Load more"}
                      </button>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ---------------------------------
   Composer (left column)
----------------------------------- */
function PostComposer({ onPosted }: { onPosted: () => void }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [linkPreview, setLinkPreview] = useState<{
    url: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    siteName?: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const lastPreviewUrl = useRef<string | null>(null);
  const previewTimer = useRef<number | null>(null);

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

  const extractFirstUrl = (value: string) => {
    const match = value.match(/https?:\/\/[^\s]+/i);
    return match?.[0] ?? null;
  };

  const stripFirstUrl = (value: string, url: string | null) => {
    if (!url) return value.trim();
    return value.replace(url, "").replace(/\s{2,}/g, " ").trim();
  };

  useEffect(() => {
    const detectedUrl = extractFirstUrl(caption);
    if (!detectedUrl) {
      if (previewTimer.current) {
        window.clearTimeout(previewTimer.current);
        previewTimer.current = null;
      }
      lastPreviewUrl.current = null;
      setPreviewLoading(false);
      setPreviewError(null);
      setLinkPreview(null);
      return;
    }

    if (detectedUrl === lastPreviewUrl.current) return;

    if (previewTimer.current) {
      window.clearTimeout(previewTimer.current);
    }

    setPreviewLoading(true);
    setPreviewError(null);

    previewTimer.current = window.setTimeout(async () => {
      try {
        const res = await apiFetch("/unfurl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: detectedUrl }),
        });
        const data = (await res.json()) as {
          url: string;
          title?: string;
          description?: string;
          imageUrl?: string;
          siteName?: string;
        };
        lastPreviewUrl.current = detectedUrl;
        setLinkPreview(data);
        setPreviewLoading(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unable to load preview.";
        setPreviewError(message);
        setLinkPreview(null);
        setPreviewLoading(false);
      }
    }, 500);

    return () => {
      if (previewTimer.current) {
        window.clearTimeout(previewTimer.current);
        previewTimer.current = null;
      }
    };
  }, [caption]);

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
      const cleanedCaption = stripFirstUrl(caption, linkPreview?.url ?? null);
      const form = new FormData();
      form.append("body", cleanedCaption);
      if (file) form.append("image", file);
      if (linkPreview?.url) {
        form.append("linkUrl", linkPreview.url);
        if (linkPreview.title) form.append("linkTitle", linkPreview.title);
        if (linkPreview.description) {
          form.append("linkDescription", linkPreview.description);
        }
        if (linkPreview.imageUrl) form.append("linkImageUrl", linkPreview.imageUrl);
        if (linkPreview.siteName) form.append("linkSiteName", linkPreview.siteName);
      }

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

      setCaption("");
      setLinkPreview(null);
      setPreviewError(null);
      setPreviewLoading(false);
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
      className="group mt-0 sm:mt-0 relative rounded-3xl
                 bg-white/[0.06] hover:bg-white/[0.08]
                 backdrop-blur-xl
                 border border-white/10
                 text-white p-2 sm:p-3
                 shadow-[0_8px_28px_rgba(2,6,23,0.45)]
                 transition"
      aria-label="Create post"
    >
      <div className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-40 group-focus-within:opacity-60 transition">
        <div className="h-full w-full rounded-3xl bg-gradient-to-r from-fuchsia-500/30 via-sky-500/30 to-emerald-500/30 blur-[6px]" />
      </div>

      <div className="flex items-start gap-3 relative">
        <img
          src={user.avatarUrl ?? "/defaultPfp.png"}
          alt="Your avatar"
          className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20"
        />
        <div className="flex-1">
          <textarea
            rows={1}
            placeholder={`What's on your mind${user.username ? `, @${user.username}` : ""}?`}
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              if (captionError && e.target.value.trim()) setCaptionError(null);
            }}
            className="w-full resize-y rounded-2xl bg-white/[0.06] border border-white/10 text-gray-100 placeholder-gray-300/70 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:border-white/20 px-3 py-1.5 text-sm"
          />
          {captionError && (
            <p className="mt-1 text-xs text-red-400">{captionError}</p>
          )}

          {preview && (
            <div className="mt-3 relative inline-block">
              <img
                src={preview}
                alt="preview"
                className="max-h-52 rounded-xl object-cover border border-white/10"
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

          {(previewLoading || previewError || linkPreview) && (
            <div className="mt-3">
              {previewLoading && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-gray-300">
                  Loading link preview…
                </div>
              )}
              {previewError && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-red-400">
                  {previewError}
                </div>
              )}
              {!previewLoading && !previewError && linkPreview && (
                <LinkPreviewCard preview={linkPreview} />
              )}
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            <label
              htmlFor="composer-image"
              className="inline-flex items-center gap-2 cursor-pointer rounded-full border border-white/10 bg-white/[0.07] hover:bg-white/[0.12] px-3 py-1 text-xs sm:text-sm transition"
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

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-accent-gradient px-4 py-1 text-xs sm:text-sm font-semibold text-white whitespace-nowrap shadow-[0_12px_28px_rgba(15,23,42,0.45)] ring-1 ring-white/20 transition hover:brightness-110 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70"
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

          {error && (
            <div className="mt-2 rounded-md bg-red-600/90 px-3 py-2 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

/* ---------------------------------
   FEED PAGE with desktop-fixed shell
----------------------------------- */
function Feed() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const navigate = useNavigate();

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const showRightPanel = false;

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

  // Listen for navbar search events
  useEffect(() => {
    const handler = (e: any) => {
      const q = e?.detail?.query ?? "";
      if (!q) return;
      setQuery(q);
      performSearch(1);
    };
    window.addEventListener("app:search", handler as any);
    return () => window.removeEventListener("app:search", handler as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPage = useCallback(async (nextPage: number) => {
    if (nextPage === 1) setLoading(true);
    setIsFetchingNext(true);
    try {
      const response = await fetchFeed<PostCardProps>(nextPage, PAGE_SIZE);
      setPosts((prev) => {
        if (nextPage === 1) return response.posts;
        const existingIds = new Set(prev.map((p) => String(p.id)));
        const appended = response.posts.filter(
          (p) => !existingIds.has(String(p.id))
        );
        return [...prev, ...appended];
      });
      setPage(nextPage);
      setHasMore(
        response.posts.length > 0 && nextPage * PAGE_SIZE < response.total
      );
    } catch (err) {
      console.error(err);
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
    const root = scrollerRef.current ?? null;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isFetchingNext) {
          loadPage(page + 1);
        }
      },
      { root }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetchingNext, loadPage, page]);

  // Scroll-to-top visibility controller
  useEffect(() => {
    const container = isDesktop ? scrollerRef.current : window;
    if (!container) return;

    const handler = () => {
      const y = isDesktop
        ? (scrollerRef.current?.scrollTop ?? 0)
        : window.scrollY;
      setShowScrollTop(y > 260);
    };

    handler();
    if (isDesktop && scrollerRef.current) {
      scrollerRef.current.addEventListener("scroll", handler, { passive: true });
      return () =>
        scrollerRef.current?.removeEventListener("scroll", handler as any);
    } else {
      window.addEventListener("scroll", handler, { passive: true });
      return () => window.removeEventListener("scroll", handler as any);
    }
  }, [isDesktop]);

  const scrollToTop = () => {
    if (isDesktop && scrollerRef.current) {
      scrollerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDeleted = (id: string | number) => {
    setPosts((prev) => prev.filter((p) => String(p.id) !== String(id)));
  };

  const hasSearchResults =
    !!results &&
    (((results.users?.results.length ?? 0) > 0) ||
      ((results.lounges?.results.length ?? 0) > 0));

  const hasNext =
    !!results &&
    (((results.users &&
      results.users.total > results.users.page * results.users.limit) ||
      (results.lounges &&
        results.lounges.total >
          results.lounges.page * results.lounges.limit)));

  return (
    <div className={`relative ${NAV_PUSH_CLASS}`}>
      {/* Pretty scrollbar (Firefox + WebKit) */}
      <style>{`
        .pretty-scroll{
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,.7) rgba(2,6,23,.35);
        }
        .pretty-scroll::-webkit-scrollbar{ width: 12px; }
        .pretty-scroll::-webkit-scrollbar-track{
          background: linear-gradient(180deg, rgba(2,6,23,.4), rgba(2,6,23,.15));
          border-radius: 9999px;
        }
        .pretty-scroll::-webkit-scrollbar-thumb{
          background: linear-gradient(180deg, rgba(99,102,241,.8), rgba(244,63,94,.75));
          border-radius: 9999px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .pretty-scroll::-webkit-scrollbar-thumb:hover{
          background: linear-gradient(180deg, rgba(59,130,246,.95), rgba(236,72,153,.9));
        }

        /* small action text only where .post-compact wrapper is used */
        .post-compact footer, .post-compact footer *{
          font-size:10px !important;
          line-height:1 !important;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12%] h-[38vh] w-[65vw] -translate-x-1/2 rounded-[999px] bg-gradient-to-br from-sky-500/12 via-fuchsia-500/10 to-emerald-500/12 blur-3xl" />
      </div>

      <div className="w-full">
        <div
          className={`w-full max-w-[var(--page-content-max)] [--page-content-max:72rem] mx-auto px-0 sm:px-4 lg:px-6
                      lg:grid ${
                        showRightPanel
                          ? "lg:grid-cols-[minmax(0,1fr)_360px]"
                          : "lg:grid-cols-1"
                      } lg:gap-6`}
        >
          {/* LEFT SCROLLER (ADD-ONLY: scrollbar-cute + scrollbar-gutter) */}
          <div
            id="feedScroll"
            ref={scrollerRef}
            className="pretty-scroll scrollbar-cute [scrollbar-gutter:stable] min-w-0 lg:overflow-y-auto lg:pt-4 pb-16"
          >
            <div className={`sticky ${STICKY_TOP_CLASS} z-30 bg-transparent`}>
              <div className="relative px-2 sm:px-4">
                <PostComposer onPosted={() => loadPage(1)} />

                {/* Optional: show results panel when Navbar triggers a search */}
                {results && (
                  <div className="mt-2 rounded-2xl border border-white/10 bg-[#0E1626] text-white p-4">
                    {hasSearchResults ? (
                      <div className="space-y-6">
                        {results.users?.results.length ? (
                          <div>
                            <h2 className="text-base font-semibold mb-2">
                              Users
                            </h2>
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
                            <h2 className="text-base font-semibold mb-2">
                              Lounges
                            </h2>
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
                      </div>
                    ) : (
                      !searchLoading && (
                        <p className="text-sm text-gray-300">No results found</p>
                      )
                    )}
                  </div>
                )}

                {searchLoading && (
                  <p className="mt-1 text-sm text-gray-300">Loading…</p>
                )}
                {searchError && (
                  <p className="mt-1 text-sm text-red-500">{searchError}</p>
                )}
              </div>
            </div>

            {/* Increased spacing between the sticky composer section and the posts */}
            <div className="h-6" />

            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
              ) : (
                <>
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="post-compact animate-fadeIn cursor-pointer rounded-2xl transition hover:bg-white/5
                                 [&_footer]:text-[10px] [&_footer_button]:text-[10px] [&_footer_span]:text-[10px]"
                      onClick={() => navigate(`/posts/${post.id}`)}
                    >
                      <PostCard {...post} onDeleted={handleDeleted} />
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

          {/* RIGHT COLUMN (desktop only) — enable internal scroll */}
          {showRightPanel && (
            <div className="hidden lg:block lg:h-full lg:minh-0 lg:overflow-hidden lg:pt-6">
              <RightProfilePanel />
            </div>
          )}
        </div>
      </div>

      {/* Mobile-only "Scroll to top" FAB (above bottom nav) */}
      {showScrollTop && !isDesktop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="lg:hidden group fixed right-4 z-[70] h-12 w-12 rounded-full
                     border border-white/15 bg-transparent backdrop-blur-2xl
                     shadow-[0_8px_30px_rgba(0,0,0,0.35)]
                     ring-1 ring-white/10
                     hover:ring-white/30 hover:bg-white/10
                     active:scale-95 transition"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)" }}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-px rounded-full
                       bg-gradient-to-tr from-fuchsia-500/25 to-sky-500/25
                       opacity-60 blur-sm transition-opacity
                       group-hover:opacity-90"
          />
          <ChevronUp className="relative mx-auto h-5 w-5 text-white drop-shadow-sm" />
        </button>
      )}
    </div>
  );
}

export default Feed;
