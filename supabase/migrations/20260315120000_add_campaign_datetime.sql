-- Migration: add scheduled_date, start_time, end_time to campaigns
-- Backfills existing rows before enforcing NOT NULL constraints.

-- 1. Add columns as nullable
ALTER TABLE campaigns
  ADD COLUMN scheduled_date DATE,
  ADD COLUMN start_time     TIME,
  ADD COLUMN end_time       TIME;

-- 2. Backfill existing rows
UPDATE campaigns
SET
  scheduled_date = created_at::date,
  start_time     = '10:00'
WHERE scheduled_date IS NULL;

-- 3. Enforce NOT NULL
ALTER TABLE campaigns
  ALTER COLUMN scheduled_date SET NOT NULL,
  ALTER COLUMN start_time     SET NOT NULL;

-- 4. Guard: end_time must be after start_time if provided
ALTER TABLE campaigns
  ADD CONSTRAINT end_time_after_start_time
  CHECK (end_time IS NULL OR end_time > start_time);
