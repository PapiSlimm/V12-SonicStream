import { describe, it, expect } from 'vitest';
import { PricingEngine } from '../pricing.engine.js';

const baseContext = {
  userId: 'u1',
  tenantId: 'default',
  demandScore: 0.5,
  supplyScore: 0.5,
  userGrowthRate: 0,
};

describe('PricingEngine.compute', () => {
  it('uses the base 15% fee rate for a creator with no growth', async () => {
    const result = await PricingEngine.compute({ ...baseContext, userGrowthRate: 0 });
    expect(result.platformFeeRate).toBeCloseTo(0.15, 5);
    expect(result.distributionPriority).toBe('NORMAL');
  });

  it('rewards growth above 0.5 with a 10% base fee rate', async () => {
    const result = await PricingEngine.compute({ ...baseContext, userGrowthRate: 0.6 });
    expect(result.platformFeeRate).toBeCloseTo(0.10, 5);
  });

  it('rewards growth above 1.0 with an 8% base fee rate', async () => {
    const result = await PricingEngine.compute({ ...baseContext, userGrowthRate: 1.5 });
    expect(result.platformFeeRate).toBeCloseTo(0.08, 5);
  });

  it('marks distribution priority HIGH once growth exceeds 0.3', async () => {
    const below = await PricingEngine.compute({ ...baseContext, userGrowthRate: 0.29 });
    const above = await PricingEngine.compute({ ...baseContext, userGrowthRate: 0.31 });
    expect(below.distributionPriority).toBe('NORMAL');
    expect(above.distributionPriority).toBe('HIGH');
  });

  it('applies a surge multiplier when demand exceeds supply', async () => {
    const surging = await PricingEngine.compute({
      ...baseContext,
      demandScore: 0.9,
      supplyScore: 0.4,
    });
    expect(surging.surgeActive).toBe(true);
    // surgeMultiplier = 1 + (0.9 - 0.4) * 0.1 = 1.05, fee = 0.15 * 1.05
    expect(surging.platformFeeRate).toBeCloseTo(0.15 * 1.05, 5);
  });

  it('never lets the surge multiplier drop fees below the base rate when demand <= supply', async () => {
    const calm = await PricingEngine.compute({
      ...baseContext,
      demandScore: 0.3,
      supplyScore: 0.8,
    });
    expect(calm.surgeActive).toBe(false);
    expect(calm.platformFeeRate).toBeCloseTo(0.15, 5); // multiplier clamped to 1, not negative
  });

  it('sets a premium visibility boost price once demand exceeds 0.8', async () => {
    const highDemand = await PricingEngine.compute({ ...baseContext, demandScore: 0.85 });
    const normalDemand = await PricingEngine.compute({ ...baseContext, demandScore: 0.5 });
    expect(highDemand.visibilityBoostPrice).toBe(25.0);
    expect(normalDemand.visibilityBoostPrice).toBe(10.0);
  });
});
