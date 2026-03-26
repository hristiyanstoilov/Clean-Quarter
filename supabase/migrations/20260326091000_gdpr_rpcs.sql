-- Migration: gdpr_rpcs
-- Implements GDPR Article 17 (right to erasure) and Article 20 (data portability).
-- Both RPCs are callable only by the authenticated user themselves.

-- ── export_user_data ──────────────────────────────────────────────────────────
-- Returns all personal data for the requesting user as JSONB (Article 20).

CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN jsonb_build_object(
    'exported_at', NOW(),
    'profile', (
      SELECT row_to_json(p) FROM (
        SELECT id, username, email, neighborhood, role, points_balance, created_at
        FROM profiles WHERE id = p_user_id
      ) p
    ),
    'campaigns', (
      SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      FROM (
        SELECT id, title, description, neighborhood, status, category, scheduled_date, created_at
        FROM campaigns
        WHERE created_by = p_user_id AND deleted_at IS NULL
        ORDER BY created_at
      ) c
    ),
    'participations', (
      SELECT COALESCE(jsonb_agg(row_to_json(p)), '[]'::jsonb)
      FROM (
        SELECT id, campaign_id, status, points_earned, bags_collected, created_at
        FROM participations
        WHERE user_id = p_user_id AND deleted_at IS NULL
        ORDER BY created_at
      ) p
    ),
    'transactions', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT id, type, amount, created_at
        FROM point_transactions
        WHERE user_id = p_user_id
        ORDER BY created_at
      ) t
    ),
    'comments', (
      SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      FROM (
        SELECT id, campaign_id, content, created_at
        FROM comments
        WHERE user_id = p_user_id AND deleted_at IS NULL
        ORDER BY created_at
      ) c
    )
  );
END;
$$;

-- ── delete_user_data ──────────────────────────────────────────────────────────
-- Anonymizes and removes all personal data for the requesting user (Article 17).
-- Returns photo URLs so the caller can purge them from Supabase Storage.
-- point_transactions are kept as a financial audit trail (standard GDPR practice).

CREATE OR REPLACE FUNCTION public.delete_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_photos JSONB;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Collect photo URLs for client-side Storage cleanup
  SELECT jsonb_build_object(
    'avatar_url', (SELECT avatar_url FROM profiles WHERE id = p_user_id),
    'campaign_photos', (
      SELECT COALESCE(jsonb_agg(before_photo_url), '[]'::jsonb)
      FROM campaigns
      WHERE created_by = p_user_id AND deleted_at IS NULL AND before_photo_url IS NOT NULL
    ),
    'participation_photos', (
      SELECT COALESCE(jsonb_agg(after_photo_url), '[]'::jsonb)
      FROM participations
      WHERE user_id = p_user_id AND deleted_at IS NULL AND after_photo_url IS NOT NULL
    )
  ) INTO v_photos;

  -- Anonymize profile — remove all PII, mark deleted
  UPDATE profiles SET
    username     = 'deleted_user',
    avatar_url   = NULL,
    neighborhood = NULL,
    email        = NULL,
    deleted_at   = NOW()
  WHERE id = p_user_id;

  -- Soft-delete user's campaigns
  UPDATE campaigns SET deleted_at = NOW(), deleted_by = p_user_id
  WHERE created_by = p_user_id AND deleted_at IS NULL;

  -- Soft-delete participations
  UPDATE participations SET deleted_at = NOW(), deleted_by = p_user_id
  WHERE user_id = p_user_id AND deleted_at IS NULL;

  -- Soft-delete comments
  UPDATE comments SET deleted_at = NOW(), deleted_by = p_user_id
  WHERE user_id = p_user_id AND deleted_at IS NULL;

  -- Hard-delete non-essential personal data
  DELETE FROM notifications      WHERE user_id     = p_user_id;
  DELETE FROM event_rsvps        WHERE user_id     = p_user_id;
  DELETE FROM push_subscriptions WHERE user_id     = p_user_id;
  DELETE FROM reports            WHERE reported_by = p_user_id;
  DELETE FROM campaign_rate_limits WHERE user_id   = p_user_id;

  RETURN v_photos;
END;
$$;

GRANT EXECUTE ON FUNCTION public.export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_data(UUID) TO authenticated;
