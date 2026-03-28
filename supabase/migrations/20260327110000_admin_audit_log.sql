-- Migration: admin_audit_log
-- Creates a dedicated audit log for admin actions (approvals, rejections,
-- campaign moderation, role changes, reward management).
-- Role change log already exists in point_transactions (type='role_change').
-- This table is for broader admin accountability.

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,           -- e.g. 'approve_participation', 'reject_participation', 'approve_campaign', 'adjust_points'
  target_type   TEXT NOT NULL,           -- e.g. 'participation', 'campaign', 'user', 'reward'
  target_id     TEXT NOT NULL,           -- UUID or string ID of the affected record
  reason        TEXT,                    -- optional reason / note
  meta          JSONB,                   -- additional data (e.g. points_delta, old_status)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by admin or target
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id    ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_id   ON public.admin_audit_log(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at  ON public.admin_audit_log(created_at DESC);

-- RLS: only admins can read; nobody inserts directly from client (use service role / RPC)
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_audit_log"
ON public.admin_audit_log FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can insert from client (needed since we don't have a dedicated RPC yet)
CREATE POLICY "admins_insert_audit_log"
ON public.admin_audit_log FOR INSERT
WITH CHECK (
  admin_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
