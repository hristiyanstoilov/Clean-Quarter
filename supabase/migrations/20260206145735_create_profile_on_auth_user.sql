-- Migration: create_profile_on_auth_user
-- Synced from production Supabase (2026-02-15)
-- This file represents the baseline schema

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  points_balance INTEGER DEFAULT 0,
  neighborhood TEXT,
  is_superadmin BOOLEAN DEFAULT false,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notifications_enabled BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS disposal_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  neighborhood TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location_lat NUMERIC NOT NULL,
  location_lng NUMERIC NOT NULL,
  disposal_point_id UUID REFERENCES disposal_points(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  before_photo_url TEXT,
  created_by UUID REFERENCES profiles(id),
  neighborhood TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  after_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rejection_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  points_earned INTEGER DEFAULT 0,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  cost INTEGER NOT NULL,
  category TEXT,
  deleted_at TIMESTAMP,
  description TEXT
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT CHECK (type IN ('earned', 'spent', 'role_change', 'admin_adjustment')),
  participation_id UUID REFERENCES participations(id),
  amount INTEGER DEFAULT 0,
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  reward_id UUID REFERENCES rewards(id),
  points_amount INTEGER,
  transaction_type TEXT,
  reference_id UUID,
  reference_type TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID NOT NULL REFERENCES profiles(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('campaign', 'user')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'fake', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('approval', 'campaign_update', 'system', 'moderation', 'achievement')),
  is_read BOOLEAN DEFAULT false,
  campaign_id UUID REFERENCES campaigns(id),
  participation_id UUID REFERENCES participations(id),
  report_id UUID REFERENCES reports(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL CHECK (length(text) > 0 AND length(text) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_neighborhood ON campaigns(neighborhood);
CREATE INDEX IF NOT EXISTS idx_campaigns_deleted_at ON campaigns(deleted_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_deleted_by ON campaigns(deleted_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_disposal_point_id ON campaigns(disposal_point_id);

CREATE INDEX IF NOT EXISTS idx_comments_campaign_id ON comments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_by ON comments(deleted_by);
CREATE INDEX IF NOT EXISTS idx_comments_active ON comments(campaign_id, deleted_at) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_disposal_points_user_id ON disposal_points(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_campaign_id ON notifications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_notifications_participation_id ON notifications(participation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_report_id ON notifications(report_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE (is_read = false);

CREATE INDEX IF NOT EXISTS idx_participations_campaign_id ON participations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_participations_user_id ON participations(user_id);
CREATE INDEX IF NOT EXISTS idx_participations_status ON participations(status);
CREATE INDEX IF NOT EXISTS idx_participations_deleted_at ON participations(deleted_at);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_campaign_id ON point_transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_participation_id ON point_transactions(participation_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_reward_id ON point_transactions(reward_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(type);

CREATE INDEX IF NOT EXISTS idx_profiles_is_superadmin ON profiles(is_superadmin);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_entity ON reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_by ON reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by ON reports(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Superadmins can update any profile role" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_superadmin = true)
);

-- Campaigns
CREATE POLICY "Anyone can view active campaigns" ON campaigns FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Authenticated users can create campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Admins can update any campaign" ON campaigns FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (created_by = auth.uid());
CREATE POLICY "Admins can delete any campaign" ON campaigns FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Participations
CREATE POLICY "Users can view all participations" ON participations FOR SELECT USING (true);
CREATE POLICY "Users can create participations" ON participations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own participations" ON participations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can update any participation" ON participations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Rewards
CREATE POLICY "Anyone see rewards" ON rewards FOR SELECT USING (deleted_at IS NULL);

-- Point Transactions
CREATE POLICY "Users can view own transactions" ON point_transactions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admins can insert transactions" ON point_transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Disposal Points
CREATE POLICY "disposal_points_select_own" ON disposal_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "disposal_points_insert_own" ON disposal_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "disposal_points_update_own" ON disposal_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "disposal_points_delete_own" ON disposal_points FOR DELETE USING (auth.uid() = user_id);

-- Reports
CREATE POLICY "Authenticated users can view all reports" ON reports FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Authenticated triggers can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Comments
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users can create comments" ON comments FOR INSERT TO authenticated WITH CHECK (
  (auth.uid())::text = user_id AND deleted_at IS NULL
);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE TO authenticated
  USING ((auth.uid())::text = user_id)
  WITH CHECK ((auth.uid())::text = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR UPDATE TO authenticated
  USING ((auth.uid())::text = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE (profiles.id)::text = (auth.uid())::text AND profiles.role = 'admin'
  ))
  WITH CHECK (deleted_at IS NOT NULL AND ((auth.uid())::text = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE (profiles.id)::text = (auth.uid())::text AND profiles.role = 'admin'
  )));

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_participations_updated_at BEFORE UPDATE ON participations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_comments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comments_timestamp BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_timestamp();

CREATE OR REPLACE FUNCTION update_reports_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_reports_timestamp();

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notification triggers
CREATE OR REPLACE FUNCTION notify_campaign_completed()
RETURNS TRIGGER AS $$
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
      VALUES (v_participant_id, 'campaign_update',
        'Campaign "' || v_campaign_title || '" has been completed!', NEW.id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_campaign_completed AFTER UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION notify_campaign_completed();

CREATE OR REPLACE FUNCTION notify_campaign_join()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_creator UUID;
  v_campaign_title TEXT;
  v_user_name TEXT;
BEGIN
  SELECT created_by, title INTO v_campaign_creator, v_campaign_title
  FROM campaigns WHERE id = NEW.campaign_id;
  SELECT username INTO v_user_name FROM profiles WHERE id = NEW.user_id;
  IF v_campaign_creator IS NOT NULL AND v_campaign_creator != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, message, campaign_id, participation_id)
    VALUES (v_campaign_creator, 'campaign_update',
      v_user_name || ' joined your campaign "' || v_campaign_title || '"',
      NEW.campaign_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_campaign_join AFTER INSERT ON participations
  FOR EACH ROW EXECUTE FUNCTION notify_campaign_join();

CREATE OR REPLACE FUNCTION notify_participation_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO notifications (user_id, type, message, participation_id)
    VALUES (NEW.user_id, 'approval',
      'Your participation has been approved! You earned ' || NEW.points_earned || ' points.',
      NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_participation_approved AFTER UPDATE ON participations
  FOR EACH ROW EXECUTE FUNCTION notify_participation_approved();

CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_creator UUID;
  v_campaign_title TEXT;
  v_commenter_name TEXT;
BEGIN
  SELECT created_by, title INTO v_campaign_creator, v_campaign_title
  FROM campaigns WHERE id = NEW.campaign_id;
  SELECT username INTO v_commenter_name FROM profiles WHERE id = NEW.user_id;
  IF v_campaign_creator IS NOT NULL AND v_campaign_creator != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, message, campaign_id)
    VALUES (v_campaign_creator, 'campaign_update',
      v_commenter_name || ' commented on your campaign "' || v_campaign_title || '"',
      NEW.campaign_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_comment AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_new_comment();

CREATE OR REPLACE FUNCTION notify_points_earned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'earned' THEN
    INSERT INTO notifications (user_id, type, message, participation_id)
    VALUES (NEW.user_id, 'points',
      'You earned ' || NEW.amount || ' points!', NEW.participation_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_points_earned AFTER INSERT ON point_transactions
  FOR EACH ROW EXECUTE FUNCTION notify_points_earned();

CREATE OR REPLACE FUNCTION notify_report_resolved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    INSERT INTO notifications (user_id, type, message, report_id)
    VALUES (NEW.reported_by, 'moderation',
      'Your report has been reviewed and resolved.', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_report_resolved AFTER UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION notify_report_resolved();

CREATE OR REPLACE FUNCTION check_duplicate_report()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_reports BEFORE INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION check_duplicate_report();
