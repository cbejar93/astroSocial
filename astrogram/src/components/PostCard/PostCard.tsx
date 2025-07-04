import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star, MessageCircle, Share2 } from 'lucide-react';

interface PostCardProps {
  username: string;
  imageUrl: string;
  caption: string;
  timestamp?: string;
  stars?: number;
  comments?: number;
  shares?: number;
}

const PostCard: React.FC<PostCardProps> = ({
  username,
  imageUrl,
  caption,
  timestamp,
  stars = 0,
  comments = 0,
  shares = 0,
}) => {
  const [liked, setLiked] = useState(false);
  const [ripple, setRipple] = useState(false);
  const [starCount, setStarCount] = useState(stars);
  const [commentCount, setCommentCount] = useState(comments);
  const [shareCount, setShareCount] = useState(shares);

  const handleLike = () => {
    setLiked(!liked);
    setStarCount(prev => prev + (liked ? -1 : 1));
    setRipple(true);
    setTimeout(() => setRipple(false), 500);
  };

  const handleComment = () => {
    setCommentCount(prev => prev + 1);
  };

  const handleShare = () => {
    setShareCount(prev => prev + 1);
  };

  return (
    <div className="w-full py-0 sm:py-4 sm:px-4">
      <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden border border-gray-300 dark:border-gray-700 w-full sm:max-w-2xl sm:mx-auto">

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <span className="font-semibold text-teal-400 text-sm">@{username}</span>
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
            alt={`Astrophotography post by ${username}: ${caption}`}
            className="object-cover w-full h-full"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/fallback.jpg.png";
            }}
          />
        </div>

        {/* Caption */}
        <div className="px-4 sm:px-6 py-4 text-sm">{caption}</div>

        {/* Buttons */}
        <div className="px-4 sm:px-6 py-3 flex flex-wrap gap-2 justify-start border-t border-gray-200 dark:border-gray-700">

          {/* Star Button */}
          <button
            onClick={handleLike}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-full font-medium transition duration-300 overflow-hidden
              ${liked ? 'bg-yellow-400 text-black' : 'bg-purple-600 text-white hover:bg-yellow-500'}`}
          >
            {/* Ripple Effect */}
            {ripple && (
              <span className="absolute inset-0 z-0 bg-yellow-300 opacity-40 animate-ripple rounded-full" />
            )}

            <Star
              className="h-5 w-5 z-10"
              fill={liked ? 'currentColor' : 'none'}
            />
            <span className="z-10">{starCount}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleComment}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium bg-violet-600 text-white hover:bg-violet-700 hover:shadow-violet-500/40 hover:shadow-lg transition-all duration-300"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{commentCount}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium bg-violet-600 text-white hover:bg-violet-700 hover:shadow-violet-500/40 hover:shadow-lg transition-all duration-300"
          >
            <Share2 className="h-5 w-5" />
            <span>{shareCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
