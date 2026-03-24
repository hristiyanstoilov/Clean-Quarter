/**
 * Critical flow tests for handleBuy() in rewards.js.
 * Covers: points validation, user cancel, demo mode, real mode RPC,
 * error paths, and quantity_available management.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// --- Module mocks (hoisted before imports) ---

const {
  mockRpc,
  mockFromChain,
  mockFrom,
  mockIsDemoUser,
  mockAddDemoTransaction,
  mockSaveDemoRewards,
  mockShowSuccessToast,
} = vi.hoisted(() => {
  const chain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  };
  Object.keys(chain).forEach((k) => {
    chain[k].mockReturnValue(Promise.resolve({ data: [], error: null }));
  });

  return {
    mockRpc: vi.fn(),
    mockFromChain: chain,
    mockFrom: vi.fn(() => chain),
    mockIsDemoUser: vi.fn(),
    mockAddDemoTransaction: vi.fn(),
    mockSaveDemoRewards: vi.fn(),
    mockShowSuccessToast: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../src/services/supabase.js', () => ({
  default: {
    rpc: mockRpc,
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('../src/utils/demoMode.js', () => ({
  isDemoUser: mockIsDemoUser,
  getDemoRewards: vi.fn().mockReturnValue([]),
  saveDemoRewards: mockSaveDemoRewards,
  addDemoTransaction: mockAddDemoTransaction,
}));

vi.mock('../src/utils/i18n.js', () => ({
  t: (key) => key,
  initI18n: vi.fn().mockResolvedValue(undefined),
  applyLanguage: vi.fn(),
  setLanguage: vi.fn(),
}));

vi.mock('../src/utils/helpers.js', () => ({
  showSuccessToast: mockShowSuccessToast,
  initSwalFallback: vi.fn(),
  escapeHTML: (s) => s,
}));

vi.mock('../src/utils/networkStatus.js', () => ({ initNetworkStatusBanner: vi.fn() }));
vi.mock('../src/hooks/index.js', () => ({ initBottomNav: vi.fn() }));

import {
  handleBuy,
  _setCurrentUser,
  _setUserProfile,
  _setRewards,
} from '../src/scripts/rewards.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-1', email: 'test@test.com' };

function makeRewards(qty = 5) {
  return [{ id: 'reward-1', title: 'Coffee', quantity_available: qty }];
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('handleBuy()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _setCurrentUser(MOCK_USER);
    _setUserProfile({ points_balance: 200 });
    _setRewards(makeRewards());
    mockIsDemoUser.mockReturnValue(false);
    // Default: user confirms the purchase dialog
    global.Swal.fire.mockResolvedValue({ isConfirmed: true });
  });

  // ── Points validation ──────────────────────────────────────────────────────

  it('shows error dialog and skips RPC when user has insufficient points', async () => {
    _setUserProfile({ points_balance: 30 });

    await handleBuy('reward-1', 'Coffee', 100);

    expect(global.Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'error' })
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });

  // ── Cancellation ──────────────────────────────────────────────────────────

  it('returns early and does not call RPC when user cancels the confirmation', async () => {
    global.Swal.fire.mockResolvedValue({ isConfirmed: false });

    await handleBuy('reward-1', 'Coffee', 50);

    expect(mockRpc).not.toHaveBeenCalled();
  });

  // ── Demo mode ─────────────────────────────────────────────────────────────

  it('demo mode: calls addDemoTransaction with correct shape, skips Supabase RPC', async () => {
    mockIsDemoUser.mockReturnValue(true);

    await handleBuy('reward-1', 'Coffee', 50);

    expect(mockAddDemoTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -50,
        type: 'spent',
        reward_id: 'reward-1',
      })
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('demo mode: decrements quantity_available by 1 and saves rewards', async () => {
    mockIsDemoUser.mockReturnValue(true);
    const list = makeRewards(5);
    _setRewards(list);

    await handleBuy('reward-1', 'Coffee', 50);

    expect(list[0].quantity_available).toBe(4);
    expect(mockSaveDemoRewards).toHaveBeenCalled();
  });

  it('demo mode: does not touch quantity_available when it is null', async () => {
    mockIsDemoUser.mockReturnValue(true);
    const list = [{ id: 'reward-1', title: 'Coffee', quantity_available: null }];
    _setRewards(list);

    await handleBuy('reward-1', 'Coffee', 50);

    expect(list[0].quantity_available).toBeNull();
    expect(mockSaveDemoRewards).not.toHaveBeenCalled();
  });

  // ── Real mode ─────────────────────────────────────────────────────────────

  it('real mode: calls supabase.rpc("purchase_reward") with correct reward id', async () => {
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });

    await handleBuy('reward-1', 'Coffee', 50);

    expect(mockRpc).toHaveBeenCalledWith('purchase_reward', { p_reward_id: 'reward-1' });
  });

  it('real mode: decrements quantity_available by 1 after successful purchase', async () => {
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });
    const list = makeRewards(10);
    _setRewards(list);

    await handleBuy('reward-1', 'Coffee', 50);

    expect(list[0].quantity_available).toBe(9);
  });

  it('real mode: shows error dialog when RPC returns a database error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    await handleBuy('reward-1', 'Coffee', 50);

    const lastCall = global.Swal.fire.mock.calls.at(-1)[0];
    expect(lastCall.icon).toBe('error');
    expect(lastCall.text).toContain('DB error');
  });

  it('real mode: shows error dialog when RPC result.success is false', async () => {
    mockRpc.mockResolvedValue({ data: { success: false, error: 'Out of stock' }, error: null });

    await handleBuy('reward-1', 'Coffee', 50);

    const lastCall = global.Swal.fire.mock.calls.at(-1)[0];
    expect(lastCall.icon).toBe('error');
    expect(lastCall.text).toContain('Out of stock');
  });

  it('real mode: does not touch quantity_available when it is null', async () => {
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });
    const list = [{ id: 'reward-1', title: 'Coffee', quantity_available: null }];
    _setRewards(list);

    await handleBuy('reward-1', 'Coffee', 50);

    expect(list[0].quantity_available).toBeNull();
  });
});
