-- Fix rewards.id missing DEFAULT — was NOT NULL without gen_random_uuid()
ALTER TABLE public.rewards ALTER COLUMN id SET DEFAULT gen_random_uuid();
