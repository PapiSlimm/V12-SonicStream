import express, { Router } from 'express';
import { db } from '../db.js';
import { StripeService } from '../domains/finance/stripe.service.js';
import { LedgerService } from '../domains/finance/ledger.service.js';
import { PricingService } from '../domains/finance/pricing.service.js';
import { IdempotencyService } from '../services/IdempotencyService.js';
import { eventBus, EVENTS } from '../services/EventBus.js';
import { notify } from '../domains/social/notification.service.js';
import { LedgerTransactionType } from '../types.js';

const router = Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req: any, res) => {
  const sig = req.headers['stripe-signature'];

  let event: any;
  try {
    event = StripeService.constructEvent(req.body, sig);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await IdempotencyService.runIdempotent(`stripe_event_${event.id}`, async () => {
      await db.run('INSERT INTO stripe_events (id, type) VALUES (?, ?) ON CONFLICT (id) DO NOTHING', [event.id, event.type]);

      switch (event.type) {

        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await handleInvoicePaid(event.data.object);
          break;

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object);
          break;

        case 'payout.paid':
          await db.run(
            `UPDATE payouts SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE stripe_payout_id = ?`,
            [event.data.object.id]
          );
          break;

        case 'payout.failed': {
          const p = event.data.object;
          await db.run(
            `UPDATE payouts SET status = 'failed', failure_reason = ? WHERE stripe_payout_id = ?`,
            [p.failure_message ?? 'unknown', p.id]
          );
          break;
        }

        case 'transfer.created':
          break; // informational

        case 'account.updated':
          await handleAccountUpdated(event.data.object);
          break;

        default:
          console.log(`[StripeWebhook] Unhandled event: ${event.type}`);
      }

      await db.run('UPDATE stripe_events SET processed = 1 WHERE id = ?', [event.id]);
      return { status: 'processed' };
    });

    res.json({ received: true });
  } catch (err: any) {
    console.error(`Error processing webhook ${event?.id}:`, err);
    res.status(500).send(`Webhook Processing Error: ${err.message}`);
  }
});

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: any) {
  const amountTotal = session.amount_total / 100;
  const { userId, artistId, trackTitle, orderType, printFileName, tier } = session.metadata ?? {};

  // Handle Subscription Checkout and Affiliate Referral logic
  if (session.mode === 'subscription' || tier) {
    const subUserId = userId || session.metadata?.userId;
    if (subUserId) {
      console.log(`[StripeWebhook] Subscription checkout completed for user: ${subUserId}`);
      
      const referral = await db.get(
        "SELECT * FROM referrals WHERE referredUserId = ? AND status = 'active'",
        [subUserId]
      );
      
      if (referral) {
        const affiliate = await db.get('SELECT * FROM affiliates WHERE id = ?', [referral.affiliateId]);
        if (affiliate) {
          const referralCount = affiliate.referralCount || 0;
          const subPriceCents = session.amount_total || 2900;
          
          let rate = 0.20;
          if (referralCount > 500) rate = 0.40;
          else if (referralCount > 200) rate = 0.30;
          
          const amountCents = Math.round(subPriceCents * rate);
          if (amountCents > 0) {
            const commissionId = `comm_${Math.random().toString(36).substr(2, 9)}`;
            const realPaymentId = session.id;
            
            await db.run(
              `INSERT INTO affiliate_commissions (id, tenantId, affiliateId, referredUserId, amountCents, subscriptionPaymentId, payoutStatus)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [commissionId, affiliate.tenantId || 'default', affiliate.id, subUserId, amountCents, realPaymentId, 'pending']
            );
            
            await db.run(
              'UPDATE affiliates SET earningsCents = earningsCents + ? WHERE id = ?',
              [amountCents, affiliate.id]
            );
            
            console.log(`[StripeWebhook] Confirmed real commission of ${amountCents} cents for affiliate ${affiliate.id}`);
          }
        }
      }
    }
  }

  // Handle Print-on-Demand (POD) Order Fulfillment
  if (orderType === 'print_order' || session.metadata?.order_type === 'print_order') {
    const updatedUser = userId || session.metadata?.userId;
    if (!updatedUser) {
      console.warn('[StripeWebhook] Missing userId in print order checkout metadata', session.id);
      return;
    }

    const subtotal = amountTotal / 1.08; // reconstruct before tax
    const zooCostEstimate = subtotal / 1.7; // reconstruct zoo pricing
    const profitEstimate = subtotal - zooCostEstimate;

    // Check if printing order is already inserted in local database (pre-created or webhook-driven)
    const existingOrder = await db.get(
      'SELECT id FROM printorders WHERE paymentintentid = ?',
      [session.id]
    );

    if (existingOrder) {
      await db.run(
        `UPDATE printorders 
         SET status = 'processing', zoocostestimate = ?, profitestimate = ?
         WHERE id = ?`,
        [zooCostEstimate, profitEstimate, existingOrder.id]
      );
    } else {
      // Build mock print cart item based on details
      const items = [{ name: 'Acoustic Cover Screenprint Custom poster', price: subtotal, quantity: 1, format: 'Apparel/Poster' }];
      const parsedShipping = session.shipping_details ? {
        name: session.shipping_details.name,
        address: session.shipping_details.address
      } : { name: session.customer_details?.name || 'Customer', address: 'Digital/Fulfillment Standard' };

      await db.run(
        `INSERT INTO printorders (userid, paymentintentid, customeremail, cart, shippingaddress, amountcharged, zoocostestimate, profitestimate, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          updatedUser,
          session.id,
          session.customer_details?.email || 'fulfillment@sonicstream.net',
          JSON.stringify(items),
          parsedShipping ? (typeof parsedShipping === 'string' ? parsedShipping : JSON.stringify(parsedShipping)) : '',
          amountTotal,
          zooCostEstimate,
          profitEstimate,
          'processing'
        ]
      );
    }

    // Capture double-entry accounting for the custom POD merchandise sale
    await LedgerService.createBalancedTransaction({
      tenantId: 'default',
      type: LedgerTransactionType.PAYMENT,
      description: `Merch POD Fulfillment: ${printFileName || 'Art Poster Print'}`,
      stripeSessionId: session.id,
      metadata: { buyerId: updatedUser, grossAmount: amountTotal },
      entries: [
        { accountType: 'PROCESSOR', amount: -amountTotal },
        { accountType: 'PLATFORM', amount: profitEstimate },
        { accountType: 'USER', userId: updatedUser, amount: zooCostEstimate }
      ],
    });

    await notify(updatedUser, 'order_status_update', `Your print merchandise order has been processed and forwarded to our automated print fulfillment partner!`);
    
    await db.run(
      `INSERT INTO adminlogs (adminid, action, targettype, targetid, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        1,
        'print_order_fulfilled',
        'user',
        updatedUser,
        `Successful checkout for print order. Session: ${session.id}, Total: $${amountTotal}`
      ]
    );

    eventBus.emit(EVENTS.PAYMENT_SUCCEEDED, { session, amount: amountTotal });
    return;
  }

  if (!userId || !artistId) {
    console.warn('[StripeWebhook] Missing metadata in checkout session', session.id);
    return;
  }

  const artist   = await db.get('SELECT tenant_id FROM users WHERE id = ?', [artistId]);
  const tenantId = artist?.tenant_id ?? 'default';

  const { platformFee, artistAmount } = await PricingService.calculateSplit(amountTotal, artistId);

  await LedgerService.createBalancedTransaction({
    tenantId,
    type: LedgerTransactionType.PAYMENT,
    description: `Sale: ${trackTitle ?? 'Music Purchase'}`,
    stripeSessionId: session.id,
    metadata: { buyerId: userId, grossAmount: amountTotal },
    entries: [
      { accountType: 'PROCESSOR', amount: -amountTotal },
      { accountType: 'USER',      userId: artistId, amount: artistAmount },
      { accountType: 'PLATFORM',  amount: platformFee },
    ],
  });

  eventBus.emit(EVENTS.PAYMENT_SUCCEEDED, { session, artistId, amount: amountTotal });
}

async function handleSubscriptionCreated(sub: any) {
  const tier = sub.metadata?.tier ?? resolveTierFromPriceId(sub.items?.data?.[0]?.price?.id);
  await db.run(
    `UPDATE users
     SET subscription_tier = ?, is_pro = 1, subscription_status = 'active',
         stripe_subscription_id = ?, subscription_period_end = ?
     WHERE stripe_customer_id = ?`,
    [tier, sub.id, new Date(sub.current_period_end * 1000).toISOString(), sub.customer]
  );
}

async function handleSubscriptionUpdated(sub: any) {
  const tier  = sub.metadata?.tier ?? resolveTierFromPriceId(sub.items?.data?.[0]?.price?.id);
  const isPro = ['active', 'trialing'].includes(sub.status) ? 1 : 0;
  await db.run(
    `UPDATE users
     SET subscription_tier = ?, is_pro = ?, subscription_status = ?,
         subscription_period_end = ?
     WHERE stripe_customer_id = ?`,
    [tier, isPro, sub.status, new Date(sub.current_period_end * 1000).toISOString(), sub.customer]
  );
}

async function handleSubscriptionDeleted(sub: any) {
  await db.run(
    `UPDATE users
     SET subscription_tier = 'free', is_pro = 0,
         subscription_status = 'canceled', stripe_subscription_id = NULL
     WHERE stripe_customer_id = ?`,
    [sub.customer]
  );
  const user = await db.get<{ id: string }>('SELECT id FROM users WHERE stripe_customer_id = ?', [sub.customer]);
  if (user?.id) {
    await notify(user.id, 'subscription_cancelled',
      'Your SonicStream subscription was cancelled. You have been moved to the free plan.'
    );
  }
  eventBus.emit(EVENTS.SUBSCRIPTION_CANCELLED, { customerId: sub.customer });
}

async function handleInvoicePaid(invoice: any) {
  if (!invoice.subscription) return; // one-time — handled by checkout.session.completed
  await db.run(
    `UPDATE users SET subscription_status = 'active', is_pro = 1,
       subscription_period_end = ?
     WHERE stripe_customer_id = ?`,
    [new Date(invoice.period_end * 1000).toISOString(), invoice.customer]
  );
}

async function handleInvoicePaymentFailed(invoice: any) {
  await db.run(
    `UPDATE users SET subscription_status = 'past_due' WHERE stripe_customer_id = ?`,
    [invoice.customer]
  );
  const user = await db.get<{ id: string }>('SELECT id FROM users WHERE stripe_customer_id = ?', [invoice.customer]);
  if (user?.id) {
    await notify(user.id, 'payment_failed',
      `Your payment failed (attempt ${invoice.attempt_count}). ` +
      `Please update your payment method to keep your subscription active.`
    );
  }
  eventBus.emit(EVENTS.PAYMENT_FAILED, { customerId: invoice.customer, invoiceId: invoice.id });
}

async function handlePaymentIntentFailed(pi: any) {
  const reason = pi.last_payment_error?.message ?? 'Payment declined';
  console.warn(`[StripeWebhook] PaymentIntent ${pi.id} failed: ${reason}`);
  const { userId } = pi.metadata ?? {};
  if (userId) {
    await notify(userId, 'payment_failed',
      `Your payment could not be processed: ${reason}. Please try again or update your payment method.`
    );
  }
}

async function handleAccountUpdated(account: any) {
  if (account.details_submitted && account.payouts_enabled) {
    await db.run('UPDATE users SET payout_enabled = 1 WHERE stripe_account_id = ?', [account.id]);
  }
}

/** Map Stripe price IDs → internal tier names. Update with your real price IDs. */
function resolveTierFromPriceId(priceId?: string): string {
  if (!priceId) return 'pro';
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_PRO_MONTHLY  ?? '']: 'pro',
    [process.env.STRIPE_PRICE_PRO_ANNUAL   ?? '']: 'pro',
    [process.env.STRIPE_PRICE_ENTERPRISE   ?? '']: 'enterprise',
  };
  return map[priceId] ?? 'pro';
}

export default router;
