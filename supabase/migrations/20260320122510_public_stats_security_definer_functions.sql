-- Replace SECURITY INVOKER views with SECURITY DEFINER functions.
-- Views run as the calling user (anon) which is blocked by RLS on
-- participations and point_transactions. Functions with SECURITY DEFINER
-- run as their owner (postgres/superuser) and bypass RLS safely,
-- exposing only aggregated non-personal data.

DROP VIEW IF EXISTS public_stats;
DROP VIEW IF EXISTS public_category_stats;

-- Aggregate stats (single row)
CREATE OR REPLACE FUNCTION get_public_stats()
RETURNS TABLE(
  total_campaigns  int,
  total_volunteers int,
  total_cleanups   int,
  total_points     bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    (SELECT COUNT(*)::int        FROM campaigns         WHERE deleted_at IS NULL)              AS total_campaigns,
    (SELECT COUNT(DISTINCT user_id)::int FROM participations WHERE status = 'approved')        AS total_volunteers,
    (SELECT COUNT(*)::int        FROM participations    WHERE status = 'approved')             AS total_cleanups,
    (SELECT COALESCE(SUM(amount), 0)::bigint FROM point_transactions WHERE type = 'award')    AS total_points;
$$;

-- Campaign count by category
CREATE OR REPLACE FUNCTION get_public_category_stats()
RETURNS TABLE(category text, campaign_count int)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(c.category, 'other')::text AS category,
         COUNT(*)::int AS campaign_count
  FROM campaigns c
  WHERE c.deleted_at IS NULL
  GROUP BY c.category
  ORDER BY COUNT(*) DESC;
$$;

-- Neighborhood leaderboard (top 5)
CREATE OR REPLACE FUNCTION get_public_neighborhood_stats()
RETURNS TABLE(neighborhood text, total_points int, participant_count int)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.neighborhood::text,
         COALESCE(SUM(p.points_balance), 0)::int AS total_points,
         COUNT(*)::int                            AS participant_count
  FROM profiles p
  WHERE p.neighborhood IS NOT NULL
  GROUP BY p.neighborhood
  ORDER BY COALESCE(SUM(p.points_balance), 0) DESC
  LIMIT 5;
$$;

GRANT EXECUTE ON FUNCTION get_public_stats()              TO anon;
GRANT EXECUTE ON FUNCTION get_public_category_stats()     TO anon;
GRANT EXECUTE ON FUNCTION get_public_neighborhood_stats() TO anon;
