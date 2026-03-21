-- Fix: neighborhood_leaderboard view runs with creator permissions by default
-- (PostgreSQL SECURITY DEFINER behavior for views), bypassing RLS on profiles.
-- Switch to SECURITY INVOKER so the view respects the querying user's RLS policies.
-- Requires PostgreSQL 15+ (supported by Supabase).

CREATE OR REPLACE VIEW public.neighborhood_leaderboard
WITH (security_invoker = true) AS
  SELECT
    neighborhood,
    COALESCE(SUM(points_balance), 0)::integer AS total_points,
    COUNT(*)::integer                          AS participant_count
  FROM public.profiles
  WHERE neighborhood IS NOT NULL
  GROUP BY neighborhood
  ORDER BY total_points DESC;

-- Re-grant select (unchanged, but explicit after view recreation)
GRANT SELECT ON public.neighborhood_leaderboard TO authenticated;
GRANT SELECT ON public.neighborhood_leaderboard TO anon;
