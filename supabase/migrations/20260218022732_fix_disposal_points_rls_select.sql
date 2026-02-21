-- Fix: disposal_points SELECT was restricted to own rows only.
-- All authenticated users should see all disposal points on the map.
DROP POLICY IF EXISTS "disposal_points_select_own" ON disposal_points;

CREATE POLICY "disposal_points_select_authenticated" ON disposal_points
  FOR SELECT USING (auth.uid() IS NOT NULL);
