// Tests unitaires — AfriLaunch AI
import { describe, it, expect } from 'vitest';
import { PLANS, CREDIT_PACKS, formatFCFA, sanitizeUser } from '../lib/user-types';

describe('PLANS', () => {
  it('should have 4 plans (no Free)', () => {
    expect(Object.keys(PLANS)).toHaveLength(4);
    expect(PLANS).not.toHaveProperty('free');
  });

  it('Starter plan should cost 5000 FCFA', () => {
    expect(PLANS.starter.priceMonthly).toBe(5000);
    expect(PLANS.starter.creditsPerMonth).toBe(500);
  });

  it('Pro plan should be popular', () => {
    expect(PLANS.pro.popular).toBe(true);
    expect(PLANS.pro.priceMonthly).toBe(15000);
  });

  it('Enterprise should have unlimited credits (-1)', () => {
    expect(PLANS.enterprise.creditsPerMonth).toBe(-1);
  });

  it('all plans should have features array', () => {
    for (const plan of Object.values(PLANS)) {
      expect(Array.isArray(plan.features)).toBe(true);
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });
});

describe('CREDIT_PACKS', () => {
  it('should have 4 packs', () => {
    expect(CREDIT_PACKS).toHaveLength(4);
  });

  it('pack_5000 should have 20% discount', () => {
    const pack = CREDIT_PACKS.find((p) => p.id === 'pack_5000');
    expect(pack?.discount).toBe(20);
    expect(pack?.popular).toBe(true);
  });
});

describe('formatFCFA', () => {
  it('should format numbers with spaces', () => {
    expect(formatFCFA(5000)).toBe('5 000 FCFA');
    expect(formatFCFA(15000)).toBe('15 000 FCFA');
    expect(formatFCFA(150000)).toBe('150 000 FCFA');
  });

  it('should handle zero', () => {
    expect(formatFCFA(0)).toBe('0 FCFA');
  });
});

describe('sanitizeUser', () => {
  it('should remove passwordHash', () => {
    const user = {
      id: 'usr_123',
      email: 'test@test.com',
      firstName: 'Test',
      passwordHash: 'secret_hash',
      createdAt: '2026-01-01',
      plan: 'starter' as const,
      planStatus: 'active' as const,
      planStartedAt: null,
      planEndsAt: null,
      credits: 500,
      creditsUsedThisMonth: 0,
      creditsResetAt: '2026-02-01',
      referralCode: 'test123',
      referredBy: null,
      referralCount: 0,
      referralCreditsEarned: 0,
      installedAgents: [],
      lastLoginAt: null,
      updatedAt: '2026-01-01',
    };
    const sanitized = sanitizeUser(user);
    expect(sanitized).not.toHaveProperty('passwordHash');
    expect(sanitized.id).toBe('usr_123');
    expect(sanitized.firstName).toBe('Test');
  });
});
