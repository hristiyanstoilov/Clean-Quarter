-- Creates a SECURITY DEFINER RPC for soft-deleting comments.
-- Needed because the SELECT RLS policy (deleted_at IS NULL) is also applied
-- as a WITH CHECK on UPDATE, blocking users from setting deleted_at themselves.
CREATE OR REPLACE FUNCTION delete_comment(comment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE comments
  SET deleted_at = NOW(),
      deleted_by = auth.uid()
  WHERE id = comment_id
    AND (
      user_id = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text])
      )
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found or permission denied';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_comment(UUID) TO authenticated;
