-- Create comments table for campaign discussions
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  campaign_id text NOT NULL,
  user_id text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_authenticated"
  ON public.comments FOR SELECT
  USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "comments_insert_own"
  ON public.comments FOR INSERT
  WITH CHECK ((auth.uid())::text = user_id);

CREATE POLICY "comments_update_soft_delete"
  ON public.comments FOR UPDATE
  USING (
    (auth.uid())::text = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  );

-- Auto-update updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_timestamp();
