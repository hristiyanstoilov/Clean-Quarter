-- Patch approve_participation to update streak after approval
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
  v_points_awarded constant integer := 20;
  v_today          date := CURRENT_DATE;
  v_last_date      date;
  v_cur_streak     integer;
BEGIN
  v_admin_id := auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT p.user_id, c.title
    INTO v_user_id, v_camp_title
    FROM participations p
    JOIN campaigns c ON c.id = p.campaign_id
   WHERE p.id = p_participation_id AND p.status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Participation not found or not pending');
  END IF;

  UPDATE participations
     SET status = 'approved', points_earned = v_points_awarded
   WHERE id = p_participation_id;

  -- Read current streak state
  SELECT last_cleanup_date, current_streak
    INTO v_last_date, v_cur_streak
    FROM profiles
   WHERE id = v_user_id;

  -- Update streak: consecutive days increment, same day no-op, gap resets
  IF v_last_date = v_today THEN
    NULL; -- already credited today, no change
  ELSIF v_last_date = v_today - interval '1 day' THEN
    v_cur_streak := v_cur_streak + 1; -- consecutive day
  ELSE
    v_cur_streak := 1; -- first cleanup or gap → reset
  END IF;

  UPDATE profiles
     SET points_balance    = COALESCE(points_balance, 0) + v_points_awarded,
         last_cleanup_date = v_today,
         current_streak    = v_cur_streak,
         longest_streak    = GREATEST(COALESCE(longest_streak, 0), v_cur_streak)
   WHERE id = v_user_id;

  INSERT INTO point_transactions (user_id, amount, type, reason, participation_id)
  VALUES (
    v_user_id,
    v_points_awarded,
    'earned',
    'Cleanup proof approved - ' || COALESCE(v_camp_title, 'Campaign'),
    p_participation_id
  );

  -- Award any newly unlocked badges
  PERFORM public.check_and_award_badges(v_user_id);

  RETURN json_build_object('success', true, 'points_awarded', v_points_awarded);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_participation(uuid) TO authenticated;
