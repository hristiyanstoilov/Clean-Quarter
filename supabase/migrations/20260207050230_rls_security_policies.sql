-- Migration: rls_security_policies
-- Applied: 2026-02-07
-- Synced from production Supabase
-- Purpose: Fine-tune RLS policies for all tables

-- Profiles policies
CREATE POLICY IF NOT EXISTS "Users can view all profiles"
  ON profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY IF NOT EXISTS "Superadmins can update any profile role"
  ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_superadmin = true)
  );

-- Campaigns policies
CREATE POLICY IF NOT EXISTS "Authenticated users can create campaigns"
  ON campaigns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Users can update own campaigns"
  ON campaigns FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can update any campaign"
  ON campaigns FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY IF NOT EXISTS "Users can delete own campaigns"
  ON campaigns FOR DELETE USING (created_by = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can delete any campaign"
  ON campaigns FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Participations policies
CREATE POLICY IF NOT EXISTS "Users can view all participations"
  ON participations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can create participations"
  ON participations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can update own participations"
  ON participations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can update any participation"
  ON participations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Point Transactions policies
CREATE POLICY IF NOT EXISTS "Admins can insert transactions"
  ON point_transactions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Disposal Points policies
CREATE POLICY IF NOT EXISTS "disposal_points_select_own"
  ON disposal_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "disposal_points_insert_own"
  ON disposal_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "disposal_points_update_own"
  ON disposal_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "disposal_points_delete_own"
  ON disposal_points FOR DELETE USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY IF NOT EXISTS "Authenticated users can view all reports"
  ON reports FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Authenticated users can create reports"
  ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Admins can update reports"
  ON reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Notifications policies
CREATE POLICY IF NOT EXISTS "Users can view own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can update own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Authenticated triggers can insert notifications"
  ON notifications FOR INSERT WITH CHECK (true);
