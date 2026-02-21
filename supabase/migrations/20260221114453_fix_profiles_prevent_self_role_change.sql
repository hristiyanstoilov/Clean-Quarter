-- Prevent users from changing their own role via RLS UPDATE policy.
-- Only superadmins (is_superadmin = true) can change any user's role.
CREATE OR REPLACE FUNCTION enforce_profile_role_protection()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    ) THEN
      RAISE EXCEPTION 'Only superadmins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_role ON profiles;
CREATE TRIGGER protect_profile_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_profile_role_protection();
