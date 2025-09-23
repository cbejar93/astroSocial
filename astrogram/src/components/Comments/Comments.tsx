import {
  MoreVertical,
  Star,
  Send,
  Quote,
  Reply,
} from 'lucide-react';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
} from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import CommentsSkeleton from './CommentsSkeleton';
import {
  fetchCommentPage,
  createComment,
  deleteComment,
  toggleCommentLike,
  fetchCommentById,
  type CommentResponse,
  type PaginatedCommentsResponse,
} from '../../lib/api';

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

type QuoteSource = { id?: string; username: string; text: string; parentId?: string | null };

type CommentsState = PaginatedCommentsResponse<CommentItem> | null;

const Comments = React.forwardRef<CommentsHandle, CommentsProps>(
  ({ postId, pageSize = 10, initialPage = 1 }, ref) => {
    const { user } = useAuth();
    const [pageData, setPageData] = useState<CommentsState>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [refreshKey, setRefreshKey] = useState(0);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [replyParentId, setReplyParentId] = useState<string | null>(null);
    const [replyContext, setReplyContext] = useState<
      { username: string; commentId?: string; parentId?: string | null } | null
    >(null);
    const [editorPlain, setEditorPlain] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setCurrentPage(initialPage);
    }, [initialPage, postId]);

    useEffect(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);

      const normalizeComment = (comment: CommentResponse): CommentItem => ({
        ...comment,
        parentId: comment.parentId ?? null,
        likedByMe: comment.likedByMe ?? false,
      });

      fetchCommentPage(postId, currentPage, pageSize)
        .then((data) => {
          if (cancelled) return;
          const normalized: PaginatedCommentsResponse<CommentItem> = {
            ...data,
            comments: data.comments.map(normalizeComment),
            replies: data.replies.map(normalizeComment),
          };
          setPageData(normalized);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          console.error(err);
          setError('Could not load replies.');
          setPageData(null);
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [postId, currentPage, pageSize, refreshKey]);

    useEffect(() => {
      const closeMenu = () => setMenuOpenId(null);
      document.addEventListener('click', closeMenu);
      return () => document.removeEventListener('click', closeMenu);
    }, []);

    const repliesByParent = useMemo(() => {
      const map = new Map<string, CommentItem[]>();
      pageData?.replies.forEach((reply) => {
        if (!reply.parentId) return;
        const bucket = map.get(reply.parentId) ?? [];
        bucket.push(reply);
        map.set(reply.parentId, bucket);
      });
      return map;
    }, [pageData]);

    const allComments = useMemo(
      () => (pageData ? [...pageData.comments, ...pageData.replies] : []),
      [pageData],
    );

    const totalPages = useMemo(() => {
      if (!pageData) return 1;
      return Math.max(1, Math.ceil(Math.max(pageData.total, 0) / pageData.limit));
    }, [pageData]);

    const focusEditor = () => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.addRange(range);
      }
    };

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const insertQuote = (source: QuoteSource) => {
      focusEditor();
      const editor = editorRef.current;
      if (!editor) return;
      const parentId = source.parentId ?? source.id ?? null;
      const quoteHtml =
        `<blockquote><p><strong>@${escapeHtml(source.username)}</strong> wrote:</p>` +
        `<p>${escapeHtml(source.text)}</p></blockquote><p><br></p>`;
      try {
        if (document.queryCommandSupported('insertHTML')) {
          document.execCommand('insertHTML', false, quoteHtml);
        } else {
          editor.innerHTML += quoteHtml;
        }
      } catch {
        editor.innerHTML += quoteHtml;
      }
      setReplyParentId(parentId);
      setReplyContext({ username: source.username, commentId: source.id, parentId });
      setEditorPlain(editor.textContent ?? '');
    };

    useImperativeHandle(ref, () => ({
      quote: (source: QuoteSource) => {
        insertQuote(source);
      },
      focusEditor: () => {
        focusEditor();
      },
    }));

    const handleQuoteComment = async (commentId: string) => {
      try {
        let comment = allComments.find((c) => c.id === commentId);
        if (!comment) {
          const fetched = await fetchCommentById<CommentResponse>(commentId);
          comment = {
            ...fetched,
            parentId: fetched.parentId ?? null,
            likedByMe: fetched.likedByMe ?? false,
          };
        }
        insertQuote({
          id: comment.id,
          username: comment.username,
          text: comment.text,
          parentId: comment.parentId ?? comment.id,
        });
      } catch (err) {
        console.error(err);
      }
    };

    const handleReplyToComment = (comment: CommentItem) => {
      const parentId = comment.parentId ?? comment.id;
      setReplyParentId(parentId);
      setReplyContext({ username: comment.username, commentId: comment.id, parentId });
      focusEditor();
    };

    const handleEditorInput = () => {
      const editor = editorRef.current;
      setEditorPlain(editor?.textContent ?? '');
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      focusEditor();
      document.execCommand('insertText', false, text);
      handleEditorInput();
    };

    const handleToolbarCommand = (command: 'bold' | 'italic' | 'bullet' | 'numbered') => {
      const commandMap: Record<typeof command, string> = {
        bold: 'bold',
        italic: 'italic',
        bullet: 'insertUnorderedList',
        numbered: 'insertOrderedList',
      };
      focusEditor();
      document.execCommand(commandMap[command]);
      handleEditorInput();
    };

    const isEditorEmpty = editorPlain.trim().length === 0;

    const handleQuickReplySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !editorRef.current || isEditorEmpty) return;
      const html = editorRef.current.innerHTML.trim();
      if (!html) return;

      const parentId = replyParentId ?? undefined;
      const limit = pageData?.limit ?? pageSize;
      const currentTotal = pageData?.total ?? 0;
      const expectedPage = parentId
        ? currentPage
        : Math.max(1, Math.ceil((currentTotal + 1) / limit));

      setSubmitting(true);
      try {
        await createComment(postId, html, parentId);
        if (parentId) {
          setRefreshKey((key) => key + 1);
        } else if (expectedPage !== currentPage) {
          setCurrentPage(expectedPage);
        } else {
          setRefreshKey((key) => key + 1);
        }
        editorRef.current.innerHTML = '';
        setEditorPlain('');
        setReplyParentId(null);
        setReplyContext(null);
      } catch (err) {
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    };

    const handleLike = async (commentId: string) => {
      try {
        const { liked, count } = await toggleCommentLike(commentId);
        setPageData((prev) => {
          if (!prev) return prev;
          const updateList = (list: CommentItem[]) =>
            list.map((item) =>
              item.id === commentId
                ? { ...item, likes: count, likedByMe: liked }
                : item,
            );
          if (prev.comments.some((c) => c.id === commentId)) {
            return { ...prev, comments: updateList(prev.comments) };
          }
          if (prev.replies.some((r) => r.id === commentId)) {
            return { ...prev, replies: updateList(prev.replies) };
          }
          return prev;
        });
      } catch (err) {
        console.error(err);
      }
    };

    const handleDelete = async (commentId: string) => {
      try {
        await deleteComment(commentId);
        const isTopLevel = pageData?.comments.some((c) => c.id === commentId) ?? false;
        const limit = pageData?.limit ?? pageSize;
        const newTotal = Math.max(0, (pageData?.total ?? 0) - (isTopLevel ? 1 : 0));
        const newPage = Math.min(currentPage, Math.max(1, Math.ceil(newTotal / limit)));

        setPageData((prev) => {
          if (!prev) return prev;
          const comments = prev.comments.filter((c) => c.id !== commentId);
          const replies = prev.replies.filter(
            (r) => r.id !== commentId && r.parentId !== commentId,
          );
          return {
            ...prev,
            comments,
            replies,
            total: isTopLevel ? newTotal : prev.total,
          };
        });

        if (isTopLevel) {
          if (newPage !== currentPage) {
            setCurrentPage(newPage);
          } else {
            setRefreshKey((key) => key + 1);
          }
        } else {
          setRefreshKey((key) => key + 1);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const clearReplyContext = () => {
      setReplyContext(null);
      setReplyParentId(null);
    };

    const renderComment = (comment: CommentItem, depth = 0): JSX.Element => {
      const replies = repliesByParent.get(comment.id) ?? [];
      const isOwn = user?.id === comment.authorId;
      const containerClasses = [
        'rounded-xl border border-white/10 bg-gray-900/70 p-4 backdrop-blur',
      ];
      if (depth > 0) {
        containerClasses.push('ml-6');
      }

      return (
        <div key={comment.id} className={containerClasses.join(' ')}>
          <div className="flex items-start gap-3">
            <img
              src={comment.avatarUrl || '/images/default-avatar.png'}
              alt={`${comment.username} avatar`}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/users/${comment.username}/posts`}
                    className="text-sm font-semibold text-teal-400 hover:underline"
                  >
                    @{comment.username}
                  </Link>
                  <div className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.timestamp), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                {isOwn && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId((prev) => (prev === comment.id ? null : comment.id));
                      }}
                      className="rounded-full p-1 text-gray-400 transition hover:text-gray-200"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpenId === comment.id && (
                      <div className="absolute right-0 mt-2 w-32 rounded-lg border border-white/10 bg-gray-900 shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            void handleDelete(comment.id);
                            setMenuOpenId(null);
                          }}
                          className="block w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div
                className="prose prose-invert max-w-none text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: comment.text }}
              />
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={() => void handleLike(comment.id)}
                  className="inline-flex items-center gap-1 text-gray-300 transition hover:text-teal-300"
                >
                  <Star
                    className="h-4 w-4"
                    fill={comment.likedByMe ? 'currentColor' : 'none'}
                  />
                  <span>{comment.likes}</span>
                </button>
                {depth === 0 && (
                  <button
                    type="button"
                    onClick={() => handleReplyToComment(comment)}
                    className="inline-flex items-center gap-1 text-gray-300 transition hover:text-teal-300"
                  >
                    <Reply className="h-4 w-4" />
                    Reply
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleQuoteComment(comment.id)}
                  className="inline-flex items-center gap-1 text-gray-300 transition hover:text-teal-300"
                >
                  <Quote className="h-4 w-4" />
                  Quote
                </button>
              </div>
            </div>
          </div>
          {replies.length > 0 && (
            <div className="mt-4 space-y-4 border-l border-white/10 pl-4">
              {replies.map((reply) => renderComment(reply, depth + 1))}
            </div>
          )}
        </div>
      );
    };

    const PaginationControls = () => {
      if (!pageData) return null;
      const start = pageData.total === 0 ? 0 : (currentPage - 1) * pageData.limit + 1;
      const end = start === 0 ? 0 : start + pageData.comments.length - 1;
      return (
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-gray-900/70 px-4 py-3 text-xs text-gray-300 backdrop-blur md:flex-row md:items-center md:justify-between">
          <span>
            {pageData.total === 0
              ? 'No replies yet'
              : `Showing ${start}-${Math.min(end, pageData.total)} of ${pageData.total}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="rounded-full border border-white/10 px-3 py-1 text-gray-200 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/10"
            >
              Previous
            </button>
            <span className="font-semibold text-gray-100">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage >= totalPages}
              className="rounded-full border border-white/10 px-3 py-1 text-gray-200 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/10"
            >
              Next
            </button>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Thread Replies</h2>
          <span className="text-xs text-gray-400">
            {pageData?.total ?? 0} replies
          </span>
        </div>
        {loading ? (
          <CommentsSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : pageData && pageData.total > 0 ? (
          <>
            <PaginationControls />
            <div className="space-y-4">
              {pageData.comments.map((comment) => renderComment(comment))}
            </div>
            <PaginationControls />
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-gray-400">
            No replies yet—be the first to join the conversation.
          </div>
        )}

        <div className="sticky bottom-4 z-10">
          {user ? (
            <form
              onSubmit={handleQuickReplySubmit}
              className="space-y-3 rounded-2xl border border-white/10 bg-gray-950/90 p-4 shadow-2xl backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-100">
                  Reply to this topic
                </h3>
                {replyContext && (
                  <button
                    type="button"
                    onClick={() => {
                      clearReplyContext();
                      if (editorRef.current) {
                        editorRef.current.innerHTML = '';
                        setEditorPlain('');
                      }
                    }}
                    className="text-xs text-teal-300 hover:text-teal-200"
                  >
                    Clear quote
                  </button>
                )}
              </div>
              {replyContext && (
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300">
                  Replying to <span className="font-semibold">@{replyContext.username}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleToolbarCommand('bold')}
                  className="rounded-md border border-white/10 px-2 py-1 text-sm font-semibold text-gray-100 hover:bg-white/10"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => handleToolbarCommand('italic')}
                  className="rounded-md border border-white/10 px-2 py-1 text-sm italic text-gray-100 hover:bg-white/10"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => handleToolbarCommand('bullet')}
                  className="rounded-md border border-white/10 px-2 py-1 text-sm text-gray-100 hover:bg-white/10"
                >
                  •
                </button>
                <button
                  type="button"
                  onClick={() => handleToolbarCommand('numbered')}
                  className="rounded-md border border-white/10 px-2 py-1 text-sm text-gray-100 hover:bg-white/10"
                >
                  1.
                </button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                className="min-h-[6rem] w-full rounded-xl border border-white/10 bg-gray-900/80 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                onInput={handleEditorInput}
                onPaste={handlePaste}
                suppressContentEditableWarning
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || isEditorEmpty}
                  className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Post reply
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-white/10 bg-gray-900/70 px-4 py-3 text-sm text-gray-300 backdrop-blur">
              Sign in to join the discussion.
            </div>
          )}
        </div>
      </div>
    );
  },
);

Comments.displayName = 'Comments';

export default Comments;
