DROP POLICY IF EXISTS "Authenticated users can view all reports" ON reports;

CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (reported_by = auth.uid());
