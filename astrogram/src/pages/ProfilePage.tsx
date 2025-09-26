import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Star, UploadCloud, MoreVertical } from 'lucide-react';
import PostCard, { type PostCardProps } from '../components/PostCard/PostCard';
import { useAuth } from '../hooks/useAuth';
import ConfirmModal from '../components/Modal/ConfirmModal';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  fetchMyPosts,
  fetchMyComments,
  updateAvatar,
  deleteProfile,
  toggleCommentLike,
  apiFetch,
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

interface MyPost extends PostCardProps {
  loungeId?: string;
  loungeName?: string;
  title?: string;
}

export default function ProfilePage(): JSX.Element {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const active: 'posts' | 'comments' | 'profile' =
    tab === 'comments' ? 'comments' : tab === 'me' ? 'profile' : 'posts';
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const handler = () => setMenuPostId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    fetchMyPosts<MyPost>()
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

  if (!user)
    return (
      <div className="w-full py-8 lg:pl-64 flex justify-center">
        <div className="w-full max-w-3xl px-0 sm:px-4">Please sign in.</div>
      </div>
    );

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setAvatarError('Only image files are allowed.');
      setAvatarFile(null);
      setPreviewUrl(null);
      return;
    }
    setAvatarError(null);
    setAvatarFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
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


  const handleLoungeDelete = async (id: string) => {
    setMenuPostId(null);
    try {
      const res = await apiFetch(`/posts/delete/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post');
      setPosts((ps) => ps.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }

  };

  const handleLogout = () => {
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

  const generalPosts = posts.filter((p) => !p.loungeId);
  const loungePosts = posts.filter((p) => p.loungeId);

  return (
    <div className="w-full py-8 lg:pl-64 flex justify-center">
      <div className="w-full max-w-3xl px-0 sm:px-4 text-gray-200">
      {/* Profile header */}
      <div className="flex items-center mb-4">
        <img
          src={user.avatarUrl ?? '/defaultPfp.png'}
          alt="avatar"
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="ml-4">
          <div className="text-xl font-bold">{user.username}</div>
          <div className="text-sm text-gray-400">
            <span className="mr-4"><span className="font-semibold text-white">Trackers</span> {user.followers?.length ?? 0}</span>
            <span><span className="font-semibold text-white">Tracking</span> {user.following?.length ?? 0}</span>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b border-gray-700 mb-4 pt-4">
        <nav className="-mb-px flex justify-center space-x-8" aria-label="Profile tabs">
          <Link
            to="/profile/posts"
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-bold text-sm hover:no-underline transition-colors duration-200 ${
              active === 'posts'
                ? 'border-brand text-white'
                : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Posts
          </Link>
          <Link
            to="/profile/comments"
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-bold text-sm hover:no-underline transition-colors duration-200 ${
              active === 'comments'
                ? 'border-brand text-white'
                : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Comments
          </Link>
          <Link
            to="/profile/me"
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-bold text-sm hover:no-underline transition-colors duration-200 ${
              active === 'profile'
                ? 'border-brand text-white'
                : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Profile
          </Link>
        </nav>
      </div>

      {active === 'posts' && (
        <div className="space-y-8">
          {loading ? (
            <div>Loading…</div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold">Posts</h3>
                {generalPosts.length === 0 && (
                  <div className="text-center text-gray-400">No posts yet.</div>
                )}
                {generalPosts.map((p) => (
                  <PostCard
                    key={p.id}
                    {...p}
                    onDeleted={(id) =>
                      setPosts((ps) => ps.filter((post) => post.id !== id))
                    }
                  />
                ))}
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Lounge Posts</h3>
                {loungePosts.length === 0 && (
                  <div className="text-center text-gray-400">
                    No lounge posts yet.
                  </div>
                )}
                {loungePosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() =>
                      navigate(
                        `/lounge/${encodeURIComponent(post.loungeName ?? '')}/posts/${post.id}`,
                      )
                    }
                  >
                    <div className="flex items-center mb-1">
                      <img
                        src={post.avatarUrl ?? '/defaultPfp.png'}
                        alt={`${post.username} avatar`}
                        className="w-8 h-8 rounded-full object-cover mr-2"
                      />
                      <span className="font-medium">{post.username}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(post.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {post.comments} replies
                        </span>
                        <div
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuPostId((id) =>
                                id === post.id ? null : post.id,
                              );
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {menuPostId === post.id && (
                            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded shadow-lg z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLoungeDelete(post.id);
                                }}
                                className="block w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                              >
                                Delete Post
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <h2 className="text-lg font-semibold">{post.title}</h2>
                  </div>
                ))}
              </div>
            </>
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
                src={c.avatarUrl ?? '/defaultPfp.png'}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <Link to={`/users/${c.username}/posts`} className="text-sm text-teal-400 hover:underline">@{c.username}</Link>
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
        <div className="space-y-8">
          <section className="space-y-4 p-4 border border-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold">Profile Picture</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
              <img
                src={previewUrl ?? user.avatarUrl ?? '/defaultPfp.png'}
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
                  <span className="mt-2 text-xs text-gray-300 truncate">
                    {avatarFile.name}
                  </span>
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
              {avatarError && (
                <p className="text-red-500 text-sm mt-2">{avatarError}</p>
              )}
              <button
                onClick={handleAvatarUpload}
                className="px-3 py-1 bg-brand hover:bg-brand-dark rounded"
              >
                Save Avatar
              </button>
            </div>
          </section>
          <section className="space-y-4 p-4 border border-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold">Account</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded"
              >
                Logout
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
              >
                Delete Profile
              </button>
            </div>
          </section>
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
    </div>
  );
};

