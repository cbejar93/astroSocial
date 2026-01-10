// src/pages/NotificationsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchNotifications, type NotificationItem } from "../lib/api";
import { useNotifications } from "../hooks/useNotifications";

/* --------------------------- Date/Grouping utils --------------------------- */

function formatRelative(d?: string | number | Date): string | null {
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

function dayGroupLabel(d?: string | number | Date): "Today" | "Yesterday" | "Earlier" {
  if (!d) return "Earlier";
  const date = new Date(d);
  const now = new Date();
  const startOf = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
  const today = startOf(now);
  const yest = today - 24 * 60 * 60 * 1000;
  const that = startOf(date);
  if (that === today) return "Today";
  if (that === yest) return "Yesterday";
  return "Earlier";
}

function groupByDay(items: NotificationItem[]) {
  const list = items as any[]; // createdAt may be optional per backend
  const hasCreatedAt = list.some((n) => n?.createdAt);
  if (!hasCreatedAt) return [{ label: null as string | null, items }];

  const groups: Record<string, NotificationItem[]> = {};
  for (const n of items) {
    const label = dayGroupLabel((n as any)?.createdAt);
    (groups[label] ||= []).push(n);
  }

  return (["Today", "Yesterday", "Earlier"] as const)
    .filter((l) => groups[l]?.length)
    .map((label) => ({ label, items: groups[label]! }));
}

/* --------------------------------- Icons ---------------------------------- */

const CommentIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H9l-5 4v-4.5A4 4 0 0 1 4 12V6Z"
      fill="currentColor"
      opacity=".9"
    />
  </svg>
);
const HeartIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 21s-6.7-4.2-9.4-7C.4 11.8 1 8 3.8 6.6 6.6 5.2 9 6.8 12 10c3-3.2 5.4-4.8 8.2-3.4C23 8 23.6 11.8 21.4 14c-2.7 2.8-9.4 7-9.4 7Z"
      fill="currentColor"
      opacity=".9"
    />
  </svg>
);
const ReplyIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M10 8V4l-8 8 8 8v-4c6 0 9.3 2.2 12 6-1-7-4-14-12-14Z"
      fill="currentColor"
      opacity=".9"
    />
  </svg>
);

/* --------------------------------- Row UI --------------------------------- */

function TypeChip({ type }: { type: NotificationItem["type"] }) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1";
  switch (type) {
    case "COMMENT":
      return (
        <span className={`${base} bg-sky-400/10 text-sky-300 ring-sky-400/30`}>
          <CommentIcon /> Comment
        </span>
      );
    case "POST_LIKE":
      return (
        <span className={`${base} bg-pink-400/10 text-pink-300 ring-pink-400/30`}>
          <HeartIcon /> Like
        </span>
      );
    default:
      return (
        <span className={`${base} bg-violet-400/10 text-violet-200 ring-violet-400/30`}>
          <ReplyIcon /> Reaction
        </span>
      );
  }
}

function LoungePill({ name }: { name?: string | null }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-300 ring-1 ring-white/10">
      #{name}
    </span>
  );
}

