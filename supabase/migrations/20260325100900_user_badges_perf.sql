-- Performance improvements for user_badges table.
--
-- 1. Index on badge_id FK: prevents full table scan when joining with badges
--    catalog in loadBadges() query (SELECT ... badges(emoji, name_bg, ...)).
--
-- 2. RLS SELECT policy: replace auth.uid() with (SELECT auth.uid()) so the
--    expression is evaluated once per query instead of once per row, avoiding
--    a per-row re-evaluation penalty at scale.

CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id
  ON public.user_badges(badge_id);

DROP POLICY IF EXISTS "user_badges_owner_read" ON public.user_badges;
CREATE POLICY "user_badges_owner_read" ON public.user_badges
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
