import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Star } from 'lucide-react';
import PostCard, { type PostCardProps } from '../components/PostCard/PostCard';
import PageContainer from '../components/Layout/PageContainer';
import { useAuth } from '../hooks/useAuth';
import { Link, useParams } from 'react-router-dom';
import {
  fetchUserPosts,
  fetchUserComments,
  toggleCommentLike,
  fetchUser,
  fetchUserStats,
  type UserStats,
} from '../lib/api';
import MilestoneBadge from '../components/MilestoneBadge';

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

interface UserInfo {
  id: string;
  username: string;
  avatarUrl?: string;
  followers?: string[];
  following?: string[];
}

const UserPage: React.FC = () => {
  const { user, updateFollowingUser } = useAuth();
  const { username = '', tab } = useParams<{ username: string; tab?: string }>();
  const active: 'posts' | 'comments' = tab === 'comments' ? 'comments' : 'posts';
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isFollowing = user?.following?.includes(info?.id ?? '') ?? false;
  const encodedUsername = encodeURIComponent(username);

  useEffect(() => {
    if (!username) return;
    fetchUser<UserInfo>(username).then(setInfo).catch(() => {});
    fetchUserStats(username).then(setStats).catch(() => {});
    fetchUserPosts<PostCardProps>(username)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchUserComments<CommentItem>(username)
      .then(setComments)
      .catch(() => {});
  }, [username]);

  const handleLike = async (id: string) => {
    try {
      const { liked, count } = await toggleCommentLike(id);
      setComments((cs) =>
        cs.map((c) => (c.id === id ? { ...c, likes: count, likedByMe: liked } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async () => {
    if (!info || !user) return;
    await updateFollowingUser(info.id, info.username, !isFollowing);
    setInfo((prev) => {
      if (!prev) return prev;
      const current = prev.followers ?? [];
      const followers = !isFollowing
        ? [...current, user.id]
        : current.filter((id) => id !== user.id);
      return { ...prev, followers };
    });
  };

  return (
    <PageContainer size="narrow" className="py-8 text-gray-200">
        {info && (
          <>
            <div className="flex items-center space-x-2 mb-2">
              <img
                src={info.avatarUrl ?? '/defaultPfp.png'}
                alt="avatar"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold">@{info.username}</h2>
                {stats && stats.postMilestone > 0 && (
                  <MilestoneBadge postMilestone={stats.postMilestone} className="mt-0.5" />
                )}
              </div>
              {user && user.id !== info.id && (
                <button
                  type="button"
                  onClick={handleFollow}
                  className="ml-auto shrink-0 px-2 py-1 bg-neutral-700 rounded text-xs text-neutral-200"
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
            <div className="text-sm text-gray-400 mb-3">
              <span className="mr-4">
                <span className="font-semibold text-white">Trackers</span>{" "}
                {stats?.followerCount ?? info.followers?.length ?? 0}
              </span>
              <span className="mr-4">
                <span className="font-semibold text-white">Tracking</span>{" "}
                {stats?.followingCount ?? info.following?.length ?? 0}
              </span>
              {stats && (
                <span>
                  <span className="font-semibold text-white">Posts</span>{" "}
                  {stats.postCount}
                </span>
              )}
            </div>
            {stats && stats.currentStreak > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm mb-4">
                <span className={stats.currentStreak >= 3 ? 'animate-pulse' : ''} aria-hidden>🔥</span>
                <span className="font-semibold">{stats.currentStreak}-day</span>
                <span className="text-gray-400">posting streak</span>
                {stats.longestStreak > stats.currentStreak && (
                  <span className="text-xs text-gray-500">
                    · best: {stats.longestStreak}d
                  </span>
                )}
              </div>
            )}
          </>
        )}
        <div className="border-b border-gray-700 mb-4 pt-4">
          <nav className="-mb-px flex justify-center space-x-8" aria-label="User tabs">
            <Link
              to={`/users/${encodedUsername}/posts`}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-bold text-sm hover:no-underline transition-colors duration-200 ${
                active === 'posts'
                  ? 'border-brand text-white'
                  : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Posts
            </Link>
            <Link
              to={`/users/${encodedUsername}/comments`}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-bold text-sm hover:no-underline transition-colors duration-200 ${
                active === 'comments'
                  ? 'border-brand text-white'
                  : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Comments
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
                  src={c.avatarUrl ?? '/defaultPfp.png'}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="text-sm text-teal-400">@{c.username}</div>
                  <div className="text-sm text-gray-200">{c.text}</div>
                  {user && (
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
                      <span>
                        {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                  {!user && (
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Star className="w-4 h-4" fill="none" />
                      <span className="ml-1">{c.likes}</span>
                      <span className="ml-2">
                        {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
    </PageContainer>
  );
};

export default UserPage;
