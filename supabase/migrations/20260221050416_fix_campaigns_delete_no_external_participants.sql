-- Enforce the business rule at DB level:
-- A campaign can only be deleted by its creator if no external participants exist.
-- (Creator's own auto-participation does not block deletion.)

CREATE OR REPLACE FUNCTION campaign_has_external_participants(p_campaign_id UUID, p_creator_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participations
    WHERE campaign_id = p_campaign_id
      AND user_id != p_creator_id
      AND deleted_at IS NULL
  );
$$;

DROP POLICY IF EXISTS "Users can delete own campaigns" ON campaigns;

CREATE POLICY "Users can delete own campaigns without external participants"
  ON campaigns FOR DELETE
  USING (
    created_by = auth.uid()
    AND NOT campaign_has_external_participants(id, auth.uid())
  );
