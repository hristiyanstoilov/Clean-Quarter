-- Enforce campaign capacity at DB level via BEFORE INSERT trigger.
-- This prevents race conditions where two concurrent joins bypass the
-- client-side check and overfill a campaign.

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

DROP TRIGGER IF EXISTS trg_check_campaign_capacity ON public.participations;
CREATE TRIGGER trg_check_campaign_capacity
BEFORE INSERT ON public.participations
FOR EACH ROW EXECUTE FUNCTION public.check_campaign_capacity();
