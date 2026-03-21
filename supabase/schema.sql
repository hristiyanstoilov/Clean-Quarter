-- Clean Quarter (Чист Квартал) Database Schema
-- Full schema snapshot matching production Supabase DB
-- Last synced: 2026-03-21 (migration 20260321075814_fix_rls_auth_uid_initplan)
-- Seed data is in supabase/seed.sql

-- ============================================================
-- 1. CREATE TABLES
-- ============================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username              TEXT NOT NULL,
  role                  TEXT NOT NULL DEFAULT 'user',
  points_balance        INTEGER DEFAULT 0,
  neighborhood          TEXT,
  is_superadmin         BOOLEAN DEFAULT false,
  email                 TEXT,
  avatar_url            TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  notifications_enabled BOOLEAN DEFAULT true,
  last_login_at         TIMESTAMP,
  deleted_at            TIMESTAMP
);

-- Disposal Points (locations for cleanup campaigns)
CREATE TABLE IF NOT EXISTS disposal_points (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  latitude     NUMERIC NOT NULL,
  longitude    NUMERIC NOT NULL,
  neighborhood TEXT NOT NULL,
  address      TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  user_id      UUID
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  location_lat     NUMERIC NOT NULL,
  location_lng     NUMERIC NOT NULL,
  disposal_point_id UUID REFERENCES disposal_points(id),
  status           TEXT NOT NULL DEFAULT 'active',
  before_photo_url TEXT,
  created_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  neighborhood     TEXT NOT NULL,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  deleted_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scheduled_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time       TIME NOT NULL DEFAULT '10:00:00',
  end_time         TIME,
  category         TEXT
);

-- Participations table
CREATE TABLE IF NOT EXISTS participations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id),
  status           TEXT DEFAULT 'pending',
  after_photo_url  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  rejection_reason TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  points_earned    INTEGER DEFAULT 0,
  deleted_at       TIMESTAMP,
  CONSTRAINT participations_user_campaign_unique UNIQUE (user_id, campaign_id)
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  cost               INTEGER NOT NULL,
  category           TEXT,
  deleted_at         TIMESTAMP,
  description        TEXT,
  image_url          TEXT,
  quantity_available INTEGER
);

-- Point Transactions table (history)
CREATE TABLE IF NOT EXISTS point_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES profiles(id),
  reason           TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  type             TEXT,
  participation_id UUID REFERENCES participations(id),
  amount           INTEGER DEFAULT 0 NOT NULL,
  description      TEXT,
  campaign_id      UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  reward_id        UUID REFERENCES rewards(id),
  points_amount    INTEGER,
  transaction_type TEXT,
  reference_id     UUID,
  reference_type   TEXT
);

-- Reports table (moderation)
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  reason      TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message          TEXT NOT NULL,
  type             TEXT NOT NULL,
  is_read          BOOLEAN DEFAULT false,
  campaign_id      UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  participation_id UUID REFERENCES participations(id) ON DELETE SET NULL,
  report_id        UUID REFERENCES reports(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  username   TEXT NOT NULL DEFAULT ''
);

-- Login Attempts table (rate limiting)
CREATE TABLE IF NOT EXISTS login_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event RSVPs table
CREATE TABLE IF NOT EXISTS event_rsvps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT event_rsvps_campaign_id_user_id_key UNIQUE (campaign_id, user_id)
);

