import 'dotenv/config';
import { describe, it, expect } from 'vitest';
// Automated RLS Policy Test Script for Supabase
// This test requires real Supabase credentials and is skipped by default

import { createClient } from '@supabase/supabase-js';

// Use environment variables for credentials
const env = process.env;
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
const USER_EMAIL = env.SUPABASE_USER_EMAIL || 'user@example.com';
const USER_PASSWORD = env.SUPABASE_USER_PASSWORD || 'userpassword';
const ADMIN_EMAIL = env.SUPABASE_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = env.SUPABASE_ADMIN_PASSWORD || 'adminpassword';
const canRun = !!SUPABASE_URL && !!SUPABASE_ANON_KEY && !!USER_EMAIL && !!ADMIN_EMAIL;

function getClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Skip these tests as they require real user credentials and authenticated sessions
describe.skip('RLS Policy Tests (requires real credentials)', () => {

async function runRlsTests() {
  // Authenticate as user
  const userClient = getClient();
  const { data: userLogin, error: userLoginError } = await userClient.auth.signInWithPassword({ email: USER_EMAIL, password: USER_PASSWORD });
  if (userLoginError) throw new Error('User login failed: ' + userLoginError.message);
  const userId = userLogin.user.id;

  // Authenticate as admin
  const adminClient = getClient();
  const { data: adminLogin, error: adminLoginError } = await adminClient.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (adminLoginError) throw new Error('Admin login failed: ' + adminLoginError.message);
  const adminId = adminLogin.user.id;

  // 1. Profiles: User can read/update own profile, not others

  // User ID and admin ID are now available from login

  let { data: myProfile, error } = await userClient.from('profiles').select('*').eq('id', userId).single();
  assert(myProfile, 'User should read own profile');

  let { error: updateOtherProfileError } = await userClient.from('profiles').update({ username: 'hacker' }).eq('id', adminId);
  assert(updateOtherProfileError, 'User should not update another profile');

  // 2. Campaigns: User can create, update own; admin can update any
  let { data: newCampaign, error: createCampaignError } = await userClient.from('campaigns').insert({
    title: 'Test Campaign',
    description: 'Test',
    location_lat: 42.0,
    location_lng: 23.0,
    created_by: userId,
    neighborhood: 'Studentski Grad',
    status: 'active',
  }).single();
  assert(!createCampaignError, 'User can create campaign');

  let { error: updateOtherCampaignError } = await userClient.from('campaigns').update({ title: 'Hacked' }).eq('created_by', adminId);
  assert(updateOtherCampaignError, 'User cannot update others campaigns');

  // 3. Participations: User can create for self, admin can approve
  let { error: createParticipationError } = await userClient.from('participations').insert({
    campaign_id: newCampaign.id,
    user_id: userId,
    status: 'pending',
  });
  assert(!createParticipationError, 'User can create participation for self');

  let { error: approveError } = await userClient.from('participations').update({ status: 'approved' }).eq('id', 'some-participation-id');
  assert(approveError, 'User cannot approve participation');

  let { error: adminApproveError } = await adminClient.from('participations').update({ status: 'approved' }).eq('id', 'some-participation-id');
  assert(!adminApproveError, 'Admin can approve participation');

  // 4. Rewards: Only admin can manage
  let { error: userCreateRewardError } = await userClient.from('rewards').insert({ title: 'Test', cost: 1, category: 'Test' });
  assert(userCreateRewardError, 'User cannot create reward');

  let { error: adminCreateRewardError } = await adminClient.from('rewards').insert({ title: 'Test', cost: 1, category: 'Test' });
  assert(!adminCreateRewardError, 'Admin can create reward');

  // 5. Point Transactions: User can view own, admin can view all
  let { data: userTransactions } = await userClient.from('point_transactions').select('*');
  assert(userTransactions, 'User can view own transactions');

  let { data: adminTransactions } = await adminClient.from('point_transactions').select('*');
  assert(adminTransactions, 'Admin can view all transactions');

  // 6. Disposal Points: Only admin can manage
  let { error: userCreateDisposalError } = await userClient.from('disposal_points').insert({ name: 'Test', latitude: 42, longitude: 23, neighborhood: 'Studentski Grad' });
  assert(userCreateDisposalError, 'User cannot create disposal point');

  let { error: adminCreateDisposalError } = await adminClient.from('disposal_points').insert({ name: 'Test', latitude: 42, longitude: 23, neighborhood: 'Studentski Grad' });
  assert(!adminCreateDisposalError, 'Admin can create disposal point');

  console.log('All RLS policy tests passed!');
}

it('should test RLS policies', async () => {
  await runRlsTests();
});

});
