-- Migration: data_retention_policy
-- NOTE: run_data_retention() v1 defined here is superseded by migrations
--       _140000 (adds logging) and _150000 (batches all four tables).
--       The final active version lives in _150000.
-- Schedules automatic cleanup of stale data:
--   • Notifications older than 90 days → deleted
--   • Campaigns completed more than 365 days ago → archived (status = 'archived')
--   • Admin audit log entries older than 180 days → deleted
--   • Login attempt records older than 30 days → deleted
--
-- Uses pg_cron (available on Supabase Pro / paid plans).
-- On the free plan the cron schedule below will silently do nothing if pg_cron
-- is not enabled; the helper function itself is always safe to call manually.

-- ── 0. Add 'archived' to campaigns status CHECK constraint ──────────────────
ALTER TABLE public.campaigns
  DROP CONSTRAINT IF EXISTS campaigns_status_check;

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_status_check
    CHECK (status IN ('active', 'completed', 'cancelled', 'pending_review', 'archived'));

-- ── 1. Retention helper function ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.run_data_retention()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete read & unread notifications older than 90 days
  DELETE FROM public.notifications
   WHERE created_at < NOW() - INTERVAL '90 days';

  -- Archive campaigns that completed more than 365 days ago
  -- (preserves the row for historical stats but removes it from active lists)
  UPDATE public.campaigns
     SET status = 'archived'
   WHERE status = 'completed'
     AND scheduled_date < (CURRENT_DATE - INTERVAL '365 days');

  -- Delete admin audit log entries older than 180 days
  DELETE FROM public.admin_audit_log
   WHERE created_at < NOW() - INTERVAL '180 days';

  -- Delete stale login attempt records older than 30 days
  DELETE FROM public.login_attempts
   WHERE attempted_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Only admins / service role may invoke this directly
REVOKE EXECUTE ON FUNCTION public.run_data_retention() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.run_data_retention() TO service_role;

-- ── 2. Schedule with pg_cron (runs daily at 03:00 UTC) ──────────────────────
-- This block is wrapped in a DO $$ … $$ so that it silently skips when
-- pg_cron is not available (free-plan deployments).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Remove any existing schedule with the same name before (re-)creating it
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'data-retention-daily') THEN
      PERFORM cron.unschedule('data-retention-daily');
    END IF;

    PERFORM cron.schedule(
      'data-retention-daily',          -- job name
      '0 3 * * *',                      -- daily at 03:00 UTC
      $cmd$SELECT public.run_data_retention()$cmd$
    );
  END IF;
END;
$$;
