import { db, isPostgres } from '../../db.js';

export class RevenueEngine {
  /**
   * Adjusts splits to maximize ecosystem health.
   * If a tenant is struggling, it might temporary lower the platform cut to boost liquidity.
   */
  static async adjust(userId: string, tenantId: string, currentPricing: any) {
    const stats = await db.get(
      `SELECT SUM(amount) as volume FROM ledger_entries 
       WHERE tenant_id = ? AND created_at > ${isPostgres() ? "(NOW() - INTERVAL '7 days')" : "datetime('now', '-7 days')"}`,
      [tenantId]
    );

    const weeklyVolume = stats?.volume || 0;
    
    // Revenue Optimization Strategy: Boost Liquidity
    // If volume is low (< $1000/week), provide a temporary "Liquidity Subsidy" 
    // by reducing platform fee by an additional 2%.
    let liquiditySubsidy = 0;
    if (weeklyVolume < 1000) {
      liquiditySubsidy = 0.02;
    }

    const finalFeeRate = Math.max(0.05, currentPricing.platformFeeRate - liquiditySubsidy);

    return {
      finalFeeRate,
      appliedSubsidy: liquiditySubsidy > 0,
      weeklyVolume
    };
  }

  /**
   * Revenue Optimizer
   */
  static optimize(data: { volume: number }) {
    return {
      platformFee: data.volume > 10000 ? 0.12 : 0.15,
      artistShare: data.volume > 10000 ? 0.88 : 0.85,
    };
  }
}
