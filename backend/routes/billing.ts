// backend/routes/billing.ts
import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.ts';
import { getSubscriptionStatus, updateSubscription } from '../services/billingService.ts';

const router = express.Router();

router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const status = await getSubscriptionStatus(req.user!.id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status.' });
  }
});

router.post('/subscribe', authenticateToken, async (req: AuthRequest, res) => {
  const { plan } = req.body;
  try {
    const sub = await updateSubscription(req.user!.id, plan, 'active');
    res.json(sub);
  } catch (error) {
    res.status(500).json({ error: 'Subscription failed.' });
  }
});

export default router;
