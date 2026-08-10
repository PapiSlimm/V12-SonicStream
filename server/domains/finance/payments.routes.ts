import express, { Router } from 'express';
import { authenticateToken, AuthRequest } from '../identity/auth.js';
import { z } from 'zod';
import { AppError } from '../../middleware/error.js';
import Stripe from 'stripe';
import { config } from '../../config.js';
import { get, run } from '../../db.js';
import { Track } from '../../types.js';
import { eventBus, EVENTS } from '../../services/EventBus.js';
import { StripeService } from './stripe.service.js';

import { stripeWebhookErrors, paymentFailures } from '../../monitoring.js';

const router = Router();
let stripeClient: Stripe | null = null;
const getStripe = (): Stripe => {
  if (!stripeClient) {
    if (!config.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required. Set it in .env');
    }
    stripeClient = new Stripe(config.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};

const purchaseSchema = z.object({
  trackId: z.number(),
});

const checkoutSchema = z.object({
  priceId: z.string(),
  userId: z.string(),
});

router.post('/create-checkout-session', authenticateToken, async (req: AuthRequest, res) => {
  // 1. Check if checkout is for subscription purchasing
  if (req.body && req.body.priceId) {
    const validated = checkoutSchema.parse(req.body);
    const { priceId, userId } = validated;
    
    const userRow = await get<any>('SELECT email, stripe_customer_id FROM users WHERE id = ?', [userId]);

    // Use StripeService to create the subscription checkout session
    const session = await StripeService.createSubscriptionCheckoutSession({
      priceId,
      customerEmail: userRow?.email || req.user?.email,
      customerId: userRow?.stripe_customer_id,
      metadata: { userId, tier: priceId.includes('pro') ? 'pro' : 'enterprise' },
      successUrl: `${config.APP_URL}/dashboard?subscribed=1`,
      cancelUrl: `${config.APP_URL}/pricing`,
    });
    
    res.json({ url: session.url });
    return;
  }

  // 2. Otherwise fall back to the digital track purchase flow
  const validated = purchaseSchema.parse(req.body);
  const { trackId } = validated;

  const track = await get<Track>('SELECT * FROM tracks WHERE id = ?', [trackId]);
  if (!track) throw new AppError('Track not found', 404);

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card', 'paypal'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: track.title,
          description: `Digital download of ${track.title} by ${track.artist}`,
        },
        unit_amount: Math.round(track.price * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${config.APP_URL}/success?sessionId={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.APP_URL}/cancel`,
    metadata: {
      trackId: track.id.toString(),
      userId: req.user?.id.toString() || '',
    }
  });

  res.json({ url: session.url });
});

const subscriptionSchema = z.object({
  tier: z.enum(['star', 'visionary', 'pro']),
});

router.post('/create-subscription-session', authenticateToken, async (req: AuthRequest, res) => {
  const validated = subscriptionSchema.parse(req.body);
  const { tier } = validated;

  const prices: Record<string, number> = {
    star: 999, // $9.99
    visionary: 1999, // $19.99
    pro: 4999, // $49.99
  };

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card', 'paypal'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `SonicStream ${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier`,
          description: `Monthly subscription for ${tier} features`,
        },
        unit_amount: prices[tier],
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${config.APP_URL}/subscription/success?sessionId={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.APP_URL}/subscription/cancel`,
    metadata: {
      tier,
      userId: req.user?.id.toString() || '',
    }
  });

  res.json({ url: session.url });
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig!, config.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    stripeWebhookErrors.inc({ reason: 'signature_verification', event: 'unknown' });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { trackId, userId, tier } = session.metadata!;
        
        eventBus.emit(EVENTS.PAYMENT_SUCCEEDED, {
          userId,
          amount: session.amount_total! / 100,
          type: trackId ? 'TRACK' : 'SUBSCRIPTION',
          referenceId: trackId || tier
        });

        if (trackId) {
          await run('INSERT INTO user_purchases (user_id, track_id) VALUES (?, ?)', [userId, trackId]);
          eventBus.emit(EVENTS.SALE_COMPLETED, {
            userId,
            targetId: trackId,
            targetType: 'TRACK',
            amount: session.amount_total! / 100
          });
        } else if (tier) {
          await run('UPDATE users SET subscription_tier = ?, is_pro = ? WHERE id = ?', [tier, tier === 'pro' ? 1 : 0, userId]);
        }
        break;
      }
      case 'invoice.payment_failed':
        paymentFailures.inc();
        // Handle failure logic...
        break;
    }
  } catch (err: any) {
    stripeWebhookErrors.inc({ reason: 'processing_error', event: event.type });
    throw err;
  }

  res.json({ received: true });
});

export default router;
