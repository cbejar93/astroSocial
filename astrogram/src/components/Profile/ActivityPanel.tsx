import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import PostCard, { type PostCardProps } from "../PostCard/PostCard";
import PostSkeleton from "../PostCard/PostSkeleton";
import {
  fetchMyPosts,
  fetchMyComments,
  fetchSavedPosts,
  toggleCommentLike,
} from "../../lib/api";

type Variant = "sidebar" | "page"; // sidebar -> sticky shell, page -> block section

const PAGE_SIZE = 20;

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

function TinyPost({
  post,
  onDeleted,
  onOpen,
}: {
  post: MyPost;
  onDeleted?: (id: string | number) => void;
  onOpen: () => void;
}) {
  return (
    <div
      className="
        post-compact rounded-md border border-white/10
        bg-gray-900/30 hover:bg-gray-900/50 transition
        leading-snug text-[13px]
        [&_p]:text-[12px] [&_span]:text-[12px] [&_small]:text-[11px]
        [&_h1]:text-[14px] [&_h2]:text-[13px]
        [&_footer]:text-[10px] [&_footer_button]:text-[10px] [&_footer_span]:text-[10px]
        [&_.rounded-3xl]:rounded-lg [&_.rounded-2xl]:rounded-lg [&_.rounded-xl]:rounded-lg
      "
    >
      <div className="w-full" onClick={onOpen}>
        <PostCard
          {...post}
          onDeleted={(id) => {
            onDeleted?.(id);
          }}
        />
      </div>
    </div>
  );
}

