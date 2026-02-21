-- Add 'points' and 'join' to notifications type CHECK constraint
-- notify_points_earned() trigger was using type='points' which violated the old constraint
ALTER TABLE public.notifications
  DROP CONSTRAINT notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'approval'::text,
    'campaign_update'::text,
    'system'::text,
    'moderation'::text,
    'achievement'::text,
    'points'::text,
    'join'::text
  ]));
