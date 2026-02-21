-- Migration: fix_comments_campaign_id_to_text
-- Applied: 2026-02-08
-- Synced from production Supabase
-- Purpose: Change comments.campaign_id from UUID to TEXT for flexibility

ALTER TABLE comments
  ALTER COLUMN campaign_id TYPE TEXT USING campaign_id::TEXT;
