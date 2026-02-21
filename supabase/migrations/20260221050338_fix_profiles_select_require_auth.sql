-- Profiles were publicly readable by unauthenticated users (USING true).
-- Restrict to authenticated users only.

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
