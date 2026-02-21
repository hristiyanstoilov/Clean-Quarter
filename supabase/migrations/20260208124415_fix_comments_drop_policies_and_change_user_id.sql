-- Migration: fix_comments_drop_policies_and_change_user_id
-- Applied: 2026-02-08
-- Synced from production Supabase
-- Purpose: Drop old comments policies, change user_id to TEXT, re-enable RLS with new policies

-- Drop old policies that reference UUID type
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- Change user_id to TEXT
ALTER TABLE comments
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Re-enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Recreate policies with TEXT cast for auth.uid()
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE TO authenticated
  USING ((auth.uid())::text = user_id)
  WITH CHECK ((auth.uid())::text = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR UPDATE TO authenticated
  USING (
    (auth.uid())::text = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE (profiles.id)::text = (auth.uid())::text AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    deleted_at IS NOT NULL
    AND (
      (auth.uid())::text = user_id
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE (profiles.id)::text = (auth.uid())::text AND profiles.role = 'admin'
      )
    )
  );
