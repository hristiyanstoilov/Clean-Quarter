-- Fix: 6 SECURITY DEFINER functions with mutable search_path.
-- Without a fixed search_path an attacker with schema-creation rights could
-- prepend a rogue schema and hijack table/function references inside these
-- functions. Adding SET search_path = '' forces fully-qualified names and
-- eliminates the attack surface.

-- ─── 1. handle_new_user (trigger: auth.users → public.profiles) ──────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role, points_balance, neighborhood)
  VALUES (
    NEW.id,
    COALESCE(split_part(NEW.email, '@', 1), 'user_' || substr(NEW.id::text, 1, 8)),
    'user',
    0,
    'Studentski Grad'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─── 2. notify_new_comment (trigger: public.comments → public.notifications) ──
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_campaign_creator UUID;
  v_campaign_title   TEXT;
  v_commenter_name   TEXT;
BEGIN
  SELECT created_by, title
    INTO v_campaign_creator, v_campaign_title
    FROM public.campaigns
   WHERE id = NEW.campaign_id::uuid;

  SELECT username
    INTO v_commenter_name
    FROM public.profiles
   WHERE id = NEW.user_id::uuid;

  IF v_campaign_creator IS NOT NULL AND v_campaign_creator != NEW.user_id::uuid THEN
    INSERT INTO public.notifications (user_id, type, message, campaign_id)
    VALUES (
      v_campaign_creator,
      'campaign_update',
      v_commenter_name || ' commented on your campaign "' || v_campaign_title || '"',
      NEW.campaign_id::uuid
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ─── 3. enforce_profile_role_protection (trigger: public.profiles update) ─────
CREATE OR REPLACE FUNCTION public.enforce_profile_role_protection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Superadmin: unrestricted
    IF EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND is_superadmin = true
    ) THEN
      RETURN NEW;
    END IF;

    -- Admin changing ANOTHER user's role: allowed
    IF NEW.id != auth.uid() AND EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RETURN NEW;
    END IF;

    -- Everything else (self-promotion, non-admin role change): blocked
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;

  RETURN NEW;
END;
$$;

-- ─── 4. get_public_stats (RPC: anon aggregated stats) ────────────────────────
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(
  total_campaigns  int,
  total_volunteers int,
  total_cleanups   int,
  total_points     bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT
    (SELECT COUNT(*)::int             FROM public.campaigns      WHERE deleted_at IS NULL)             AS total_campaigns,
    (SELECT COUNT(DISTINCT user_id)::int FROM public.participations WHERE status = 'approved')         AS total_volunteers,
    (SELECT COUNT(*)::int             FROM public.participations WHERE status = 'approved')            AS total_cleanups,
    (SELECT COALESCE(SUM(amount), 0)::bigint FROM public.point_transactions WHERE type = 'award')     AS total_points;
$$;

-- ─── 5. get_public_category_stats (RPC: anon category breakdown) ─────────────
CREATE OR REPLACE FUNCTION public.get_public_category_stats()
RETURNS TABLE(category text, campaign_count int)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(c.category, 'other')::text AS category,
         COUNT(*)::int AS campaign_count
    FROM public.campaigns c
   WHERE c.deleted_at IS NULL
   GROUP BY c.category
   ORDER BY COUNT(*) DESC;
$$;

-- ─── 6. get_public_neighborhood_stats (RPC: anon leaderboard top 5) ──────────
CREATE OR REPLACE FUNCTION public.get_public_neighborhood_stats()
RETURNS TABLE(neighborhood text, total_points int, participant_count int)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.neighborhood::text,
         COALESCE(SUM(p.points_balance), 0)::int AS total_points,
         COUNT(*)::int                            AS participant_count
    FROM public.profiles p
   WHERE p.neighborhood IS NOT NULL
   GROUP BY p.neighborhood
   ORDER BY COALESCE(SUM(p.points_balance), 0) DESC
   LIMIT 5;
$$;

-- Re-grant execute permissions (unchanged, explicit after recreation)
GRANT EXECUTE ON FUNCTION public.get_public_stats()              TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_category_stats()     TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_neighborhood_stats() TO anon;
