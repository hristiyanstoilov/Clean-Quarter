/**
 * Critical flow tests for handleApprove(), handleReject(), and checkAuth() in admin.js.
 * Covers: demo mode, real mode RPC/update, cancellation, error paths, and auth redirect.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// --- Module mocks (hoisted) ---

const {
  mockRpc,
  mockFrom,
  mockGetUser,
  mockIsDemoUser,
  mockUpdateDemoParticipation,
  mockAddDemoTransaction,
  mockGetDemoUsers,
} = vi.hoisted(() => {
  const makeUpdateChain = () => ({ eq: vi.fn(() => Promise.resolve({ error: null })) });
  const makeSelectChain = () => ({
    select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
  });

  const from = vi.fn(() => ({
    ...makeSelectChain(),
    update: vi.fn(() => makeUpdateChain()),
    insert: vi.fn(() => ({ select: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
  }));

  return {
    mockRpc: vi.fn(),
    mockFrom: from,
    mockGetUser: vi.fn(),
    mockIsDemoUser: vi.fn(),
    mockUpdateDemoParticipation: vi.fn(),
    mockAddDemoTransaction: vi.fn(),
    mockGetDemoUsers: vi.fn().mockReturnValue([]),
  };
});

vi.mock('../src/services/supabase.js', () => ({
  default: {
    rpc: mockRpc,
    from: mockFrom,
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn(), unsubscribe: vi.fn() })),
  },
}));

vi.mock('../src/utils/demoMode.js', () => ({
  isDemoUser: mockIsDemoUser,
  getDemoParticipations: vi.fn().mockReturnValue([]),
  getDemoCampaigns: vi.fn().mockReturnValue([]),
  getDemoUsers: mockGetDemoUsers,
  saveDemoUsers: vi.fn(),
  updateDemoUser: vi.fn(),
  updateDemoParticipation: mockUpdateDemoParticipation,
  addDemoTransaction: mockAddDemoTransaction,
  getDemoRoleLog: vi.fn().mockReturnValue([]),
  saveDemoRoleLog: vi.fn(),
}));

vi.mock('../src/utils/i18n.js', () => ({
  t: (key, _params) => key,
  initI18n: vi.fn().mockResolvedValue(undefined),
  applyLanguage: vi.fn(),
  setLanguage: vi.fn(),
}));

vi.mock('../src/utils/helpers.js', () => ({
  showSuccessToast: vi.fn().mockResolvedValue(undefined),
  showInfoToast: vi.fn().mockResolvedValue(undefined),
  initSwalFallback: vi.fn(),
  escapeHTML: (s) => s,
}));

vi.mock('../src/services/csvExport.js', () => ({
  exportUsersCsv: vi.fn(),
  exportParticipationsCsv: vi.fn(),
}));
vi.mock('../src/utils/networkStatus.js', () => ({ initNetworkStatusBanner: vi.fn() }));
vi.mock('../src/hooks/index.js', () => ({ initBottomNav: vi.fn() }));
vi.mock('../src/services/pushNotifications.js', () => ({ sendPushToUser: vi.fn() }));
vi.mock('../src/services/points.js', () => ({ CLEANUP_POINTS: 20 }));

import {
  handleApprove,
  handleReject,
  checkAuth,
  _setCurrentUser,
  _setPendingParticipations,
} from '../src/scripts/admin.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_ADMIN = { id: 'admin-1', email: 'admin@test.com', role: 'admin' };
const MOCK_PARTICIPATION = {
  id: 'p-1',
  user_id: 'user-2',
  campaign_id: 'c-1',
  status: 'pending',
  campaigns: { title: 'Test Campaign' },
};

// ─── handleApprove() ──────────────────────────────────────────────────────────

describe('handleApprove()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _setCurrentUser(MOCK_ADMIN);
    _setPendingParticipations([{ ...MOCK_PARTICIPATION }]);
    mockIsDemoUser.mockReturnValue(false);
    // Default: user confirms
    global.Swal.fire.mockResolvedValue({ isConfirmed: true });
    // Default RPC success
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });
  });

  it('throws and shows error when participation is not found in pendingParticipations', async () => {
    _setPendingParticipations([]);

    await handleApprove('non-existent-id', 'user');

    expect(global.Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'error' })
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns early without RPC when admin cancels the confirmation', async () => {
    global.Swal.fire.mockResolvedValue({ isConfirmed: false });

    await handleApprove('p-1', 'user');

    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('demo mode: calls updateDemoParticipation and addDemoTransaction, skips RPC', async () => {
    mockIsDemoUser.mockReturnValue(true);
    // Demo mode reads localStorage for the user entry
    global.localStorage.setItem('user', JSON.stringify({ id: 'admin-1', role: 'admin' }));

    await handleApprove('p-1', 'user');

    expect(mockUpdateDemoParticipation).toHaveBeenCalledWith(
      'p-1',
      expect.objectContaining({ status: 'approved' })
    );
    expect(mockAddDemoTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'earned', amount: 20 })
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('real mode: calls supabase.rpc("approve_participation") with correct id', async () => {
    await handleApprove('p-1', 'user');

    expect(mockRpc).toHaveBeenCalledWith('approve_participation', {
      p_participation_id: 'p-1',
    });
  });

  it('real mode: shows error dialog when RPC returns an error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    await handleApprove('p-1', 'user');

    const lastCall = global.Swal.fire.mock.calls.at(-1)[0];
    expect(lastCall.icon).toBe('error');
    expect(lastCall.text).toContain('RPC failed');
  });
});

// ─── handleReject() ───────────────────────────────────────────────────────────

describe('handleReject()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _setCurrentUser(MOCK_ADMIN);
    _setPendingParticipations([{ ...MOCK_PARTICIPATION }]);
    mockIsDemoUser.mockReturnValue(false);
    // Default: user confirms with a reason
    global.Swal.fire.mockResolvedValue({ isConfirmed: true, value: 'Foto is blurry' });
  });

  it('returns early without DB call when admin cancels', async () => {
    global.Swal.fire.mockResolvedValue({ isConfirmed: false });

    await handleReject('p-1', 'user');

    expect(mockFrom).not.toHaveBeenCalledWith('participations');
    expect(mockUpdateDemoParticipation).not.toHaveBeenCalled();
  });

  it('real mode: updates participations with status rejected and rejection_reason', async () => {
    const updateFn = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));
    mockFrom.mockImplementationOnce(() => ({ update: updateFn }));

    await handleReject('p-1', 'user');

    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'rejected',
        rejection_reason: 'Foto is blurry',
      })
    );
  });

  it('demo mode: calls updateDemoParticipation with rejected status and reason', async () => {
    mockIsDemoUser.mockReturnValue(true);
    global.localStorage.setItem('user', JSON.stringify({ id: 'admin-1', role: 'admin' }));

    await handleReject('p-1', 'user');

    expect(mockUpdateDemoParticipation).toHaveBeenCalledWith(
      'p-1',
      expect.objectContaining({
        status: 'rejected',
        rejection_reason: 'Foto is blurry',
      })
    );
  });

  it('real mode: shows error dialog when DB update fails', async () => {
    mockFrom.mockImplementationOnce(() => ({
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: { message: 'update error' } })) })),
    }));

    await handleReject('p-1', 'user');

    const lastCall = global.Swal.fire.mock.calls.at(-1)[0];
    expect(lastCall.icon).toBe('error');
    expect(lastCall.text).toContain('update error');
  });
});

// ─── checkAuth() ──────────────────────────────────────────────────────────────

describe('checkAuth()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.localStorage.clear();
    global.window.location = { href: '' };
    // Reset DOM mock for relevant elements
    global.document.getElementById = vi.fn((id) => ({
      style: {},
      disabled: false,
      textContent: '',
      innerHTML: '',
      id,
    }));
  });

  it('demo admin user: skips Supabase, grants access without redirect', async () => {
    global.localStorage.setItem('user', JSON.stringify({ id: 'demo-123', role: 'admin' }));

    await checkAuth();

    expect(mockGetUser).not.toHaveBeenCalled();
    expect(global.window.location.href).toBe('');
  });

  it('demo non-admin user: shows accessDenied element, no redirect', async () => {
    global.localStorage.setItem('user', JSON.stringify({ id: 'demo-456', role: 'user' }));
    const accessDeniedEl = { style: { display: '' } };
    global.document.getElementById = vi.fn((id) =>
      id === 'accessDenied' ? accessDeniedEl : { style: {}, disabled: false, textContent: '' }
    );

    await checkAuth();

    expect(accessDeniedEl.style.display).toBe('block');
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('real user with no session: redirects to "/"', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await checkAuth();

    expect(global.window.location.href).toBe('/');
  });
});
