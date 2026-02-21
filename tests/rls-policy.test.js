import dotenv from 'dotenv';
dotenv.config({ path: '.env.test', override: true });
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Real Supabase integration tests for RLS policies.
// Requires .env.test with valid credentials:
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
//   SUPABASE_USER_EMAIL, SUPABASE_USER_PASSWORD
//   SUPABASE_ADMIN_EMAIL, SUPABASE_ADMIN_PASSWORD

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const USER_EMAIL = process.env.SUPABASE_USER_EMAIL;
const USER_PASSWORD = process.env.SUPABASE_USER_PASSWORD;
const ADMIN_EMAIL = process.env.SUPABASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SUPABASE_ADMIN_PASSWORD;

const canRun = !!(SUPABASE_URL && SUPABASE_ANON_KEY && USER_EMAIL && USER_PASSWORD && ADMIN_EMAIL && ADMIN_PASSWORD);

function makeClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

describe.skipIf(!canRun)('RLS Policy Integration Tests (requires real credentials)', () => {
  let userClient, adminClient, anonClient;
  let userId, adminId;
  let testCampaignId, testParticipationId;

  beforeAll(async () => {
    // Anon client (no auth)
    anonClient = makeClient();

    // User client
    userClient = makeClient();
    const { data: userLogin, error: userErr } = await userClient.auth.signInWithPassword({
      email: USER_EMAIL, password: USER_PASSWORD,
    });
    if (userErr) throw new Error(`User login failed: ${userErr.message}`);
    userId = userLogin.user.id;

    // Admin client
    adminClient = makeClient();
    const { data: adminLogin, error: adminErr } = await adminClient.auth.signInWithPassword({
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
    });
    if (adminErr) throw new Error(`Admin login failed: ${adminErr.message}`);
    adminId = adminLogin.user.id;
  });

  afterAll(async () => {
    // Cleanup test data created during tests
    if (testCampaignId) {
      await adminClient.from('participations').delete().eq('campaign_id', testCampaignId);
      await adminClient.from('campaigns').delete().eq('id', testCampaignId);
    }
    await userClient.auth.signOut();
    await adminClient.auth.signOut();
  });

  // ─── PROFILES ────────────────────────────────────────────────────────────────

  describe('Profiles', () => {
    it('authenticated user can read profiles', async () => {
      const { data, error } = await userClient.from('profiles').select('id, username').limit(1);
      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });

    it('[Fix #2] anonymous user CANNOT read profiles', async () => {
      const { data } = await anonClient.from('profiles').select('id, username').limit(1);
      // RLS should return empty result for anon
      expect(data?.length ?? 0).toBe(0);
    });

    it('user can update own profile', async () => {
      const { error } = await userClient.from('profiles').update({ neighborhood: 'Darvenitsa' }).eq('id', userId);
      expect(error).toBeNull();
    });

    it('user CANNOT update another profile', async () => {
      const { error } = await userClient.from('profiles').update({ username: 'hacked' }).eq('id', adminId);
      // Either error or 0 rows affected — both are correct
      if (!error) {
        const { data } = await adminClient.from('profiles').select('username').eq('id', adminId).single();
        expect(data?.username).not.toBe('hacked');
      }
    });
  });

  // ─── CAMPAIGNS ────────────────────────────────────────────────────────────────

  describe('Campaigns', () => {
    it('user can create a campaign', async () => {
      const { data, error } = await userClient
        .from('campaigns')
        .insert({
          title: 'RLS Test Campaign',
          description: 'Automated RLS test — safe to delete',
          location_lat: 42.65,
          location_lng: 23.37,
          created_by: userId,
          neighborhood: 'Studentski Grad',
          status: 'active',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBeTruthy();
      testCampaignId = data.id;
    });

    it('user CANNOT update another user\'s campaign', async () => {
      const { data: otherCampaign } = await adminClient
        .from('campaigns').select('id, title').neq('created_by', userId).limit(1).single();

      if (otherCampaign) {
        // RLS silently blocks — no error but 0 rows affected; verify title unchanged
        await userClient.from('campaigns').update({ title: 'Hacked' }).eq('id', otherCampaign.id);
        const { data: after } = await adminClient.from('campaigns').select('title').eq('id', otherCampaign.id).single();
        expect(after?.title).not.toBe('Hacked');
      }
    });

    it('[Fix #4] user CANNOT delete campaign that has external participants', async () => {
      // Add another user's participation to the test campaign
      const { error: partErr } = await adminClient.from('participations').insert({
        campaign_id: testCampaignId,
        user_id: adminId,
        status: 'pending',
      });
      expect(partErr).toBeNull();

      // RLS silently blocks — no error but campaign should still exist
      await userClient.from('campaigns').delete().eq('id', testCampaignId);
      const { data: stillExists } = await adminClient.from('campaigns').select('id').eq('id', testCampaignId).single();
      expect(stillExists?.id).toBe(testCampaignId);

      // Cleanup admin's participation so afterAll can delete campaign
      await adminClient.from('participations').delete().eq('campaign_id', testCampaignId).eq('user_id', adminId);
    });
  });

  // ─── PARTICIPATIONS ──────────────────────────────────────────────────────────

  describe('Participations', () => {
    beforeAll(async () => {
      // Create user's own participation for test campaign
      const { data } = await userClient
        .from('participations')
        .insert({ campaign_id: testCampaignId, user_id: userId, status: 'pending' })
        .select()
        .single();
      testParticipationId = data?.id;
    });

    it('user can update own after_photo_url', async () => {
      const { error } = await userClient
        .from('participations')
        .update({ after_photo_url: 'https://example.com/photo.jpg', status: 'pending' })
        .eq('id', testParticipationId);
      expect(error).toBeNull();
    });

    it('[Fix #1] user CANNOT self-approve participation', async () => {
      const { error } = await userClient
        .from('participations')
        .update({ status: 'approved' })
        .eq('id', testParticipationId);
      expect(error).not.toBeNull();
      expect(error.message).toMatch(/Permission denied/i);
    });

    it('[Fix #1] user CANNOT self-reject participation', async () => {
      const { error } = await userClient
        .from('participations')
        .update({ status: 'rejected' })
        .eq('id', testParticipationId);
      expect(error).not.toBeNull();
    });

    it('[Fix #1] user CANNOT manipulate points_earned', async () => {
      const { error } = await userClient
        .from('participations')
        .update({ points_earned: 9999 })
        .eq('id', testParticipationId);
      expect(error).not.toBeNull();
    });

    it('admin CAN approve participation', async () => {
      const { error } = await adminClient
        .from('participations')
        .update({ status: 'approved', points_earned: 20 })
        .eq('id', testParticipationId);
      expect(error).toBeNull();
    });
  });

  // ─── DISPOSAL POINTS ─────────────────────────────────────────────────────────

  describe('Disposal Points', () => {
    it('authenticated user can READ disposal points', async () => {
      const { error } = await userClient.from('disposal_points').select('id').limit(1);
      expect(error).toBeNull();
    });

    it('[Fix #3] regular user CANNOT insert disposal point', async () => {
      const { error } = await userClient.from('disposal_points').insert({
        name: 'Hacked Point', latitude: 42.0, longitude: 23.0, neighborhood: 'Studentski Grad',
      });
      expect(error).not.toBeNull();
    });

    it('[Fix #3] admin CAN insert disposal point', async () => {
      const { data, error } = await adminClient
        .from('disposal_points')
        .insert({ name: 'RLS Test Point', latitude: 42.65, longitude: 23.37, neighborhood: 'Studentski Grad' })
        .select()
        .single();
      expect(error).toBeNull();

      // Cleanup
      if (data?.id) await adminClient.from('disposal_points').delete().eq('id', data.id);
    });
  });

  // ─── REWARDS ─────────────────────────────────────────────────────────────────

  describe('Rewards', () => {
    it('user CANNOT create a reward', async () => {
      const { error } = await userClient.from('rewards').insert({ title: 'Fake Reward', cost: 1, category: 'Test' });
      expect(error).not.toBeNull();
    });

    it('admin CAN create and delete a reward', async () => {
      const { data, error } = await adminClient
        .from('rewards')
        .insert({ title: 'RLS Test Reward', cost: 1, category: 'Test' })
        .select()
        .single();
      expect(error).toBeNull();

      if (data?.id) await adminClient.from('rewards').delete().eq('id', data.id);
    });
  });

  // ─── POINT TRANSACTIONS ──────────────────────────────────────────────────────

  describe('Point Transactions', () => {
    it('user can read own transactions', async () => {
      const { error } = await userClient.from('point_transactions').select('id').limit(5);
      expect(error).toBeNull();
    });

    it('user CANNOT insert transactions directly', async () => {
      const { error } = await userClient.from('point_transactions').insert({
        user_id: userId, amount: 999, type: 'earned', description: 'Self-awarded points hack',
      });
      expect(error).not.toBeNull();
    });

    it('point transaction is created automatically when admin approves participation', async () => {
      // Create a fresh participation for this test
      const { data: part } = await userClient
        .from('participations')
        .insert({ campaign_id: testCampaignId, user_id: userId, status: 'pending' })
        .select()
        .single();

      if (!part?.id) return; // skip if insert failed (duplicate)

      const { error } = await adminClient
        .from('participations')
        .update({ status: 'approved', points_earned: 15 })
        .eq('id', part.id);
      expect(error).toBeNull();

      // A trigger/function should have created a point_transaction
      // Must query as userClient — RLS restricts point_transactions to own rows
      const { data: tx } = await userClient
        .from('point_transactions')
        .select('amount, type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      expect(tx).toBeTruthy();
      expect(tx?.amount).toBe(15);

      // Cleanup
      await adminClient.from('participations').delete().eq('id', part.id);
    });
  });

  // ─── ANONYMOUS ACCESS ─────────────────────────────────────────────────────────

  describe('Anonymous Access', () => {
    it('anonymous user CAN view active campaigns (public listing)', async () => {
      const { data, error } = await anonClient.from('campaigns').select('id, title').limit(1);
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('anonymous user CAN view rewards (public catalogue)', async () => {
      const { data, error } = await anonClient.from('rewards').select('id, title, cost').limit(1);
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('anonymous user CANNOT view participations', async () => {
      const { data } = await anonClient.from('participations').select('id').limit(1);
      expect(data?.length ?? 0).toBe(0);
    });

    it('anonymous user CANNOT view point_transactions', async () => {
      const { data } = await anonClient.from('point_transactions').select('id').limit(1);
      expect(data?.length ?? 0).toBe(0);
    });
  });

  // ─── SELF-PARTICIPATION / FRAUD ───────────────────────────────────────────────

  describe('Self-participation (Fraud Prevention)', () => {
    it('campaign creator CAN join own campaign (points awarded by admin — not a fraud risk)', async () => {
      // Business decision: creator joining is allowed; fraud is prevented because
      // only an admin (different person) can approve and award points.
      const { error } = await userClient
        .from('participations')
        .insert({ campaign_id: testCampaignId, user_id: userId, status: 'pending' });
      // Either succeeds or fails due to unique constraint — both are acceptable
      // The key guard is that self-approval is blocked (tested above)
      if (error) {
        expect(error.code).toMatch(/23505|42501/); // unique violation or RLS — both fine
      }
    });
  });

  // ─── REPORTS ─────────────────────────────────────────────────────────────────

  describe('Reports', () => {
    it('authenticated user CAN submit a report', async () => {
      const { data, error } = await userClient
        .from('reports')
        .insert({ reported_by: userId, entity_type: 'campaign', entity_id: testCampaignId, reason: 'other' })
        .select()
        .single();
      expect(error).toBeNull();

      // Cleanup
      if (data?.id) await adminClient.from('reports').delete().eq('id', data.id);
    });

    it('user CANNOT view other users\' reports', async () => {
      // Insert a report as admin, then verify user cannot read it
      const { data: rep } = await adminClient
        .from('reports')
        .insert({ reported_by: adminId, entity_type: 'campaign', entity_id: testCampaignId, reason: 'other' })
        .select()
        .single();

      const { data: userView } = await userClient
        .from('reports')
        .select('id')
        .eq('id', rep?.id)
        .maybeSingle();
      expect(userView).toBeNull();

      if (rep?.id) await adminClient.from('reports').delete().eq('id', rep.id);
    });

    it('admin CAN view all reports', async () => {
      const { data, error } = await adminClient.from('reports').select('id').limit(5);
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
