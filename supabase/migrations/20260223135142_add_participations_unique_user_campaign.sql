-- Prevent users from joining the same campaign more than once.
ALTER TABLE participations
  ADD CONSTRAINT participations_user_campaign_unique UNIQUE (user_id, campaign_id);
