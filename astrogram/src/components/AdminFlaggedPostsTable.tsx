import React, { useEffect, useMemo, useState } from 'react';
import {
  deletePostAsAdmin,
  deleteUserAsAdmin,
  fetchFlaggedPosts,
  FlaggedPostSummary,
  FeedResponse,
} from '../lib/api';
import ConfirmModal from './Modal/ConfirmModal';

interface DeletionState {
  type: 'post' | 'user';
  post: FlaggedPostSummary;
}

const AdminFlaggedPostsTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [data, setData] = useState<FlaggedPostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<FlaggedPostSummary | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DeletionState | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response: FeedResponse<FlaggedPostSummary> = await fetchFlaggedPosts(
          page,
          limit,
        );
        if (cancelled) return;
        setData(response.posts);
        setTotal(response.total);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load flagged posts';
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, limit]);

  const handleDelete = async () => {
    if (!pendingDelete) return;

    try {
      if (pendingDelete.type === 'post') {
        await deletePostAsAdmin(pendingDelete.post.id);
      } else {
        await deleteUserAsAdmin(pendingDelete.post.author.id);
      }
      setPendingDelete(null);
      // Refresh the table after deletion
      const response = await fetchFlaggedPosts(page, limit);
      setTotal(response.total);
      setError(null);
      if (response.posts.length === 0 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        setData(response.posts);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete action';
      setError(message);
      setPendingDelete(null);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Flagged Posts</h2>
        <span className="text-sm text-gray-400">
          Page {page} of {totalPages}
        </span>
      </div>

      {error && (
        <div className="rounded-md border border-red-500 bg-red-900/40 p-3 text-red-100">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700 text-left text-sm">
          <thead className="bg-gray-800/60">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-200">Author</th>
              <th className="px-4 py-3 font-semibold text-gray-200">Text</th>
              <th className="px-4 py-3 font-semibold text-gray-200">Image</th>
              <th className="px-4 py-3 font-semibold text-gray-200">Flagged At</th>
              <th className="px-4 py-3 font-semibold text-gray-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900/40">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Loading flagged posts...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No flagged posts at the moment.
                </td>
              </tr>
            ) : (
              data.map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-3">
                      {post.author.avatarUrl ? (
                        <img
                          src={post.author.avatarUrl}
                          alt={post.author.username ?? 'User avatar'}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-700" />
                      )}
                      <div>
                        <div className="font-medium text-gray-100">
                          {post.author.username ?? 'Unknown user'}
                        </div>
                        <div className="text-xs text-gray-400">{post.author.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="max-w-xs text-gray-200">
                      {post.title && (
                        <div className="mb-1 text-sm font-semibold text-gray-100">
                          {post.title}
                        </div>
                      )}
                      <div className="max-h-24 overflow-hidden whitespace-pre-line text-sm text-gray-300">
                        {post.body}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {post.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreview(post)}
                        className="group relative block h-16 w-16 overflow-hidden rounded-md border border-gray-700"
                      >
                        <img
                          src={post.imageUrl}
                          alt={post.title || 'Flagged post image'}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">No image</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-gray-300">
                    {formatDate(post.createdAt)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPreview(post)}
                        className="rounded-md bg-gray-700 px-3 py-1.5 text-sm text-white transition hover:bg-gray-600"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete({ type: 'post', post })}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white transition hover:bg-red-700"
                      >
                        Delete Post
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete({ type: 'user', post })}
                        className="rounded-md bg-orange-600 px-3 py-1.5 text-sm text-white transition hover:bg-orange-700"
                      >
                        Delete User
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-200 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <div className="text-sm text-gray-400">
          {total === 0
            ? 'Showing 0 of 0'
            : `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total}`}
        </div>
        <button
          type="button"
          onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
          disabled={page >= totalPages || loading}
          className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-200 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-gray-900 p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-100">
                  {preview.title || 'Flagged Post Preview'}
                </h3>
                <p className="text-xs text-gray-400">Post ID: {preview.id}</p>
                <p className="text-xs text-gray-400">Author ID: {preview.author.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-md bg-gray-700 px-3 py-1 text-sm text-gray-200 hover:bg-gray-600"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-gray-200">
              {preview.imageUrl && (
                <img
                  src={preview.imageUrl}
                  alt={preview.title || 'Flagged post image'}
                  className="max-h-96 w-full rounded-md object-contain"
                />
              )}
              <div className="whitespace-pre-wrap text-sm text-gray-200">
                {preview.body}
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmModal
          message={
            pendingDelete.type === 'post'
              ? 'Delete this post? This action cannot be undone.'
              : 'Delete the user who created this post? All of their content will be removed.'
          }
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
};

export default AdminFlaggedPostsTable;
