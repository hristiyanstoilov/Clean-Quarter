-- Migration: improve_data_retention_logging
-- NOTE: run_data_retention() v2 defined here is superseded by migration
--       _150000 which adds batching for admin_audit_log and login_attempts.
--       The final active version lives in _150000.
-- Replaces run_data_retention() with a version that:
--   • Logs row counts via RAISE LOG for observability
--   • Batches notification deletes (1 000 rows/iteration) to reduce lock contention
--     on the first run when many rows may need purging

CREATE OR REPLACE FUNCTION public.run_data_retention()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted  integer;
  v_total    integer := 0;
BEGIN
  -- ── Notifications: batch-delete older than 90 days ─────────────────────────
  -- Deleting in chunks of 1 000 avoids a single long-running lock on first run
  LOOP
    DELETE FROM public.notifications
     WHERE id IN (
       SELECT id FROM public.notifications
        WHERE created_at < NOW() - INTERVAL '90 days'
        LIMIT 1000
     );
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_total := v_total + v_deleted;
    EXIT WHEN v_deleted = 0;
  END LOOP;
  RAISE LOG 'data_retention: deleted % notifications older than 90 days', v_total;

  -- ── Campaigns: archive completed ones older than 365 days ──────────────────
  UPDATE public.campaigns
     SET status = 'archived'
   WHERE status = 'completed'
     AND scheduled_date < (CURRENT_DATE - INTERVAL '365 days');
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE LOG 'data_retention: archived % campaigns (scheduled_date > 365 days ago)', v_deleted;

  -- ── Admin audit log: delete entries older than 180 days ────────────────────
  DELETE FROM public.admin_audit_log
   WHERE created_at < NOW() - INTERVAL '180 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE LOG 'data_retention: deleted % admin_audit_log rows older than 180 days', v_deleted;

  -- ── Login attempts: delete records older than 30 days ──────────────────────
  -- Note: the rate-limiter only queries the last 15 minutes, so 30-day retention
  -- is safe and does not affect rate-limit accuracy.
  DELETE FROM public.login_attempts
   WHERE attempted_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE LOG 'data_retention: deleted % login_attempts older than 30 days', v_deleted;
END;
$$;

-- Permissions unchanged — service_role only
REVOKE EXECUTE ON FUNCTION public.run_data_retention() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.run_data_retention() TO service_role;
