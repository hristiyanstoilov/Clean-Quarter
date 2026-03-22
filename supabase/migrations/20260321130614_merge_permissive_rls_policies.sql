-- Migration: merge_permissive_rls_policies
-- Problem: PostgreSQL evaluates ALL permissive policies per statement,
-- even after the first one matches. Pairs of "user owns it" + "admin can too"
-- policies on the same operation are merged into one policy with OR.
-- This eliminates duplicate sub-selects and the multiple-permissive-policies WARN.

-- ── Helper: is current user an admin? ────────────────────────────────────────
-- SECURITY DEFINER + SET search_path avoids RLS recursion (same pattern as
-- current_user_is_superadmin). Called from RLS expressions, evaluated once.
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ── campaigns UPDATE ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own campaigns"    ON campaigns;
DROP POLICY IF EXISTS "Admins can update any campaign"    ON campaigns;

CREATE POLICY "campaigns_update" ON campaigns
  FOR UPDATE USING (
    created_by = (SELECT auth.uid())
    OR public.current_user_is_admin()
  );

-- ── campaigns DELETE ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can delete own campaigns without external participants" ON campaigns;
DROP POLICY IF EXISTS "Admins can delete any campaign"    ON campaigns;

CREATE POLICY "campaigns_delete" ON campaigns
  FOR DELETE TO authenticated
  USING (
    (
      created_by = (SELECT auth.uid())
      AND NOT public.campaign_has_external_participants(id, (SELECT auth.uid()))
    )
    OR public.current_user_is_admin()
  );

-- ── participations UPDATE ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own participations"  ON participations;
DROP POLICY IF EXISTS "Admins can update any participation"  ON participations;

CREATE POLICY "participations_update" ON participations
  FOR UPDATE USING (
    user_id = (SELECT auth.uid())
    OR public.current_user_is_admin()
  );

-- ── point_transactions SELECT ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all transactions" ON point_transactions;
DROP POLICY IF EXISTS "Users can view own transactions"  ON point_transactions;

CREATE POLICY "point_transactions_select" ON point_transactions
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.current_user_is_admin()
  );

-- ── reports SELECT ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Users can view own reports"  ON reports;

CREATE POLICY "reports_select" ON reports
  FOR SELECT TO authenticated
  USING (
    reported_by = (SELECT auth.uid())
    OR public.current_user_is_admin()
  );
