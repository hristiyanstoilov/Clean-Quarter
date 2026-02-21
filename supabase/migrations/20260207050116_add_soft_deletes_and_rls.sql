-- Migration: add_soft_deletes_and_rls
-- Applied: 2026-02-07
-- Synced from production Supabase
-- Purpose: Add soft delete support and enhanced RLS policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Campaigns: soft-delete aware SELECT
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON campaigns;
CREATE POLICY "Anyone can view active campaigns"
  ON campaigns FOR SELECT
  USING (deleted_at IS NULL);

-- Rewards: soft-delete aware SELECT
DROP POLICY IF EXISTS "Anyone see rewards" ON rewards;
CREATE POLICY "Anyone see rewards"
  ON rewards FOR SELECT
  USING (deleted_at IS NULL);

-- Comments: soft-delete aware SELECT
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (deleted_at IS NULL);
