-- 1. purchase_reward() — atomic SECURITY DEFINER function
CREATE OR REPLACE FUNCTION purchase_reward(p_reward_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        UUID;
  v_reward_cost    INTEGER;
  v_reward_title   TEXT;
  v_reward_qty     INTEGER;
  v_current_points INTEGER;
  v_new_points     INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT cost, title, quantity_available
    INTO v_reward_cost, v_reward_title, v_reward_qty
    FROM rewards
   WHERE id = p_reward_id AND deleted_at IS NULL
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Reward not found');
  END IF;

  IF v_reward_qty IS NOT NULL AND v_reward_qty <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Out of stock');
  END IF;

  SELECT points_balance
    INTO v_current_points
    FROM profiles
   WHERE id = v_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_current_points < v_reward_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient points');
  END IF;

  v_new_points := v_current_points - v_reward_cost;

  UPDATE profiles SET points_balance = v_new_points WHERE id = v_user_id;

  IF v_reward_qty IS NOT NULL THEN
    UPDATE rewards SET quantity_available = quantity_available - 1 WHERE id = p_reward_id;
  END IF;

  INSERT INTO point_transactions (user_id, amount, type, description, reward_id)
  VALUES (v_user_id, -v_reward_cost, 'spent', 'Purchased reward: ' || v_reward_title, p_reward_id);

  RETURN json_build_object('success', true, 'new_balance', v_new_points);
END;
$$;

-- 2. point_transactions INSERT: restrict to admins only
DROP POLICY IF EXISTS "Users can insert own transactions" ON point_transactions;

CREATE POLICY "Admins can insert transactions" ON point_transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. rewards UPDATE: remove client-side quantity manipulation
DROP POLICY IF EXISTS "Users can update reward quantity" ON rewards;

-- 4. participations SELECT: require authentication
DROP POLICY IF EXISTS "Users can view all participations" ON participations;

CREATE POLICY "Authenticated users can view participations" ON participations
  FOR SELECT USING (auth.uid() IS NOT NULL);
