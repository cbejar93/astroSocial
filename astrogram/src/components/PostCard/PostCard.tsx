import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star, MessageCircle, Share2 } from 'lucide-react';

interface PostCardProps {
  username: string;
  imageUrl: string;
  caption: string;
  timestamp?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  username,
  imageUrl,
  caption,
  timestamp,
}) => {
  const [liked, setLiked] = useState(false);
  const [wave, setWave] = useState(false);
  const [ripple, setRipple] = useState(false);


  const handleLike = () => {
    setLiked(!liked);
    setRipple(true);
    setTimeout(() => setRipple(false), 600); // match animation length
  };
  const handleComment = () => alert("Comment clicked");
  const handleShare = () => alert("Share clicked");

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
              (e.currentTarget as HTMLImageElement).src = "/fallback.jpg.png"; // or any fallback URL
            }}
          />
        </div>

        {/* Caption */}
        <div className="px-4 sm:px-6 py-4 text-sm">
          {caption}
        </div>

        {/* Buttons */}
        <div className="px-4 sm:px-6 py-3 flex flex-wrap gap-2 justify-start border-t border-gray-200 dark:border-gray-700">
          {/* Star Button */}
          <button
            onClick={handleLike}
            className={`relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-full font-medium transition duration-300
    ${liked ? 'bg-yellow-400 text-black' : 'bg-purple-600 text-white hover:bg-yellow-500'}`}
          >
            {/* Ripple effect */}
            {ripple && <span className="ring-wave" />}

            <Star
              className="h-5 w-5 z-10"
              fill={liked ? 'currentColor' : 'none'}
            />
            <span className="z-10">Star</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleComment}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium bg-violet-600 text-white hover:bg-violet-700 hover:shadow-violet-500/40 hover:shadow-lg transition-all duration-300"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Comment</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium bg-violet-600 text-white hover:bg-violet-700 hover:shadow-violet-500/40 hover:shadow-lg transition-all duration-300"
          >
            <Share2 className="h-5 w-5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
