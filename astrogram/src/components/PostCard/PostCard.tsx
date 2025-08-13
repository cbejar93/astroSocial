import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from "date-fns";
import { Star, MessageCircle, Share2, Repeat2, Bookmark, MoreVertical } from "lucide-react";
import { sharePost, repostPost, apiFetch } from '../../lib/api';
import { useAuth } from "../../contexts/AuthContext";


export interface PostCardProps {
  id: string
  authorId: string
  username: string;
  title?: string;
  imageUrl?: string;
  caption: string;
  timestamp: string;
  stars?: number;
  comments?: number;
  shares?: number;
  reposts?: number;
  avatarUrl: string;
  likedByMe?: boolean;
  repostedByMe?: boolean;
  onDeleted?: (id: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  username,
  imageUrl,
  avatarUrl,
  caption,
  timestamp,
  stars = 0,
  comments = 0,
  shares = 0,
  reposts = 0,
  likedByMe,
  repostedByMe,
  authorId,
  onDeleted
}) => {

  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwn = user?.id === authorId;

  const [liked, setLiked] = useState(likedByMe);
  const [starCount, setStarCount] = useState(stars);
  const [commentCount] = useState(comments);
  const [shareCount, setShareCount] = useState(shares);
  const [reposted, setReposted] = useState(Boolean(repostedByMe));
  const [repostCount, setRepostCount] = useState(reposts);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLike = async () => {
    try {
      const res = await apiFetch(`/posts/${id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('Like toggle failed');
      const { liked, count } = await res.json();
      setLiked(liked);
      setStarCount(count);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${id}`;

    try {
      const { count } = await sharePost(id);
      setShareCount(count);
    } catch (err) {
      console.error("Failed to share:", err);
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s post`,
          text: caption,
          url: postUrl,
        });
      } catch (err) {
        console.warn("User cancelled share or error:", err);
      }
    } else {
      // fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(postUrl);
        alert("Link copied to clipboard!");
      } catch {
        prompt("Copy this link to share:", postUrl);
      }
    }
  };

  const handleRepost = async () => {
    if (reposted) return;
      try {
        const { count } = await repostPost(id);
        setRepostCount(count);
        setReposted(true);
        setShareCount(prev => prev); // share count unaffected by repost
      } catch (err: unknown) {
        console.error("Failed to repost:", err);
      }
  };

  // close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleDelete = async () => {
    setMenuOpen(false);

    try {
      const res = await apiFetch(`/posts/delete/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to delete post');
      }

      // inform parent so it can remove this post from the UI
      onDeleted?.(id);
    } catch (err: unknown) {
      console.error('Delete post error:', err);
      // you could show a toast here
    }
  };

  return (
    <div className="w-full py-0 sm:py-2 sm:px-2">
      <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden border border-gray-300 dark:border-gray-700 w-full sm:max-w-2xl sm:mx-auto">

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <Link
            to={`/users/${username}/posts`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 hover:underline"
          >
            <img
              src={avatarUrl}
              alt={`${username}'s profile`}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="font-semibold text-teal-400 text-sm">@{username}</span>
          </Link>
          <div className="flex items-center gap-2">
            {timestamp && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
              </span>
            )}
            {isOwn && (
              <div ref={menuRef} className="relative" onClick={stop}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded shadow-lg z-10">
                    <button
                      onClick={handleDelete}
                      className="block w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                    >
                      Delete Post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Image */}
        {imageUrl && (
          <div className="w-full aspect-video overflow-hidden">
            <img
              src={imageUrl}
              alt={`Post by ${username}: ${caption}`}
              className="object-cover w-full h-full"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/fallback.jpg.png";
              }}
            />
          </div>
        )}

        {/* Caption */}
        <div className="px-4 sm:px-6 py-4 text-sm">{caption}</div>

        {/* Action Buttons */}
        <div onClick={stop} className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-evenly items-center text-gray-400 dark:text-gray-300 text-sm">

            {/* Like */}
            <button
              type="button"
              onClick={handleLike}
              className="btn-unstyled btn-action text-white hover:text-gray-300"
            >
              <Star className="w-5 h-5" fill={liked ? "currentColor" : "none"} />
              <span className="ml-1">{starCount}</span>
            </button>

            {/* Repost */}
            <button
              type="button"
              onClick={handleRepost}
              className="btn-unstyled btn-action hover:text-green-400"
            >
              <Repeat2 className="w-5 h-5" />
              <span>{repostCount}</span>
            </button>

            {/* Comment */}
            <button
              type="button"
              onClick={() => navigate(`/posts/${id}`)}
              className="btn-unstyled btn-action hover:text-violet-400"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{commentCount}</span>
            </button>

            {/* Save */}
            <button
              type="button"
              onClick={() => setSaved(s => !s)}
              className="btn-unstyled btn-action hover:text-blue-400"
            >
              <Bookmark className="w-5 h-5" fill={saved ? "currentColor" : "none"} />
              <span>{saved ? 1 : 0}</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="btn-unstyled btn-action hover:text-violet-400"
            >
              <Share2 className="w-5 h-5" />
              <span>{shareCount}</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;