-- Fix: login_attempts table is public without RLS enabled.
-- Any authenticated user could read all login attempts (username enumeration risk).
--
-- The table is written ONLY by SECURITY DEFINER rate-limiting functions which
-- bypass RLS by design — no INSERT/UPDATE/DELETE policies are needed.
-- Only admins and superadmins should be able to SELECT from this table.

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_select_login_attempts"
  ON public.login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );
