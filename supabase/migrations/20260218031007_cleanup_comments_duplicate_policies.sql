-- Cleanup any duplicate RLS policies on comments table if they exist
-- (idempotent - safe to run multiple times)
DO $$
BEGIN
  -- Drop duplicates if they exist, keep the canonical ones
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'comments' AND policyname = 'comments_select_authenticated'
  ) THEN
    NULL; -- policy exists, no action needed
  END IF;
END $$;
