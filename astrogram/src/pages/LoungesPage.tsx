import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { fetchLounges } from "../lib/api";

interface LoungeInfo {
  id: string;
  name: string;
  bannerUrl: string;
  profileUrl: string;
  threads?: number;
  followers?: number;
  lastPostAt?: string | null;
}

const LoungesPage: React.FC = () => {
  const { user, updateFollowedLounge } = useAuth();
  const [lounges, setLounges] = useState<LoungeInfo[]>([]);

  useEffect(() => {
    fetchLounges<LoungeInfo>()
      .then((data) => {
        console.log("Fetched lounges:", data);
        setLounges(data);
      })
      .catch(() => {});
  }, []);

  const sortByLastPost = (a: LoungeInfo, b: LoungeInfo) => {
    const aTime = a.lastPostAt ? new Date(a.lastPostAt).getTime() : 0;
    const bTime = b.lastPostAt ? new Date(b.lastPostAt).getTime() : 0;
    return bTime - aTime;
  };

  const sortedLounges = [...lounges].sort(sortByLastPost);

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sortedLounges.map((lounge) => {
          const isFollowed = user?.followedLounges?.includes(lounge.id) ?? false;
          return (
            <Link
              key={lounge.id}
              to={`/lounge/${encodeURIComponent(lounge.name)}`}
              className="bg-neutral-800 rounded-lg overflow-hidden hover:bg-neutral-700 transition-colors"
            >
              <div className="w-full h-32 overflow-hidden">
                <img
                  src={lounge.bannerUrl}
                  alt={`${lounge.name} banner`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex items-center gap-4">
                <img
                  src={lounge.profileUrl}
                  alt={`${lounge.name} icon`}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="text-lg font-semibold">{lounge.name}</div>
                  <div className="text-sm text-neutral-400 flex items-center gap-2">
                    <span>
                      {lounge.threads ?? 0} Threads · {lounge.followers ?? 0} Trackers
                    </span>
                    {user && (
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await updateFollowedLounge(
                            lounge.id,
                            lounge.name,
                            !isFollowed,
                          );
                        }}
                        className="px-2 py-1 bg-neutral-700 rounded text-xs text-neutral-200"
                      >
                        {isFollowed ? "Unfollow" : "Follow"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default LoungesPage;
