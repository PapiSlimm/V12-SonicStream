import { db } from '../../db.js';
import { LedgerService } from './ledger.service.js';
import { LedgerTransactionType } from '../../types.js';

export class CommerceService {
  /**
   * Calculates platform fee deductions and net earnings for a marketplace transaction,
   * then securely commits a balanced multi-entry transaction to the ledger.
   * 
   * Account roles mapping:
   *  - PROCESSOR is debited the gross transaction amount (funds flowing into the gateway)
   *  - PLATFORM is credited the derived platform fee revenue
   *  - USER (vendor/artist) is credited the net earnings
   */
  static async recordMarketplaceTransaction(params: {
    tenantId?: string;
    buyerId: string;
    sellerId: string;
    productId: string;
    productName: string;
    grossAmount: number;
    platformFeeRate?: number;
    stripeSessionId?: string;
  }) {
    const tenantId = params.tenantId || 'default';
    
    // Resolve platform fee rate from tenant permission policy profile or use default 10%
    let feeRate = params.platformFeeRate;
    if (feeRate === undefined) {
      const policy = await db.get<{ customPayoutRate?: number }>(
        'SELECT custom_payout_rate as customPayoutRate FROM tenant_permissions WHERE id = ?',
        [tenantId]
      );
      if (policy && policy.customPayoutRate !== undefined && policy.customPayoutRate !== null) {
        // Platform fee is the inverse of the artist payout rate
        feeRate = Math.max(0, 1 - policy.customPayoutRate);
      } else {
        feeRate = 0.10; // Standard 10% Platform fee fallback
      }
    }

    const platformFee = Math.round(params.grossAmount * feeRate * 100) / 100;
    const netEarnings = Math.round((params.grossAmount - platformFee) * 100) / 100;

    // Secure double-entry record balancing to zero
    await LedgerService.createBalancedTransaction({
      tenantId,
      type: LedgerTransactionType.PAYMENT,
      description: `Marketplace Purchase: ${params.productName} (Gross: $${params.grossAmount}, Fee: $${platformFee})`,
      stripeSessionId: params.stripeSessionId,
      metadata: {
        productId: params.productId,
        buyerId: params.buyerId,
        sellerId: params.sellerId,
        grossAmount: params.grossAmount,
        platformFee,
        netEarnings,
        feeRate
      },
      entries: [
        { accountType: 'PROCESSOR', amount: -params.grossAmount }, // Debit Processor holding the payment gate
        { accountType: 'USER', userId: params.sellerId, amount: netEarnings }, // Credit creator net earnings wallet
        { accountType: 'PLATFORM', amount: platformFee } // Credit platform direct fee revenue
      ]
    });

    return {
      platformFee,
      netEarnings,
      feeRate
    };
  }
}
