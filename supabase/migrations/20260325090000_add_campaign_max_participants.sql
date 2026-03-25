-- Add max_participants column to campaigns
-- NULL means unlimited capacity
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS max_participants integer CHECK (max_participants IS NULL OR max_participants > 0);
