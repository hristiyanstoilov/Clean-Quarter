-- Prevent max_participants = 0 at DB level.
-- NULL means "no limit" (allowed). Any non-null value must be >= 1.
ALTER TABLE public.campaigns
  ADD CONSTRAINT max_participants_positive
  CHECK (max_participants IS NULL OR max_participants >= 1);
