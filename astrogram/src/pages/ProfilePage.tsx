import React, { useEffect, useState } from 'react';
import PostCard, { type PostCardProps } from '../components/PostCard/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  fetchMyPosts,
  fetchMyComments,
  updateAvatar,
  deleteProfile,
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

  if (!user) return <div className="p-4">Please sign in.</div>;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setAvatarFile(f);
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

  return (
    <div className="p-4 max-w-2xl mx-auto text-gray-200">
      {/* Tabs */}
      <div className="border-b border-gray-700 mb-4">
        <nav className="-mb-px flex space-x-8" aria-label="Profile tabs">
          <button
            onClick={() => setActive('posts')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              active === 'posts'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-200'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActive('comments')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              active === 'comments'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-200'
            }`}
          >
            Comments
          </button>
          <button
            onClick={() => setActive('profile')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
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
          {comments.map((c) => (
            <li key={c.id} className="border-b border-white/20 pb-2">
              <div className="text-teal-400 text-sm">@{c.username}</div>
              <div className="text-sm">{c.text}</div>
            </li>
          ))}
        </ul>
      )}

      {active === 'profile' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatarUrl}
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
