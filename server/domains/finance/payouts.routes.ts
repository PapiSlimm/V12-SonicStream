import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../identity/auth.js';
import { all, get, run } from '../../db.js';
import { AppError } from '../../middleware/error.js';
import { z } from 'zod';

const router = Router();

const payoutSchema = z.object({
  amount: z.number().positive(),
  method: z.string().min(1),
});

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  const payouts = await all('SELECT * FROM payouts WHERE user_id = ? ORDER BY created_at DESC', [req.user?.id]);
  res.json(payouts);
});

router.post('/request', authenticateToken, async (req: AuthRequest, res) => {
  const validated = payoutSchema.parse(req.body);
  const { amount } = validated;

  const user = await get<{ balance: number; payoutThreshold: number }>('SELECT balance, payout_threshold as payoutThreshold FROM users WHERE id = ?', [req.user?.id]);
  if (!user) throw new AppError('User not found', 404);
  
  if (user.balance < amount) {
    throw new AppError('Insufficient balance', 400);
  }

  if (amount < (user.payoutThreshold || 10)) {
    throw new AppError(`Minimum payout amount is $${user.payoutThreshold || 10}`, 400);
  }

  // 1. Create payout record
  const result = await run(
    'INSERT INTO payouts (user_id, amount, status) VALUES (?, ?, ?)',
    [req.user?.id, amount, 'pending']
  );

  // 2. Deduct from balance
  await run('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, req.user?.id]);

  res.json({ id: result.lastID, status: 'pending', amount });
});

export default router;
