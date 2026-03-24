-- Fix get_public_stats() — was querying type = 'award' which doesn't exist.
-- Valid enum values: 'earned' | 'spent' | 'role_change' | 'admin_adjustment'
-- Result: total_points always returned 0. Fix: use type = 'earned'.

CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE (
  total_campaigns  bigint,
  active_campaigns bigint,
  total_users      bigint,
  total_points     bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    (SELECT COUNT(*)::bigint          FROM public.campaigns)                                             AS total_campaigns,
    (SELECT COUNT(*)::bigint          FROM public.campaigns  WHERE status = 'active')                    AS active_campaigns,
    (SELECT COUNT(*)::bigint          FROM public.profiles)                                              AS total_users,
    (SELECT COALESCE(SUM(amount), 0)::bigint
                                      FROM public.point_transactions WHERE type = 'earned')              AS total_points;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO authenticated;
