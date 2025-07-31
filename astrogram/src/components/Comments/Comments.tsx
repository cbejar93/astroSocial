
import { MoreVertical, Star } from 'lucide-react';
import React, { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchComments, createComment, deleteComment, toggleCommentLike } from '../../lib/api';

export interface CommentItem {
  id: string;
  text: string;
  authorId: string;
  username: string;
  avatarUrl: string;
  timestamp: string;
  likes: number;
  likedByMe?: boolean;
}

const Comments: React.FC<{ postId: string }> = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchComments<CommentItem>(postId)
      .then((data) => data.map((c) => ({ ...c, likedByMe: c.likedByMe ?? false })))
      .then(setComments)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const newComment = await createComment<CommentItem>(postId, text.trim());
      setComments((c) => [...c, { ...newComment, likedByMe: false }]);
      setText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const { liked, count } = await toggleCommentLike(id);
      setComments((cs) =>
        cs.map((cm) =>
          cm.id === id ? { ...cm, likes: count, likedByMe: liked } : cm,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComment(id);
      setComments((c) => c.filter((cm) => cm.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mt-4">
      {user && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-gray-700 text-gray-100 rounded-md p-2"
            placeholder="Write a comment..."
            rows={2}
          />
          <button
            type="submit"
            className="self-end px-3 py-2 bg-brand text-white rounded-md hover:bg-brand-dark"
          >
            Post
          </button>
        </form>
      )}

      {loading ? (
        <div>Loading comments…</div>
      ) : (
        comments.map((c) => (
          <div
            key={c.id}
            className="flex gap-2 py-2 relative border-t border-b border-white/20"
          >
            <img
              src={c.avatarUrl}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1">
              <Link to={`/users/${c.username}/posts`} className="text-sm text-teal-400 hover:underline">@{c.username}</Link>
              <div className="text-sm text-gray-200">{c.text}</div>
              <button
                type="button"
                onClick={() => handleLike(c.id)}
                className="btn-unstyled btn-action mt-1 text-white hover:text-gray-300"
              >
                <Star className="w-4 h-4" fill={c.likedByMe ? 'currentColor' : 'none'} />
                <span className="ml-1 text-xs">{c.likes}</span>
              </button>
            </div>
            {user?.id === c.authorId && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpenId(menuOpenId === c.id ? null : c.id)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpenId === c.id && (
                  <div className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-800 rounded shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 z-10">
                    <button
                      onClick={() => {
                        handleDelete(c.id);
                        setMenuOpenId(null);
                      }}
                      className="block w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-700 hover:text-red-600 transition-colors text-left"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Comments;
