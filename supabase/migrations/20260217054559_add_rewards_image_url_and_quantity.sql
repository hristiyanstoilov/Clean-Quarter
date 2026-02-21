-- Add image_url and quantity_available columns to rewards table
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS quantity_available integer;
