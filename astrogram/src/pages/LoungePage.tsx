import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fetchLoungePosts, fetchLounge } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

interface LoungePostSummary {
  id: string;
  title: string;
  username: string;
  avatarUrl: string;
  timestamp: string;
  comments: number;
}

interface LoungeInfo {
  id: string;
  name: string;
  bannerUrl: string;
  profileUrl: string;
}

const LoungePage: React.FC = () => {
  const { loungeName } = useParams<{ loungeName: string }>();
  const { user } = useAuth();
  const [lounge, setLounge] = useState<LoungeInfo | null>(null);
  const [loadingLounge, setLoadingLounge] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [posts, setPosts] = useState<LoungePostSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loungeName) return;
    fetchLounge<LoungeInfo>(loungeName)
      .then((data) => setLounge(data))
      .catch(() => setLounge(null))
      .finally(() => setLoadingLounge(false));
  }, [loungeName]);

  useEffect(() => {
    if (!loungeName) return;
    fetchLoungePosts<LoungePostSummary>(loungeName, 1, 20)
      .then((data) => {
        setPosts(data.posts);
        setLoadingPosts(false);
      })
      .catch(() => setLoadingPosts(false));
  }, [loungeName]);

  if (loadingLounge) {
    return <div className="py-6">Loading...</div>;
  }
  if (!lounge) {
    return <div className="py-6">Lounge not found.</div>;
  }

  return (
    <div className="py-6">
      <div className="relative mb-12">
        <div className="w-full h-40 overflow-hidden">
          <img
            src={lounge.bannerUrl}
            alt={`${lounge.name} banner`}
            className="w-full h-full object-cover"
          />
        </div>
        <img
          src={lounge.profileUrl}
          alt={`${lounge.name} icon`}
          className="w-24 h-24 rounded-full object-cover absolute left-4 bottom-0 translate-y-1/2 border-4 border-neutral-900"
        />
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{lounge.name}</h1>
        {user && (
          <Link
            to={`/lounge/${encodeURIComponent(lounge.name)}/post`}
            className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            Post
          </Link>
        )}
      </div>
      <div className="w-full max-w-3xl mx-auto space-y-4">
        {loadingPosts ? (
          <div>Loading posts...</div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="p-4 bg-white dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() =>
                navigate(
                  `/lounge/${encodeURIComponent(lounge.name)}/posts/${post.id}`,
                )
              }
            >
              <div className="flex items-center mb-1">
                <img
                  src={post.avatarUrl}
                  alt={`${post.username} avatar`}
                  className="w-8 h-8 rounded-full object-cover mr-2"
                />
                <span className="font-medium">{post.username}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                </span>
                <span className="ml-auto text-sm text-gray-500">
                  {post.comments} replies
                </span>
              </div>
              <h2 className="text-lg font-semibold">{post.title}</h2>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LoungePage;
