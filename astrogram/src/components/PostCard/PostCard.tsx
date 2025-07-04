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

  const handleLike = () => setLiked(!liked);
  const handleComment = () => alert("Comment clicked");
  const handleShare = () => alert("Share clicked");

  return (
    <div className="w-full py-0 sm:py-4 sm:px-4">



      <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden border border-gray-300 dark:border-gray-700 w-full sm:max-w-2xl sm:mx-auto">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">@{username}</span>
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
          />
        </div>

        {/* Caption */}
        <div className="px-4 sm:px-6 py-4 text-sm">
          {caption}
        </div>

        {/* Buttons */}
        <div className="px-4 sm:px-6 py-3 flex flex-wrap gap-2 justify-start border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition ${
              liked
                ? 'bg-yellow-500 text-white'
                : 'bg-neutral-800 text-white hover:bg-yellow-500'
            }`}
          >
            <Star
              className="h-5 w-5"
              fill={liked ? 'currentColor' : 'none'}
            />
            <span>Star</span>
          </button>

          <button
            onClick={handleComment}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium bg-neutral-800 text-white hover:bg-blue-500 transition"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Comment</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium bg-neutral-800 text-white hover:bg-green-500 transition"
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