function NotificationRow({ n }: { n: NotificationItem }) {
  const rel = formatRelative((n as any).createdAt);
  const primary =
    n.type === "COMMENT"
      ? "commented on your post"
      : n.type === "POST_LIKE"
      ? "liked your post"
      : "liked your comment";

  const link =
    (n as any).postId &&
    ((n as any).loungeName
      ? `/lounge/${encodeURIComponent((n as any).loungeName)}/posts/${(n as any).postId}`
      : `/posts/${(n as any).postId}`);

  const isUnread = Boolean((n as any).unread);

  // Unread → pink (#f04bb3), Read → blue (#5aa2ff)
  const unreadRing =
    "ring-[rgba(240,75,179,0.35)] hover:ring-[rgba(240,75,179,0.5)]";
  const readRing =
    "ring-[rgba(90,162,255,0.30)] hover:ring-[rgba(90,162,255,0.45)]";

  return (
    <li className="group relative">
      <div
        className={`relative flex items-start gap-3 rounded-2xl ring-1 ${
          isUnread ? unreadRing : readRing
        } bg-transparent hover:bg-white/[0.04] p-3 backdrop-blur-[2px] transition`}
      >
        {/* Avatar */}
        <img
          src={(n as any)?.actor?.avatarUrl || "/defaultPfp.png"}
          alt={(n as any)?.actor?.username ? `${(n as any).actor.username}'s avatar` : "avatar"}
          className="mt-0.5 h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-white/10"
          loading="lazy"
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-white">
              @{(n as any)?.actor?.username ?? "user"}
            </span>

            <TypeChip type={n.type as any} />
            <LoungePill name={(n as any).loungeName} />

            {rel && (
              <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-400 ring-1 ring-white/10">
                {rel}
              </span>
            )}

            {isUnread && (
              <span
                className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[radial-gradient(circle_at_30%_30%,#f04bb3_0,#f04bb3_45%,#5aa2ff_100%)]"
                aria-label="unread"
              />
            )}
          </div>

          <div className="mt-1 text-sm text-slate-200">
            {primary}
            {link && (
              <>
                {" "}
                <Link
                  to={link}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 transition ${
                    isUnread
                      ? "bg-[rgba(240,75,179,0.12)] text-white ring-[rgba(240,75,179,0.35)] hover:bg-[rgba(240,75,179,0.18)]"
                      : "bg-[rgba(90,162,255,0.10)] text-slate-200 ring-[rgba(90,162,255,0.30)] hover:bg-[rgba(90,162,255,0.16)]"
                  }`}
                >
                  View post
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M13 5l7 7-7 7M20 12H4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </>
            )}
          </div>

          {(n as any).preview && (
            <p className="mt-2 line-clamp-2 text-[13px] text-slate-300">
              {(n as any).preview}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

function SkeletonRow() {
  return (
    <li className="rounded-2xl ring-1 ring-white/10 bg-transparent p-3 backdrop-blur-[2px]">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
        <div className="w-full space-y-2">
          <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-64 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl ring-1 ring-white/10 bg-transparent p-8 text-center">
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/10">
        <svg className="h-5 w-5 text-slate-300" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H9l-5 4v-4.5A4 4 0 0 1 4 12V6Z"
            fill="currentColor"
            opacity=".9"
          />
        </svg>
      </div>
      <h2 className="text-sm font-semibold text-white">You’re all caught up</h2>
      <p className="mt-1 text-xs text-slate-400">New notifications will show up here.</p>
    </div>
  );
}

/* ----------------------------------- Page ---------------------------------- */

const NotificationsPage: React.FC = () => {
  const { refresh } = useNotifications();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchNotifications();
        if (!mounted) return;
        const normalized = Array.isArray(data) ? (data as NotificationItem[]) : [];
        setItems(normalized);
        refresh();
      } catch (e) {
        console.error(e);
        setError("Failed to load notifications.");
        setItems([]); // purely backend-driven
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const grouped = useMemo(() => groupByDay(items), [items]);

  return (
    <div className="relative w-full">
      {/* Soft background auras */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12%] h-[36vh] w-[64vw] -translate-x-1/2 rounded-[999px] bg-gradient-to-br from-sky-500/15 via-fuchsia-500/10 to-emerald-500/15 blur-3xl" />
        <div className="absolute left-[-10%] bottom-[-20%] h-[30vh] w-[38vw] rounded-[999px] bg-gradient-to-tr from-emerald-500/10 via-sky-500/10 to-transparent blur-3xl" />
      </div>

      {/* Center the section */}
      <div className="mx-auto w-full max-w-[var(--page-content-max)] [--page-content-max:48rem] px-0 sm:px-4 text-gray-200 py-8">
        {/* Header Card */}
        <div className="mb-6 rounded-2xl ring-1 ring-white/10 bg-transparent p-4 backdrop-blur-[2px]">
          <div className="flex items-center justify-between">
            <h1 className="bg-gradient-to-r from-[#f04bb3] to-[#5aa2ff] bg-clip-text text-lg font-semibold text-transparent">
              Notifications
            </h1>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Scroll to top"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-[radial-gradient(circle_at_30%_30%,#f04bb3_0,#f04bb3_45%,#5aa2ff_100%)]" />
              Newest
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-amber-300">{error}</p>}
        </div>

        {/* Content */}
        {loading ? (
          <ul className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </ul>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            {grouped.map(({ label, items }) => (
              <section key={label ?? "all"}>
                {label && (
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                )}
                <ul className="space-y-4">
                  {items.map((n) => (
                    <NotificationRow key={String((n as any).id ?? Math.random())} n={n} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
