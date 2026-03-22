-- Migration: merge_profiles_update_policy
-- Merge "Users can update own profile" + "Superadmins can update any profile role"
-- into a single permissive policy to eliminate the multiple-permissive-policies WARN
-- on public.profiles for action UPDATE.
--
-- Semantics preserved:
--   id = (SELECT auth.uid())         → user can update own row
--   OR public.current_user_is_superadmin() → superadmin can update any row

DROP POLICY IF EXISTS "Users can update own profile"           ON profiles;
DROP POLICY IF EXISTS "Superadmins can update any profile role" ON profiles;

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    id = (SELECT auth.uid())
    OR public.current_user_is_superadmin()
  );
