import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, authenticateAdmin, AuthRequest } from '../domains/identity/auth.js';
import { AppError } from '../middleware/error.js';
import { requestMarketingTools, listRmpmRequests, listMarketingAssets } from '../ecosystem/rmpm-client.js';

/**
 * SonicStream ↔ R.M.P.M marketing control surface.
 * Every request to RMPM mandates a deep dive (enforced in the client).
 */
const router = Router();

const requestSchema = z.object({
  task: z.string().min(3).max(2000),
  context: z.any().optional(),
});

// POST /api/rmpm/request — ask RMPM for the marketing tools to accomplish a task.
router.post('/request', authenticateToken, async (req: AuthRequest, res) => {
  const { task, context } = requestSchema.parse(req.body);
  const result = await requestMarketingTools({ task, context, userId: req.user?.id?.toString() });
  // deepDive is always true; surface it explicitly in the response.
  res.json(result);
});

// GET /api/rmpm/requests — sent requests + delivery/answer status (admin).
router.get('/requests', authenticateAdmin, async (req, res) => {
  const limit = parseInt(String(req.query.limit)) || 50;
  res.json({ requests: await listRmpmRequests(limit) });
});

// GET /api/rmpm/inbound — marketing data RMPM sent back, to market & promote with.
router.get('/inbound', authenticateToken, async (req, res) => {
  const limit = parseInt(String(req.query.limit)) || 50;
  res.json({ assets: await listMarketingAssets(limit) });
});

export default router;
