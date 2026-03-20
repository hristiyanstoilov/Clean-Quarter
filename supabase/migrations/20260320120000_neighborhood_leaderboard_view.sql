-- Neighborhood leaderboard view
-- Aggregates profiles by neighborhood server-side to avoid fetching
-- all rows client-side. Dashboard queries this view directly.

CREATE OR REPLACE VIEW neighborhood_leaderboard AS
  SELECT
    neighborhood,
    COALESCE(SUM(points_balance), 0)::integer AS total_points,
    COUNT(*)::integer                          AS participant_count
  FROM profiles
  WHERE neighborhood IS NOT NULL
  GROUP BY neighborhood
  ORDER BY total_points DESC;

-- Allow authenticated users to read the leaderboard view
GRANT SELECT ON neighborhood_leaderboard TO authenticated;
