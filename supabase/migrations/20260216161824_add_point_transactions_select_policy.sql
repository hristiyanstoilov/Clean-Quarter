-- Allow users to read their own transaction history
CREATE POLICY "Users can view own transactions"
  ON point_transactions FOR SELECT
  USING (user_id = auth.uid());
