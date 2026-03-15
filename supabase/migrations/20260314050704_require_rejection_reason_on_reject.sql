-- Enforce that rejection_reason is required when a participation is rejected.
-- Client-side validation alone is bypassable via direct API calls.
ALTER TABLE participations
ADD CONSTRAINT rejection_reason_required_on_reject
CHECK (status != 'rejected' OR (rejection_reason IS NOT NULL AND rejection_reason != ''));
