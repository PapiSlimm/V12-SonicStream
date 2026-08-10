import { Router } from 'express';
import { authenticateToken } from '../domains/identity/auth.js';
import { db } from '../db.js';
import { AppError } from '../middleware/error.js';
import { PlatformBrain } from '../services/PlatformBrain.js';

const router = Router();

// Get recent brain decisions (Admin only)
router.get('/decisions', authenticateToken, async (req: any, res) => {
  if (req.user.user_type !== 'admin' && req.user.user_type !== 'business') {
    throw new AppError('Unauthorized access to Brain insights', 403);
  }

  const decisions = await db.all(
    'SELECT * FROM brain_decisions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.user.tenant_id]
  );

  res.json(decisions);
});

// Get Audit Logs
router.get('/audit', authenticateToken, async (req: any, res) => {
  if (req.user.user_type !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  const logs = await db.all(
     'SELECT * FROM brain_audit_logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 100',
     [req.user.tenant_id]
  );
  res.json(logs);
});

// Manual Policy Override
router.post('/override', authenticateToken, async (req: any, res) => {
  if (req.user.user_type !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  const { userId, action, reason } = req.body;
  
  const id = `log_${Math.random().toString(36).substr(2, 9)}`;
  await db.run(
    'INSERT INTO brain_audit_logs (id, tenant_id, action, actor_id, metadata) VALUES (?, ?, ?, ?, ?)',
    [id, req.user.tenant_id, `MANUAL_OVERRIDE_${action}`, req.user.id, JSON.stringify({ userId, reason })]
  );

  res.json({ success: true, message: 'Override recorded' });
});

// Sonic Intelligence Layer Endpoint
router.get('/intel', authenticateToken, async (req: any, res) => {
  const userId = req.user.id;
  const tenantId = req.user.tenant_id || 'default';

  const [pricing, marketing, growth, affiliate, revenue, recommendations] = await Promise.all([
    PlatformBrain.getPricingOptimization(userId, tenantId),
    PlatformBrain.getMarketingStrategy(userId),
    PlatformBrain.getAudienceGrowthSignals(userId),
    PlatformBrain.getAffiliateOptimization(userId),
    PlatformBrain.getRevenueForecasting(userId),
    PlatformBrain.getCreatorRecommendations(userId)
  ]);

  res.json({
    success: true,
    layer: 'Sonic Intelligence Layer',
    version: 'v12-intelligence',
    userId,
    tenantId,
    insights: {
      pricing,
      marketing,
      growth,
      affiliate,
      revenue,
      recommendations
    }
  });
});

export default router;
