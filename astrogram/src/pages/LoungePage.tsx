import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fetchLoungePosts, fetchLounge, apiFetch, deleteLounge } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { MoreVertical } from "lucide-react";

interface LoungePostSummary {
  id: string;
  title: string;
  username: string;
  avatarUrl: string;
  timestamp: string;
  comments: number;
  lastReplyUsername?: string;
  lastReplyTimestamp?: string;
}

interface LoungeInfo {
  id: string;
  name: string;
  bannerUrl: string;
  profileUrl: string;
  description: string;
}

const LoungePage: React.FC = () => {
  const { loungeName } = useParams<{ loungeName: string }>();
  const { user } = useAuth();
  const [lounge, setLounge] = useState<LoungeInfo | null>(null);
  const [loadingLounge, setLoadingLounge] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [posts, setPosts] = useState<LoungePostSummary[]>([]);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      setMenuPostId(null);
      setShowMenu(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

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
        const sorted = data.posts.sort((a, b) => {
          const aTime = a.lastReplyTimestamp || a.timestamp;
          const bTime = b.lastReplyTimestamp || b.timestamp;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });
        setPosts(sorted);
        setLoadingPosts(false);
      })
      .catch(() => setLoadingPosts(false));
  }, [loungeName]);

  const handleDelete = async (id: string) => {
    setMenuPostId(null);
    try {
      const res = await apiFetch(`/posts/delete/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete post");
      }
      setPosts((ps) => ps.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete post error:", err);
    }
  };

  const handleDeleteLounge = async () => {
    setShowMenu(false);
    if (!lounge) return;
    try {
      await deleteLounge(lounge.id);
      navigate('/lounge');
    } catch (err) {
      console.error('Delete lounge error:', err);
    }
  };

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
        <div className="flex items-center gap-4">
          {user && (
            <Link
              to={`/lounge/${encodeURIComponent(lounge.name)}/post`}
              className="px-4 py-2 rounded text-white hover:text-gray-200 transition-colors"
            >
              Post
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((m) => !m);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded shadow-lg z-10">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate('/admin/lounge', { state: { lounge } });
                    }}
                    className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Edit Lounge
                  </button>
                  <button
                    onClick={handleDeleteLounge}
                    className="block w-full px-4 py-2 text-sm text-red-500 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Delete Lounge
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="w-full max-w-3xl mx-auto space-y-4">
        {loadingPosts ? (
          <div>Loading posts...</div>
        ) : (
          posts.map((post) => {
            const isOwn = user?.username === post.username;
            return (
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
                  <Link
                    to={`/users/${post.username}/posts`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-teal-400 text-sm hover:underline"
                  >
                    @{post.username}
                  </Link>
                  <span className="ml-2 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {post.comments} replies
                    </span>
                    {isOwn && (
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuPostId((id) => (id === post.id ? null : post.id));
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
                                handleDelete(post.id);
                              }}
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
                <h2 className="text-lg font-semibold">{post.title}</h2>
                {post.lastReplyTimestamp && post.lastReplyUsername && (
                  <p className="mt-1 text-sm text-gray-500">
                    Last reply by {post.lastReplyUsername}{' '}
                    {formatDistanceToNow(new Date(post.lastReplyTimestamp), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LoungePage;
