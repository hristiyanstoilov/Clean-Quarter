-- Migration: fix_comments_cleanup_duplicate_policies
-- Applied: 2026-02-08
-- Synced from production Supabase
-- Purpose: Remove any duplicate RLS policies on comments table

-- Drop potential duplicates and ensure clean state
DO $$
DECLARE
  pol RECORD;
  seen TEXT[] := '{}';
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'comments'
    ORDER BY policyname
  LOOP
    IF pol.policyname = ANY(seen) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON comments', pol.policyname);
    ELSE
      seen := seen || pol.policyname;
    END IF;
  END LOOP;
END $$;
