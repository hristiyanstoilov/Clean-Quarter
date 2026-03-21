-- Fix: RLS policies calling auth.uid() directly cause PostgreSQL to re-evaluate
-- the function for every row in the table scan. Wrapping with (SELECT auth.uid())
-- turns it into a scalar subquery evaluated once per statement (init plan),
-- which can be orders of magnitude faster on large tables.
--
-- Policies already using (SELECT auth.uid()) are left unchanged.
-- 21 policies across 9 tables are updated below.

-- ─── comments ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "comments_insert_own"             ON public.comments;
DROP POLICY IF EXISTS "comments_select_authenticated"   ON public.comments;
DROP POLICY IF EXISTS "comments_update_soft_delete"     ON public.comments;

CREATE POLICY "comments_select_authenticated" ON public.comments
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY "comments_update_soft_delete" ON public.comments
  FOR UPDATE TO authenticated
  USING (
    ((SELECT auth.uid())::text = user_id)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  );

-- ─── disposal_points ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "disposal_points_select_authenticated" ON public.disposal_points;
DROP POLICY IF EXISTS "disposal_points_insert_admin"         ON public.disposal_points;
DROP POLICY IF EXISTS "disposal_points_update_admin"         ON public.disposal_points;
DROP POLICY IF EXISTS "disposal_points_delete_admin"         ON public.disposal_points;

CREATE POLICY "disposal_points_select_authenticated" ON public.disposal_points
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "disposal_points_insert_admin" ON public.disposal_points
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  );

CREATE POLICY "disposal_points_update_admin" ON public.disposal_points
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  );

CREATE POLICY "disposal_points_delete_admin" ON public.disposal_points
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  );

-- ─── event_rsvps ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rsvps_insert" ON public.event_rsvps;
DROP POLICY IF EXISTS "rsvps_delete" ON public.event_rsvps;

CREATE POLICY "rsvps_insert" ON public.event_rsvps
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "rsvps_delete" ON public.event_rsvps
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ─── login_attempts ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admins_select_login_attempts" ON public.login_attempts;

CREATE POLICY "admins_select_login_attempts" ON public.login_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  );

-- ─── participations ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can view participations" ON public.participations;

CREATE POLICY "Authenticated users can view participations" ON public.participations
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- ─── point_transactions ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert transactions"    ON public.point_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions"  ON public.point_transactions;
DROP POLICY IF EXISTS "Users can view own transactions"   ON public.point_transactions;

CREATE POLICY "Admins can insert transactions" ON public.point_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'::text
    )
  );

CREATE POLICY "Admins can view all transactions" ON public.point_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'::text
    )
  );

CREATE POLICY "Users can view own transactions" ON public.point_transactions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ─── profiles ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"          ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- ─── push_subscriptions ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;

CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ─── reports ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view own reports"  ON public.reports;

CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'::text
    )
  );

CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (reported_by = (SELECT auth.uid()));

-- ─── campaigns (partial — function call also wrapped) ────────────────────────

DROP POLICY IF EXISTS "Users can delete own campaigns without external participants"
  ON public.campaigns;

CREATE POLICY "Users can delete own campaigns without external participants"
  ON public.campaigns
  FOR DELETE TO authenticated
  USING (
    (created_by = (SELECT auth.uid()))
    AND (NOT public.campaign_has_external_participants(id, (SELECT auth.uid())))
  );
