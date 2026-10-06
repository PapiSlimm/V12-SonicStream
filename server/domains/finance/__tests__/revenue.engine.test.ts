import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../db.js', () => ({
  db: { get: vi.fn() },
}));

import { db } from '../../../db.js';
import { RevenueEngine } from '../revenue.engine.js';

const mockGet = db.get as ReturnType<typeof vi.fn>;

describe('RevenueEngine.optimize (pure)', () => {
  it('uses standard rates below the $10,000 volume threshold', () => {
    const result = RevenueEngine.optimize({ volume: 5000 });
    expect(result).toEqual({ platformFee: 0.15, artistShare: 0.85 });
  });

  it('rewards high-volume creators with a lower platform fee above $10,000', () => {
    const result = RevenueEngine.optimize({ volume: 10001 });
    expect(result).toEqual({ platformFee: 0.12, artistShare: 0.88 });
  });

  it('platformFee + artistShare always sums to 1 (no leakage) at both tiers', () => {
    expect(RevenueEngine.optimize({ volume: 500 }).platformFee +
           RevenueEngine.optimize({ volume: 500 }).artistShare).toBeCloseTo(1, 5);
    expect(RevenueEngine.optimize({ volume: 50000 }).platformFee +
           RevenueEngine.optimize({ volume: 50000 }).artistShare).toBeCloseTo(1, 5);
  });
});

describe('RevenueEngine.adjust (liquidity subsidy)', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('applies a 2% liquidity subsidy when weekly volume is under $1,000', async () => {
    mockGet.mockResolvedValueOnce({ volume: 400 });

    const result = await RevenueEngine.adjust('u1', 'tenant-1', { platformFeeRate: 0.15 });

    expect(result.appliedSubsidy).toBe(true);
    expect(result.finalFeeRate).toBeCloseTo(0.13, 5);
    expect(result.weeklyVolume).toBe(400);
  });

  it('applies no subsidy when weekly volume meets the $1,000 threshold', async () => {
    mockGet.mockResolvedValueOnce({ volume: 1000 });

    const result = await RevenueEngine.adjust('u1', 'tenant-1', { platformFeeRate: 0.15 });

    expect(result.appliedSubsidy).toBe(false);
    expect(result.finalFeeRate).toBeCloseTo(0.15, 5);
  });

  it('treats a tenant with zero ledger activity (NULL SUM) as $0 volume, not a crash', async () => {
    mockGet.mockResolvedValueOnce(undefined);

    const result = await RevenueEngine.adjust('u1', 'brand-new-tenant', { platformFeeRate: 0.15 });

    expect(result.weeklyVolume).toBe(0);
    expect(result.appliedSubsidy).toBe(true);
  });

  it('never lets the subsidy push the fee rate below the 5% floor', async () => {
    mockGet.mockResolvedValueOnce({ volume: 0 });

    // Even starting from an already-low fee rate, the floor must hold.
    const result = await RevenueEngine.adjust('u1', 'tenant-1', { platformFeeRate: 0.06 });

    expect(result.finalFeeRate).toBeGreaterThanOrEqual(0.05);
  });
});
