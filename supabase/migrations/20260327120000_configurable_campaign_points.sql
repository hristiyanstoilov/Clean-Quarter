-- Migration: configurable_campaign_points
-- Adds a `points_value` column to campaigns so organizers can set how many
-- points participants earn upon approval (10 / 20 / 30 / 50).
-- Updates the approve_participation RPC to read the campaign's points_value.

-- ── 1. Add points_value column ────────────────────────────────────────────────
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS points_value INTEGER NOT NULL DEFAULT 20
    CHECK (points_value IN (10, 20, 30, 50));

-- ── 2. Update approve_participation RPC to use campaign points_value ──────────
CREATE OR REPLACE FUNCTION public.approve_participation(p_participation_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_id       uuid;
  v_user_id        uuid;
  v_camp_title     text;
  v_points_awarded integer;
BEGIN
  v_admin_id := auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT p.user_id, c.title, COALESCE(c.points_value, 20)
    INTO v_user_id, v_camp_title, v_points_awarded
    FROM participations p
    JOIN campaigns c ON c.id = p.campaign_id
   WHERE p.id = p_participation_id AND p.status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Participation not found or not pending');
  END IF;

  UPDATE participations
     SET status = 'approved', points_earned = v_points_awarded
   WHERE id = p_participation_id;

  UPDATE profiles
     SET points_balance = COALESCE(points_balance, 0) + v_points_awarded
   WHERE id = v_user_id;

  INSERT INTO point_transactions (user_id, amount, type, reason, participation_id)
  VALUES (
    v_user_id,
    v_points_awarded,
    'earned',
    'Cleanup proof approved - ' || COALESCE(v_camp_title, 'Campaign'),
    p_participation_id
  );

  RETURN json_build_object('success', true, 'points_awarded', v_points_awarded);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_participation(uuid) TO authenticated;
