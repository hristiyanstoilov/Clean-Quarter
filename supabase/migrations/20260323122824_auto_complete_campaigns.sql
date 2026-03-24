-- Auto-complete campaigns whose scheduled_date has passed
-- Called client-side from dashboard.js on every page load (fire-and-forget)
-- RLS note: this runs as the invoking user via RPC; SECURITY DEFINER allows it to
-- bypass RLS and update any active campaign regardless of ownership.

CREATE OR REPLACE FUNCTION public.auto_complete_campaigns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE campaigns
  SET status = 'completed'
  WHERE status = 'active'
    AND deleted_at IS NULL
    AND scheduled_date IS NOT NULL
    AND scheduled_date::date < CURRENT_DATE;
END;
$$;

-- Allow any authenticated user to invoke this RPC
GRANT EXECUTE ON FUNCTION public.auto_complete_campaigns() TO authenticated;
