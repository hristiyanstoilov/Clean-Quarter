-- Migration: schema_sync_campaigns_participations
-- Applied: 2026-02-07
-- Synced from production Supabase
-- Purpose: Sync campaigns and participations schema with latest changes

-- Add missing columns to campaigns
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- Add missing columns to participations
ALTER TABLE participations
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_campaigns_deleted_at ON campaigns(deleted_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_deleted_by ON campaigns(deleted_by);
CREATE INDEX IF NOT EXISTS idx_participations_deleted_at ON participations(deleted_at);
