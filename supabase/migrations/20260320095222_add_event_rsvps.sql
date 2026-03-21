CREATE TABLE event_rsvps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rsvps_select" ON event_rsvps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rsvps_insert" ON event_rsvps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rsvps_delete" ON event_rsvps
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
