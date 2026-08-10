import { db } from '../../db.js';
import { 
  LedgerTransactionType, 
  LedgerTransactionStatus 
} from '../../types.js';

export class LedgerService {
  /**
   * Creates a balanced Ledger Transaction with multiple entries
   * A balanced transaction must summon all its entries to zero.
   */
  static async createBalancedTransaction(params: {
    tenantId: string;
    type: LedgerTransactionType;
    description: string;
    entries: {
      accountType: 'USER' | 'PLATFORM' | 'ESCROW' | 'PROCESSOR';
      userId?: string;
      amount: number; // Positive for credit, Negative for debit
    }[];
    metadata?: any;
    stripeSessionId?: string;
    reference?: string;
  }) {
    // 1. Verify Balance (Double-entry must sum to 0)
    const total = params.entries.reduce((sum, e) => sum + e.amount, 0);
    if (Math.abs(total) > 0.001) {
      throw new Error(`Ledger imbalance error: Total entries sum to ${total}, must be exactly 0.`);
    }

    const transactionId = `tx_${Math.random().toString(36).substr(2, 9)}`;
    const mainAmount = Math.abs(params.entries.find(e => e.amount > 0)?.amount || 0);

    // Get the primary user if any
    const primaryUserId = params.entries.find(e => e.userId && e.accountType === 'USER')?.userId || null;

    try {
      await db.run('BEGIN TRANSACTION');

      // 2. Create Transaction Header
      await db.run(
        `INSERT INTO ledger_transactions (
          id, tenant_id, user_id, type, amount, status, stripe_session_id, metadata, reference
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          params.tenantId,
          primaryUserId,
          params.type,
          mainAmount,
          LedgerTransactionStatus.COMPLETED,
          params.stripeSessionId || null,
          params.metadata ? JSON.stringify(params.metadata) : null,
          params.reference || null
        ]
      );

      // 3. Create Entries
      for (const entry of params.entries) {
        const entryId = `ent_${Math.random().toString(36).substr(2, 9)}`;
        await db.run(
          `INSERT INTO ledger_entries (
            id, tenant_id, transaction_id, account_type, user_id, type, amount, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entryId,
            params.tenantId,
            transactionId,
            entry.accountType,
            entry.userId || null,
            entry.amount > 0 ? 'credit' : 'debit',
            entry.amount,
            params.description
          ]
        );

        // Ensure wallet exists if needed
        if (entry.userId && entry.accountType === 'USER') {
          await this.ensureWallet(entry.userId);
        }
      }

      await db.run('COMMIT');
      return transactionId;
    } catch (err) {
      await db.run('ROLLBACK');
      console.error('[LedgerService] Failed to create balanced transaction:', err);
      throw err;
    }
  }

  static async ensureWallet(userId: string) {
    const exists = await db.get('SELECT id FROM wallets WHERE user_id = ?', [userId]);
    if (!exists) {
      const id = `wal_${Math.random().toString(36).substr(2, 9)}`;
      await db.run(
        'INSERT INTO wallets (id, user_id, currency) VALUES (?, ?, ?)',
        [id, userId, 'USD']
      );
    }
  }

  /**
   * DERIVED BALANCE: Always calculate from source of truth (Ledger)
   */
  static async getBalance(userId: string) {
    const stats = await db.get<{ available: number, pending: number }>(
      `SELECT 
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as available,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending
       FROM ledger_entries e
       JOIN ledger_transactions t ON e.transaction_id = t.id
       WHERE e.user_id = ? AND e.account_type = 'USER'`, 
      [userId]
    );

    return {
      available: stats?.available || 0,
      pending: stats?.pending || 0
    };
  }

  static async getHistory(userId: string) {
    return db.all<any>(
      `SELECT t.*, e.description, e.amount as entry_amount
       FROM ledger_transactions t 
       JOIN ledger_entries e ON t.id = e.transaction_id 
       WHERE e.user_id = ? AND e.account_type = 'USER'
       ORDER BY t.created_at DESC`,
      [userId]
    );
  }

  static async getRevenueDashboard(tenantId: string) {
    const stats = await db.get<any>(
      `SELECT 
        SUM(CASE WHEN account_type = 'USER' AND amount > 0 THEN amount ELSE 0 END) as gross_volume,
        SUM(CASE WHEN account_type = 'PLATFORM' THEN amount ELSE 0 END) as platform_revenue,
        SUM(CASE WHEN account_type = 'USER' AND amount < 0 THEN ABS(amount) ELSE 0 END) as payouts
       FROM ledger_entries 
       WHERE tenant_id = ?`,
      [tenantId]
    );

    return {
      grossVolume: stats?.grossVolume || 0,
      platformRevenue: stats?.platformRevenue || 0,
      totalPayouts: stats?.payouts || 0,
      netArtistEarnings: (stats?.grossVolume || 0) - (stats?.payouts || 0)
    };
  }
}
