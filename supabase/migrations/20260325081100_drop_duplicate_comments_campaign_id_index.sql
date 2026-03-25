-- comments_campaign_id_idx is identical to idx_comments_campaign_id (created in 20260206145735).
-- idx_comments_campaign_id follows the project naming convention (idx_ prefix) — keep it.
-- comments_campaign_id_idx was accidentally created in 20260324081738 because
-- CREATE INDEX IF NOT EXISTS checks by name only, not structure.

DROP INDEX IF EXISTS public.comments_campaign_id_idx;
