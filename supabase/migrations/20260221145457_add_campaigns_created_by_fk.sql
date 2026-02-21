ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id)
  ON DELETE SET NULL;
