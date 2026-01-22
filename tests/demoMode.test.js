import { describe, it, expect, beforeEach } from 'vitest';
import * as demoMode from '../src/utils/demoMode.js';

// Mock localStorage for Node.js
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = value; },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

beforeEach(() => {
  localStorage.clear();
});

describe('demoMode.js', () => {
  it('initDemoMode() should initialize demo data', () => {
    demoMode.initDemoMode();
    expect(demoMode.isDemoMode()).toBe(true);
    expect(demoMode.getDemoUser()).toBeTruthy();
    expect(demoMode.getDemoCampaigns().length).toBeGreaterThan(0);
    expect(demoMode.getDemoRewards().length).toBeGreaterThan(0);
    expect(demoMode.getDemoTransactions().length).toBeGreaterThan(0);
  });

  it('clearDemoMode() should clear demo data', () => {
    demoMode.initDemoMode();
    demoMode.clearDemoMode();
    expect(demoMode.isDemoMode()).toBe(false);
    expect(demoMode.getDemoUser()).toBeNull();
    expect(demoMode.getDemoCampaigns().length).toBe(0);
    expect(demoMode.getDemoRewards().length).toBe(0);
    expect(demoMode.getDemoTransactions().length).toBe(0);
  });

  it('ensureDemoUser() should add user to CLEAN_QUARTER_DEMO_USERS', () => {
    const user = { id: 'test-user', username: 'test', role: 'user' };
    demoMode.ensureDemoUser(user);
    const users = JSON.parse(localStorage.getItem('CLEAN_QUARTER_DEMO_USERS'));
    expect(users.some(u => u.id === 'test-user')).toBe(true);
  });

  it('getDemoCampaignById() should return correct campaign', () => {
    demoMode.initDemoMode();
    const campaigns = demoMode.getDemoCampaigns();
    const campaign = demoMode.getDemoCampaignById(campaigns[0].id);
    expect(campaign).toBeTruthy();
    expect(campaign.id).toBe(campaigns[0].id);
  });

  it('getDemoParticipations() should return participations', () => {
    demoMode.initDemoMode();
    const participations = demoMode.getDemoParticipations();
    expect(Array.isArray(participations)).toBe(true);
    expect(participations.length).toBeGreaterThan(0);
  });
});