-- Push Subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. CREATE INDEXES
-- ============================================================

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by        ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_status            ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_neighborhood      ON campaigns(neighborhood);
CREATE INDEX IF NOT EXISTS idx_campaigns_deleted_at        ON campaigns(deleted_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_deleted_by        ON campaigns(deleted_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_disposal_point_id ON campaigns(disposal_point_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_campaign_id ON comments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id     ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at  ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_by  ON comments(deleted_by);
CREATE INDEX IF NOT EXISTS idx_comments_active      ON comments(campaign_id, deleted_at) WHERE (deleted_at IS NULL);

-- Disposal Points indexes
CREATE INDEX IF NOT EXISTS idx_disposal_points_user_id ON disposal_points(user_id);

-- Event RSVPs indexes
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);

-- Login Attempts indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON login_attempts(email, attempted_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id         ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_campaign_id     ON notifications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_notifications_participation_id ON notifications(participation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_report_id       ON notifications(report_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read         ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at      ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread     ON notifications(user_id, is_read) WHERE (is_read = false);

-- Participations indexes
CREATE INDEX IF NOT EXISTS idx_participations_campaign_id ON participations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_participations_user_id     ON participations(user_id);
CREATE INDEX IF NOT EXISTS idx_participations_status      ON participations(status);
CREATE INDEX IF NOT EXISTS idx_participations_deleted_at  ON participations(deleted_at);

-- Point Transactions indexes
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id          ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_campaign_id      ON point_transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_participation_id ON point_transactions(participation_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_reward_id        ON point_transactions(reward_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type             ON point_transactions(type);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_is_superadmin ON profiles(is_superadmin);

-- Push Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_status      ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_entity      ON reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_by ON reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by ON reports(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_reports_created_at  ON reports(created_at DESC);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE campaigns         ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal_points   ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards           ENABLE ROW LEVEL SECURITY;

-- ── campaigns ─────────────────────────────────────────────
CREATE POLICY "Anyone can view active campaigns" ON campaigns
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create campaigns" ON campaigns
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE USING (created_by = (SELECT auth.uid()));

CREATE POLICY "Admins can update any campaign" ON campaigns
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Users can delete own campaigns without external participants" ON campaigns
  FOR DELETE TO authenticated
  USING (
    (created_by = (SELECT auth.uid()))
    AND (NOT campaign_has_external_participants(id, (SELECT auth.uid())))
  );

CREATE POLICY "Admins can delete any campaign" ON campaigns
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- ── comments ──────────────────────────────────────────────
CREATE POLICY "comments_select_authenticated" ON comments
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "comments_insert_own" ON comments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY "comments_update_soft_delete" ON comments
  FOR UPDATE TO authenticated
  USING (
    ((SELECT auth.uid())::text = user_id)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  );

-- ── disposal_points ────────────────────────────────────────
CREATE POLICY "disposal_points_select_authenticated" ON disposal_points
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "disposal_points_insert_admin" ON disposal_points
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  );

CREATE POLICY "disposal_points_update_admin" ON disposal_points
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  );

CREATE POLICY "disposal_points_delete_admin" ON disposal_points
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  );

-- ── event_rsvps ────────────────────────────────────────────
CREATE POLICY "rsvps_select" ON event_rsvps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rsvps_insert" ON event_rsvps
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "rsvps_delete" ON event_rsvps
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ── login_attempts ─────────────────────────────────────────
-- Written only by SECURITY DEFINER rate-limiting functions (bypass RLS)
CREATE POLICY "admins_select_login_attempts" ON login_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text])
    )
  );

-- ── notifications ──────────────────────────────────────────
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- ── participations ─────────────────────────────────────────
CREATE POLICY "Authenticated users can view participations" ON participations
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can create participations" ON participations
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own participations" ON participations
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can update any participation" ON participations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- ── point_transactions ─────────────────────────────────────
CREATE POLICY "Admins can insert transactions" ON point_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can view all transactions" ON point_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Users can view own transactions" ON point_transactions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ── profiles ───────────────────────────────────────────────
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

CREATE POLICY "Superadmins can update any profile role" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_superadmin = true)
  );

-- ── push_subscriptions ─────────────────────────────────────
CREATE POLICY "push_subscriptions_select_own" ON push_subscriptions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "push_subscriptions_insert_own" ON push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "push_subscriptions_delete_own" ON push_subscriptions
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ── reports ────────────────────────────────────────────────
CREATE POLICY "Authenticated users can create reports" ON reports
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT TO authenticated
  USING (reported_by = (SELECT auth.uid()));

CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- ── rewards ────────────────────────────────────────────────
CREATE POLICY "Anyone see rewards" ON rewards
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Admins can insert rewards" ON rewards
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update rewards" ON rewards
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can delete rewards" ON rewards
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- ============================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================

-- ── Auto-update updated_at timestamp ──────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participations_updated_at
  BEFORE UPDATE ON participations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Auto-update comments timestamp ────────────────────────
CREATE OR REPLACE FUNCTION public.update_comments_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_comments_timestamp
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_timestamp();

-- ── Auto-update reports timestamp ─────────────────────────
CREATE OR REPLACE FUNCTION public.update_reports_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_reports_timestamp();

-- ── Auto-create profile on auth.users insert ──────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Enforce profile role protection ───────────────────────
CREATE OR REPLACE FUNCTION public.enforce_profile_role_protection()
RETURNS TRIGGER LANGUAGE plpgsql
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

CREATE TRIGGER protect_profile_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_profile_role_protection();

