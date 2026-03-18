-- Add optional category field to campaigns table
-- Valid values: park, street, water, other
-- Nullable — existing campaigns without a category are unaffected

ALTER TABLE campaigns
ADD COLUMN category text CHECK (category IN ('park', 'street', 'water', 'other'));
