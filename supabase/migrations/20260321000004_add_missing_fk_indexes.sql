-- Fix: event_rsvps.user_id and push_subscriptions.user_id are foreign keys
-- without covering indexes. Queries filtering by user_id (e.g. "get all RSVPs
-- for user X") trigger a full table scan without these indexes.

CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id
  ON public.event_rsvps (user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions (user_id);
