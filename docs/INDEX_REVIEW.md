# Unused Index Review

**Next review date:** 2026-04-21 (one month after initial indexing — enough traffic to have reliable stats)

## Why

PostgreSQL tracks index usage via `pg_stat_user_indexes`. Every scan that uses an index increments `idx_scan`. Indexes that are never (or rarely) scanned still impose write overhead on every INSERT/UPDATE/DELETE. Regular review keeps the database lean.

## How to identify unused indexes

Run the following query on the **production** Supabase project (SQL editor or via `psql`):

```sql
SELECT
  schemaname,
  relname        AS table_name,
  indexrelname   AS index_name,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
```

## Decision criteria

| idx_scan | Action |
|----------|--------|
| 0        | Strong candidate for removal — confirm it is not used by a rarely-run admin query |
| 1–10     | Review: check if it covers a critical low-frequency query (e.g., admin reports) |
| > 10     | Keep |

## Known indexes to watch (as of 2026-03-21)

| Table | Index | Purpose |
|-------|-------|---------|
| `campaigns` | `campaigns_neighborhood_idx` | Filter by neighborhood on dashboard |
| `campaigns` | `campaigns_status_idx` | Filter active/completed campaigns |
| `participations` | `participations_user_id_idx` | User's own participations |
| `participations` | `participations_campaign_id_idx` | Campaign participant list |
| `notifications` | `notifications_user_id_idx` | Notification bell fetch |
| `point_transactions` | `point_transactions_user_id_idx` | Leaderboard / profile points |

## Process

1. Run the query above.
2. Note any indexes with `idx_scan = 0`.
3. Cross-check with `EXPLAIN (ANALYZE, BUFFERS)` on the queries you expect to use them.
4. If confirmed unused, open a migration: `DROP INDEX CONCURRENTLY public.<index_name>;`
5. Update this document with the outcome and set the next review date.

## Stats reset note

Supabase resets `pg_stat_*` counters when the instance restarts (e.g., after maintenance). If stats show 0 for many indexes, check the last reset time:

```sql
SELECT stats_reset FROM pg_stat_bgwriter;
```
