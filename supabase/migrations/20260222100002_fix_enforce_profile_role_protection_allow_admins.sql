-- Allow admins to change OTHER users' roles (not just superadmins)
-- Still blocks self-promotion for non-superadmins
CREATE OR REPLACE FUNCTION public.enforce_profile_role_protection()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Superadmin: unrestricted
    IF EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    ) THEN
      RETURN NEW;
    END IF;

    -- Admin changing ANOTHER user's role: allowed
    IF NEW.id != auth.uid() AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RETURN NEW;
    END IF;

    -- Everything else (self-promotion, non-admin role change): blocked
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
