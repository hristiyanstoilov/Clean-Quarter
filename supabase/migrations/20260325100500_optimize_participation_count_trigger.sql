-- Optimize participation_count trigger: only fire on UPDATE when
-- deleted_at actually changes, avoiding unnecessary executions on
-- unrelated column updates (e.g. status, after_photo_url, points_earned).

DROP TRIGGER IF EXISTS trg_update_campaign_participation_count ON public.participations;

CREATE TRIGGER trg_update_campaign_participation_count
AFTER INSERT OR DELETE ON public.participations
FOR EACH ROW EXECUTE FUNCTION public.update_campaign_participation_count();

-- Separate UPDATE trigger with WHEN guard for deleted_at transitions only
CREATE TRIGGER trg_update_campaign_participation_count_upd
AFTER UPDATE ON public.participations
FOR EACH ROW
WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
EXECUTE FUNCTION public.update_campaign_participation_count();
