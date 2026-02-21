-- Trigger functions (notify_points_earned, notify_report_resolved) are SECURITY DEFINER
-- and bypass RLS entirely, so they don't need this policy.
-- Removing the overly permissive INSERT policy prevents clients from
-- inserting arbitrary notifications to any user.
DROP POLICY IF EXISTS "Authenticated triggers can insert notifications" ON notifications;
