-- Fix point_transactions.id missing DEFAULT — was NOT NULL without gen_random_uuid()
ALTER TABLE public.point_transactions ALTER COLUMN id SET DEFAULT gen_random_uuid();
