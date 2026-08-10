import { Response, NextFunction } from 'express';
import { get } from '../db.js';
import { addDays, differenceInDays } from 'date-fns';
import { AuthRequest } from '../domains/identity/auth.js';
import { revenueBlockerHits } from '../monitoring.js';

const TRIAL_DAYS = 7;
const PROOF_PERIOD_DAYS = 60;

export const revenueBlocker = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return next();

  try {
    const user = await get<{ isPro: number, createdAt: string }>(
      'SELECT is_pro, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (user?.isPro) {
      return next();
    }

    // 2. Check trial period
    const trialEnd = addDays(new Date(user!.createdAt), TRIAL_DAYS);
    if (new Date() < trialEnd) {
      const daysLeft = differenceInDays(trialEnd, new Date());
      revenueBlockerHits.inc({ userType: 'free', feature: req.path });
      return res.status(403).json({
        error: `Trial period active (${daysLeft} days left). Upgrade to Pro for immediate revenue.`,
        trial_active: true,
        days_remaining: daysLeft,
        upgrade_required: true
      });
    }

    // 3. Require 60 days of approved content history
    const contentProof = await get<{ first_approval: string }>(`
      SELECT MIN(created_at) as first_approval
      FROM tracks 
      WHERE user_id = ? AND moderation_status = 'approved' AND status = 'live'
    `, [userId]);

    if (!contentProof?.firstApproval) {
      revenueBlockerHits.inc({ userType: 'free', feature: req.path });
      return res.status(403).json({
        error: 'No approved content found. Upload & get approved tracks to unlock revenue.',
        needs_approval: true,
        upgrade_required: true
      });
    }

    const daysSinceFirstApproval = differenceInDays(new Date(), new Date(contentProof.firstApproval));
    if (daysSinceFirstApproval < PROOF_PERIOD_DAYS) {
      const daysLeft = PROOF_PERIOD_DAYS - daysSinceFirstApproval;
      revenueBlockerHits.inc({ userType: 'free', feature: req.path });
      return res.status(403).json({
        error: `Need ${daysLeft} more days (${PROOF_PERIOD_DAYS} total) with approved content.`,
        proof_period_active: true,
        days_remaining: daysLeft,
        upgrade_required: true
      });
    }

    next();
  } catch (err) {
    console.error('Revenue blocker error:', err);
    return res.status(500).json({ error: 'Revenue eligibility check failed' });
  }
};
