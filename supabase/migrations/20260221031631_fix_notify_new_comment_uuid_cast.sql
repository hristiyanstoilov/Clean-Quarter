CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_campaign_creator UUID;
  v_campaign_title TEXT;
  v_commenter_name TEXT;
BEGIN
  SELECT created_by, title INTO v_campaign_creator, v_campaign_title
  FROM campaigns
  WHERE id = NEW.campaign_id::uuid;

  SELECT username INTO v_commenter_name
  FROM profiles
  WHERE id = NEW.user_id::uuid;

  IF v_campaign_creator IS NOT NULL AND v_campaign_creator != NEW.user_id::uuid THEN
    INSERT INTO notifications (user_id, type, message, campaign_id)
    VALUES (
      v_campaign_creator,
      'campaign_update',
      v_commenter_name || ' commented on your campaign "' || v_campaign_title || '"',
      NEW.campaign_id
    );
  END IF;

  RETURN NEW;
END;
$$;
