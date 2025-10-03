import React, { useEffect, useMemo, useState } from 'react';
import { fetchAnalyticsSummary } from '../lib/api';
import type { AnalyticsSummary } from '../lib/api';
import { useAnalytics } from '../hooks/useAnalytics';

const RANGE_OPTIONS = [7, 30, 90];

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '0s';
  }

  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours) {
    parts.push(`${hours}h`);
  }
  if (minutes) {
    parts.push(`${minutes}m`);
  }
  if (!hours && !minutes && seconds) {
    parts.push(`${seconds}s`);
  }
  if (!parts.length) {
    parts.push('0s');
  }
  return parts.join(' ');
}

function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function relativeTimeFrom(iso: string): string {
  const date = new Date(iso);
  const deltaMs = Date.now() - date.getTime();
  if (!Number.isFinite(deltaMs)) {
    return '';
  }
  const deltaMinutes = Math.round(deltaMs / (60 * 1000));
  if (deltaMinutes < 1) {
    return 'just now';
  }
  if (deltaMinutes < 60) {
    return `${deltaMinutes} minute${deltaMinutes === 1 ? '' : 's'} ago`;
  }
  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `${deltaHours} hour${deltaHours === 1 ? '' : 's'} ago`;
  }
  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays} day${deltaDays === 1 ? '' : 's'} ago`;
}

const AdminAnalyticsDashboard: React.FC = () => {
  const [range, setRange] = useState<number>(RANGE_OPTIONS[0]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enabled: trackingEnabled, setEnabled: setTrackingEnabled } = useAnalytics();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAnalyticsSummary(range)
      .then((data) => {
        if (!cancelled) {
          setSummary(data);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const maxDaily = useMemo(() => {
    if (!summary?.dailyActiveUsers?.length) {
      return 0;
    }
    return summary.dailyActiveUsers.reduce(
      (max, entry) => (entry.count > max ? entry.count : max),
      0,
    );
  }, [summary]);

  const maxInteraction = useMemo(() => {
    if (!summary?.interactionCounts?.length) {
      return 0;
    }
    return summary.interactionCounts.reduce(
      (max, entry) => (entry.count > max ? entry.count : max),
      0,
    );
  }, [summary]);

  const sortedInteractions = useMemo(() => {
    if (!summary?.interactionCounts) {
      return [];
    }
    return [...summary.interactionCounts].sort((a, b) => b.count - a.count);
  }, [summary]);

  const postInteractionTotal = useMemo(() => {
    if (!summary?.platformActivity?.postInteractions) {
      return 0;
    }
    return summary.platformActivity.postInteractions.reduce(
      (sum, entry) => sum + entry.count,
      0,
    );
  }, [summary]);

  const totalUniqueVisits = useMemo(() => {
    if (!summary?.visitsByLocation?.length) {
      return 0;
    }
    return summary.visitsByLocation.reduce((sum, entry) => sum + entry.count, 0);
  }, [summary]);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Analytics overview</h2>
          <p className="text-sm text-gray-400">
            Summaries are refreshed nightly and cached server-side for fast loads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                range === value
                  ? 'bg-brand text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              aria-pressed={range === value}
            >
              Last {value} days
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-700 bg-gray-900/70 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Browser tracking preference
            </h3>
            <span
              className={`text-xs font-medium ${
                trackingEnabled ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {trackingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-300">
            AstroSocial honors each browser&apos;s Do Not Track signal and lets admins toggle
            analytics locally. Events are only sent while tracking is enabled.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTrackingEnabled(!trackingEnabled)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                trackingEnabled
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-brand text-white hover:bg-brand/90'
              }`}
            >
              {trackingEnabled ? 'Disable on this browser' : 'Enable analytics'}
            </button>
            <span className="text-xs text-gray-500">
              Preference persists via <code>localStorage</code> and clears on logout.
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-900/70 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Operational policies
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-300">
            <li>Events are queued and flushed to the database in compact batches.</li>
            <li>Sessions and events older than 180 days are pruned during nightly maintenance.</li>
            <li>Aggregated rollups run just after midnight to keep this dashboard snappy.</li>
          </ul>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-200">
          Failed to load analytics summary: {error}
        </div>
      )}

      <section className="rounded-lg border border-gray-700 bg-gray-900/70 p-6">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-white">Usage snapshot</h3>
            {summary && (
              <p className="text-xs text-gray-400">
                Generated {relativeTimeFrom(summary.generatedAt)} · Tracking last{' '}
                {summary.rangeDays} days
              </p>
            )}
          </div>
          {loading && <span className="text-xs text-gray-500">Refreshing…</span>}
        </header>

        {summary ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-md bg-gray-800/70 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-400">Total events</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {formatNumber(summary.totals.events)}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {formatNumber(summary.totals.uniqueUsers)} unique participants
              </p>
            </div>
            <div className="rounded-md bg-gray-800/70 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-400">Session time</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {formatDuration(summary.sessions.totalDurationMs)}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Avg session {formatDuration(summary.sessions.averageDurationMs)}
              </p>
            </div>
            <div className="rounded-md bg-gray-800/70 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-400">Post &amp; comment activity</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {formatNumber(postInteractionTotal + (summary.platformActivity?.commentLikes ?? 0))}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {formatNumber(postInteractionTotal)} post interactions ·{' '}
                {formatNumber(summary.platformActivity?.commentLikes ?? 0)} comment likes
              </p>
            </div>
          </div>
        ) : (
          !loading && (
            <p className="mt-4 text-sm text-gray-400">No analytics available for this range.</p>
          )
        )}
      </section>

      {summary && (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-700 bg-gray-900/70 p-6">
              <h3 className="text-lg font-semibold text-white">Daily active users</h3>
              {summary.dailyActiveUsers.length ? (
                <div className="mt-4">
                  <div className="flex h-40 items-end gap-2">
                    {summary.dailyActiveUsers.map((entry) => {
                      const percent = maxDaily
                        ? Math.max((entry.count / maxDaily) * 100, entry.count > 0 ? 6 : 0)
                        : 0;
                      return (
                        <div key={entry.date} className="flex-1 text-center">
                          <div
                            className="mx-auto w-full rounded-t bg-brand"
                            style={{ height: `${percent}%` }}
                          />
                          <div className="mt-2 text-[10px] uppercase tracking-wide text-gray-400">
                            {formatDateLabel(entry.date)}
                          </div>
                          <div className="text-xs font-semibold text-gray-200">
                            {formatNumber(entry.count)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-400">
                  No active user data captured for this period.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-gray-700 bg-gray-900/70 p-6">
              <h3 className="text-lg font-semibold text-white">Interaction breakdown</h3>
              {sortedInteractions.length ? (
                <ul className="mt-4 space-y-3">
                  {sortedInteractions.map((interaction) => {
                    const percent = maxInteraction
                      ? Math.max((interaction.count / maxInteraction) * 100, 6)
                      : 0;
                    return (
                      <li key={interaction.type}>
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span className="capitalize">{interaction.type.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-xs text-gray-400">
                            {formatNumber(interaction.count)}
                          </span>
                        </div>
                        <div className="mt-1 h-2 rounded bg-gray-800">
                          <div
                            className="h-2 rounded bg-brand"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-400">No interaction events recorded.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-700 bg-gray-900/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Unique visits by locale</h3>
                <p className="text-xs text-gray-400">
                  Estimated from browser locale strings captured in session metadata.
                </p>
              </div>
              <div className="text-xs font-medium text-gray-300">
                Total unique visits:{' '}
                <span className="font-semibold text-white">
                  {formatNumber(totalUniqueVisits)}
                </span>
              </div>
            </div>

            {summary.visitsByLocation.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800 text-left text-sm">
                  <thead className="text-gray-400">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">
                        Approximate location
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium">
                        Unique visits
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-gray-200">
                    {summary.visitsByLocation.map((entry) => {
                      const share = totalUniqueVisits
                        ? (entry.count / totalUniqueVisits) * 100
                        : 0;
                      const roundedShare = Math.round(share);
                      const barWidth = share > 0 ? Math.max(share, 6) : 0;
                      const clampedWidth = Math.min(barWidth, 100);

                      return (
                        <tr key={entry.location}>
                          <td className="px-3 py-2">
                            {entry.location || 'Unknown region'}
                          </td>
                          <td className="px-3 py-2 font-mono">
                            {formatNumber(entry.count)}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-1 rounded bg-gray-800">
                                <div
                                  className="h-2 rounded bg-brand"
                                  style={{ width: `${clampedWidth}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">
                                {roundedShare}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-400">
                No visit locale information captured for this period.
              </p>
            )}

            <p className="mt-3 text-xs text-gray-500">
              Locale-derived locations help highlight regional reach while keeping
              IP addresses private.
            </p>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminAnalyticsDashboard;
