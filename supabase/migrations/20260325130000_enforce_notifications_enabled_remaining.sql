-- Migration: enforce_notifications_enabled_remaining
-- Patches notify_new_comment and notify_points_earned — the two trigger functions
-- missed in 20260325120000 — to respect the user's notifications_enabled preference
-- via the existing can_notify() helper.

-- ── New comment ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_campaign_creator UUID;
  v_campaign_title   TEXT;
  v_commenter_name   TEXT;
BEGIN
  SELECT created_by, title
    INTO v_campaign_creator, v_campaign_title
    FROM public.campaigns
   WHERE id = NEW.campaign_id::uuid;

  SELECT username
    INTO v_commenter_name
    FROM public.profiles
   WHERE id = NEW.user_id::uuid;

  IF v_campaign_creator IS NOT NULL
    AND v_campaign_creator != NEW.user_id::uuid
    AND can_notify(v_campaign_creator)
  THEN
    INSERT INTO public.notifications (user_id, type, message, campaign_id)
    VALUES (
      v_campaign_creator,
      'campaign_update',
      json_build_object('key', 'notification.newComment', 'username', v_commenter_name, 'title', v_campaign_title)::text,
      NEW.campaign_id::uuid
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ── Points earned ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_points_earned()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NEW.type = 'earned' AND can_notify(NEW.user_id) THEN
    INSERT INTO notifications (user_id, type, message, participation_id)
    VALUES (
      NEW.user_id,
      'points',
      json_build_object('key', 'notification.pointsEarned', 'points', NEW.amount)::text,
      NEW.participation_id
    );
  END IF;
  RETURN NEW;
END;
$$;
