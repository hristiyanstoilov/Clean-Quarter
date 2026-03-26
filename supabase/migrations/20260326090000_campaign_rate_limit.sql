-- Migration: campaign_rate_limit
-- Prevents spam campaign creation: max 5 campaigns per 24 hours per user.
-- Mirrors the login rate-limiting pattern (check_login_rate_limit).

CREATE TABLE IF NOT EXISTS campaign_rate_limits (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_rate_limits_user_time
  ON campaign_rate_limits (user_id, created_at DESC);

ALTER TABLE campaign_rate_limits DISABLE ROW LEVEL SECURITY;

-- ── check_campaign_rate_limit ─────────────────────────────────────────────────
-- Call BEFORE inserting a campaign. Returns { allowed: bool, remaining: int }.
-- Does NOT record an attempt — only checks the count.

CREATE OR REPLACE FUNCTION public.check_campaign_rate_limit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count  INTEGER;
  v_window TIMESTAMPTZ := NOW() - INTERVAL '24 hours';
  v_max    CONSTANT INTEGER := 5;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM campaign_rate_limits
  WHERE user_id = p_user_id
    AND created_at > v_window;

  IF v_count >= v_max THEN
    RETURN json_build_object('allowed', false, 'remaining', 0);
  END IF;

  RETURN json_build_object('allowed', true, 'remaining', v_max - v_count);
END;
$$;

-- ── record_campaign_creation ──────────────────────────────────────────────────
-- Call AFTER a successful campaign insert.
-- Records the creation and cleans up entries older than 48h.

CREATE OR REPLACE FUNCTION public.record_campaign_creation(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO campaign_rate_limits (user_id) VALUES (p_user_id);

  DELETE FROM campaign_rate_limits
  WHERE created_at < NOW() - INTERVAL '48 hours';
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_campaign_rate_limit(UUID)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_campaign_creation(UUID)   TO authenticated;
