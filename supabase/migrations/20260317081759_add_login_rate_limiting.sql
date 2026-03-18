-- Server-side login rate limiting
-- Tracks failed login attempts per email. Only failed attempts are recorded
-- (successful logins do not write to this table).

CREATE TABLE IF NOT EXISTS login_attempts (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email        TEXT        NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast per-email lookups within the time window
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
  ON login_attempts (email, attempted_at DESC);

-- RLS is disabled — access is only via SECURITY DEFINER functions below
ALTER TABLE login_attempts DISABLE ROW LEVEL SECURITY;

-- ─── check_login_rate_limit ───────────────────────────────────────────────────
-- Call this BEFORE attempting signInWithPassword.
-- Returns { allowed: bool, remaining: int }
-- Does NOT record an attempt — only checks the count.

CREATE OR REPLACE FUNCTION check_login_rate_limit(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count     INTEGER;
  v_window    TIMESTAMPTZ := NOW() - INTERVAL '15 minutes';
  v_max       CONSTANT INTEGER := 5;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM login_attempts
  WHERE email = lower(p_email)
    AND attempted_at > v_window;

  IF v_count >= v_max THEN
    RETURN json_build_object('allowed', false, 'remaining', 0);
  END IF;

  RETURN json_build_object('allowed', true, 'remaining', v_max - v_count);
END;
$$;

-- ─── record_login_attempt ─────────────────────────────────────────────────────
-- Call this AFTER a failed signInWithPassword.
-- Records the failed attempt and cleans up entries older than 24h.

CREATE OR REPLACE FUNCTION record_login_attempt(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert failed attempt
  INSERT INTO login_attempts (email) VALUES (lower(p_email));

  -- Clean up old entries to prevent table bloat
  DELETE FROM login_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Grant to both anon (login page) and authenticated roles
GRANT EXECUTE ON FUNCTION check_login_rate_limit(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_login_rate_limit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_login_attempt(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION record_login_attempt(TEXT) TO authenticated;
