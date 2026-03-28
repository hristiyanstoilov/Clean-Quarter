-- Migration: add_campaign_moderation_queue
-- Adds 'pending_review' to campaigns.status so first-time campaign creators
-- can be held for admin approval before their campaign goes public.

-- ── 1. Widen the status CHECK constraint ──────────────────────────────────────
ALTER TABLE campaigns
  DROP CONSTRAINT IF EXISTS campaigns_status_check;

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_status_check
    CHECK (status IN ('active', 'completed', 'cancelled', 'pending_review'));

-- ── 2. RLS: pending_review campaigns are invisible to regular users ────────────
-- Existing select policy allows users to see active/completed campaigns.
-- Add a supplemental condition: filter out pending_review unless the viewer
-- is an admin or the campaign creator.

-- Drop the existing campaigns select policy and recreate it with the extra check.
DROP POLICY IF EXISTS "Users can view active campaigns" ON campaigns;
DROP POLICY IF EXISTS "campaigns_select_policy" ON campaigns;

CREATE POLICY "campaigns_select_policy"
ON campaigns FOR SELECT
USING (
  -- Admins see everything
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  -- Creator always sees their own campaigns
  OR created_by = auth.uid()
  -- Everyone else only sees non-pending_review campaigns
  OR status != 'pending_review'
);

-- ── 3. Index for admin moderation queue lookup ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_campaigns_pending_review
  ON campaigns(status) WHERE status = 'pending_review';
