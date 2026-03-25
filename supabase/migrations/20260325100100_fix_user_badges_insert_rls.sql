-- Harden user_badges INSERT policy:
-- Prevent direct API inserts from authenticated users.
-- The SECURITY DEFINER function check_and_award_badges bypasses RLS
-- and can still insert freely, so badge awarding is unaffected.
DROP POLICY IF EXISTS "user_badges_service_insert" ON public.user_badges;

CREATE POLICY "user_badges_service_insert" ON public.user_badges
  FOR INSERT WITH CHECK (false);
