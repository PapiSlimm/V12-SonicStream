import { get, run } from '../../db.js';
import { safeBalanceUpdate } from './balance.service.js';

export const processRoyaltiesWithRecoupment = async (userId: number, royaltyAmount: number, source: string) => {
  const advance = await get<{ id: number, recoupment_rate: number, balance_remaining: number }>(`
    SELECT * FROM advances 
    WHERE user_id = ? AND recoupable = 1 AND balance_remaining > 0
    ORDER BY created_at ASC LIMIT 1
  `, [userId]);

  if (advance) {
    const recoupRate = advance.recoupment_rate / 100;
    const recoupAmount = Math.min(royaltyAmount * recoupRate, advance.balance_remaining);
    
    await run(`
      INSERT INTO recoupment_transactions (advance_id, royalty_amount, recouped_amount, remaining_balance)
      VALUES (?, ?, ?, ? - ?)
    `, [advance.id, royaltyAmount, recoupAmount, advance.balance_remaining, recoupAmount]);
    
    await run(`
      UPDATE advances 
      SET balance_remaining = balance_remaining - ? 
      WHERE id = ?
    `, [recoupAmount, advance.id]);
    
    const artistShare = royaltyAmount - recoupAmount;
    await safeBalanceUpdate(String(userId), artistShare, `${source}_post_recoup`);
    
  } else {
    await safeBalanceUpdate(String(userId), royaltyAmount, source);
  }
};