-- ── Prevent participation privilege escalation ─────────────
CREATE OR REPLACE FUNCTION public.prevent_participation_privilege_escalation()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- System/trigger context (auth.uid() is NULL) — allow all
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
  ) INTO is_admin;

  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Block users from setting status to approved or rejected
  IF NEW.status IN ('approved', 'rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'Permission denied: only admins can approve or reject participations';
  END IF;

  -- Block users from manipulating earned points
  IF OLD.points_earned IS DISTINCT FROM NEW.points_earned THEN
    RAISE EXCEPTION 'Permission denied: only admins can change points_earned';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_participation_integrity
  BEFORE UPDATE ON participations
  FOR EACH ROW EXECUTE FUNCTION prevent_participation_privilege_escalation();

-- ── Notify when campaign is completed ─────────────────────
CREATE OR REPLACE FUNCTION public.notify_campaign_completed()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_campaign_title TEXT;
  v_participant_id UUID;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT title INTO v_campaign_title FROM campaigns WHERE id = NEW.id;
    FOR v_participant_id IN
      SELECT DISTINCT user_id FROM participations WHERE campaign_id = NEW.id
    LOOP
      INSERT INTO notifications (user_id, type, message, campaign_id)
      VALUES (
        v_participant_id,
        'campaign_update',
        'Campaign "' || v_campaign_title || '" has been completed!',
        NEW.id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_campaign_completed
  AFTER UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION notify_campaign_completed();

-- ── Notify when someone joins a campaign ──────────────────
CREATE OR REPLACE FUNCTION public.notify_campaign_join()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_campaign_creator UUID;
  v_campaign_title   TEXT;
  v_user_name        TEXT;
BEGIN
  SELECT created_by, title INTO v_campaign_creator, v_campaign_title
  FROM campaigns WHERE id = NEW.campaign_id;
  SELECT username INTO v_user_name FROM profiles WHERE id = NEW.user_id;
  IF v_campaign_creator IS NOT NULL AND v_campaign_creator != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, message, campaign_id, participation_id)
    VALUES (
      v_campaign_creator,
      'campaign_update',
      v_user_name || ' joined your campaign "' || v_campaign_title || '"',
      NEW.campaign_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_campaign_join
  AFTER INSERT ON participations
  FOR EACH ROW EXECUTE FUNCTION notify_campaign_join();

-- ── Notify when participation is approved ─────────────────
CREATE OR REPLACE FUNCTION public.notify_participation_approved()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO notifications (user_id, type, message, participation_id)
    VALUES (
      NEW.user_id,
      'approval',
      'Your participation has been approved! You earned ' || NEW.points_earned || ' points.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_participation_approved
  AFTER UPDATE ON participations
  FOR EACH ROW EXECUTE FUNCTION notify_participation_approved();

-- ── Auto-create point transaction on participation approval
CREATE OR REPLACE FUNCTION public.create_point_transaction_on_approval()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only on transition to 'approved' with points_earned > 0
  IF NEW.status = 'approved'
     AND OLD.status IS DISTINCT FROM 'approved'
     AND NEW.points_earned IS NOT NULL
     AND NEW.points_earned > 0
  THEN
    INSERT INTO point_transactions (user_id, amount, type, description)
    VALUES (NEW.user_id, NEW.points_earned, 'earned', 'Campaign participation approved');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_point_transaction_on_approval
  AFTER UPDATE ON participations
  FOR EACH ROW EXECUTE FUNCTION create_point_transaction_on_approval();

-- ── Notify when someone comments on a campaign ────────────
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER LANGUAGE plpgsql
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

CREATE TRIGGER trigger_notify_new_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_new_comment();

-- ── Notify when points are earned ─────────────────────────
CREATE OR REPLACE FUNCTION public.notify_points_earned()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.type = 'earned' THEN
    INSERT INTO notifications (user_id, type, message, participation_id)
    VALUES (
      NEW.user_id,
      'points',
      'You earned ' || NEW.amount || ' points!',
      NEW.participation_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_points_earned
  AFTER INSERT ON point_transactions
  FOR EACH ROW EXECUTE FUNCTION notify_points_earned();

-- ── Notify when report is resolved ────────────────────────
CREATE OR REPLACE FUNCTION public.notify_report_resolved()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    INSERT INTO notifications (user_id, type, message, report_id)
    VALUES (
      NEW.reported_by,
      'moderation',
      'Your report has been reviewed and resolved.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_report_resolved
  AFTER UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION notify_report_resolved();

-- ── Prevent duplicate reports within 24 hours ─────────────
CREATE OR REPLACE FUNCTION public.check_duplicate_report()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reports
    WHERE reported_by = NEW.reported_by
      AND entity_type = NEW.entity_type
      AND entity_id = NEW.entity_id
      AND created_at > NOW() - INTERVAL '24 hours'
      AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'You have already reported this item within the last 24 hours';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_duplicate_reports
  BEFORE INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION check_duplicate_report();

-- ── Login rate limiting ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email text)
RETURNS json LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count  INTEGER;
  v_window TIMESTAMPTZ := NOW() - INTERVAL '15 minutes';
  v_max    CONSTANT INTEGER := 5;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM login_attempts
  WHERE email = lower(p_email)
    AND attempted_at > v_window;

  IF v_count >= v_max THEN
    RETURN json_build_object('allowed', false, 'remaining', 0);
  END IF;

  RETURN json_build_object('allowed', true, 'remaining', v_max - v_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_login_attempt(p_email text)
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO login_attempts (email) VALUES (lower(p_email));
  DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- ── Admin RPCs ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_participation(p_participation_id uuid)
RETURNS json LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_id       uuid;
  v_user_id        uuid;
  v_camp_title     text;
  v_points_awarded CONSTANT integer := 20;
BEGIN
  v_admin_id := auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT p.user_id, c.title
    INTO v_user_id, v_camp_title
    FROM participations p
    JOIN campaigns c ON c.id = p.campaign_id
   WHERE p.id = p_participation_id AND p.status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Participation not found or not pending');
  END IF;

  UPDATE participations
     SET status = 'approved', points_earned = v_points_awarded
   WHERE id = p_participation_id;

  UPDATE profiles
     SET points_balance = COALESCE(points_balance, 0) + v_points_awarded
   WHERE id = v_user_id;

  INSERT INTO point_transactions (user_id, amount, type, reason, participation_id)
  VALUES (
    v_user_id,
    v_points_awarded,
    'earned',
    'Cleanup proof approved - ' || COALESCE(v_camp_title, 'Campaign'),
    p_participation_id
  );

  RETURN json_build_object('success', true, 'points_awarded', v_points_awarded);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_role(p_user_id uuid, p_role text)
RETURNS json LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_id uuid;
  v_old_role text;
BEGIN
  v_admin_id := auth.uid();

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  IF v_admin_id = p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot change your own role');
  END IF;

  IF p_role NOT IN ('user', 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role');
  END IF;

  SELECT role INTO v_old_role FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  UPDATE profiles SET role = p_role WHERE id = p_user_id;

  INSERT INTO point_transactions (user_id, amount, type, reason)
  VALUES (p_user_id, 0, 'role_change', 'Role changed: ' || v_old_role || ' -> ' || p_role);

  RETURN json_build_object('success', true, 'old_role', v_old_role, 'new_role', p_role);
END;
$$;

-- ── Reward purchase RPC ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.purchase_reward(p_reward_id uuid)
RETURNS json LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id        UUID;
  v_reward_cost    INTEGER;
  v_reward_title   TEXT;
  v_reward_qty     INTEGER;
  v_current_points INTEGER;
  v_new_points     INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT cost, title, quantity_available
    INTO v_reward_cost, v_reward_title, v_reward_qty
    FROM rewards
   WHERE id = p_reward_id AND deleted_at IS NULL
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Reward not found');
  END IF;

  IF v_reward_qty IS NOT NULL AND v_reward_qty <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Out of stock');
  END IF;

  SELECT points_balance INTO v_current_points FROM profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_current_points < v_reward_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient points');
  END IF;

  v_new_points := v_current_points - v_reward_cost;
  UPDATE profiles SET points_balance = v_new_points WHERE id = v_user_id;

  IF v_reward_qty IS NOT NULL THEN
    UPDATE rewards SET quantity_available = quantity_available - 1 WHERE id = p_reward_id;
  END IF;

  INSERT INTO point_transactions (user_id, amount, type, description, reward_id)
  VALUES (v_user_id, -v_reward_cost, 'spent', 'Purchased reward: ' || v_reward_title, p_reward_id);

  RETURN json_build_object('success', true, 'new_balance', v_new_points);
END;
$$;

-- ── Comment soft-delete RPC ────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_comment(comment_id uuid)
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE comments
  SET
    deleted_at = NOW(),
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

-- ── Helper: campaign has external participants ─────────────
CREATE OR REPLACE FUNCTION public.campaign_has_external_participants(
  p_campaign_id uuid,
  p_creator_id  uuid
)
RETURNS boolean LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participations
    WHERE campaign_id = p_campaign_id
      AND user_id != p_creator_id
      AND deleted_at IS NULL
  );
$$;

-- ============================================================
-- 5. VIEWS
-- ============================================================

-- Admin dashboard statistics (authenticated only via RLS on base tables)
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
  SELECT
    (SELECT COUNT(*) FROM profiles     WHERE deleted_at IS NULL)                                AS total_users,
    (SELECT COUNT(*) FROM campaigns    WHERE deleted_at IS NULL)                                AS total_campaigns,
    (SELECT COUNT(*) FROM campaigns    WHERE status = 'active'    AND deleted_at IS NULL)       AS active_campaigns,
    (SELECT COUNT(*) FROM campaigns    WHERE status = 'completed' AND deleted_at IS NULL)       AS completed_campaigns,
    (SELECT COUNT(*) FROM participations WHERE deleted_at IS NULL)                              AS total_participations,
    (SELECT COUNT(*) FROM participations WHERE status = 'pending' AND deleted_at IS NULL)       AS pending_participations,
    (SELECT COALESCE(SUM(points_balance), 0) FROM profiles WHERE deleted_at IS NULL)           AS total_points_in_circulation;

-- Campaign statistics (participation counts per campaign)
CREATE OR REPLACE VIEW public.campaign_stats AS
  SELECT
    c.id,
    c.title,
    c.neighborhood,
    c.status,
    c.created_at,
    COUNT(DISTINCT p.id)                                                            AS participation_count,
    COUNT(DISTINCT CASE WHEN p.status = 'approved'  THEN p.id ELSE NULL END)       AS approved_count,
    COUNT(DISTINCT CASE WHEN p.status = 'pending'   THEN p.id ELSE NULL END)       AS pending_count
  FROM campaigns c
  LEFT JOIN participations p ON (c.id = p.campaign_id AND p.deleted_at IS NULL)
  WHERE c.deleted_at IS NULL
  GROUP BY c.id, c.title, c.neighborhood, c.status, c.created_at;

-- Neighborhood leaderboard (security_invoker = true: respects querying user's RLS)
CREATE OR REPLACE VIEW public.neighborhood_leaderboard
WITH (security_invoker = true) AS
  SELECT
    neighborhood,
    COALESCE(SUM(points_balance), 0)::integer AS total_points,
    COUNT(*)::integer                          AS participant_count
  FROM public.profiles
  WHERE neighborhood IS NOT NULL
  GROUP BY neighborhood
  ORDER BY total_points DESC;

-- User leaderboard (ranked by points_balance)
CREATE OR REPLACE VIEW public.user_leaderboard AS
  SELECT
    p.id,
    p.username,
    p.neighborhood,
    p.points_balance,
    COUNT(DISTINCT part.id)                   AS campaigns_completed,
    COALESCE(SUM(part.points_earned), 0)      AS total_points_earned,
    ROW_NUMBER() OVER (ORDER BY p.points_balance DESC, p.username) AS rank
  FROM profiles p
  LEFT JOIN participations part
    ON (p.id = part.user_id AND part.status = 'approved' AND part.deleted_at IS NULL)
  WHERE p.deleted_at IS NULL
  GROUP BY p.id, p.username, p.neighborhood, p.points_balance;

-- ============================================================
-- 6. PUBLIC RPC FUNCTIONS (anon access for stats page)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(
  total_campaigns  int,
  total_volunteers int,
  total_cleanups   int,
  total_points     bigint
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    (SELECT COUNT(*)::int               FROM public.campaigns       WHERE deleted_at IS NULL)           AS total_campaigns,
    (SELECT COUNT(DISTINCT user_id)::int FROM public.participations WHERE status = 'approved')          AS total_volunteers,
    (SELECT COUNT(*)::int               FROM public.participations  WHERE status = 'approved')          AS total_cleanups,
    (SELECT COALESCE(SUM(amount), 0)::bigint FROM public.point_transactions WHERE type = 'award')      AS total_points;
$$;

CREATE OR REPLACE FUNCTION public.get_public_category_stats()
RETURNS TABLE(category text, campaign_count int)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(c.category, 'other')::text AS category,
         COUNT(*)::int AS campaign_count
    FROM public.campaigns c
   WHERE c.deleted_at IS NULL
   GROUP BY c.category
   ORDER BY COUNT(*) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_public_neighborhood_stats()
RETURNS TABLE(neighborhood text, total_points int, participant_count int)
LANGUAGE sql STABLE
SECURITY DEFINER
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

-- ============================================================
-- 7. GRANTS
-- ============================================================

GRANT SELECT ON public.neighborhood_leaderboard TO authenticated;
GRANT SELECT ON public.neighborhood_leaderboard TO anon;

GRANT EXECUTE ON FUNCTION public.get_public_stats()              TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_category_stats()     TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_neighborhood_stats() TO anon;
