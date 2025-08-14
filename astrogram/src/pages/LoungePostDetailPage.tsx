import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { apiFetch } from "../lib/api";
import Comments from "../components/Comments/Comments";
import { useAuth } from "../hooks/useAuth";
import { MoreVertical } from "lucide-react";

interface Post {
  id: string;
  title: string;
  caption: string;
  username: string;
  avatarUrl: string;
  timestamp: string;
}

const LoungePostDetailPage: React.FC = () => {
  const { loungeName, postId } = useParams<{ loungeName: string; postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!postId) return;
    apiFetch(`/posts/${postId}`)
      .then(res => res.json())
      .then(data => setPost(data))
      .catch(() => setError("Could not load post."))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = async () => {
    if (!post) return;
    setMenuOpen(false);
    try {
      const res = await apiFetch(`/posts/delete/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete post");
      }
      navigate(`/lounge/${encodeURIComponent(loungeName ?? "")}`);
    } catch (err) {
      console.error("Delete post error:", err);
    }
  };

  if (loading) return <div className="py-6">Loading...</div>;
  if (error) return <div className="py-6">{error}</div>;
  if (!post) return <div className="py-6">Post not found.</div>;

  const isOwn = user?.username === post.username;

  return (
    <div className="py-6">
      <div className="flex items-center mb-4">
        <img
          src={post.avatarUrl}
          alt={`${post.username} avatar`}
          className="w-10 h-10 rounded-full object-cover mr-3"
        />
        <div>
          <div className="font-medium">{post.username}</div>
          <div className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
          </div>
        </div>
        {isOwn && (
          <div ref={menuRef} className="relative ml-auto">
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
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
      <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.caption }} />
      <hr className="my-4 border-t border-white/20" />
      <Comments postId={post.id} />
    </div>
  );
};

export default LoungePostDetailPage;
