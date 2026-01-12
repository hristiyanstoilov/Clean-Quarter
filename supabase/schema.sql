-- Clean Quarter (Чист Квартал) Database Schema
-- Supabase SQL Script with RLS policies and seed data

-- ============================================================
-- 1. CREATE TABLES
-- ============================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  points_balance INTEGER NOT NULL DEFAULT 0,
  neighborhood TEXT NOT NULL CHECK (neighborhood IN (
    'Studentski Grad',
    'Darvenitsa',
    'Musagenitsa',
    'Vitosha (VEC)',
    'Malinova Dolina'
  )),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Disposal Points (locations for cleanup campaigns)
CREATE TABLE IF NOT EXISTS disposal_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  neighborhood TEXT NOT NULL CHECK (neighborhood IN (
    'Studentski Grad',
    'Darvenitsa',
    'Musagenitsa',
    'Vitosha (VEC)',
    'Malinova Dolina'
  )),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  disposal_point_id UUID REFERENCES disposal_points(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  before_photo_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  neighborhood TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Participations table
CREATE TABLE IF NOT EXISTS participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  after_photo_url TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL CHECK (cost > 0),
  category TEXT NOT NULL,
  image_url TEXT,
  quantity_available INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Point Transactions table (history)
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent')),
  description TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  reward_id UUID REFERENCES rewards(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. CREATE INDEXES
-- ============================================================

CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_neighborhood ON campaigns(neighborhood);
CREATE INDEX idx_participations_campaign_id ON participations(campaign_id);
CREATE INDEX idx_participations_user_id ON participations(user_id);
CREATE INDEX idx_participations_status ON participations(status);
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_disposal_points_neighborhood ON disposal_points(neighborhood);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal_points ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Campaigns RLS Policies
CREATE POLICY "Anyone can view campaigns" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Users can create campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Campaign creators can update their campaigns" ON campaigns FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Admins can update any campaign" ON campaigns FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Participations RLS Policies
CREATE POLICY "Anyone can view participations" ON participations FOR SELECT USING (true);
CREATE POLICY "Users can create participations" ON participations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own participations" ON participations FOR SELECT USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));
CREATE POLICY "Admins can approve/reject participations" ON participations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Rewards RLS Policies
CREATE POLICY "Anyone can view rewards" ON rewards FOR SELECT USING (true);
CREATE POLICY "Admins can manage rewards" ON rewards FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Point Transactions RLS Policies
CREATE POLICY "Users can view their own transactions" ON point_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON point_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can insert transactions" ON point_transactions FOR INSERT WITH CHECK (true);

-- Disposal Points RLS Policies
CREATE POLICY "Anyone can view disposal points" ON disposal_points FOR SELECT USING (true);
CREATE POLICY "Admins can manage disposal points" ON disposal_points FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- 4. SEED DATA
-- ============================================================

-- Insert test users (profiles)
-- Note: These need to correspond to actual auth.users records in Supabase
-- For testing, we'll insert with placeholder UUIDs - update these after creating auth users

INSERT INTO profiles (id, username, role, points_balance, neighborhood) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 'petar_user', 'user', 150, 'Studentski Grad'),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 'maria_admin', 'admin', 500, 'Studentski Grad'),
('550e8400-e29b-41d4-a716-446655440003'::uuid, 'ivan_user', 'user', 80, 'Darvenitsa'),
('550e8400-e29b-41d4-a716-446655440004'::uuid, 'sofia_user', 'user', 200, 'Vitosha (VEC)'),
('550e8400-e29b-41d4-a716-446655440005'::uuid, 'georgi_user', 'user', 120, 'Musagenitsa')
ON CONFLICT (id) DO NOTHING;

-- Insert Disposal Points (5 locations near Studentski Grad)
-- Coordinates: Sofia Studentski Grad area (42.65°N, 23.37°E)
INSERT INTO disposal_points (name, description, latitude, longitude, neighborhood, address) VALUES
('Disposal Point 1 - Studentski Complex', 'Main waste collection point in Studentski Complex', 42.65123, 23.37456, 'Studentski Grad', 'bul. Tsarigradsko shose 125'),
('Disposal Point 2 - Park near Stadium', 'Waste collection by the sports stadium', 42.65789, 23.37234, 'Studentski Grad', 'ul. Olimpijska 10'),
('Disposal Point 3 - Residential Zone A', 'Collection point in residential area A', 42.64567, 23.36789, 'Studentski Grad', 'ul. Vitosha 45'),
('Disposal Point 4 - Commercial Street', 'Waste point on main commercial street', 42.65432, 23.38123, 'Studentski Grad', 'ul. Vasil Levski 200'),
('Disposal Point 5 - Green Space', 'Collection point near green recreational area', 42.66012, 23.37890, 'Studentski Grad', 'Park "Zelenika"')
ON CONFLICT DO NOTHING;

