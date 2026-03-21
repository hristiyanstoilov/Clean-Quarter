-- Fix: "Superadmins can update any profile role" RLS policy contains a subquery
-- SELECT FROM profiles inside an UPDATE policy on profiles.
-- PostgreSQL detects this as potential infinite recursion (error 42P17).
--
-- Solution: extract the superadmin check into a SECURITY DEFINER helper function
-- that queries profiles with RLS bypassed, then reference the function in the policy.

CREATE OR REPLACE FUNCTION public.current_user_is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

DROP POLICY IF EXISTS "Superadmins can update any profile role" ON public.profiles;

CREATE POLICY "Superadmins can update any profile role" ON public.profiles
  FOR UPDATE
  USING (public.current_user_is_superadmin());
