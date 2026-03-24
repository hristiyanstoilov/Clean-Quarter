-- Enforce that campaign coordinates fall within Sofia's bounding box.
-- Verified: all 61 existing campaigns pass this check (0 violations).
-- Must stay in sync with SOFIA_BOUNDS in src/utils/constants.js.

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_location_within_sofia CHECK (
    location_lat BETWEEN 42.55 AND 42.80 AND
    location_lng BETWEEN 23.15 AND 23.55
  );
