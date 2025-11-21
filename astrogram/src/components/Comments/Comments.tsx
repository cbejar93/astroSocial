// src/components/Comments/Comments.tsx
import { Star, Send, Quote, Reply } from "lucide-react";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
} from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../../hooks/useAuth";
import CommentsSkeleton from "./CommentsSkeleton";
import {
  fetchCommentPage,
  createComment,
  deleteComment,
  toggleCommentLike,
  type CommentResponse,
  type PaginatedCommentsResponse,
} from "../../lib/api";

export interface CommentItem extends CommentResponse {
  likedByMe?: boolean;
  parentId: string | null;
}

export interface CommentsHandle {
  quote(source: { id?: string; username: string; text: string; parentId?: string | null }): void;
  focusEditor(): void;
}

interface CommentsProps {
  postId: string;
  pageSize?: number;
  initialPage?: number;
}

const Comments = React.forwardRef<CommentsHandle, CommentsProps>(
  ({ postId, pageSize = 10, initialPage = 1 }, ref) => {
    const { user } = useAuth();
    const [pageData, setPageData] =
      useState<PaginatedCommentsResponse<CommentItem> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [refreshKey, setRefreshKey] = useState(0);
    const [replyParentId, setReplyParentId] = useState<string | null>(null);
    const [replyContext, setReplyContext] = useState<{ username: string; commentId?: string }>({ username: "" });
    const [editorPlain, setEditorPlain] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    // Load comments
    useEffect(() => {
      setLoading(true);
      fetchCommentPage(postId, { page: currentPage, limit: pageSize })
        .then((data) =>
          setPageData({
            ...data,
            comments: data.comments.map((c) => ({
              ...c,
              parentId: c.parentId ?? null,
            })),
            replies: data.replies.map((r) => ({
              ...r,
              parentId: r.parentId ?? null,
            })),
          })
        )
        .catch(() => setError("Could not load replies."))
        .finally(() => setLoading(false));
    }, [postId, currentPage, pageSize, refreshKey]);

    // Group replies
    const repliesByParent = useMemo(() => {
      const map = new Map<string, CommentItem[]>();
      pageData?.replies.forEach((r) => {
        if (!r.parentId) return;
        const arr = map.get(r.parentId) ?? [];
        arr.push(r);
        map.set(r.parentId, arr);
      });
      return map;
    }, [pageData]);

    const sanitize = (v: string) => {
      const el = document.createElement("div");
      el.innerHTML = v;
      el.querySelectorAll("script,style").forEach((e) => e.remove());
      return el.innerHTML;
    };

    const focusEditor = () => editorRef.current?.focus();

    useImperativeHandle(ref, () => ({
      quote: (s) => insertQuote(s),
      focusEditor,
    }));

    const insertQuote = (s: { id?: string; username: string; text: string; parentId?: string | null }) => {
      focusEditor();
      if (!editorRef.current) return;
      const html = `<blockquote><p><strong>@${s.username}</strong>:</p>${sanitize(
        s.text
      )}</blockquote><p><br/></p>`;
      editorRef.current.innerHTML += html;
      setReplyParentId(s.parentId ?? s.id ?? null);
      setReplyContext({ username: s.username, commentId: s.id });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editorRef.current || !editorRef.current.innerHTML.trim()) return;
      setSubmitting(true);
      try {
        await createComment(postId, editorRef.current.innerHTML, replyParentId ?? undefined);
        editorRef.current.innerHTML = "";
        setEditorPlain("");
        setReplyParentId(null);
        setReplyContext({ username: "" });
        setRefreshKey((k) => k + 1);
      } finally {
        setSubmitting(false);
      }
    };

    const handleLike = async (id: string) => {
      const { liked, count } = await toggleCommentLike(id);
      setPageData((p) =>
        p
          ? {
              ...p,
              comments: p.comments.map((c) =>
                c.id === id ? { ...c, likes: count, likedByMe: liked } : c
              ),
              replies: p.replies.map((r) =>
                r.id === id ? { ...r, likes: count, likedByMe: liked } : r
              ),
            }
          : p
      );
    };

    const handleDelete = async (id: string) => {
      await deleteComment(id);
      setRefreshKey((k) => k + 1);
    };

    const renderComment = (c: CommentItem, depth = 0): JSX.Element => (
      <div
        key={c.id}
        className={`p-4 border border-white/10 rounded-lg bg-slate-800/30 backdrop-blur ${
          depth ? "ml-6" : ""
        }`}
      >
        <div className="flex gap-3 items-start">
          <img
            src={c.avatarUrl ?? "/defaultPfp.png"}
            alt={c.username}
            className="h-10 w-10 aspect-square flex-shrink-0 rounded-full object-cover ring-2 ring-white/15"
          />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div>
                <Link
                  to={`/users/${c.username}/posts`}
                  className="text-sm font-semibold text-teal-300 hover:underline"
                >
                  @{c.username}
                </Link>
                <div className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                </div>
              </div>
              {user?.id === c.authorId && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              )}
            </div>

            {/* ✅ Left-aligned text (normal flow) */}
            <div
              className="text-sm leading-relaxed text-gray-200 prose prose-invert"
              dangerouslySetInnerHTML={{ __html: sanitize(c.text) }}
            />

            <div className="flex gap-4 text-xs text-slate-300">
              <button
                onClick={() => handleLike(c.id)}
                className="flex items-center gap-1 hover:text-teal-300"
              >
                <Star
                  className="h-4 w-4"
                  fill={c.likedByMe ? "currentColor" : "none"}
                />{" "}
                {c.likes}
              </button>
              <button
                onClick={() => {
                  setReplyParentId(c.id);
                  setReplyContext({ username: c.username, commentId: c.id });
                  focusEditor();
                }}
                className="flex items-center gap-1 hover:text-teal-300"
              >
                <Reply className="h-4 w-4" /> Reply
              </button>
              <button
                onClick={() =>
                  insertQuote({
                    id: c.id,
                    username: c.username,
                    text: c.text,
                    parentId: c.parentId ?? c.id,
                  })
                }
                className="flex items-center gap-1 hover:text-teal-300"
              >
                <Quote className="h-4 w-4" /> Quote
              </button>
            </div>
          </div>
        </div>

        {(repliesByParent.get(c.id) ?? []).length > 0 && (
          <div className="mt-2 space-y-2 border-l border-white/10 pl-4">
            {repliesByParent.get(c.id)?.map((r) => renderComment(r, depth + 1))}
          </div>
        )}
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">{pageData?.total ?? 0} replies</span>
        </div>

        {user ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-3 border border-white/10 bg-gray-950/70 rounded-xl p-3 backdrop-blur"
          >
            {replyParentId && (
              <div className="text-xs text-gray-300">
                Replying to{" "}
                <span className="text-teal-300">@{replyContext.username}</span>
                <button
                  type="button"
                  className="ml-2 text-teal-300 hover:underline"
                  onClick={() => {
                    setReplyParentId(null);
                    setReplyContext({ username: "" });
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            <div
              ref={editorRef}
              contentEditable
              onInput={() => setEditorPlain(editorRef.current?.textContent ?? "")}
              className="min-h-[3rem] max-h-[8rem] overflow-y-auto border border-white/10 bg-gray-900/80 rounded-lg px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-teal-400 outline-none pretty-scroll scrollbar-cute"
              suppressContentEditableWarning
            />

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {["B", "I", "•", "1."].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="border border-white/10 px-2 py-1 rounded-md text-sm text-gray-200 hover:bg-white/10"
                    onClick={() =>
                      document.execCommand(
                        t === "B"
                          ? "bold"
                          : t === "I"
                          ? "italic"
                          : t === "•"
                          ? "insertUnorderedList"
                          : "insertOrderedList"
                      )
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={!editorPlain.trim() || submitting}
                className="flex items-center gap-2 rounded-full bg-teal-500 hover:bg-teal-400 text-gray-900 font-semibold text-sm px-4 py-1.5 disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Post reply
              </button>
            </div>
          </form>
        ) : (
          <div className="border border-white/10 bg-gray-900/70 text-sm text-gray-300 rounded-xl p-3 text-center">
            Sign in to join the discussion.
          </div>
        )}

        {/* Scrollable container */}
        <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 p-3 pretty-scroll scrollbar-cute">
          {loading ? (
            <CommentsSkeleton />
          ) : error ? (
            <div className="text-red-300">{error}</div>
          ) : (
            <>
              {pageData && pageData.comments.length > 0 ? (
                <div className="space-y-4">{pageData.comments.map((c) => renderComment(c))}</div>
              ) : (
                <div className="text-gray-400 text-center py-6 border border-dashed border-white/10 rounded-xl">
                  No replies yet — be the first to join the conversation.
                </div>
              )}

              {pageData && pageData.total > pageData.comments.length && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="text-sm text-teal-300 hover:underline"
                  >
                    Load more replies
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);

Comments.displayName = "Comments";
export default Comments;
