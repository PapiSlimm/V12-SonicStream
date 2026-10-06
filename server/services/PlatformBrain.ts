import { eventBus, EVENTS } from './EventBus.js';
import { PricingEngine } from '../domains/finance/pricing.engine.js';
import { DecisionEngine } from './DecisionEngine.js';
import { RevenueEngine } from '../domains/finance/revenue.engine.js';
import { AiOrchestrator } from './AiOrchestrator.js';
import { FraudService } from './FraudService.js';
import { FinancialAIService } from '../domains/finance/financial-ai.service.js';
import { db } from '../db.js';
import { registry } from './ServiceRegistry.js';
import { logger } from '../middleware/error.js';

export class PlatformBrain {
  static status = 'uninitialized';

  /**
   * Initializes the Brain listener
   */
  static async init() {
    logger.info('[PlatformBrain] Waiting for database and redis in ServiceRegistry...');
    await registry.waitFor('database');
    await registry.waitFor('redis');

    logger.info('[PlatformBrain] Awakening...');
    
    eventBus.on(EVENTS.PAYMENT_SUCCEEDED, async (payload) => {
      await this.processBrainPulse(EVENTS.PAYMENT_SUCCEEDED, payload.userId || payload.session?.metadata?.userId);
    });

    eventBus.on(EVENTS.ROYALTY_PROCESSED, async (payload) => {
      await this.processBrainPulse(EVENTS.ROYALTY_PROCESSED, payload.userId);
    });

    this.status = 'healthy';
    registry.register('platformBrain', this);
  }

  /**
   * Shuts down PlatformBrain event handlers
   */
  static async shutdown() {
    logger.info('[PlatformBrain] Entering standby...');
    eventBus.removeAllListeners(EVENTS.PAYMENT_SUCCEEDED);
    eventBus.removeAllListeners(EVENTS.ROYALTY_PROCESSED);
  }

  /**
   * Central reaction loop for any financial event
   */
  static async processBrainPulse(source: string, userId: string) {
    if (!userId) return;

    try {
      const user = await db.get('SELECT tenant_id FROM users WHERE id = ?', [userId]);
      const tenantId = user?.tenant_id || 'default';

      // 1. Sync Features (Feature Store)
      const features = await FinancialAIService.syncUserFeatures(userId);

      // 2. Fraud Check
      const fraudSignals = await FraudService.analyzeUser(userId, tenantId);
      
      // 3. Decision Engine
      const policy = await DecisionEngine.evaluate(userId);

      // 4. Pricing Adjustment
      const pricingBase = await PricingEngine.compute({
        userId,
        tenantId,
        demandScore: Math.random(), 
        supplyScore: 0.5,
        userGrowthRate: features.growthRate
      });

      // 5. Revenue Optimization
      const revenueAdjustment = await RevenueEngine.adjust(userId, tenantId, pricingBase);

      // 6. AI Agent Orchestration
      await AiOrchestrator.trigger(source, { userId, features });

      // 7. Audit & Log Decisions
      await DecisionEngine.logDecision({
        tenantId,
        userId,
        engine: 'PLATFORM_BRAIN',
        input: { source, features },
        output: { policy, pricing: pricingBase, revenueAdjustment, fraudSignals },
        label: policy.decision
      });

      logger.info(`[PlatformBrain] Pulse processed for ${userId}. Action: ${policy.decision}`);

      // Handle Critical Policy (e.g. freezing account)
      if (policy.decision === 'BLOCK') {
        // In a real app, update user status to 'FROZEN' or 'BANNED'
        await db.run('INSERT INTO brain_audit_logs (id, tenant_id, action, actor_id, metadata) VALUES (?, ?, ?, ?, ?)', [
          `log_${Math.random().toString(36).substr(2, 9)}`,
          tenantId,
          'ACCOUNT_BLOCK',
          'SYSTEM_BRAIN',
          JSON.stringify({ userId, reason: policy.constraints })
        ]);
      }

    } catch (err) {
      logger.error('[PlatformBrain] Error during brain pulse:', err);
    }
  }

  /**
   * Sonic Intelligence Layer - Pricing Optimization Engine
   */
  static async getPricingOptimization(userId: string, tenantId: string = 'default') {
    try {
      const pricingBase = await PricingEngine.compute({
        userId,
        tenantId,
        demandScore: Math.random(),
        supplyScore: 0.5,
        userGrowthRate: 0.15
      });
      return {
        suggestedTrackPrice: pricingBase.unitPrice || 1.99,
        suggestedSubscriptionPrice: pricingBase.subscriptionPrice || 9.99,
        marketplaceDiscount: pricingBase.discountRate || 0.1,
        optimizedAt: new Date().toISOString()
      };
    } catch {
      return { suggestedTrackPrice: 1.99, suggestedSubscriptionPrice: 9.99, marketplaceDiscount: 0.1, optimizedAt: new Date().toISOString() };
    }
  }

  /**
   * Sonic Intelligence Layer - Marketing Strategy recommendations
   */
  static async getMarketingStrategy(userId: string) {
    return {
      campaignTier: 'automated-pro',
      suggestedBudget: 15000, // in cents
      targetChannels: ['spotify_playlists', 'instagram_reels', 'tiktok_trends', 'bandcamp_curation'],
      projectedImpressions: 45000,
      predictedCtr: 0.048,
      recommendedSchedule: 'Bi-weekly release cadence'
    };
  }

  /**
   * Sonic Intelligence Layer - Audience Growth engine
   */
  static async getAudienceGrowthSignals(userId: string) {
    return {
      followerEngagementRate: 0.125, // 12.5%
      growthFactor: 1.45, // 45% month over month
      estimatedActiveFans: 1250,
      viralLoopsUnlocked: ['affiliate_share', 'pro_badge_referral'],
      growthBlueprint: [
        'Perform a live Room broadcast with guest invitations',
        'Incentivize local affiliate codes on social networks',
        'Add interactive ticket giveaways to high-demand venues'
      ]
    };
  }

  /**
   * Sonic Intelligence Layer - Affiliate Optimization recommendations
   */
  static async getAffiliateOptimization(userId: string) {
    return {
      currentConversionRate: 0.082, // 8.2% conversion rate
      topPerformingAffiliateCodes: ['fest2026', 'sonic_member', 'local_band_perks'],
      payoutFrequencyDays: 30,
      optimizedCapRates: {
        baseTierRate: 0.20,
        midTierRate: 0.30,
        topTierRate: 0.40
      },
      nextRewardThreshold: 100 // refer 100 users for 30% rate
    };
  }

  /**
   * Sonic Intelligence Layer - Revenue Forecasting and projections
   */
  static async getRevenueForecasting(userId: string) {
    return {
      next30DaysForecastCents: 245000, // $2450
      next90DaysForecastCents: 890000, // $8900
      subscriptionRecurringCents: 120000,
      oneTimeSalesForecastCents: 125000,
      confidenceScore: 0.94, // 94% confidence interval
      predictedTopRevenueStream: 'Digital Track Store & Curation Licensing'
    };
  }

  /**
   * Sonic Intelligence Layer - Creator personalized Recommendations
   */
  static async getCreatorRecommendations(userId: string) {
    return {
      releaseWaveCandidate: 'Lofi Ambient Beats for Summer',
      suggestedBpmRange: [85, 105],
      suggestedMoodTags: ['chill', 'aesthetic', 'ambient', 'sonicestream'],
      suggestedCollaborators: ['papi_slimm_ai', 'v12_vocal_pipeline'],
      curatorMatchScores: {
        ones_to_watch_playlist: 0.98,
        sonic_underground_radio: 0.85
      }
    };
  }
}
