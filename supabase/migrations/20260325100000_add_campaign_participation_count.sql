-- Add participation_count to campaigns, maintained by trigger
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS participation_count integer NOT NULL DEFAULT 0;

-- Trigger function: keep participation_count in sync on participations changes
CREATE OR REPLACE FUNCTION public.update_campaign_participation_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only count rows that are not soft-deleted
    IF NEW.deleted_at IS NULL THEN
      UPDATE campaigns
         SET participation_count = participation_count + 1
       WHERE id = NEW.campaign_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Row became soft-deleted → decrement
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      UPDATE campaigns
         SET participation_count = GREATEST(participation_count - 1, 0)
       WHERE id = NEW.campaign_id;
    -- Row was restored from soft-delete → increment
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      UPDATE campaigns
         SET participation_count = participation_count + 1
       WHERE id = NEW.campaign_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.deleted_at IS NULL THEN
      UPDATE campaigns
         SET participation_count = GREATEST(participation_count - 1, 0)
       WHERE id = OLD.campaign_id;
    END IF;

  END IF;
  RETURN NULL;
END;
$$;

-- Attach trigger to participations
DROP TRIGGER IF EXISTS trg_update_campaign_participation_count ON public.participations;
CREATE TRIGGER trg_update_campaign_participation_count
AFTER INSERT OR UPDATE OR DELETE ON public.participations
FOR EACH ROW EXECUTE FUNCTION public.update_campaign_participation_count();

-- Backfill existing data
UPDATE public.campaigns c
   SET participation_count = (
     SELECT COUNT(*)
       FROM public.participations p
      WHERE p.campaign_id = c.id
        AND p.deleted_at IS NULL
   );
