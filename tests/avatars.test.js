import { getDiceBearUrl, getAvatarUrl } from '../src/services/avatars.js';

const DICEBEAR_BASE = 'https://api.dicebear.com/7.x';

describe('avatars.js — getDiceBearUrl()', () => {
  it('returns bottts-neutral for 0 points', () => {
    const url = getDiceBearUrl('user-1', 0);
    expect(url).toBe(`${DICEBEAR_BASE}/bottts-neutral/svg?seed=user-1`);
  });

  it('returns bottts-neutral for 49 points', () => {
    const url = getDiceBearUrl('user-1', 49);
    expect(url).toContain('/bottts-neutral/svg');
  });

  it('returns adventurer for exactly 50 points', () => {
    const url = getDiceBearUrl('user-1', 50);
    expect(url).toContain('/adventurer/svg');
  });

  it('returns adventurer for 99 points', () => {
    const url = getDiceBearUrl('user-1', 99);
    expect(url).toContain('/adventurer/svg');
  });

  it('returns notionists for exactly 100 points', () => {
    const url = getDiceBearUrl('user-1', 100);
    expect(url).toContain('/notionists/svg');
  });

  it('returns notionists for 2500 points (demo user)', () => {
    const url = getDiceBearUrl('demo-user', 2500);
    expect(url).toContain('/notionists/svg');
  });

  it('uses default 0 points when omitted', () => {
    const url = getDiceBearUrl('user-1');
    expect(url).toContain('/bottts-neutral/svg');
  });

  it('encodes special characters in userId seed', () => {
    const url = getDiceBearUrl('user@email.com', 0);
    expect(url).toContain('seed=user%40email.com');
  });

  it('always includes the seed param', () => {
    const url = getDiceBearUrl('abc-123', 75);
    expect(url).toContain('seed=abc-123');
  });
});

describe('avatars.js — getAvatarUrl()', () => {
  it('returns null for null profile', () => {
    expect(getAvatarUrl(null)).toBeNull();
  });

  it('returns null for undefined profile', () => {
    expect(getAvatarUrl(undefined)).toBeNull();
  });

  it('returns avatar_url when profile has one (uploaded photo takes priority)', () => {
    const profile = { id: 'u1', avatar_url: 'https://storage.example.com/avatar.jpg', points_balance: 0 };
    expect(getAvatarUrl(profile)).toBe('https://storage.example.com/avatar.jpg');
  });

  it('returns DiceBear URL when avatar_url is null (edge case: save profile without uploading)', () => {
    // Regression test: previously displayAvatar(newAvatarUrl) was called with null
    // after saving profile changes → "👤" shown instead of DiceBear.
    const profile = { id: 'u1', avatar_url: null, points_balance: 0 };
    const url = getAvatarUrl(profile);
    expect(url).toContain('dicebear.com');
    expect(url).toContain('/bottts-neutral/svg');
  });

  it('returns DiceBear URL when avatar_url is empty string', () => {
    const profile = { id: 'u1', avatar_url: '', points_balance: 50 };
    const url = getAvatarUrl(profile);
    expect(url).toContain('dicebear.com');
    expect(url).toContain('/adventurer/svg');
  });

  it('uses "default" seed when profile has no id', () => {
    const profile = { avatar_url: null, points_balance: 0 };
    const url = getAvatarUrl(profile);
    expect(url).toContain('seed=default');
  });

  it('uses 0 points when points_balance is missing', () => {
    const profile = { id: 'u1', avatar_url: null };
    const url = getAvatarUrl(profile);
    expect(url).toContain('/bottts-neutral/svg');
  });

  it('selects correct tier based on points_balance', () => {
    expect(getAvatarUrl({ id: 'u1', avatar_url: null, points_balance: 0 })).toContain('/bottts-neutral/svg');
    expect(getAvatarUrl({ id: 'u1', avatar_url: null, points_balance: 50 })).toContain('/adventurer/svg');
    expect(getAvatarUrl({ id: 'u1', avatar_url: null, points_balance: 100 })).toContain('/notionists/svg');
  });

  it('demo user (2500 pts, no avatar) gets notionists tier', () => {
    const demoProfile = { id: 'demo-123', avatar_url: null, points_balance: 2500 };
    const url = getAvatarUrl(demoProfile);
    expect(url).toContain('/notionists/svg');
    expect(url).toContain('seed=demo-123');
  });
});
