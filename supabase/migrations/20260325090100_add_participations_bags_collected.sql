-- Add bags_collected to participations for waste weight tracking
ALTER TABLE public.participations
  ADD COLUMN IF NOT EXISTS bags_collected integer CHECK (bags_collected IS NULL OR bags_collected >= 0);