function LoungeRow({ post, onOpen }: { post: MyPost; onOpen: () => void }) {
  return (
    <div
      className="rounded-lg border border-white/10 bg-gray-900/30 hover:bg-gray-900/50 transition cursor-pointer p-3"
      onClick={onOpen}
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

const ActivityPanel: React.FC<{ variant?: Variant }> = ({ variant = "sidebar" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"posts" | "comments" | "saved">("posts");
  const [postSubTab, setPostSubTab] = useState<"all" | "posts" | "lounges">("all");

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
  const [openLoungeGroups, setOpenLoungeGroups] = useState<Set<string>>(() => new Set());

  const containerRef = useRef<HTMLDivElement | null>(null);

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
          const appended = (res.posts ?? []).filter((p) => !seen.has(String(p.id)));
          return [...prev, ...appended];
        });
        setSavedPage(nextPage);
        setHasMoreSaved((res.posts?.length ?? 0) > 0 && nextPage * PAGE_SIZE < (res.total ?? 0));
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
    if (activeTab === "saved" && savedPage === 0 && !loadingSaved) loadSavedPage(1);
  }, [activeTab, savedPage, loadingSaved, loadSavedPage]);

  if (!user) return null;

  const trackers = user.followers?.length ?? 0;
  const tracking = user.following?.length ?? 0;
  const username = user.username ?? "user";

  const generalPosts = useMemo(() => myPosts.filter((p) => !p.loungeId), [myPosts]);
  const loungePosts = useMemo(() => myPosts.filter((p) => p.loungeId), [myPosts]);

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

  const handleToggleLike = async (id: string) => {
    try {
      const { liked, count } = await toggleCommentLike(id);
      setComments((cs) => cs.map((c) => (c.id === id ? { ...c, likes: count, likedByMe: liked } : c)));
    } catch (e) {
      console.error(e);
    }
  };

  const postsCount = generalPosts.length;
  const loungesCount = loungePosts.length;
  const allCount = postsCount + loungesCount;

  // styling helpers
  const shellClasses =
    variant === "sidebar"
      ? "hidden lg:block sticky top-0 z-20"
      : "block w-full"; // "page" just flows in layout

  return (
    <aside className={shellClasses} ref={containerRef}>
      {/* keep the pretty scrollbar CSS local to this component */}
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
      `}</style>

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
              <div className="text-lg font-bold">{trackers.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
              <div className="text-xs text-gray-400">Tracking</div>
              <div className="text-lg font-bold">{tracking.toLocaleString()}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 grid grid-cols-3 rounded-lg border border-white/10 p-1 bg-gray-900/40">
            <button
              onClick={() => setActiveTab("posts")}
              className={`py-1.5 rounded-md text-sm ${
                activeTab === "posts" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800/50"
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`py-1.5 rounded-md text-sm ${
                activeTab === "comments" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800/50"
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`py-1.5 rounded-md text-sm ${
                activeTab === "saved" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800/50"
              }`}
              title="Saved posts"
            >
              Saved
            </button>
          </div>

          {/* Scrollable body */}
          <div className="mt-3 flex-1 min-h-0">
            <div
              className={[
                "pretty-scroll space-y-3",
                variant === "sidebar" ? "max-h-[66vh] overflow-y-auto overflow-x-hidden pt-3 pb-16 px-2 mx-auto w-full max-w-[360px]" : "pt-3",
              ].join(" ")}
            >
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
                      Posts <span className="ml-1 text-[10px] opacity-75">({generalPosts.length})</span>
                    </button>
                    <button
                      onClick={() => setPostSubTab("lounges")}
                      className={`px-2.5 py-1 rounded-md border ${
                        postSubTab === "lounges"
                          ? "border-white/20 bg-gray-800 text-white"
                          : "border-white/10 text-gray-300 hover:bg-gray-800/40"
                      }`}
                    >
                      Lounges <span className="ml-1 text-[10px] opacity-75">({loungePosts.length})</span>
                    </button>
                  </div>

                  {/* ALL */}
                  {postSubTab === "all" && (
                    <>
                      <section className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs uppercase tracking-wide text-gray-400">Your Posts</h4>
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
                          <div className="text-sm text-gray-400">No posts yet.</div>
                        ) : (
                          (showMorePosts ? generalPosts : generalPosts.slice(0, 3)).map((p) => (
                            <TinyPost
                              key={p.id}
                              post={p}
                              onOpen={() => navigate(`/posts/${p.id}`)}
                              onDeleted={(id) => setMyPosts((ps) => ps.filter((x) => x.id !== id))}
                            />
                          ))
                        )}
                      </section>

                      <section className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs uppercase tracking-wide text-gray-400">Lounge Posts</h4>
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
                          <div className="text-sm text-gray-400">No lounge posts yet.</div>
                        ) : (
                          (showMoreLounge ? loungePosts : loungePosts.slice(0, 3)).map((p) => (
                            <LoungeRow
                              key={p.id}
                              post={p}
                              onOpen={() =>
                                navigate(`/lounge/${encodeURIComponent(p.loungeName ?? "")}/posts/${p.id}`)
                              }
                            />
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
                      ) : generalPosts.length === 0 ? (
                        <div className="text-sm text-gray-400">No posts yet.</div>
                      ) : (
                        generalPosts.map((p) => (
                          <TinyPost
                            key={p.id}
                            post={p}
                            onOpen={() => navigate(`/posts/${p.id}`)}
                            onDeleted={(id) => setMyPosts((ps) => ps.filter((x) => x.id !== id))}
                          />
                        ))
                      )}
                    </section>
                  )}

                  {/* LOUNGES only */}
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
                                    <LoungeRow
                                      key={p.id}
                                      post={p}
                                      onOpen={() =>
                                        navigate(
                                          `/lounge/${encodeURIComponent(p.loungeName ?? "")}/posts/${p.id}`
                                        )
                                      }
                                    />
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
                      <div key={c.id} className="rounded-xl border border-white/10 bg-gray-900/30 p-3">
                        <div className="flex items-start gap-2">
                          <img
                            src={c.avatarUrl ?? "/defaultPfp.png"}
                            alt="avatar"
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="text-xs text-gray-400">
                              <span className="font-medium text-gray-200">@{c.username}</span> •{" "}
                              {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
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
                                <Star className="w-4 h-4" fill={c.likedByMe ? "currentColor" : "none"} />
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
                    <h4 className="text-xs uppercase tracking-wide text-gray-400">Saved posts</h4>
                    <Link to="/saved" className="text-xs text-sky-300 hover:underline" title="Open full Saved page">
                      View all
                    </Link>
                  </div>

                  {loadingSaved && savedPage <= 1 ? (
                    <div className="space-y-2">
                      <PostSkeleton />
                      <PostSkeleton />
                    </div>
                  ) : savedPosts.length === 0 ? (
                    <div className="text-sm text-gray-400">You haven’t saved any posts yet.</div>
                  ) : (
                    <>
                      {savedPosts.map((p, i) => (
                        <div key={p.id} className={i === savedPosts.length - 1 ? "mb-20" : ""}>
                          <TinyPost
                            post={p}
                            onOpen={() => navigate(`/posts/${p.id}`)}
                            onDeleted={(id) =>
                              setSavedPosts((prev) => prev.filter((sp) => String(sp.id) !== String(id)))
                            }
                          />
                        </div>
                      ))}
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
};

export default ActivityPanel;
