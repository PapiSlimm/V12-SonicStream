import { db } from '../../db.js';
import { StripeService } from './stripe.service.js';
import { LedgerService } from './ledger.service.js';
import { eventBus, EVENTS } from '../../services/EventBus.js';
import { LedgerTransactionType } from '../../types.js';
import { AppError } from '../../middleware/error.js';

export class PayoutService {
  /**
   * Processes a payout request for a user
   */
  static async processPayout(userId: string, amountUSD: number) {
    const amountCents = Math.round(amountUSD * 100);
    const MIN_PAYOUT = 50.00; // $50 minimum

    if (amountUSD < MIN_PAYOUT) {
      throw new AppError(`Minimum payout is ${MIN_PAYOUT}`, 400);
    }

    const user = await db.get<{id: string, stripeAccountId: string, tenantId: string}>('SELECT id, stripe_account_id, tenant_id FROM users WHERE id = ?', [userId]);
    if (!user?.stripeAccountId) {
      throw new AppError('Artist has no connected Stripe account. Please complete onboarding.', 400);
    }

    // 1. Check Wallet Balance
    const balance = await LedgerService.getBalance(userId);
    if (balance.available < amountUSD) {
      throw new AppError('Insufficient available funds for payout', 400);
    }

    const tenantId = user.tenantId || 'default';

    try {
      // 2. Execute Stripe Transfer first (Safest for this simple model)
      // In a more complex model, we'd book it to ESCROW first.
      const transfer = await StripeService.createTransfer({
        amount: amountCents,
        destination: user.stripeAccountId,
        description: `SonicStream Payout for ${userId}`
      });

      // 3. Balanced Ledger Entry: Move from USER to PROCESSOR (since it's now sent via Stripe)
      await LedgerService.createBalancedTransaction({
        tenantId,
        type: LedgerTransactionType.PAYOUT,
        description: `Payout to Stripe account ${user.stripeAccountId}`,
        reference: transfer.id,
        entries: [
          { accountType: 'USER', userId: userId, amount: -amountUSD }, // Debit user
          { accountType: 'PROCESSOR', amount: amountUSD } // Credit processor (outflow)
        ]
      });

      // 4. Update Legacy Payout Table
      const payoutId = `pay_${Math.random().toString(36).substr(2, 9)}`;
      await db.run(
        'INSERT INTO payouts (id, user_id, amount, currency, stripe_transfer_id, status) VALUES (?, ?, ?, ?, ?, ?)',
        [payoutId, userId, amountUSD, 'USD', transfer.id, 'paid']
      );

      // 5. Emit Event
      eventBus.emit(EVENTS.PAYOUT_CREATED, { payoutId, userId, amount: amountUSD });

      return { payoutId, stripeTransferId: transfer.id };
    } catch (err: any) {
      console.error('[Payout Error]', err);
      throw new AppError(`Payout failed: ${err.message}`, 500);
    }
  }
}

