-- Fix FK constraints so admins can delete campaigns.
-- participations: CASCADE so rows are removed with the campaign.
-- point_transactions: SET NULL to preserve financial history without blocking the delete.

ALTER TABLE participations
  DROP CONSTRAINT participations_campaign_id_fkey,
  ADD CONSTRAINT participations_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE point_transactions
  DROP CONSTRAINT point_transactions_campaign_id_fkey,
  ADD CONSTRAINT point_transactions_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
