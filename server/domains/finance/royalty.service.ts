import { db } from '../../db.js';
import { LedgerService } from './ledger.service.js';
import { PricingService } from './pricing.service.js';
import { eventBus, EVENTS } from '../../services/EventBus.js';
import { LedgerTransactionType } from '../../types.js';
import { FinancialAIService } from './financial-ai.service.js';

export class RoyaltyService {
  /**
   * Process a royalty payment from a DSP statement
   */
  static async ingestRoyalty(params: {
    userId: string;
    trackId: string;
    dspId: string;
    amount: number; // Gross amount in USD
  }) {
    // 1. Calculate Split
    const { platformFee, artistAmount } = await PricingService.calculateSplit(params.amount, params.userId);
    
    // 2. Fetch User to get TenantId
    const user = await db.get<{ tenantId: string }>('SELECT tenant_id FROM users WHERE id = ?', [params.userId]);
    const tenantId = user?.tenantId || 'default';

    // 3. Register Royalty Record
    const royaltyId = `roy_${Math.random().toString(36).substr(2, 9)}`;
    await db.run(
      `INSERT INTO royalties (
        id, tenant_id, user_id, track_id, dsp_id, amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [royaltyId, tenantId, params.userId, params.trackId, params.dspId, params.amount, 'processed']
    );

    // 4. Resolve co-ownership splits and publish rights
    const splits = await db.all<any>(
      `SELECT rs.*, a.user_id 
       FROM rights_splits rs 
       JOIN artists a ON rs.artist_id = a.id 
       WHERE rs.track_id = ?`,
      [params.trackId]
    );

    const ledgerEntries: any[] = [
      { accountType: 'PROCESSOR', amount: -params.amount },
      { accountType: 'PLATFORM', amount: platformFee }
    ];

    if (splits && splits.length > 0) {
      console.log(`[RoyaltyService] Found ${splits.length} split co-owners for track: ${params.trackId}. Distributing proportionally...`);
      for (const split of splits) {
        const shareFraction = (split.ownershipShare || split.ownership_share || 100) / 100;
        const participantEarned = artistAmount * shareFraction;
        const targetUserId = split.userId || split.user_id || params.userId;

        ledgerEntries.push({
          accountType: 'USER',
          userId: targetUserId,
          amount: participantEarned
        });

        // Trigger AI updates for each co-owner
        await FinancialAIService.syncUserFeatures(targetUserId).catch(() => {});
      }
    } else {
      // Default to 100% to primary user
      ledgerEntries.push({
        accountType: 'USER',
        userId: params.userId,
        amount: artistAmount
      });
      await FinancialAIService.syncUserFeatures(params.userId);
    }

    // 5. Record Balanced Transaction
    await LedgerService.createBalancedTransaction({
      tenantId,
      type: LedgerTransactionType.ROYALTY,
      description: `Royalty Splits: ${params.dspId} statement for track ${params.trackId}`,
      reference: royaltyId,
      metadata: { trackId: params.trackId, gross: params.amount },
      entries: ledgerEntries
    });

    // 6. Emit Event
    eventBus.emit(EVENTS.ROYALTY_PROCESSED, { royaltyId, userId: params.userId, amount: params.amount });

    return { royaltyId, artistAmount, platformFee };
  }
}

