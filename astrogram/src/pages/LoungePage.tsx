import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fetchLoungePosts, fetchLounge, apiFetch, deleteLounge } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import {
  MoreVertical,
  PencilLine,
  MessageSquare,
  Clock,
  Shield,
  Flame,
  Sparkles,
  Filter,
} from "lucide-react";

/* ----------------------------- Types ------------------------------ */

interface LoungePostSummary {
  id: string;
  title: string;
  username: string;
  avatarUrl: string;
  timestamp: string;
  comments: number;
  lastReplyUsername?: string;
  lastReplyTimestamp?: string;
}
interface LoungeInfo {
  id: string;
  name: string;
  bannerUrl: string;
  profileUrl: string;
  description: string;
}

/* --------------------------- Skeletons ---------------------------- */

const HeroSkeleton: React.FC = () => (
  <section className="relative mb-12 rounded-3xl overflow-hidden ring-1 ring-white/10 bg-white/5 backdrop-blur-md">
    <div className="h-48 w-full bg-gradient-to-r from-white/10 via-white/5 to-white/10 animate-pulse" />
    <div className="p-6">
      <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
      <div className="mt-3 h-3 w-80 bg-white/10 rounded animate-pulse" />
    </div>
  </section>
);

const PostSkeleton: React.FC = () => (
  <div className="rounded-2xl overflow-hidden p-[1px] bg-[conic-gradient(at_20%_0%,rgba(240,75,179,.14),rgba(90,162,255,.14),rgba(34,197,94,.1),rgba(240,75,179,.14))]">
    <div className="rounded-2xl bg-[#0E1626]/70 ring-1 ring-white/10 p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
        <div className="flex-1">
          <div className="h-3.5 w-40 bg-white/10 rounded animate-pulse" />
          <div className="mt-2 h-3 w-28 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
      <div className="mt-4 h-4 w-3/4 bg-white/10 rounded animate-pulse" />
    </div>
  </div>
);

/* ----------------------------- Page ------------------------------- */

type SortBy = "latest" | "mostReplies" | "latestReply";

