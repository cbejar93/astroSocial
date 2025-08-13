import { useEffect, useState } from 'react';
import PostSkeleton from '../components/PostCard/PostSkeleton';
import PostCard from '../components/PostCard/PostCard';
import type { PostCardProps } from '../components/PostCard/PostCard';
import { fetchSavedPosts } from '../lib/api';
import { useNavigate } from 'react-router-dom';

const SavedPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedPosts<PostCardProps>(1, 20)
      .then((data) => {
        setPosts(data.posts);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full py-8 flex justify-center">
      <div className="w-full max-w-3xl px-0 sm:px-4">
        <div className="w-full max-w-3xl space-y-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
            : posts.map((post) => (
                <div
                  key={post.id}
                  className="animate-fadeIn cursor-pointer"
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  <PostCard
                    {...post}
                    onSavedChange={(id, saved) => {
                      if (!saved) {
                        setPosts((ps) => ps.filter((p) => p.id !== id));
                      }
                    }}
                  />
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default SavedPage;
