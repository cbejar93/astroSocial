import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Star } from 'lucide-react';
import PostCard, { type PostCardProps } from '../components/PostCard/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  fetchMyPosts,
  fetchMyComments,
  updateAvatar,
  deleteProfile,
  toggleCommentLike,
} from '../lib/api';

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

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<'posts' | 'comments' | 'profile'>('posts');
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPosts<PostCardProps>()
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchMyComments<CommentItem>()
      .then(setComments)
      .catch(() => {});
  }, []);

  // revoke preview URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!user) return <div className="p-4">Please sign in.</div>;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setAvatarFile(f);
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    await updateAvatar(user.username || '', avatarFile);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!confirm('Delete your account? This cannot be undone.')) return;
    await deleteProfile();
    logout();
    navigate('/signup');
  };

  const handleLike = async (id: string) => {
    try {
      const { liked, count } = await toggleCommentLike(id);
      setComments((cs) =>
        cs.map((c) =>
          c.id === id ? { ...c, likes: count, likedByMe: liked } : c,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto text-gray-200">
      {/* Tabs */}
      <div className="border-b border-gray-700 mb-4">
        <nav className="-mb-px flex justify-center space-x-8" aria-label="Profile tabs">
          <button
            onClick={() => setActive('posts')}
            type="button"
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors duration-200 ${
              active === 'posts'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-200'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActive('comments')}
            type="button"
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors duration-200 ${
              active === 'comments'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-200'
            }`}
          >
            Comments
          </button>
          <button
            onClick={() => setActive('profile')}
            type="button"
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors duration-200 ${
              active === 'profile'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-200'
            }`}
          >
            Profile
          </button>
        </nav>
      </div>

      {active === 'posts' && (
        <div className="space-y-4">
          {loading ? (
            <div>Loading…</div>
          ) : (
            posts.map((p) => <PostCard key={p.id} {...p} />)
          )}
        </div>
      )}

      {active === 'comments' && (
        <ul className="space-y-4">
          {comments.length === 0 && (
            <li className="text-center text-gray-400">No comments yet.</li>
          )}
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2 border-b border-white/20 pb-2">
              <img
                src={c.avatarUrl}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="text-sm text-teal-400">@{c.username}</div>
                <div className="text-sm text-gray-200">{c.text}</div>
                <div className="flex items-center text-xs text-gray-400 mt-1">
                  <button
                    type="button"
                    onClick={() => handleLike(c.id)}
                    className="mr-2 flex items-center text-yellow-400 hover:text-yellow-300"
                  >
                    <Star
                      className="w-4 h-4"
                      fill={c.likedByMe ? 'currentColor' : 'none'}
                    />
                    <span className="ml-1">{c.likes}</span>
                  </button>
                  <span>{formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {active === 'profile' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <img
              src={previewUrl || user.avatarUrl}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover"
            />
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
            <button
              onClick={handleAvatarUpload}
              className="px-3 py-1 bg-purple-600 rounded"
            >
              Change Picture
            </button>
          </div>
          <button
            onClick={handleDelete}
            className="px-3 py-1 bg-red-600 rounded"
          >
            Delete Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
