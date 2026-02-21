-- DB-level guarantee: auto-create point_transaction when admin approves participation
CREATE OR REPLACE FUNCTION create_point_transaction_on_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved'
     AND OLD.status IS DISTINCT FROM 'approved'
     AND NEW.points_earned IS NOT NULL
     AND NEW.points_earned > 0
  THEN
    INSERT INTO point_transactions (user_id, amount, type, description)
    VALUES (NEW.user_id, NEW.points_earned, 'earned', 'Campaign participation approved');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_point_transaction_on_approval
  AFTER UPDATE ON participations
  FOR EACH ROW
  EXECUTE FUNCTION create_point_transaction_on_approval();
