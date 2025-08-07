import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { apiFetch } from "../lib/api";

interface Post {
  id: string;
  title: string;
  caption: string;
  username: string;
  avatarUrl: string;
  timestamp: string;
}

const LoungePostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    apiFetch(`/posts/${postId}`)
      .then(res => res.json())
      .then(data => setPost(data))
      .catch(() => setError("Could not load post."))
      .finally(() => setLoading(false));
  }, [postId]);

  if (loading) return <div className="py-6">Loading...</div>;
  if (error) return <div className="py-6">{error}</div>;
  if (!post) return <div className="py-6">Post not found.</div>;

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
      </div>
      <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
      <p>{post.caption}</p>
    </div>
  );
};

export default LoungePostDetailPage;
