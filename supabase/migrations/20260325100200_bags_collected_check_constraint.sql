-- Prevent negative values for bags_collected
ALTER TABLE public.participations
  ADD CONSTRAINT bags_collected_non_negative CHECK (bags_collected >= 0);
