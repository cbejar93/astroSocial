# Analytics instrumentation

AstroLounge now ships with a lightweight analytics pipeline that respects user
privacy while giving administrators the metrics they need.

## Data collection

- The browser client batches interaction, session, and heartbeat events through
  `POST /api/analytics/events`.
- Events are buffered on the server and flushed to the database in small batches
  (default: 50 events or every five seconds) to reduce write amplification.
- Summary rollups are cached and refreshed nightly so the admin dashboard loads
  quickly without hammering the database.

## Privacy and opt-in

- The analytics provider inspects each browser's **Do Not Track** header. If it
  is set to `1`, tracking is disabled automatically.
- Administrators (and any signed-in user) can toggle analytics locally from the
  new **Analytics** tab under `/admin/analytics`. The preference persists via the
  `astro.analytics.optOut` flag in `localStorage`.
- When tracking is disabled, the client skips event delivery entirely. Users can
  also clear the preference by logging out or removing the storage key.

## Retention and maintenance

- A nightly job prunes analytics sessions and events older than **180 days** so
  historical data does not grow without bound.
- The same maintenance window pre-computes rollups for 1, 7, and 30-day ranges
  so the dashboard can serve cached summaries immediately after login.
- Because events are buffered in memory, the service flushes the queue before
  pruning or warming caches to avoid data loss.

Feel free to adjust the retention window or batching knobs inside
`backend/src/analytics/analytics.service.ts` to suit your production workload.
