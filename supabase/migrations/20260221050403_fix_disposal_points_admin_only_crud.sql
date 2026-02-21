-- Disposal points are infrastructure managed by admins, not arbitrary users.
-- Replace user-owned policies with admin-only policies.

DROP POLICY IF EXISTS "disposal_points_insert_own" ON disposal_points;
DROP POLICY IF EXISTS "disposal_points_update_own" ON disposal_points;
DROP POLICY IF EXISTS "disposal_points_delete_own" ON disposal_points;

CREATE POLICY "disposal_points_insert_admin" ON disposal_points
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "disposal_points_update_admin" ON disposal_points
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "disposal_points_delete_admin" ON disposal_points
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );
