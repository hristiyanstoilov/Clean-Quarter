-- Clean Quarter (Чист Квартал) Seed Data
-- Development/test data - DO NOT use in production
-- Note: profiles need corresponding auth.users records in Supabase

-- Insert test users (profiles)
INSERT INTO profiles (id, username, role, points_balance, neighborhood, email, is_superadmin) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 'petar_user', 'user', 150, 'Studentski Grad', 'petar@example.com', false),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 'maria_admin', 'admin', 500, 'Studentski Grad', 'maria@example.com', true),
('550e8400-e29b-41d4-a716-446655440003'::uuid, 'ivan_user', 'user', 80, 'Darvenitsa', 'ivan@example.com', false),
('550e8400-e29b-41d4-a716-446655440004'::uuid, 'sofia_user', 'user', 200, 'Vitosha (VEC)', 'sofia@example.com', false),
('550e8400-e29b-41d4-a716-446655440005'::uuid, 'georgi_user', 'user', 120, 'Musagenitsa', 'georgi@example.com', false)
ON CONFLICT (id) DO NOTHING;

-- Insert Disposal Points
INSERT INTO disposal_points (name, description, latitude, longitude, neighborhood, address) VALUES
('Disposal Point 1 - Studentski Complex', 'Main waste collection point in Studentski Complex', 42.65123, 23.37456, 'Studentski Grad', 'bul. Tsarigradsko shose 125'),
('Disposal Point 2 - Park near Stadium', 'Waste collection by the sports stadium', 42.65789, 23.37234, 'Studentski Grad', 'ul. Olimpijska 10'),
('Disposal Point 3 - Residential Zone A', 'Collection point in residential area A', 42.64567, 23.36789, 'Studentski Grad', 'ul. Vitosha 45'),
('Disposal Point 4 - Commercial Street', 'Waste point on main commercial street', 42.65432, 23.38123, 'Studentski Grad', 'ul. Vasil Levski 200'),
('Disposal Point 5 - Green Space', 'Collection point near green recreational area', 42.66012, 23.37890, 'Studentski Grad', 'Park "Zelenika"')
ON CONFLICT DO NOTHING;

-- Insert Campaigns
INSERT INTO campaigns (
  title, description, location_lat, location_lng, status,
  before_photo_url, created_by, neighborhood
) VALUES
(
  'Clean Studentski Stadium Area',
  'Help us clean the stadium surroundings and park benches. Goal: Remove trash and restore green spaces.',
  42.65789, 23.37234, 'active',
  'https://via.placeholder.com/400?text=Stadium+Before',
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Studentski Grad'
),
(
  'Vitosha Street Cleanup - Completed',
  'Successful cleanup of Vitosha street area. Community effort to beautify the neighborhood.',
  42.64567, 23.36789, 'completed',
  'https://via.placeholder.com/400?text=Vitosha+Before',
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'Studentski Grad'
),
(
  'Park Renovation Initiative',
  'Large-scale park cleanup and beautification project.',
  42.66012, 23.37890, 'active',
  'https://via.placeholder.com/400?text=Park+Before',
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  'Studentski Grad'
)
ON CONFLICT DO NOTHING;

-- Insert Rewards
INSERT INTO rewards (title, description, cost, category) VALUES
('Cinema Ticket', 'Free ticket to local cinema - 2D movie', 100, 'Entertainment'),
('IT Help Session', 'Professional IT assistance - 1 hour session', 150, 'Services'),
('Coffee Shop Voucher', '50 BGN voucher for local coffee shop', 80, 'Food & Beverage'),
('Sports Equipment', 'Free sports equipment rental coupon (1 month)', 200, 'Sports'),
('Home Cleaning Service', 'Professional home cleaning - 1 session (2 hours)', 250, 'Services')
ON CONFLICT DO NOTHING;

-- Insert Participations
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

-- Insert Point Transactions
INSERT INTO point_transactions (user_id, amount, type, description, campaign_id) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 50, 'earned', 'Completed campaign: Vitosha Street Cleanup', (SELECT id FROM campaigns WHERE title = 'Vitosha Street Cleanup - Completed' LIMIT 1)),
('550e8400-e29b-41d4-a716-446655440003'::uuid, 50, 'earned', 'Completed campaign: Vitosha Street Cleanup', (SELECT id FROM campaigns WHERE title = 'Vitosha Street Cleanup - Completed' LIMIT 1)),
('550e8400-e29b-41d4-a716-446655440001'::uuid, 100, 'spent', 'Redeemed reward: Cinema Ticket', NULL),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 200, 'earned', 'Admin task bonus', NULL)
ON CONFLICT DO NOTHING;
