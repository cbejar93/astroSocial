import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchLoungePosts, fetchLounge } from "../lib/api";
import PostSkeleton from "../components/PostCard/PostSkeleton";
import LoungePostItem from "../components/LoungePostItem/LoungePostItem";

interface LoungePost {
  id: string;
  title: string;
  body: string;
}

interface LoungeInfo {
  id: string;
  name: string;
  bannerUrl: string;
  profileUrl: string;
}

const LoungePage: React.FC = () => {
  const { loungeName } = useParams<{ loungeName: string }>();
  const [lounge, setLounge] = useState<LoungeInfo | null>(null);
  const [loadingLounge, setLoadingLounge] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [posts, setPosts] = useState<LoungePost[]>([]);

  useEffect(() => {
    if (!loungeName) return;
    fetchLounge<LoungeInfo>(loungeName)
      .then((data) => setLounge(data))
      .catch(() => setLounge(null))
      .finally(() => setLoadingLounge(false));
  }, [loungeName]);

  useEffect(() => {
    if (!loungeName) return;
    fetchLoungePosts<LoungePost>(loungeName, 1, 20)
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
        <Link
          to={`/lounge/${encodeURIComponent(lounge.name)}/post`}
          className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Post
        </Link>
      </div>
      <div className="w-full max-w-3xl mx-auto space-y-4">
        {loadingPosts
          ? Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
          : posts.map((post) => (
              <LoungePostItem key={post.id} title={post.title} body={post.body} />
            ))}
      </div>
    </div>
  );
};

export default LoungePage;
