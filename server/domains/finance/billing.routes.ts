import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../identity/auth.js';
import { run, get, isPostgres } from '../../db.js';
import { AppError } from '../../middleware/error.js';
import { config } from '../../config.js';
import { StripeService } from './stripe.service.js';
import { LedgerService } from './ledger.service.js';
import { DynamicPricingService, PricingContext } from './dynamic-pricing.service.js';

const router = Router();

// Middleware to fail fast if Stripe is unconfigured or dummy keys are in use
router.use((req, res, next) => {
  if (!config.STRIPE_SECRET_KEY || config.STRIPE_SECRET_KEY.startsWith('dummy') || config.STRIPE_SECRET_KEY.toLowerCase().includes('dummy')) {
    throw new Error('STRIPE_SECRET_KEY is required. Set it in .env as a valid Stripe API key.');
  }
  next();
});

// ── Dynamic demand score (real) ───────────────────────────────────────────────

async function getDemandScore(artistId: string): Promise<number> {
  // Count bookings in the past 7 days as a demand proxy.
  // Replace with a more sophisticated signal (views, plays, wishlist) as the
  // platform grows.
  const row = await get<{ count: number }>(
    `SELECT COUNT(*) AS count FROM bookings
     WHERE artist_id = ? AND created_at > ${isPostgres() ? "(NOW() - INTERVAL '7 days')" : "datetime('now', '-7 days')"}`,
    [artistId]
  );
  const bookings = row?.count ?? 0;
  // Normalise: 0 bookings = 1.0 (baseline), 10+ bookings = 2.0 (peak surge)
  return Math.min(2.0, 1.0 + bookings / 10);
}

// ── 1. Booking checkout ───────────────────────────────────────────────────────

router.post('/booking/checkout', authenticateToken, async (req: AuthRequest, res) => {
  const { artistId, amount } = req.body; // amount in cents
  if (!amount || amount < 500) throw new AppError('Minimum booking is $5', 400);

  const artist = await get<any>(
    'SELECT id, email, stripe_account_id, loyalty_score FROM users WHERE id = ?',
    [artistId]
  );
  if (!artist) throw new AppError('Artist not found', 404);

  const demandScore = await getDemandScore(artistId);

  const ctx: PricingContext = {
    userId:        req.user?.id ?? '',
    role:          'buyer',
    demandScore,
    supplyScore:   1.0,
    loyaltyScore:  artist.loyalty_score ?? 0.5,
    fraudRiskScore: 0.1,
  };

  const feePercentage = DynamicPricingService.calculateMarketplaceFee(ctx);
  const platformFee   = Math.round(amount * feePercentage);

  const session = await StripeService.createCheckoutSession({
    amount,
    currency: 'usd',
    artistStripeAccountId: artist.stripe_account_id,
    platformFee,
    metadata: { userId: req.user!.id, artistId, type: 'booking' },
    successUrl: `${config.APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl:  `${config.APP_URL}/booking/cancel`,
  });

  res.json({ url: session.url });
});

// ── 2. Booking success callback ───────────────────────────────────────────────
// Verifies the session directly with Stripe instead of trusting query params.

router.get('/booking/success', authenticateToken, async (req: AuthRequest, res) => {
  const { session_id } = req.query;
  if (!session_id) throw new AppError('Missing session_id', 400);

  const session = await StripeService.retrieveCheckoutSession(session_id as string);
  const totalAmount = (session.amount_total ?? 0) / 100;
  const platformFee = (session.metadata as any)?.platformFee
    ? parseInt((session.metadata as any).platformFee, 10) / 100
    : totalAmount * 0.12;
  const artistId = (session.metadata as any)?.artistId;
  const artistAmount = totalAmount - platformFee;

  await LedgerService.recordTransaction({
    type: 'BOOKING_PAYMENT',
    amount: totalAmount,
    entries: [
      { account: 'PROCESSOR_CLEARING', amount: totalAmount, direction: 'DEBIT' },
      { account: 'PLATFORM_REVENUE', amount: platformFee, direction: 'CREDIT' },
      { account: `USER_BALANCE_${artistId ?? ''}`, amount: artistAmount, direction: 'CREDIT' },
    ],
    metadata: { buyerId: req.user?.id, artistId, sessionId: session_id },
  });

  res.json({ success: true, message: 'Booking payment recorded' });
});

// ── 3. Subscription checkout ──────────────────────────────────────────────────

const TIER_PRICE_IDS: Record<string, string | undefined> = {
  pro_monthly:  config.STRIPE_PRICE_PRO_MONTHLY,
  pro_annual:   config.STRIPE_PRICE_PRO_ANNUAL,
  enterprise:   config.STRIPE_PRICE_ENTERPRISE,
  pro:          config.STRIPE_PRICE_PRO_MONTHLY, // fallback
};

router.post('/checkout', authenticateToken, async (req: AuthRequest, res) => {
  const { tier } = req.body;
  if (!tier) throw new AppError('tier is required', 400);

  const priceId = TIER_PRICE_IDS[tier as string];
  if (!priceId) throw new AppError(`Unknown or unconfigured price for tier: ${tier}`, 400);

  const user = await get<any>('SELECT email, stripe_customer_id FROM users WHERE id = ?', [req.user!.id]);

  const session = await StripeService.createSubscriptionCheckoutSession({
    priceId,
    customerEmail: user?.email,
    customerId: user?.stripe_customer_id,
    metadata: { userId: req.user!.id, tier },
    successUrl: `${config.APP_URL}/dashboard?subscribed=1`,
    cancelUrl: `${config.APP_URL}/pricing`,
  });

  res.json({ url: session.url });
});

// ── 4. Stripe Customer Portal ─────────────────────────────────────────────────

router.get('/portal', authenticateToken, async (req: AuthRequest, res) => {
  const user = await get<any>('SELECT stripe_customer_id FROM users WHERE id = ?', [req.user!.id]);
  if (!user?.stripe_customer_id) throw new AppError('No billing account found', 404);

  const portalSession = await StripeService.createBillingPortalSession(
    user.stripe_customer_id,
    `${config.APP_URL}/dashboard`
  );

  res.json({ url: portalSession.url });
});

// ── 5. Stripe Connect onboarding ──────────────────────────────────────────────

router.post('/connect', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const user = await get<any>('SELECT email, stripe_account_id FROM users WHERE id = ?', [userId]);

  let accountId = user?.stripe_account_id;
  if (!accountId) {
    const account = await StripeService.createConnectAccount(userId, user.email);
    accountId = account.id;
    await run('UPDATE users SET stripe_account_id = ? WHERE id = ?', [accountId, userId]);
  }

  const { url } = await StripeService.createOnboardingLink(accountId, 'dashboard/payouts');
  res.json({ url });
});

router.get('/connect-refresh', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const user = await get<any>('SELECT stripe_account_id FROM users WHERE id = ?', [userId]);
  if (!user?.stripe_account_id) throw new AppError('Connect account not found', 404);
  const { url } = await StripeService.createOnboardingLink(user.stripe_account_id, 'dashboard/payouts');
  res.redirect(url);
});

export default router;
