-- Remove test/seed rewards added during development.
-- Real rewards should be added via the Supabase Dashboard → rewards table
-- or through a future admin rewards management panel.
--
-- We keep reward_purchases intact — only delete the reward catalogue entries.
-- (If any purchase references a deleted reward, SET NULL via FK on_delete is expected.)

DELETE FROM public.rewards
WHERE title IN (
  'Cinema Ticket',
  'IT Help Session',
  'Coffee Shop Voucher',
  'Sports Equipment',
  'Home Cleaning Service'
);
