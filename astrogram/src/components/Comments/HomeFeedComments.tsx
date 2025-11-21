import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Star, Loader2, Reply, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  createComment,
  deleteComment,
  fetchCommentPage,
  toggleCommentLike,
  type CommentResponse,
  type PaginatedCommentsResponse,
} from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

export interface HomeFeedCommentItem extends CommentResponse {
  likedByMe?: boolean;
  parentId: string | null;
}

export interface HomeFeedCommentsHandle {
  focusEditor(): void;
}

interface HomeFeedCommentsProps {
  postId: string;
  pageSize?: number;
}

function sanitizeHtml(value: string): string {
  const el = document.createElement("div");
  el.innerHTML = value;
  el.querySelectorAll("script,style").forEach((node) => node.remove());
  return el.innerHTML;
}

function toParagraphHtml(value: string): string {
  const escape = (v: string) =>
    v
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const lines = value.split(/\n{2,}/).map((line) => line.trim());
  const blocks = lines.filter(Boolean);
  if (blocks.length === 0) return "<p><br/></p>";
  return blocks.map((line) => `<p>${escape(line)}</p>`).join("");
}

const HomeFeedComments = React.forwardRef<HomeFeedCommentsHandle, HomeFeedCommentsProps>(
  ({ postId, pageSize = 10 }, ref) => {
    const { user } = useAuth();
    const [pageData, setPageData] =
      useState<PaginatedCommentsResponse<HomeFeedCommentItem> | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [replyParentId, setReplyParentId] = useState<string | null>(null);
    const [replyUsername, setReplyUsername] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      let isMounted = true;
      setLoading(true);
      setError(null);
      fetchCommentPage(postId, { limit: pageSize })
        .then((data) => {
          if (!isMounted) return;
          setPageData({
            ...data,
            comments: data.comments.map((c) => ({ ...c, parentId: c.parentId ?? null })),
            replies: data.replies.map((r) => ({ ...r, parentId: r.parentId ?? null })),
          });
        })
        .catch(() => isMounted && setError("Could not load comments"))
        .finally(() => isMounted && setLoading(false));
      return () => {
        isMounted = false;
      };
    }, [postId, pageSize]);

    const repliesByParent = useMemo(() => {
      const map = new Map<string, HomeFeedCommentItem[]>();
      pageData?.replies.forEach((reply) => {
        if (!reply.parentId) return;
        const list = map.get(reply.parentId) ?? [];
        list.push(reply);
        map.set(reply.parentId, list);
      });
      return map;
    }, [pageData]);

    const hasMore = !!pageData?.nextCursor;

    const focusEditor = () => {
      inputRef.current?.focus();
    };

    useImperativeHandle(ref, () => ({
      focusEditor,
    }));

    const refreshComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCommentPage(postId, { limit: pageSize });
        setPageData({
          ...data,
          comments: data.comments.map((c) => ({ ...c, parentId: c.parentId ?? null })),
          replies: data.replies.map((r) => ({ ...r, parentId: r.parentId ?? null })),
        });
      } catch (e) {
        setError("Could not refresh comments");
      } finally {
        setLoading(false);
      }
    };

    const loadMore = async () => {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
      try {
        const data = await fetchCommentPage(postId, {
          cursor: pageData?.nextCursor ?? null,
          limit: pageSize,
        });
        setPageData((prev) =>
          prev
            ? {
                ...prev,
                comments: [
                  ...prev.comments,
                  ...data.comments.map((c) => ({ ...c, parentId: c.parentId ?? null })),
                ],
                replies: [
                  ...prev.replies,
                  ...data.replies.map((r) => ({ ...r, parentId: r.parentId ?? null })),
                ],
                total: data.total,
                page: data.page,
                nextCursor: data.nextCursor,
                hasMore: data.hasMore,
              }
            : data
        );
      } catch {
        setError("Could not load more comments");
      } finally {
        setLoadingMore(false);
      }
    };

    const handleLike = async (id: string) => {
      const { liked, count } = await toggleCommentLike(id);
      setPageData((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map((c) =>
                c.id === id ? { ...c, likes: count, likedByMe: liked } : c
              ),
              replies: prev.replies.map((r) =>
                r.id === id ? { ...r, likes: count, likedByMe: liked } : r
              ),
            }
          : prev
      );
    };

    const handleDelete = async (id: string) => {
      await deleteComment(id);
      void refreshComments();
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || submitting) return;
      setSubmitting(true);
      try {
        await createComment(postId, toParagraphHtml(input), replyParentId ?? undefined);
        setInput("");
        setReplyParentId(null);
        setReplyUsername(null);
        await refreshComments();
      } finally {
        setSubmitting(false);
      }
    };

    const renderComment = (comment: HomeFeedCommentItem, depth = 0): JSX.Element => (
      <div
        key={comment.id}
        className={
          depth
            ? "ml-6 border-l border-white/10 pl-4 py-3"
            : "rounded-2xl border border-white/10 p-4 shadow-[0_6px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150"
        }
        style={depth ? undefined : { backgroundColor: "rgba(255,255,255,0.04)" }}
      >
        <div className="flex gap-3">
          <Link
            to={`/users/${encodeURIComponent(comment.username)}/posts`}
            className="shrink-0"
          >
            <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/10 bg-black/30">
              <img
                src={comment.avatarUrl ?? "/defaultPfp.png"}
                alt={comment.username}
                className="h-full w-full object-cover"
              />
            </div>
          </Link>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  to={`/users/${encodeURIComponent(comment.username)}/posts`}
                  className="text-sm font-semibold text-white flex items-center gap-2 hover:text-sky-200 transition"
                >
                  @{comment.username}
                  <span className="text-[11px] font-normal text-slate-400">
                    {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                  </span>
                </Link>
                <div
                  className="prose prose-invert max-w-none text-sm text-slate-100 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.text) }}
                />
              </div>
              {user?.id === comment.authorId && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  className="text-slate-400 hover:text-red-300 transition"
                  title="Delete comment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <button
                type="button"
                onClick={() => handleLike(comment.id)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition border border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10 ${
                  comment.likedByMe ? "text-amber-300" : "text-slate-200"
                }`}
              >
                <Star
                  className="h-4 w-4"
                  fill={comment.likedByMe ? "currentColor" : "none"}
                />
                <span>{comment.likes}</span>
              </button>
              {depth === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setReplyParentId(comment.id);
                    setReplyUsername(comment.username);
                    focusEditor();
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 border border-white/5 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10 transition"
                >
                  <Reply className="h-4 w-4" /> Reply
                </button>
              )}
            </div>

            {(repliesByParent.get(comment.id) ?? []).length > 0 && (
              <div className="space-y-3">
                {repliesByParent.get(comment.id)?.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-3">
        {user ? (
          <form
            onSubmit={handleSubmit}
            className="group relative rounded-3xl bg-white/[0.06] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 text-white p-3 sm:p-4 shadow-[0_8px_28px_rgba(2,6,23,0.45)] transition"
          >
            <div className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-40 group-focus-within:opacity-60 transition">
              <div className="h-full w-full rounded-3xl bg-gradient-to-r from-fuchsia-500/30 via-sky-500/30 to-emerald-500/30 blur-[6px]" />
            </div>

            <div className="relative flex items-start gap-3">
              <img
                src={user.avatarUrl ?? "/defaultPfp.png"}
                alt={user.username ?? "You"}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20"
              />
              <div className="flex-1 space-y-3">
                {replyParentId && replyUsername && (
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-200 border border-white/10">
                    <span>
                      Replying to <span className="text-sky-200">@{replyUsername}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyParentId(null);
                        setReplyUsername(null);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <span className="sr-only">Cancel reply</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full rounded-2xl bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50 min-h-[96px] resize-none pretty-scroll scrollbar-cute"
                  placeholder="Share your thoughts..."
                />
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={!input.trim() || submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,#60f5e5,#5f8bff)] px-4 py-2 text-sm font-semibold text-[#08111f] shadow-lg shadow-cyan-500/20 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Posting
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Post reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center text-sm text-slate-200 border border-white/10 rounded-2xl px-3 py-4" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
            Sign in to join the discussion.
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto space-y-3 pretty-scroll scrollbar-cute">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-2xl border border-white/5"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="h-10 w-10 rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 rounded-full bg-white/10" />
                      <div className="h-3 w-full rounded-full bg-white/10" />
                      <div className="h-3 w-2/3 rounded-full bg-white/10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-red-300 text-sm">{error}</div>
          ) : pageData && pageData.comments.length > 0 ? (
            <div className="space-y-3">
              {pageData.comments.map((comment) => renderComment(comment))}
              {hasMore && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 text-sm text-sky-200 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading
                      </>
                    ) : (
                      "Load more"
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-slate-400 border border-dashed border-white/10 rounded-2xl py-6">
              Be the first to start the conversation.
            </div>
          )}
        </div>
      </div>
    );
  }
);

HomeFeedComments.displayName = "HomeFeedComments";

export default HomeFeedComments;
