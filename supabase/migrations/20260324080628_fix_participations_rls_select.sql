-- Replace overly permissive SELECT policy on participations.
-- Old: any authenticated user can read all participations.
-- New: users see only their own participations OR participations
--      for campaigns they created; admins see everything.

DROP POLICY IF EXISTS "Authenticated users can view participations" ON participations;

CREATE POLICY "participations_select"
ON participations
FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = participations.campaign_id
      AND campaigns.created_by = (SELECT auth.uid())
  )
  OR current_user_is_admin()
);
