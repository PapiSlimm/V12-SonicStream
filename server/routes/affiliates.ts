import { Router } from 'express';
import { all, run, get } from '../db.js';
import { authenticateToken, AuthRequest } from '../domains/identity/auth.js';
import { z } from 'zod';

const router = Router();

// Zod schemas for validation
const registerAffiliateSchema = z.object({
  code: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Code can only contain alphanumeric characters, hyphens, and underscores'),
  payoutAddress: z.string().optional(),
  tenantId: z.string().optional(),
});

const logReferralSchema = z.object({
  code: z.string(),
  referredUserId: z.string(),
  subscriptionTier: z.string(),
  tenantId: z.string().optional(),
});

// Calculate tiered rate based on referral count
// 20% base, 30% after 200 users, 40% after 500 users
export function calculateTierRate(referralCount: number): number {
  if (referralCount > 500) {
    return 0.40; // 40%
  } else if (referralCount > 200) {
    return 0.30; // 30%
  }
  return 0.20; // 20%
}

// 1) Get current affiliate account info for logged-in user
router.get('/account', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const affiliate = await get('SELECT * FROM affiliates WHERE userId = ?', [userId]);

    if (!affiliate) {
      return res.json({ registered: false });
    }

    const referralCount = (affiliate as any).referralCount || 0;
    const currentRate = calculateTierRate(referralCount);

    res.json({
      registered: true,
      id: (affiliate as any).id,
      code: (affiliate as any).code,
      referralCount,
      earningsCents: (affiliate as any).earningsCents || 0,
      payoutAddress: (affiliate as any).payoutAddress || '',
      currentRate,
      createdAt: (affiliate as any).created_at,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2) Register as an affiliate
router.post('/register', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { code, payoutAddress, tenantId } = registerAffiliateSchema.parse(req.body);

    // Check if code is already taken
    const existing = await get('SELECT id FROM affiliates WHERE code = ?', [code]);
    if (existing) {
      return res.status(400).json({ error: 'Referral code already taken' });
    }

    const userExistingAffiliate = await get('SELECT id FROM affiliates WHERE userId = ?', [userId]);
    if (userExistingAffiliate) {
      return res.status(400).json({ error: 'User is already registered as an affiliate' });
    }

    const id = `aff_${Math.random().toString(36).substr(2, 9)}`;
    const effectiveTenantId = tenantId || req.user!.tenantId || 'default-tenant';

    await run(
      `INSERT INTO affiliates (id, tenantId, userId, code, referralCount, earningsCents, payoutAddress)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, effectiveTenantId, userId, code.toLowerCase(), 0, 0, payoutAddress || null]
    );

    res.status(211).json({
      id,
      code: code.toLowerCase(),
      referralCount: 0,
      earningsCents: 0,
      payoutAddress,
      currentRate: 0.20,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 3) Retrieve list of referrals brought in by this affiliate
router.get('/referrals', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const affiliate = await get('SELECT id FROM affiliates WHERE userId = ?', [userId]);
    if (!affiliate) {
      return res.status(400).json({ error: 'Not registered as an affiliate' });
    }

    const list = await all(
      `SELECT r.*, u.name as referred_user_name, u.email as referred_user_email 
       FROM referrals r
       JOIN users u ON r.referredUserId = u.id
       WHERE r.affiliateId = ?
       ORDER BY r.created_at DESC`,
      [(affiliate as any).id]
    );

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4) Track subscription commission trigger (simulated subscription checkout webhook)
router.post('/commission-trigger', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { code, referredUserId, subscriptionTier, tenantId } = logReferralSchema.parse(req.body);

    const affiliate = await get('SELECT * FROM affiliates WHERE code = ?', [code.toLowerCase()]);
    if (!affiliate) {
      return res.status(404).json({ error: 'Affiliate code not found' });
    }

    const aff = affiliate as any;

    // Check if already referred
    const isReferred = await get('SELECT id FROM referrals WHERE referredUserId = ?', [referredUserId]);
    if (isReferred) {
      return res.status(400).json({ error: 'User already referred or registered' });
    }

    const refId = `ref_${Math.random().toString(36).substr(2, 9)}`;
    const effectiveTenant = tenantId || aff.tenantId || 'default-tenant';

    // 1) Log the referral link
    await run(
      `INSERT INTO referrals (id, tenantId, affiliateId, referredUserId, status, subscriptionTier)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [refId, effectiveTenant, aff.id, referredUserId, 'active', subscriptionTier]
    );

    // 2) Increment referral counter
    const newCount = aff.referralCount + 1;
    await run('UPDATE affiliates SET referralCount = ? WHERE id = ?', [newCount, aff.id]);

    // 3) Calculate commission based on subscription cost
    // Let's assume standard subscription costs: creator: $10, pro: $29, visionary: $99, enterprise: $299
    let subPriceCents = 0;
    if (subscriptionTier === 'creator') subPriceCents = 1000;
    else if (subscriptionTier === 'pro') subPriceCents = 2900;
    else if (subscriptionTier === 'visionary') subPriceCents = 9900;
    else if (subscriptionTier === 'enterprise') subPriceCents = 29900;

    const rate = calculateTierRate(newCount);
    const amountCents = Math.round(subPriceCents * rate);

    if (amountCents > 0) {
      const commissionId = `comm_${Math.random().toString(36).substr(2, 9)}`;
      const mockPaymentId = `sub_pay_${Math.random().toString(36).substr(2, 12)}`;

      await run(
        `INSERT INTO affiliate_commissions (id, tenantId, affiliateId, referredUserId, amountCents, subscriptionPaymentId, payoutStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [commissionId, effectiveTenant, aff.id, referredUserId, amountCents, mockPaymentId, 'pending']
      );

      // 4) Add earnings to affiliate totals
      const newEarnings = aff.earningsCents + amountCents;
      await run('UPDATE affiliates SET earningsCents = ? WHERE id = ?', [newEarnings, aff.id]);
    }

    res.json({ success: true, count: newCount, commissionEarntCents: amountCents });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 5) Get commission transactions for the logged in user
router.get('/commissions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const affiliate = await get('SELECT id FROM affiliates WHERE userId = ?', [userId]);
    if (!affiliate) {
      return res.status(400).json({ error: 'Not registered as an affiliate' });
    }

    const list = await all(
      `SELECT ac.*, u.name as referred_user_name 
       FROM affiliate_commissions ac
       JOIN users u ON ac.referredUserId = u.id
       WHERE ac.affiliateId = ?
       ORDER BY ac.created_at DESC`,
      [(affiliate as any).id]
    );

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Click and Conversion Tracker with Attribution Settings (30, 60, 90 day windows)
router.post('/clicks/track', async (req, res) => {
  try {
    const { code, source, referralUrl, attributionDays } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Affiliate code is required' });
    }

    const affiliate = await get('SELECT id, referralCount FROM affiliates WHERE code = ?', [code.toLowerCase()]);
    if (!affiliate) {
      return res.status(404).json({ error: 'Affiliate code does not exist' });
    }

    const trackingId = 'clk_' + Math.random().toString(36).substring(2, 11);
    const windowDays = attributionDays || 30; // standard 30, 60, 90 days

    // Generate response tracking the click with attribution details
    res.json({
      success: true,
      trackingId,
      code: code.toLowerCase(),
      source: source || 'direct',
      referralUrl: referralUrl || '',
      attributionWindow: `${windowDays} days`,
      expiresAt: new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fraud detection: Prevent self-referrals and multi-accounting duplicate creation
router.post('/fraud-check', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { code, targetEmail } = req.body;

    const affiliate = await get('SELECT userId FROM affiliates WHERE code = ?', [code.toLowerCase()]);
    if (!affiliate) {
      return res.status(404).json({ error: 'Affiliate code not found' });
    }

    // 1. Self-referral protection check
    const isSelfReferral = (affiliate as any).userId === userId;
    
    // 2. Multi-accounting dummy referral check (using matching targetEmail or standard IPs)
    const activeUser = await get<{ email: string }>('SELECT email FROM users WHERE id = ?', [userId]);
    const isDuplicateAccount = activeUser && targetEmail && activeUser.email.toLowerCase() === targetEmail.toLowerCase();

    const fraudThreatScore = isSelfReferral ? 95 : (isDuplicateAccount ? 80 : 0);
    const fraudFlagged = fraudThreatScore >= 70;

    res.json({
      success: true,
      code,
      userId,
      isSelfReferral,
      isDuplicateAccount,
      fraudThreatScore,
      fraudFlagged,
      recommendation: fraudFlagged ? 'BLOCK_COMMISSION' : 'ALLOW_SUBSCRIBER'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
