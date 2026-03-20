-- Push subscriptions table for Web Push API (VAPID)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read/insert/delete their own subscriptions
CREATE POLICY "push_subscriptions_select_own"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_insert_own"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete_own"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Edge Function service role can read all subscriptions to send pushes
-- (service_role bypasses RLS automatically, no extra policy needed)
