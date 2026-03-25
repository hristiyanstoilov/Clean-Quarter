-- Add defensive NOT FOUND guard to check_campaign_capacity().
--
-- If NEW.campaign_id has no matching campaigns row (prevented in practice by
-- the FK constraint, but defensive coding), the previous version silently
-- allowed the operation because v_max = NULL triggered the "no limit" branch.
-- This version explicitly raises an exception if the campaign is not found.

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
  -- For UPDATE: only act on soft-delete restores (deleted_at → NULL)
  IF TG_OP = 'UPDATE' THEN
    IF NOT (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT max_participants, participation_count
    INTO v_max, v_taken
    FROM campaigns
   WHERE id = NEW.campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign % not found', NEW.campaign_id
      USING ERRCODE = 'P0002';
  END IF;

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
