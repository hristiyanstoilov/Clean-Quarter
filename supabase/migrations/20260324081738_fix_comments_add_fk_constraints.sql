-- Fix comments table: change TEXT columns to UUID and add FK constraints.
-- Policies using user_id::text cast must be dropped and recreated.

-- 1. Drop policies that reference user_id as text
DROP POLICY IF EXISTS comments_insert_own         ON comments;
DROP POLICY IF EXISTS comments_update_soft_delete ON comments;

-- 2. Convert columns from TEXT to UUID
ALTER TABLE comments
  ALTER COLUMN campaign_id TYPE uuid USING campaign_id::uuid,
  ALTER COLUMN user_id     TYPE uuid USING user_id::uuid;

-- 3. Add FK constraints
ALTER TABLE comments
  ADD CONSTRAINT comments_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  ADD CONSTRAINT comments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. Recreate policies with proper UUID comparison (no cast needed)
CREATE POLICY comments_insert_own
  ON comments FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY comments_update_soft_delete
  ON comments FOR UPDATE
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- 5. Index for fast campaign lookup
CREATE INDEX IF NOT EXISTS comments_campaign_id_idx ON comments(campaign_id);
