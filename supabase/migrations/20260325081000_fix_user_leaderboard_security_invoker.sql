-- Fix: user_leaderboard view runs with creator permissions by default
-- (PostgreSQL SECURITY DEFINER behavior for views), bypassing RLS on profiles.
-- Switch to SECURITY INVOKER so the view respects the querying user's RLS policies.
-- Identical fix to neighborhood_leaderboard (migration 20260321052117).

CREATE OR REPLACE VIEW public.user_leaderboard
WITH (security_invoker = true) AS
  SELECT
    id,
    username,
    neighborhood,
    points_balance::integer AS total_points
  FROM public.profiles
  WHERE points_balance > 0
    AND deleted_at IS NULL
    AND username IS NOT NULL
  ORDER BY points_balance DESC;

GRANT SELECT ON public.user_leaderboard TO authenticated;
