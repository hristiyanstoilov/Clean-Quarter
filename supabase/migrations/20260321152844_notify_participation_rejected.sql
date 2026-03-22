-- Migration: notify_participation_rejected
-- Add DB trigger that fires when a participation is rejected.
-- Previously only push notifications were sent from admin.js (JS-side).
-- Now users also receive an in-app bell notification with the rejection reason.
-- Message stored as i18n JSON (same pattern as other notification triggers).

CREATE OR REPLACE FUNCTION public.notify_participation_rejected()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
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
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_participation_rejected
  AFTER UPDATE ON participations
  FOR EACH ROW EXECUTE FUNCTION notify_participation_rejected();
