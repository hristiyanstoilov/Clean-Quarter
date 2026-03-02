-- Soft-delete duplicate English seed rewards that duplicate the Bulgarian entries.
-- IDs 30000000-...-000001 (Free Coffee) and 30000000-...-000002 (Gym Pass)
-- were seeded as English placeholders but are superseded by the Bulgarian rewards.
UPDATE rewards
SET deleted_at = '2026-02-25 02:56:30.76999'
WHERE id IN (
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002'
);
