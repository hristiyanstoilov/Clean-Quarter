-- Migration: notification_i18n
-- Store structured JSON in notifications.message instead of hardcoded English text.
-- Frontend parses JSON {"key":"notification.X","param":"..."} and translates with t().
-- Old plain-text messages are handled as fallback in renderNotifications().

-- ── Campaign completed ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_campaign_completed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_campaign_title TEXT;
  v_participant_id UUID;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT title INTO v_campaign_title FROM campaigns WHERE id = NEW.id;
    FOR v_participant_id IN
      SELECT DISTINCT user_id FROM participations WHERE campaign_id = NEW.id
    LOOP
      INSERT INTO notifications (user_id, type, message, campaign_id)
      VALUES (
        v_participant_id,
        'campaign_update',
        json_build_object('key', 'notification.campaignCompleted', 'title', v_campaign_title)::text,
        NEW.id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- ── Campaign join ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_campaign_join()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_campaign_creator UUID;
  v_campaign_title   TEXT;
  v_user_name        TEXT;
BEGIN
  SELECT created_by, title INTO v_campaign_creator, v_campaign_title
  FROM campaigns WHERE id = NEW.campaign_id;
  SELECT username INTO v_user_name FROM profiles WHERE id = NEW.user_id;
  IF v_campaign_creator IS NOT NULL AND v_campaign_creator != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, message, campaign_id, participation_id)
    VALUES (
      v_campaign_creator,
      'campaign_update',
      json_build_object('key', 'notification.campaignJoin', 'username', v_user_name, 'title', v_campaign_title)::text,
      NEW.campaign_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ── Participation approved ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_participation_approved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO notifications (user_id, type, message, participation_id)
    VALUES (
      NEW.user_id,
      'approval',
      json_build_object('key', 'notification.participationApproved', 'points', NEW.points_earned)::text,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ── New comment ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
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

  IF v_campaign_creator IS NOT NULL AND v_campaign_creator != NEW.user_id::uuid THEN
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

-- ── Points earned ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_points_earned()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NEW.type = 'earned' THEN
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

-- ── Report resolved ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_report_resolved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    INSERT INTO notifications (user_id, type, message, report_id)
    VALUES (
      NEW.reported_by,
      'moderation',
      json_build_object('key', 'notification.reportResolved')::text,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;
