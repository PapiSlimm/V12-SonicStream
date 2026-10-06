import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../domains/identity/auth.js';
import { run, get } from '../db.js';
import { AppError } from '../middleware/error.js';

const router = Router();

// 1. GET CREDIT BALANCE
router.get('/balance', authenticateToken, async (req: AuthRequest, res) => {
  const user = await get<{ credits: number }>('SELECT credits FROM users WHERE id = ?', [req.user?.id]);
  res.json({ balance: user?.credits || 0 });
});

// 2. CONSUME CREDITS
router.post('/consume', authenticateToken, async (req: AuthRequest, res) => {
  const { amount, service } = req.body;
  if (!amount || amount <= 0) throw new AppError('Invalid credit amount', 400);

  const user = await get<{ credits: number }>('SELECT credits FROM users WHERE id = ?', [req.user?.id]);
  if (!user || user.credits < amount) {
    throw new AppError('Insufficient credits. Please Top-up.', 402);
  }

  await run('UPDATE users SET credits = credits - ? WHERE id = ?', [amount, req.user?.id]);
  
  await run('INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)', 
    [req.user?.id, -amount, 'consumption', `Used for ${service}`]);

  res.json({ success: true, remaining: user.credits - amount });
});

// 3. GET CREDIT PACKAGES
router.get('/packages', async (req, res) => {
  res.json([
    { id: '10_credits', name: 'Lite Pack', credits: 10, price: 49 },
    { id: '50_credits', name: 'Creator Pack', credits: 50, price: 199 },
    { id: '100_credits', name: 'Sonic Pro Pack', credits: 100, price: 349 },
  ]);
});

// 4. ADMIN: ADD CREDITS
router.post('/admin/add', authenticateToken, async (req: AuthRequest, res) => {
  // Check if admin inside user_type (using the camelCase version I introduced in server/auth.ts)
  if (req.user?.userType !== 'admin') throw new AppError('Admin only', 403);

  const { userId, amount, reason } = req.body;
  await run('UPDATE users SET credits = credits + ? WHERE id = ?', [amount, userId]);
  await run('INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)', 
    [userId, amount, 'purchase', reason || 'Admin bonus']);

  res.json({ success: true });
});

export default router;
