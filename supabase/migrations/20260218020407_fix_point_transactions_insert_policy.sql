-- Fix: add INSERT policy for point_transactions so admins can award points
CREATE POLICY "Admins can insert transactions"
  ON public.point_transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));
