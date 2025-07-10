import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star, MessageCircle, Share2, Repeat2, Bookmark } from "lucide-react";

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
  const [starCount, setStarCount] = useState(stars);
  const [commentCount, setCommentCount] = useState(comments);
  const [shareCount, setShareCount] = useState(shares);
  const [reposted, setReposted] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setStarCount((prev) => prev + (liked ? -1 : 1));
  };

  return (
    <div className="w-full py-0 sm:py-4 sm:px-4">
      <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden border border-gray-300 dark:border-gray-700 w-full sm:max-w-2xl sm:mx-auto">

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src="/default-avatar.png"
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
        <div className="px-4 sm:px-6 py-3 flex gap-6 justify-start items-center border-t border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-300 text-sm">

          <button
            onClick={handleLike}
            className="btn-unstyled flex items-center gap-1 hover:text-yellow-400"
          >
            <Star className="w-6 h-6" fill={liked ? "currentColor" : "none"} />
            <span>{starCount}</span>
          </button>

          <button
            onClick={() => setCommentCount((c) => c + 1)}
            className="btn-unstyled flex items-center gap-1 hover:text-violet-400"
          >
            <MessageCircle className="w-6 h-6" />
            <span>{commentCount}</span>
          </button>

          <button
            onClick={() => setShareCount((s) => s + 1)}
            className="btn-unstyled flex items-center gap-1 hover:text-violet-400"
          >
            <Share2 className="w-6 h-6" />
            <span>{shareCount}</span>
          </button>

          <button
            onClick={() => setReposted(!reposted)}
            className="btn-unstyled flex items-center gap-1 hover:text-green-400"
          >
            <Repeat2 className="w-6 h-6" />
          </button>

          <button
            onClick={() => setSaved(!saved)}
            className="btn-unstyled flex items-center gap-1 hover:text-blue-400"
          >
            <Bookmark className="w-6 h-6" fill={saved ? "currentColor" : "none"} />
          </button>

        </div>
      </div>
    </div>
  );
};

export default PostCard;