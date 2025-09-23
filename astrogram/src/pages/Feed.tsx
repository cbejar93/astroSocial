import { useCallback, useEffect, useRef, useState } from "react";
import PostCard from "../components/PostCard/PostCard";
import PostSkeleton from "../components/PostCard/PostSkeleton";
import { fetchFeed } from "../lib/api";
import type { PostCardProps } from '../components/PostCard/PostCard';
import { useNavigate } from "react-router-dom";


// const dummyPosts = [
//   {
//     id: 1,
//     username: "astro_nerd",
//     imageUrl: "https://images-assets.nasa.gov/image/PIA04921/PIA04921~orig.jpg",
//     caption: "The Orion Nebula at 3AM 🌌",
//     timestamp: "2025-07-03T03:00:00Z",
//     stars: 12,
//     comments: 3,
//     shares: 5,
//   },
//   {
//     id: 2,
//     username: "galaxyhunter",
//     imageUrl: "https://images-assets.nasa.gov/image/PIA12235/PIA12235~orig.jpg",
//     caption: "Milky Way glowing above the Atacama Desert 🔭",
//     timestamp: "2025-07-02T23:15:00Z",
//     stars: 8,
//     comments: 2,
//     shares: 1,
//   },
//   {
//     id: 3,
//     username: "cosmicdreamer",
//     imageUrl: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001478/GSFC_20171208_Archive_e001478~orig.jpg",
//     caption: "Edge of the galaxy — deep space haze ✨",
//     timestamp: "2025-07-01T18:42:00Z",
//     stars: 15,
//     comments: 5,
//     shares: 4,
//   },
//   {
//     id: 4,
//     username: "nebula_chaser",
//     imageUrl: "https://images-assets.nasa.gov/image/PIA09178/PIA09178~orig.jpg",
//     caption: "Carina Nebula looking unreal tonight 💫",
//     timestamp: "2025-06-30T22:00:00Z",
//     stars: 9,
//     comments: 1,
//     shares: 2,
//   },
//   {
//     id: 5,
//     username: "starlord",
//     imageUrl: "https://images-assets.nasa.gov/image/PIA19806/PIA19806~orig.jpg",
//     caption: "A peek into the Pillars of Creation 🌀",
//     timestamp: "2025-06-28T20:10:00Z",
//     stars: 20,
//     comments: 7,
//     shares: 6,
//   },
//   {
//     id: 6,
//     username: "darkmatter",
//     imageUrl: "https://images-assets.nasa.gov/image/PIA21087/PIA21087~orig.jpg",
//     caption: "Caught a distant supernova remnant 🌠",
//     timestamp: "2025-06-25T11:30:00Z",
//     stars: 11,
//     comments: 2,
//     shares: 3,
//   },
//   {
//     id: 7,
//     username: "orbitjunkie",
//     imageUrl: "https://images-assets.nasa.gov/image/PIA12046/PIA12046~orig.jpg",
//     caption: "Star cluster hidden behind a veil of dust 🌌",
//     timestamp: "2025-06-24T14:00:00Z",
//     stars: 7,
//     comments: 1,
//     shares: 0,
//   },
//   {
//     id: 8,
//     username: "stellarvista",
//     imageUrl: "https://images-assets.nasa.gov/image/PIA21425/PIA21425~orig.jpg",
//     caption: "Staring into the Tarantula Nebula 🕷️✨",
//     timestamp: "2025-06-22T10:45:00Z",
//     stars: 18,
//     comments: 4,
//     shares: 5,
//   },
//   {
//     id: 9,
//     username: "lunarlurker",
//     imageUrl: "https://images-assets.nasa.gov/image/PIA00342/PIA00342~orig.jpg",
//     caption: "Moonrise over Earth’s horizon 🌖",
//     timestamp: "2025-06-20T08:15:00Z",
//     stars: 6,
//     comments: 0,
//     shares: 1,
//   },
//   {
//     id: 10,
//     username: "deepfield",
//     imageUrl: "https://images-assets.nasa.gov/image/PIA12348/PIA12348~orig.jpg",
//     caption: "Hubble’s deep field never ceases to amaze 🔍🌌",
//     timestamp: "2025-06-24T16:45:00Z",
//     stars: 66,
//     comments: 5,
//     shares: 7,
//   },
//   {
//     id: 11,
//     username: "moonrider",
//     imageUrl: "https://images-assets.nasa.gov/image/PIA13562/PIA13562~orig.jpg",
//     caption: "First quarter moonrise over the mountains 🌙",
//     timestamp: "2025-06-22T21:20:00Z",
//     stars: 24,
//     comments: 3,
//     shares: 2,
//   },
//   {
//     id: 12,
//     username: "auroraholic",
//     imageUrl: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001274/GSFC_20171208_Archive_e001274~orig.jpg",
//     caption: "Northern lights were electric tonight! 💚💜",
//     timestamp: "2025-06-21T02:10:00Z",
//     stars: 57,
//     comments: 9,
//     shares: 6,
//   },
//   {
//     id: 13,
//     username: "venusgazer",
//     imageUrl: "https://images-assets.nasa.gov/image/PIA18184/PIA18184~orig.jpg",
//     caption: "Venus in retrograde looking like a gem ✨",
//     timestamp: "2025-06-20T04:00:00Z",
//     stars: 31,
//     comments: 4,
//     shares: 3,
    
//   },
// ];


const PAGE_SIZE = 20;

const Feed: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(async (nextPage: number) => {
    if (nextPage === 1) {
      setLoading(true);
    }

    setIsFetchingNext(true);

    try {
      const response = await fetchFeed<PostCardProps>(nextPage, PAGE_SIZE);

      setPosts((prev) => {
        if (nextPage === 1) {
          return response.posts;
        }

        const existingIds = new Set(prev.map((post) => post.id));
        const appendedPosts = response.posts.filter(
          (post) => !existingIds.has(post.id)
        );

        return [...prev, ...appendedPosts];
      });

      setPage(nextPage);
      setHasMore(
        response.posts.length > 0 && nextPage * PAGE_SIZE < response.total
      );
    } catch (error) {
      console.error(error);
    } finally {
      if (nextPage === 1) {
        setLoading(false);
      }

      setIsFetchingNext(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];

      if (entry.isIntersecting && hasMore && !isFetchingNext) {
        loadPage(page + 1);
      }
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isFetchingNext, loadPage, page]);

  return (
    <div className="w-full py-8 flex justify-center">
      <div className="w-full max-w-3xl px-0 sm:px-4">
        <div className="w-full max-w-3xl space-y-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <PostSkeleton key={i} />
              ))
            : (
                <>
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className=" animate-fadeIn cursor-pointer"
                      onClick={() => navigate(`/posts/${post.id}`)}
                    >
                      <PostCard
                        {...post}
                        onDeleted={(id) =>
                          setPosts((ps) => ps.filter((p) => p.id !== id))
                        }
                      />
                    </div>
                  ))}
                  <div ref={sentinelRef} />
                  {isFetchingNext && (
                    <div className="py-4 text-center text-sm text-gray-500">
                      Loading more...
                    </div>
                  )}
                </>
              )}
        </div>
      </div>
    </div>
  );
};

export default Feed;