const LoungePage: React.FC = () => {
  const { loungeName } = useParams<{ loungeName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lounge, setLounge] = useState<LoungeInfo | null>(null);
  const [loadingLounge, setLoadingLounge] = useState(true);

  const [posts, setPosts] = useState<LoungePostSummary[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [sortBy, setSortBy] = useState<SortBy>("latest");
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);

  // close menus on outside click
  useEffect(() => {
    const handler = () => {
      setMenuPostId(null);
      setAdminOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // fetch lounge
  useEffect(() => {
    if (!loungeName) return;
    setLoadingLounge(true);
    fetchLounge<LoungeInfo>(loungeName)
      .then((data) => setLounge(data))
      .catch(() => setLounge(null))
      .finally(() => setLoadingLounge(false));
  }, [loungeName]);

  // fetch posts
  useEffect(() => {
    if (!loungeName) return;
    setLoadingPosts(true);
    fetchLoungePosts<LoungePostSummary>(loungeName, 1, 20)
      .then((data) => setPosts(data.posts ?? []))
      .finally(() => setLoadingPosts(false));
  }, [loungeName]);

  // derived
  const sortedPosts = useMemo(() => {
    const arr = [...posts];
    if (sortBy === "latest") {
      arr.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } else if (sortBy === "latestReply") {
      arr.sort((a, b) => {
        const at = new Date(a.lastReplyTimestamp ?? a.timestamp).getTime();
        const bt = new Date(b.lastReplyTimestamp ?? b.timestamp).getTime();
        return bt - at;
      });
    } else {
      // mostReplies
      arr.sort((a, b) => b.comments - a.comments);
    }
    return arr;
  }, [posts, sortBy]);

  const postCount = sortedPosts.length;
  const lastActive = useMemo(() => {
    if (!sortedPosts.length) return null;
    const top = sortedPosts[0];
    const ts = new Date(top.lastReplyTimestamp ?? top.timestamp);
    return formatDistanceToNow(ts, { addSuffix: true });
  }, [sortedPosts]);

  // actions
  const handleDelete = async (id: string) => {
    setMenuPostId(null);
    try {
      const res = await apiFetch(`/posts/delete/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete post");
      }
      setPosts((ps) => ps.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLounge = async () => {
    setAdminOpen(false);
    if (!lounge) return;
    try {
      await deleteLounge(lounge.id);
      navigate("/lounge");
    } catch (e) {
      console.error(e);
    }
  };

  /* --------------------------- Render -------------------------------- */

  if (loadingLounge) {
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="w-full max-w-4xl px-4">
          <HeroSkeleton />
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!lounge) {
    return (
      <div className="w-full py-12 flex justify-center">
        <div className="w-full max-w-3xl px-4">
          <div className="rounded-2xl ring-1 ring-white/10 bg-white/5 backdrop-blur-md px-6 py-10 text-center">
            <p className="text-sm text-gray-300">Lounge not found.</p>
            <button
              className="mt-4 rounded-lg px-4 py-2 text-sm text-white ring-1 ring-white/20 hover:bg-white/10"
              onClick={() => navigate("/lounge")}
            >
              Back to Lounges
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 flex justify-center">
      <div className="w-full max-w-5xl px-0 sm:px-4">
        {/* ====== Aurora Hero (new look) ====== */}
        <section className="relative mb-12 rounded-3xl overflow-hidden ring-1 ring-white/10 bg-[#0B1220]/60 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          {/* layered nebula */}
          <div className="absolute inset-0 -z-10">
            <img
              src={lounge.bannerUrl}
              alt={`${lounge.name} banner`}
              className="w-full h-full object-cover opacity-70"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/banner-fallback.jpg";
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(800px_300px_at_20%_-10%,rgba(240,75,179,.28),transparent),radial-gradient(800px_300px_at_80%_110%,rgba(90,162,255,.25),transparent)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-transparent to-transparent" />
          </div>

          <div className="px-5 sm:px-7 pt-20 pb-6">
            <div className="flex items-end gap-5">
              <div className="relative">
                <span className="absolute -inset-1 rounded-full blur-lg opacity-60" style={{ background: "linear-gradient(135deg,#f04bb3,#5aa2ff)" }} />
                <img
                  src={lounge.profileUrl}
                  alt={`${lounge.name} icon`}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-2 ring-white/30 bg-[#0E1626]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/defaultPfp.png";
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{lounge.name}</h1>
                  {postCount > 0 && (
                    <span className="text-[11px] sm:text-xs text-sky-300 bg-sky-500/10 ring-1 ring-sky-400/30 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> {postCount} posts
                    </span>
                  )}
                  {lastActive && (
                    <span className="text-[11px] sm:text-xs text-fuchsia-200 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/30 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Active {lastActive}
                    </span>
                  )}
                </div>

                {lounge.description && (
                  <div className="mt-3">
                    <p className={["text-sm text-gray-200 whitespace-pre-line", descOpen ? "" : "line-clamp-3"].join(" ")}>
                      {lounge.description}
                    </p>
                    <button
                      type="button"
                      className="mt-1 text-xs text-gray-300 hover:text-white underline underline-offset-2"
                      onClick={() => setDescOpen((s) => !s)}
                    >
                      {descOpen ? "Show less" : "Show more"}
                    </button>
                  </div>
                )}
              </div>

              <div className="ml-auto flex items-center gap-2">
                {user && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/lounge/${encodeURIComponent(lounge.name)}/post`)
                    }
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/20 shadow-[0_12px_28px_rgba(15,23,42,0.45)] transition hover:brightness-110 active:translate-y-px"
                    style={{ background: "linear-gradient(90deg,#f04bb3,#5aa2ff)" }}
                  >
                    <PencilLine className="h-4 w-4" />
                    Post
                  </button>
                )}

                {user?.role === "ADMIN" && (
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setAdminOpen((m) => !m)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm text-gray-200 hover:bg-white/10 ring-1 ring-white/15"
                      aria-haspopup="menu"
                      aria-expanded={adminOpen}
                      title="Admin"
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </button>
                    {adminOpen && (
                      <div className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden ring-1 ring-white/10 bg-[#0E1626]/95 shadow-2xl z-10">
                        <button
                          onClick={() => {
                            setAdminOpen(false);
                            navigate("/admin/lounge", { state: { lounge } });
                          }}
                          className="block w-full px-4 py-2 text-left text-sm hover:bg-white/5"
                        >
                          Edit Lounge
                        </button>
                        <button
                          onClick={handleDeleteLounge}
                          className="block w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
                        >
                          Delete Lounge
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* sticky action bar */}
          <div className="sticky bottom-4 px-4 pb-4">
            <div className="mx-auto max-w-5xl">
              <div className="rounded-2xl bg-[#0B1220]/70 ring-1 ring-white/10 backdrop-blur-md px-3 py-2 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,.45)]">
                <Filter className="w-4 h-4 text-gray-300" />
                <span className="text-xs text-gray-300">Sort</span>
                <div className="ml-1 flex items-center gap-1">
                  {(["latest", "latestReply", "mostReplies"] as SortBy[]).map((k) => {
                    const active = sortBy === k;
                    const label =
                      k === "latest" ? "Newest" : k === "latestReply" ? "Latest reply" : "Most replies";
                    return (
                      <button
                        key={k}
                        onClick={() => setSortBy(k)}
                        className={[
                          "text-xs px-2 py-1 rounded-md ring-1 transition",
                          active
                            ? "text-white ring-white/30"
                            : "text-gray-300 ring-white/10 hover:ring-white/30 hover:text-white",
                        ].join(" ")}
                        style={active ? { background: "linear-gradient(90deg,#f04bb3,#5aa2ff)" } : {}}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-gray-300 inline-flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    {postCount} posts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== POSTS ====== */}
        <section className="space-y-4">
          {loadingPosts ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : sortedPosts.length === 0 ? (
            <div className="rounded-2xl ring-1 ring-white/10 bg-white/[0.03] backdrop-blur-md px-6 py-12 text-center">
              <p className="text-sm text-gray-300">No posts yet.</p>
              {user && (
                <button
                  className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/20 shadow-[0_12px_28px_rgba(15,23,42,0.45)] hover:brightness-110"
                  style={{ background: "linear-gradient(90deg,#f04bb3,#5aa2ff)" }}
                  onClick={() =>
                    navigate(`/lounge/${encodeURIComponent(lounge.name)}/post`)
                  }
                >
                  <PencilLine className="w-4 h-4" />
                  Be the first to post
                </button>
              )}
            </div>
          ) : (
            sortedPosts.map((post) => {
              const isOwn = user?.username === post.username;
              const encodedUsername = encodeURIComponent(post.username);
              const lastLine =
                post.lastReplyTimestamp && post.lastReplyUsername
                  ? `Last reply by ${post.lastReplyUsername} ${formatDistanceToNow(
                      new Date(post.lastReplyTimestamp),
                      { addSuffix: true }
                    )}`
                  : null;

              return (
                <article
                  key={post.id}
                  className="group relative rounded-2xl overflow-hidden ring-1 ring-white/10 bg-[#0E1626]/65 backdrop-blur-md p-4 shadow-[0_10px_40px_rgba(0,0,0,.45)] hover:shadow-[0_18px_80px_rgba(2,6,23,.6)] transition-shadow cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/lounge/${encodeURIComponent(lounge.name)}/posts/${post.id}`
                    )
                  }
                >
                  {/* left glow bar */}
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#f04bb3] via-[#5aa2ff] to-[#22c55e] opacity-60" />

                  <div className="flex items-center gap-3">
                    <img
                      src={post.avatarUrl ?? "/defaultPfp.png"}
                      alt={`${post.username} avatar`}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/defaultPfp.png";
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/users/${encodedUsername}/posts`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-sm text-sky-300 hover:underline"
                        >
                          @{post.username}
                        </Link>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(post.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <h2 className="mt-1 text-[15px] sm:text-base font-semibold leading-tight">
                        {post.title}
                      </h2>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-300 bg-white/5 px-2 py-1 rounded-full ring-1 ring-white/10">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {post.comments}
                      </span>

                      {isOwn && (
                        <div
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setMenuPostId((id) => (id === post.id ? null : post.id))
                            }
                            className="p-1 text-gray-300 hover:text-white rounded-md hover:bg-white/10"
                            aria-haspopup="menu"
                            aria-expanded={menuPostId === post.id}
                            aria-label="Post menu"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {menuPostId === post.id && (
                            <div className="absolute right-0 mt-2 w-36 rounded-xl overflow-hidden ring-1 ring-white/10 bg-[#0E1626]/95 shadow-2xl z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(post.id);
                                }}
                                className="block w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
                              >
                                Delete Post
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {lastLine && (
                    <p className="mt-2 text-[12px] text-gray-400">{lastLine}</p>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
};

export default LoungePage;
