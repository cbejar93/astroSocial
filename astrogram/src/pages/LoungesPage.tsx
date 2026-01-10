// src/pages/LoungesPage.tsx
import { useEffect, useMemo, useState } from "react";
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

function formatRelative(d?: string | number | Date | null): string | null {
  if (!d) return null;
  const ts = new Date(d).getTime();
  if (Number.isNaN(ts)) return null;

  const diff = ts - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const mins = Math.round(abs / (60 * 1000));
  if (mins < 60) return rtf.format(Math.round(diff / (60 * 1000)), "minute");

  const hours = Math.round(abs / (60 * 60 * 1000));
  if (hours < 24) return rtf.format(Math.round(diff / (60 * 60 * 1000)), "hour");

  const days = Math.round(abs / (24 * 60 * 60 * 1000));
  return rtf.format(Math.round(diff / (24 * 60 * 60 * 1000)), "day");
}

const LoungesPage: React.FC = () => {
  const { user, updateFollowedLounge } = useAuth();
  const [lounges, setLounges] = useState<LoungeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchLounges<LoungeInfo>();
        setLounges(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("Failed to load lounges.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sortedLounges = useMemo(() => {
    const byLastPost = (a: LoungeInfo, b: LoungeInfo) => {
      const ta = a.lastPostAt ? new Date(a.lastPostAt).getTime() : 0;
      const tb = b.lastPostAt ? new Date(b.lastPostAt).getTime() : 0;
      return tb - ta;
    };
    return [...lounges].sort(byLastPost);
  }, [lounges]);

  return (
    <div className="w-full pt-3 pb-8 sm:pt-8">
      <div className="mx-auto w-full max-w-[var(--page-content-max)] [--page-content-max:64rem] px-4">
        {/* Header */}
        <div className="mb-4 sm:mb-6 rounded-2xl p-[1px] bg-[conic-gradient(at_20%_0%,rgba(240,75,179,.25),rgba(90,162,255,.25),rgba(34,197,94,.18),rgba(240,75,179,.25))]">
          <div className="rounded-2xl bg-[#0E1626]/70 backdrop-blur-md ring-1 ring-white/10 px-5 py-5 shadow-[0_8px_28px_rgba(2,6,23,.45)]">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">Lounges</h1>
                <p className="text-xs text-gray-400 mt-1">
                  Explore communities. Share the night sky. Find your people.
                </p>
              </div>
              <div className="text-[11px] text-gray-300">
                {loading ? "Loading…" : `${sortedLounges.length} lounges`}
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-4 rounded-xl bg-red-600/15 text-red-200 ring-1 ring-red-400/30 px-4 py-3 text-sm">
            {err}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/20 backdrop-blur-xl text-slate-100 shadow-[0_16px_36px_rgba(2,6,23,0.35)]"
              >
                <div className="h-28 w-full bg-white/10 animate-pulse" />
                <div className="p-4">
                  <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
                  <div className="mt-3 h-4 w-28 bg-white/10 rounded animate-pulse" />
                  <div className="mt-4 h-8 w-24 bg-white/10 rounded animate-pulse" />
                </div>
              </li>
            ))}
          </ul>
        ) : sortedLounges.length === 0 ? (
          <div className="rounded-2xl ring-1 ring-white/10 bg-white/[0.03] backdrop-blur-md px-6 py-12 text-center text-gray-300">
            No lounges yet. Check back soon!
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedLounges.map((l) => {
              const isFollowed = user?.followedLounges?.includes(l.id) ?? false;
              const active = formatRelative(l.lastPostAt);
              return (
                <li key={l.id} className="group">
                  {/* Card matches PostCard styling */}
                  <Link
                    to={`/lounge/${encodeURIComponent(l.name)}`}
                    className="block rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/20 backdrop-blur-xl text-slate-100 shadow-[0_16px_36px_rgba(2,6,23,0.35)] hover:shadow-[0_16px_60px_rgba(2,6,23,0.6)] transition-shadow"
                  >
                    {/* Banner */}
                    <div className="relative h-28 w-full overflow-hidden">
                      <img
                        src={l.bannerUrl}
                        alt={`${l.name} banner`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/banner-fallback.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                      {/* Avatar */}
                      <div className="absolute -bottom-6 left-4">
                        <div
                          className="p-[3px] rounded-full"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                          }}
                        >
                          <img
                            src={l.profileUrl}
                            alt={`${l.name} icon`}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20 bg-[#0E1626]"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/defaultPfp.png";
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-4 pt-7 pb-4">
                      <div className="flex items-start gap-2">
                        <h3 className="text-sm font-semibold leading-tight truncate flex-1">
                          {l.name}
                        </h3>

                        {/* Follow pill */}
                        {user && (
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              await updateFollowedLounge(l.id, l.name, !isFollowed);
                            }}
                            aria-pressed={isFollowed}
                            className={[
                              "shrink-0 inline-flex items-center justify-center rounded-full px-3 py-1 text-[12px] font-medium ring-1 transition",
                              isFollowed
                                ? "bg-white/5 text-gray-200 ring-white/15 hover:bg-white/10"
                                : "bg-accent-gradient text-white ring-white/20 shadow-[0_8px_28px_rgba(15,23,42,0.45)]",
                            ].join(" ")}
                          >
                            {isFollowed ? "Following" : "Follow"}
                          </button>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                        <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 ring-1 ring-white/10 text-gray-300">
                          {(l.threads ?? 0).toLocaleString()} Threads
                        </span>
                        <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 ring-1 ring-white/10 text-gray-300">
                          {(l.followers ?? 0).toLocaleString()} Trackers
                        </span>
                        {active && (
                          <span className="ml-auto text-[11px] text-gray-400">
                            Active {active}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LoungesPage;
