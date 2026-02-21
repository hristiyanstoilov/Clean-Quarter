-- Add username column to comments for denormalized display (avoid JOIN on every fetch)
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS username text NOT NULL DEFAULT '';
