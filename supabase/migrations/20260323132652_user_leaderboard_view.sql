-- Individual user leaderboard view
-- Ordered by points_balance DESC, excludes soft-deleted profiles
DROP VIEW IF EXISTS public.user_leaderboard;

CREATE VIEW public.user_leaderboard AS
  SELECT
    id,
    username,
    neighborhood,
    points_balance::integer AS total_points
  FROM profiles
  WHERE points_balance > 0
    AND deleted_at IS NULL
    AND username IS NOT NULL
  ORDER BY points_balance DESC;

GRANT SELECT ON public.user_leaderboard TO authenticated;
