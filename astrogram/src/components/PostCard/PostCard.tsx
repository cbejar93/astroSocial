import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star, MessageCircle, Share2, Repeat2, Bookmark } from "lucide-react";
import { likePost, sharePost, repostPost, apiFetch } from '../../lib/api';

export interface PostCardProps {
  id: string
  username: string;
  imageUrl: string;
  caption: string;
  timestamp: string;
  stars?: number;
  comments?: number;
  shares?: number;
  avatarUrl: string;
  likedByMe?: boolean;
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
  likedByMe
}) => {
  const [liked, setLiked] = useState(likedByMe);
  const [starCount, setStarCount] = useState(stars);
  const [commentCount, setCommentCount] = useState(comments);
  const [shareCount, setShareCount] = useState(shares);
  const [reposted, setReposted] = useState(false);
  const [saved, setSaved] = useState(false);

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
          url:  postUrl,
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
      setShareCount(prev => prev); // leave shareCount alone
      setReposted(true);
      // if you want to show repost count separately, add another state
    } catch (err) {
      console.error("Failed to repost:", err);
    }
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="w-full py-0 sm:py-4 sm:px-4">
      <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden border border-gray-300 dark:border-gray-700 w-full sm:max-w-2xl sm:mx-auto">

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src={avatarUrl}
              alt={`${username}'s profile`}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="font-semibold text-teal-400 text-sm">@{username}</span>
          </div>
          {timestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Image */}
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

        {/* Caption */}
        <div className="px-4 sm:px-6 py-4 text-sm">{caption}</div>

        {/* Action Buttons */}
        <div onClick={stop} className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-evenly items-center text-gray-400 dark:text-gray-300 text-sm">

            {/* Like */}
            <button
              type="button"
              onClick={handleLike}
              className="btn-unstyled btn-action hover:text-yellow-400"
            >
              <Star className="w-5 h-5" fill={liked ? "currentColor" : "none"} />
              <span>{starCount}</span>
            </button>

            {/* Repost */}
            <button
              type="button"
              onClick={handleRepost}
              className="btn-unstyled btn-action hover:text-green-400"
            >
              <Repeat2 className="w-5 h-5" />
              <span>{reposted ? 1 : 0}</span>
            </button>

            {/* Comment */}
            <button
              type="button"
              onClick={() => setCommentCount(c => c + 1)}
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