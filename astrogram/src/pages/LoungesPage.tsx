import { useState } from "react";
import { Link } from "react-router-dom";
import { lounges } from "../data/lounges";
import { useAuth } from "../contexts/AuthContext";
import { followLounge, unfollowLounge } from "../lib/api";

const LoungesPage: React.FC = () => {
  const [sortBy, setSortBy] = useState<"name" | "lastPost">("name");
  const { user, refreshUser } = useAuth();

  const sortedLounges = Object.entries(lounges).sort((a, b) => {
    if (sortBy === "lastPost") {
      return (
        new Date(b[1].lastPostAt).getTime() -
        new Date(a[1].lastPostAt).getTime()
      );
    }
    return a[1].name.localeCompare(b[1].name);
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
        {sortedLounges.map(([id, lounge]) => {
          const isFollowing = user?.followedLounges.includes(id) ?? false;
          return (
            <Link
              key={id}
              to={`/lounge/${id}`}
              className="bg-neutral-800 rounded-lg overflow-hidden hover:bg-neutral-700 transition-colors"
            >
              <div className="w-full h-32 overflow-hidden">
                <img
                  src={lounge.banner}
                  alt={`${lounge.name} banner`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex items-center gap-4">
                <img
                  src={lounge.icon}
                  alt={`${lounge.name} icon`}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="text-lg font-semibold">{lounge.name}</div>
                  <div className="text-sm text-neutral-400 flex items-center gap-2">
                    <span>
                      {lounge.threads} Threads · {lounge.views} Views
                    </span>
                    {user && (
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            if (isFollowing) {
                              await unfollowLounge(id);
                            } else {
                              await followLounge(id);
                            }
                            await refreshUser();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="px-2 py-1 bg-neutral-700 rounded text-xs text-white hover:bg-neutral-600"
                      >
                        {isFollowing ? "Unfollow" : "Follow"}
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
