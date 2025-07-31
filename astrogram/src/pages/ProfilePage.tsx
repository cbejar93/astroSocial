import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Star, UploadCloud } from 'lucide-react';
import PostCard, { type PostCardProps } from '../components/PostCard/PostCard';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/Modal/ConfirmModal';
import { useNavigate, Link, useParams } from 'react-router-dom';
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
  const { tab } = useParams<{ tab?: string }>();
  const active: 'posts' | 'comments' | 'profile' =
    tab === 'comments' ? 'comments' : tab === 'me' ? 'profile' : 'posts';
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
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
      <div className="border-b border-gray-700 mb-4 pt-4">
        <nav className="-mb-px flex justify-center space-x-8" aria-label="Profile tabs">
          <Link
            to="/profile/posts"
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-bold text-sm hover:no-underline transition-colors duration-200 ${
              active === 'posts'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Posts
          </Link>
          <Link
            to="/profile/comments"
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-bold text-sm hover:no-underline transition-colors duration-200 ${
              active === 'comments'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Comments
          </Link>
          <Link
            to="/profile/me"
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-bold text-sm hover:no-underline transition-colors duration-200 ${
              active === 'profile'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Profile
          </Link>
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
                    className="mr-2 flex items-center text-white hover:text-gray-300"
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
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
            <img
              src={previewUrl || user.avatarUrl}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover"
            />
            <label
              htmlFor="avatar-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 hover:border-teal-400 p-4 rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition"
            >
              <UploadCloud className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">
                {avatarFile ? 'Change' : 'Click to upload'} picture
              </span>
              {avatarFile && (
                <span className="mt-2 text-xs text-gray-300 truncate">{avatarFile.name}</span>
              )}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="mt-4 w-16 h-16 object-cover rounded-full"
                />
              )}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </label>
            <button
              onClick={handleAvatarUpload}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded"
            >
              Save Avatar
            </button>
          </div>
          <button
            onClick={handleDelete}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
          >
            Delete Profile
          </button>
        </div>
      )}
      {showConfirm && (
        <ConfirmModal
          message="Delete your account? This cannot be undone."
          onCancel={() => setShowConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default ProfilePage;
