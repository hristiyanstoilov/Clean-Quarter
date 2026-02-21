-- Prevent users from self-approving participations or manipulating points.
-- Admins can update any field. Regular users can update after_photo_url
-- and set status = 'pending' (photo submission), but cannot set
-- status = 'approved' / 'rejected' or change points_earned.

CREATE OR REPLACE FUNCTION prevent_participation_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- System/trigger context (auth.uid() is NULL) — allow all
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
  ) INTO is_admin;

  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Block users from setting status to approved or rejected
  IF NEW.status IN ('approved', 'rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'Permission denied: only admins can approve or reject participations';
  END IF;

  -- Block users from manipulating earned points
  IF OLD.points_earned IS DISTINCT FROM NEW.points_earned THEN
    RAISE EXCEPTION 'Permission denied: only admins can change points_earned';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_participation_integrity ON participations;
CREATE TRIGGER enforce_participation_integrity
  BEFORE UPDATE ON participations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_participation_privilege_escalation();
