-- Migration: fix_comments_user_id_disable_rls_first
-- Applied: 2026-02-08
-- Synced from production Supabase
-- Purpose: Temporarily disable RLS on comments before altering user_id column

ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
