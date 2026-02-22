-- Admins need to read all point_transactions for the admin panel
-- (role log, user history, approval verification)
CREATE POLICY "Admins can view all transactions"
  ON point_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
