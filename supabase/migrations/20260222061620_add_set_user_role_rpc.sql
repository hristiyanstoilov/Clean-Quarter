CREATE OR REPLACE FUNCTION public.set_user_role(p_user_id uuid, p_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_id   uuid;
  v_old_role   text;
BEGIN
  v_admin_id := auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  IF v_admin_id = p_user_id AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_admin_id AND is_superadmin = true
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Cannot change your own role');
  END IF;

  IF p_role NOT IN ('user', 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role. Allowed: user, admin');
  END IF;

  SELECT role INTO v_old_role FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  UPDATE profiles SET role = p_role WHERE id = p_user_id;

  INSERT INTO point_transactions (user_id, amount, type, reason)
  VALUES (p_user_id, 0, 'role_change', 'Role changed: ' || v_old_role || ' → ' || p_role);

  RETURN json_build_object('success', true, 'old_role', v_old_role, 'new_role', p_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;
