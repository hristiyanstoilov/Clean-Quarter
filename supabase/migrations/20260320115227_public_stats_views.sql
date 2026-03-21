-- Public stats views — exposes aggregated, non-personal data to anonymous users
-- Used by the public /stats page (no auth required).

-- 1. Flat aggregate numbers
CREATE OR REPLACE VIEW public_stats AS
SELECT
  (SELECT COUNT(*)::integer        FROM campaigns     WHERE deleted_at IS NULL)             AS total_campaigns,
  (SELECT COUNT(DISTINCT user_id)  FROM participations WHERE status = 'approved')::integer  AS total_volunteers,
  (SELECT COUNT(*)::integer        FROM participations WHERE status = 'approved')            AS total_cleanups,
  (SELECT COALESCE(SUM(amount), 0)::bigint
                                   FROM point_transactions WHERE type = 'award')             AS total_points;

-- 2. Category breakdown (multiple rows)
CREATE OR REPLACE VIEW public_category_stats AS
SELECT
  COALESCE(category, 'other') AS category,
  COUNT(*)::integer            AS campaign_count
FROM campaigns
WHERE deleted_at IS NULL
GROUP BY category;

-- Grant anonymous read access (aggregated data only — no personal info)
GRANT SELECT ON public_stats             TO anon;
GRANT SELECT ON public_category_stats    TO anon;
GRANT SELECT ON neighborhood_leaderboard TO anon;
