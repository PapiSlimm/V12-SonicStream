import { get } from '../../db.js';
import { LedgerService } from './ledger.service.js';
import { LedgerTransactionType } from '../../types.js';

export const safeBalanceUpdate = async (userId: string, amount: number, source = 'unknown', tenantId = 'default') => {
  try {
    const user = await get<{ isPro: number }>(
      'SELECT is_pro FROM users WHERE id = ?',
      [userId]
    );
    
    // Check content proof for unpaid (unless Pro)
    if (!user?.isPro) {
      const contentProof = await get<{ days: number }>(`
        SELECT (julianday('now') - julianday(MIN(created_at))) as days 
        FROM tracks 
        WHERE user_id = ? AND moderation_status = 'approved'
      `, [userId]);

      if (!contentProof?.days || contentProof.days < 60) {
        return false;
      }
    }

    // CREATE LEDGER TRANSACTION (The only way to update balance)
    await LedgerService.createBalancedTransaction({
      tenantId,
      type: LedgerTransactionType.ROYALTY,
      description: `Revenue from ${source}`,
      entries: [
        { accountType: 'USER', userId, amount },
        { accountType: 'ESCROW', amount: -amount } // Source from Escrow or Platform
      ]
    });
    
    return true;

  } catch (err) {
    console.error('Balance update failed:', err);
    return false;
  }
};
