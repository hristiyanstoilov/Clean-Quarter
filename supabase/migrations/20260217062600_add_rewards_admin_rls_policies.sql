-- Add admin RLS policies for rewards table (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can insert rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update rewards"
  ON public.rewards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can delete rewards"
  ON public.rewards FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
  ));
