import { db } from '../../db.js';
import { PricingEngine } from './pricing.engine.js';
import { RevenueEngine } from './revenue.engine.js';
import { FinancialAIService } from './financial-ai.service.js';

export class PricingService {
  /**
   * Calculates the split for a transaction based on user tier and Brain dynamic logic
   */
  static async calculateSplit(amount: number, userId: string) {
    const user = await db.get<any>('SELECT tenant_id, is_pro, subscription_tier FROM users WHERE id = ?', [userId]);
    const tenantId = user?.tenantId || 'default';

    // 1. Get Brain Pricing & Revenue Optimization
    const features = await FinancialAIService.syncUserFeatures(userId);
    const pricingBase = await PricingEngine.compute({
      userId,
      tenantId,
      demandScore: 0.5, // Default/Average
      supplyScore: 0.5,
      userGrowthRate: features.growthRate
    });

    const revenueAdj = await RevenueEngine.adjust(userId, tenantId, pricingBase);
    
    // 2. Base rate from Brain
    let rate = revenueAdj.finalFeeRate;
    
    // 3. Override with User Tier if it's better for the user
    if (user) {
      if (user.subscriptionTier === 'enterprise' && rate > 0.05) rate = 0.05;
      else if ((user.isPro || user.subscriptionTier === 'pro') && rate > 0.10) rate = 0.10;
    }

    const platformFee = Math.round(amount * rate * 100) / 100;
    const artistAmount = Math.round((amount - platformFee) * 100) / 100;

    return {
      platformFee,
      artistAmount,
      rate
    };
  }

  /**
   * AI Pricing Suggestion Engine
   */
  static suggest(basePrice: number, demand: number) {
    const multiplier = 1 + Math.log(demand + 1) * 0.1;

    return {
      suggestedPrice: basePrice * multiplier,
      confidence: 0.72,
    };
  }
}
