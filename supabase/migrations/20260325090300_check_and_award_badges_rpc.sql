-- RPC: award any new badges a user has earned based on approved participation count
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  badge   public.badges%ROWTYPE;
BEGIN
  -- Count approved participations for the user
  SELECT COUNT(*)
    INTO v_count
    FROM public.participations
   WHERE user_id = p_user_id
     AND status = 'approved'
     AND deleted_at IS NULL;

  -- Check each badge threshold
  FOR badge IN
    SELECT * FROM public.badges WHERE threshold <= v_count ORDER BY threshold
  LOOP
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (p_user_id, badge.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_award_badges(uuid) TO authenticated;
