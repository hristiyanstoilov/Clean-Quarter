-- Remove the trigger that duplicates point_transaction inserts.
--
-- When approve_participation RPC sets status = 'approved', both the RPC
-- and this trigger were inserting into point_transactions, resulting in
-- two rows per approval (though points_balance was only credited once).
-- The RPC is the authoritative path: it inserts with participation_id,
-- campaign title, streak tracking, and badge awarding. The trigger is
-- redundant and must be removed.

DROP TRIGGER IF EXISTS trigger_point_transaction_on_approval ON public.participations;
DROP FUNCTION IF EXISTS public.create_point_transaction_on_approval();