-- Insert Campaigns (3 campaigns: 1 active, 1 completed, 1 cancelled)
INSERT INTO campaigns (
  title,
  description,
  location_lat,
  location_lng,
  status,
  before_photo_url,
  created_by,
  neighborhood
) VALUES
(
  'Clean Studentski Stadium Area',
  'Help us clean the stadium surroundings and park benches. Goal: Remove trash and restore green spaces.',
  42.65789,
  23.37234,
  'active',
  'https://via.placeholder.com/400?text=Stadium+Before',
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Studentski Grad'
),
(
  'Vitosha Street Cleanup - Completed',
  'Successful cleanup of Vitosha street area. Community effort to beautify the neighborhood.',
  42.64567,
  23.36789,
  'completed',
  'https://via.placeholder.com/400?text=Vitosha+Before',
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'Studentski Grad'
),
(
  'Park Renovation Initiative',
  'Large-scale park cleanup and beautification project.',
  42.66012,
  23.37890,
  'active',
  'https://via.placeholder.com/400?text=Park+Before',
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  'Studentski Grad'
)
ON CONFLICT DO NOTHING;

-- Insert Rewards (5 rewards with different categories)
INSERT INTO rewards (title, description, cost, category, quantity_available) VALUES
('Cinema Ticket', 'Free ticket to local cinema - 2D movie', 100, 'Entertainment', 50),
('IT Help Session', 'Professional IT assistance - 1 hour session', 150, 'Services', 20),
('Coffee Shop Voucher', '50 BGN voucher for local coffee shop', 80, 'Food & Beverage', 100),
('Sports Equipment', 'Free sports equipment rental coupon (1 month)', 200, 'Sports', 15),
('Home Cleaning Service', 'Professional home cleaning - 1 session (2 hours)', 250, 'Services', 10)
ON CONFLICT DO NOTHING;

-- Insert Participations (users participating in campaigns)
INSERT INTO participations (campaign_id, user_id, status, after_photo_url, points_earned) VALUES
(
  (SELECT id FROM campaigns WHERE title = 'Vitosha Street Cleanup - Completed' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'approved',
  'https://via.placeholder.com/400?text=Vitosha+After',
  50
),
(
  (SELECT id FROM campaigns WHERE title = 'Vitosha Street Cleanup - Completed' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'approved',
  'https://via.placeholder.com/400?text=Vitosha+After+2',
  50
),
(
  (SELECT id FROM campaigns WHERE title = 'Clean Studentski Stadium Area' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'pending',
  NULL,
  0
),
(
  (SELECT id FROM campaigns WHERE title = 'Park Renovation Initiative' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  'pending',
  'https://via.placeholder.com/400?text=Park+After',
  0
)
ON CONFLICT DO NOTHING;

-- Insert Point Transactions (history)
INSERT INTO point_transactions (user_id, amount, type, description, campaign_id) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 50, 'earned', 'Completed campaign: Vitosha Street Cleanup', (SELECT id FROM campaigns WHERE title = 'Vitosha Street Cleanup - Completed' LIMIT 1)),
('550e8400-e29b-41d4-a716-446655440003'::uuid, 50, 'earned', 'Completed campaign: Vitosha Street Cleanup', (SELECT id FROM campaigns WHERE title = 'Vitosha Street Cleanup - Completed' LIMIT 1)),
('550e8400-e29b-41d4-a716-446655440001'::uuid, 100, 'spent', 'Redeemed reward: Cinema Ticket', NULL),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 200, 'earned', 'Admin task bonus', NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. VERIFICATION QUERIES (Optional - run to verify data)
-- ============================================================

-- SELECT COUNT(*) as total_profiles FROM profiles;
-- SELECT COUNT(*) as total_campaigns FROM campaigns;
-- SELECT COUNT(*) as total_rewards FROM rewards;
-- SELECT COUNT(*) as total_disposal_points FROM disposal_points;
-- SELECT COUNT(*) as total_transactions FROM point_transactions;
