export interface PricingContext {
  userId: string;
  role: 'artist' | 'buyer' | 'business';
  demandScore: number;      // velocity of bookings or views
  supplyScore: number;      // competition in category
  loyaltyScore: number;     // calculated internal score (0-1)
  fraudRiskScore: number;   // ML-based risk (0-1)
}

export class DynamicPricingService {
  /**
   * Calculates dynamic marketplace fee based on demand/supply, loyalty, and risk.
   */
  static calculateMarketplaceFee(ctx: PricingContext): number {
    const base = 0.12; // Base 12%

    // Surge pricing factor (e.g. if demand > supply)
    const demandMultiplier = 1 + Math.max(0, (ctx.demandScore - ctx.supplyScore) * 0.2);

    // Loyalty discount (up to 2% reduction)
    const loyaltyDiscount = ctx.loyaltyScore > 0.8 ? 0.02 : 0;

    // Risk premium (increase fee if risk is high)
    const riskPremium = ctx.fraudRiskScore > 0.7 ? 0.03 : 0;

    const finalFee = (base * demandMultiplier) + riskPremium - loyaltyDiscount;

    // Clamp between 5% and 25%
    return Math.max(0.05, Math.min(0.25, finalFee));
  }

  /**
   * Distribution revenue share based on loyalty/tier
   */
  static calculateDistributionCut(ctx: PricingContext): number {
    if (ctx.loyaltyScore > 0.9) return 0.05; // 5% for elite artists
    if (ctx.loyaltyScore > 0.7) return 0.10; // 10% for growth artists
    return 0.15; // 15% Standard
  }

  /**
   * Estimates Revenue for the next N months using a simple growth model
   */
  static simulateRevenue(input: {
    users: number;
    conversionRate: number;
    avgRevenuePerUser: number;
    churnRate: number;
    growthRate: number;
    months: number;
    platformFee?: number;
    distroCut?: number;
  }) {
    let users = input.users;
    let totalRevenue = 0;
    const results = [];

    const pFee = input.platformFee || 0.12;
    const dCut = input.distroCut || 0.10;

    for (let m = 0; m < input.months; m++) {
      const newUsers = users * input.growthRate;
      const churned = users * input.churnRate;

      users = users + newUsers - churned;

      const payingUsers = users * input.conversionRate;
      // Revenue is (Marketplace Vol * fee) + (Streaming Vol * cut)
      // Simplification: avgRevenuePerUser is the total platform's take per user
      const monthlyRevenue = payingUsers * input.avgRevenuePerUser * (pFee + dCut);

      totalRevenue += monthlyRevenue;

      results.push({
        month: m + 1,
        users: Math.round(users),
        monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2))
      });
    }

    return results;
  }
}
