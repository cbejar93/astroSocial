import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { followLounge, unfollowLounge, fetchLounges } from "../lib/api";

interface LoungeInfo {
  id: string;
  name: string;
  bannerUrl: string;
  profileUrl: string;
  threads?: number;
  views?: number;
  lastPostAt?: string | null;
}

const LoungesPage: React.FC = () => {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<"name" | "lastPost">("name");
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user?.followedLounges) {
      const map: Record<string, boolean> = {};
      for (const id of user.followedLounges) {
        map[id] = true;
      }
      setFollowed(map);
    }
  }, [user]);

  const [lounges, setLounges] = useState<LoungeInfo[]>([]);

  useEffect(() => {
    console.log('before calling get lounges')
    fetchLounges<LoungeInfo>()
      .then((data) => {
        
        console.log('what is the issue here?')
        setLounges(data)})
      .catch(() => {});
  }, []);

  const sortedLounges = lounges.slice().sort((a, b) => {
    if (sortBy === "lastPost") {
      const aTime = a.lastPostAt ? new Date(a.lastPostAt).getTime() : 0;
      const bTime = b.lastPostAt ? new Date(b.lastPostAt).getTime() : 0;
      return bTime - aTime;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <div className="flex justify-end mb-4">
        <label htmlFor="sort" className="mr-2 text-sm">
          Sort by:
        </label>
        <select
          id="sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "lastPost")}
          className="bg-neutral-800 border border-neutral-700 rounded p-1 text-sm"
        >
          <option value="name">Name</option>
          <option value="lastPost">Last Post</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sortedLounges.map((lounge) => (
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
                    {lounge.threads ?? 0} Threads · {lounge.views ?? 0} Views
                  </span>
                  {user && (
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          if (followed[lounge.id]) await unfollowLounge(lounge.name);
                          else await followLounge(lounge.name);
                          setFollowed((prev) => ({
                            ...prev,
                            [lounge.id]: !prev[lounge.id],
                          }));
                        } catch {}
                      }}
                      className="px-2 py-1 bg-neutral-700 rounded text-xs text-neutral-200"
                    >
                      {followed[lounge.id] ? "Unfollow" : "Follow"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LoungesPage;
