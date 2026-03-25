-- Extend capacity enforcement to cover soft-delete restores.
--
-- The existing BEFORE INSERT trigger (trg_check_campaign_capacity) blocks
-- new joins when a campaign is full. However, if a soft-deleted participation
-- is restored (deleted_at set back to NULL by an admin), the participation_count
-- trigger increments the count with no capacity check, potentially exceeding
-- max_participants.
--
-- This migration patches check_campaign_capacity() to handle both INSERT and
-- the restore UPDATE path, then adds a BEFORE UPDATE trigger for that case.

CREATE OR REPLACE FUNCTION public.check_campaign_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max   integer;
  v_taken integer;
BEGIN
  -- For INSERT: always check capacity
  -- For UPDATE: only check when restoring a soft-deleted row (deleted_at → NULL)
  IF TG_OP = 'UPDATE' THEN
    -- Not a restore operation — nothing to check
    IF NOT (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT max_participants, participation_count
    INTO v_max, v_taken
    FROM campaigns
   WHERE id = NEW.campaign_id;

  -- No limit set → always allow
  IF v_max IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_taken >= v_max THEN
    RAISE EXCEPTION 'Campaign is full'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- Add BEFORE UPDATE trigger for the soft-delete restore path
DROP TRIGGER IF EXISTS trg_check_campaign_capacity_restore ON public.participations;
CREATE TRIGGER trg_check_campaign_capacity_restore
BEFORE UPDATE ON public.participations
FOR EACH ROW
WHEN (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL)
EXECUTE FUNCTION public.check_campaign_capacity();
