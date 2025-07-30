import React, { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchComments, createComment, deleteComment } from '../../lib/api';

export interface CommentItem {
  id: string;
  text: string;
  authorId: string;
  username: string;
  avatarUrl: string;
  timestamp: string;
  likes: number;
}

const Comments: React.FC<{ postId: string }> = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchComments<CommentItem>(postId)
      .then(setComments)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const newComment = await createComment<CommentItem>(postId, text.trim());
      setComments((c) => [...c, newComment]);
      setText('');
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
    <div className="mt-4 space-y-4">
      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2 items-start">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-gray-700 text-gray-100 rounded-md p-2"
            placeholder="Write a comment..."
            rows={2}
          />
          <button
            type="submit"
            className="px-3 py-2 bg-purple-600 rounded-md hover:bg-purple-700"
          >
            Post
          </button>
        </form>
      )}

      {loading ? (
        <div>Loading comments…</div>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex gap-2">
            <img
              src={c.avatarUrl}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="text-sm text-teal-400">@{c.username}</div>
              <div className="text-sm text-gray-200">{c.text}</div>
            </div>
            {user?.id === c.authorId && (
              <button
                onClick={() => handleDelete(c.id)}
                className="text-xs text-red-500 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Comments;
