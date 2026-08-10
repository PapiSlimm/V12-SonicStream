import { Router } from 'express';
import { authenticateToken } from '../identity/auth.js';
import { LedgerService } from './ledger.service.js';
import { RoyaltyService } from './royalty.service.js';
import { FinancialAIService } from './financial-ai.service.js';
import { AppError } from '../../middleware/error.js';
import { db } from '../../db.js';
import { z } from 'zod';

const router = Router();

// Get balance for user
router.get('/balance', authenticateToken, async (req: any, res) => {
  const balance = await LedgerService.getBalance(req.user.id);
  res.json({ balance: balance.available, pending: balance.pending });
});

// Get AI financial features for user
router.get('/ai-features', authenticateToken, async (req: any, res) => {
  // Sync before fetching to ensure matrix is calibrated
  const features = await FinancialAIService.syncUserFeatures(req.user.id);
  res.json(features);
});

// Get ledger history
router.get('/entries', authenticateToken, async (req: any, res) => {
  const history = await LedgerService.getHistory(req.user.id);
  res.json(history);
});

// Manual clearance of pending funds (Simulation tool)
router.post('/clear-funds', authenticateToken, async (req: any, res) => {
  await RoyaltyService.clearPendingRoyalties(req.user.id);
  res.json({ status: 'FUNDS_CLEARED' });
});

// Admin/Platform Dashboard Stats
router.get('/dashboard', authenticateToken, async (req: any, res) => {
  if (req.user.userType !== 'admin' && req.user.userType !== 'business') {
    throw new AppError('Unauthorized access to dashboard matrix', 403);
  }
  const stats = await LedgerService.getRevenueDashboard(req.user.tenantId);
  res.json(stats);
});

// Simulate monthly distribution (Admin only)
router.post('/simulate-payouts', authenticateToken, async (req: any, res) => {
  if (req.user.userType !== 'admin') {
    throw new AppError('Only admins can simulate payouts', 403);
  }
  await RoyaltyService.simulateMonthlyDistribution();
  res.json({ status: 'SIMULATION_COMPLETE' });
});

// Configure split ownership and publishing percentages
router.post('/splits', authenticateToken, async (req: any, res) => {
  const { trackId, splits } = z.object({
    trackId: z.string(),
    splits: z.array(z.object({
      artistId: z.string(),
      ownershipShare: z.number().min(0).max(100),
      publishingShare: z.number().min(0).max(100).optional(),
      mechanicalShare: z.number().min(0).max(100).optional(),
      neighboringShare: z.number().min(0).max(100).optional(),
    }))
  }).parse(req.body);

  // Clear existing splits for this track
  await db.run('DELETE FROM rights_splits WHERE track_id = ?', [trackId]);

  // Insert updated splits
  for (const split of splits) {
    const id = `spl_${Math.random().toString(36).substr(2, 9)}`;
    await db.run(
      `INSERT INTO rights_splits (
        id, track_id, artist_id, ownership_share, publishing_share, mechanical_share, neighboring_share
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        trackId, 
        split.artistId, 
        split.ownershipShare, 
        split.publishingShare ?? 100.0, 
        split.mechanicalShare ?? 100.0, 
        split.neighboringShare ?? 100.0
      ]
    );
  }

  res.json({ success: true, message: 'Rights and royalty ownership splits declared successfully.' });
});

// Retrieve split shares for a track
router.get('/splits/:trackId', authenticateToken, async (req: any, res) => {
  const splits = await db.all('SELECT * FROM rights_splits WHERE track_id = ?', [req.params.trackId]);
  res.json(splits);
});

export default router;
