-- Migration: enforce_notifications_enabled
-- The `notifications_enabled` column on profiles has existed since the initial schema
-- but was never read by any notification trigger — every user received notifications
-- regardless of their preference toggle.
-- This migration adds a helper function and patches all 5 notification trigger
-- functions to skip INSERT when the target user has opted out.

-- ── Helper: check user preference ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.can_notify(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT COALESCE(notifications_enabled, true)
  FROM profiles
  WHERE id = p_user_id;
$$;

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
      IF can_notify(v_participant_id) THEN
        INSERT INTO notifications (user_id, type, message, campaign_id)
        VALUES (
          v_participant_id,
          'campaign_update',
          json_build_object('key', 'notification.campaignCompleted', 'title', v_campaign_title)::text,
          NEW.id
        );
      END IF;
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
  IF v_campaign_creator IS NOT NULL
    AND v_campaign_creator != NEW.user_id
    AND can_notify(v_campaign_creator)
  THEN
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
    IF can_notify(NEW.user_id) THEN
      INSERT INTO notifications (user_id, type, message, participation_id)
      VALUES (
        NEW.user_id,
        'approval',
        json_build_object('key', 'notification.participationApproved', 'points', NEW.points_earned)::text,
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── Participation rejected ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_participation_rejected()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    IF can_notify(NEW.user_id) THEN
      INSERT INTO notifications (user_id, type, message, participation_id)
      VALUES (
        NEW.user_id,
        'approval',
        json_build_object(
          'key',    'notification.participationRejected',
          'reason', COALESCE(NEW.rejection_reason, '')
        )::text,
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── Report resolved ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_report_resolved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_reporter_id UUID;
BEGIN
  IF NEW.status IN ('resolved', 'dismissed')
    AND (OLD.status IS NULL OR OLD.status = 'pending')
  THEN
    SELECT reported_by INTO v_reporter_id FROM reports WHERE id = NEW.id;
    IF v_reporter_id IS NOT NULL AND can_notify(v_reporter_id) THEN
      INSERT INTO notifications (user_id, type, message, report_id)
      VALUES (
        v_reporter_id,
        'moderation',
        json_build_object('key', 'notification.reportResolved', 'status', NEW.status)::text,
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
