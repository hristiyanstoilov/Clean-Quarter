-- Prevent status transition from 'approved' back to 'rejected'.
--
-- Once a participation is approved (points awarded, streak updated, badges checked),
-- allowing a reject would leave the database in an inconsistent state:
-- the points transaction and streak update would remain but the participation
-- would appear rejected.
--
-- A BEFORE UPDATE trigger is the correct guard — the RLS UPDATE policy only
-- restricts who can write, not which state transitions are legal.

CREATE OR REPLACE FUNCTION public.prevent_approved_to_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'approved' AND NEW.status = 'rejected' THEN
    RAISE EXCEPTION 'Cannot reject an already-approved participation'
      USING ERRCODE = 'P0003';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_approved_to_rejected ON public.participations;
CREATE TRIGGER trg_prevent_approved_to_rejected
  BEFORE UPDATE ON public.participations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_approved_to_rejected();
