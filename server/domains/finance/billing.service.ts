import { db } from '../../db.js';
import { LedgerService } from './ledger.service.js';
import { FraudService } from '../../services/FraudService.js';
import { FinancialAIService } from './financial-ai.service.js';
import { IdempotencyService } from '../../services/IdempotencyService.js';
import { eventBus, EVENTS } from '../../services/EventBus.js';
import { LedgerTransactionType } from '../../types.js';
import { AppError } from '../../middleware/error.js';

export class BillingService {
  /**
   * Creates a checkout session (Simulated)
   */
  static async createCheckoutSession(_userId: string, params: {
    productId: string;
    amount: number;
    description: string;
  }) {
    const sessionId = `cs_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[BillingService] Creating session for product ${params.productId}`);
    
    return {
      sessionId,
      url: `/checkout/simulated?session_id=${sessionId}`
    };
  }

  /**
   * Handles successful payment webhook
   */
  static async handleSuccessfulPayment(stripeSessionId: string) {
    return await IdempotencyService.runIdempotent(`billing_payment_${stripeSessionId}`, async () => {
      // 1. Fetch session data (Simulated metadata lookup)
      const sessionData = {
        userId: 'user_123', 
        amount: 49.99,
        description: 'SonicStream Pro Subscription',
        tenantId: 'default'
      };

      const user = await db.get('SELECT tenant_id FROM users WHERE id = ?', [sessionData.userId]);
      const tenantId = user?.tenant_id || sessionData.tenantId;

      // 2. Record in Balanced Ledger
      // Money moves from PROCESSOR (Stripe) to PLATFORM for subscriptions
      await LedgerService.createBalancedTransaction({
        tenantId,
        type: LedgerTransactionType.PAYMENT,
        description: sessionData.description,
        stripeSessionId: stripeSessionId,
        entries: [
          { accountType: 'PROCESSOR', amount: -sessionData.amount },
          { accountType: 'PLATFORM', amount: sessionData.amount }
        ]
      });

      // Sync AI features after payment
      await FinancialAIService.syncUserFeatures(sessionData.userId);

      // 3. Emit Event
      eventBus.emit(EVENTS.PAYMENT_SUCCEEDED, { stripeSessionId, userId: sessionData.userId, amount: sessionData.amount });

      return { status: 'completed' };
    });
  }

  /**
   * Initiates a Payout
   */
  static async initiatePayout(userId: string, amount: number) {
    const user = await db.get('SELECT id, tenant_id, stripe_account_id FROM users WHERE id = ?', [userId]);
    if (!user) throw new AppError('User not found', 404);

    const tenantId = user.tenant_id || 'default';

    // 1. Sync & Get AI Decision
    await FinancialAIService.syncUserFeatures(userId);
    const aiDecision = await FinancialAIService.evaluatePayout(userId);

    if (aiDecision.decision === 'BLOCK') {
       await FraudService.logFraudSignal(userId, tenantId, 'AI_BLOCK', 100, { amount, reason: aiDecision.reason });
       throw new AppError(`Payout blocked by AI intelligence system: ${aiDecision.reason}`, 403);
    }

    // 2. Balance Check
    const balance = await LedgerService.getBalance(userId);
    if (balance.available < amount) {
      throw new AppError('Insufficient available funds', 400);
    }

    // 3. Balanced Transaction
    const transactionId = await LedgerService.createBalancedTransaction({
      tenantId,
      type: LedgerTransactionType.PAYOUT,
      description: `Direct Payout (AI Strategy: ${aiDecision.decision}, Delay: ${aiDecision.delayDays}d)`,
      entries: [
        { accountType: 'USER', userId, amount: -amount },
        { accountType: 'PROCESSOR', amount: amount }
      ]
    });

    // 4. Emit Event with Payout Strategy
    eventBus.emit(EVENTS.PAYOUT_CREATED, { 
      userId, 
      amount, 
      transactionId, 
      aiDecision 
    });
    
    return { 
      transactionId, 
      status: aiDecision.decision === 'HOLD' ? 'pending_review' : 'initiated',
      aiReason: aiDecision.reason,
      payoutDelay: aiDecision.delayDays
    };
  }
}

