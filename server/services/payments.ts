import Stripe from 'stripe';
import { config } from '../config.js';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_dev_purposes_only';
    stripeClient = new Stripe(key, {
      apiVersion: '2024-04-10' as any,
    });
  }
  return stripeClient;
}

export const PRICE_IDS: Record<string, string> = {
  STAR_MONTHLY: process.env.STRIPE_PRICE_STAR_MONTHLY || 'price_star_mo_dummy',
  STAR_YEARLY: process.env.STRIPE_PRICE_STAR_YEARLY || 'price_star_yr_dummy',
  VISIONARY_MONTHLY: process.env.STRIPE_PRICE_VISIONARY_MONTHLY || 'price_visionary_mo_dummy',
  VISIONARY_YEARLY: process.env.STRIPE_PRICE_VISIONARY_YEARLY || 'price_visionary_yr_dummy',
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_mo_dummy',
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yr_dummy',
};

export async function createCheckoutSession(userId: string, email: string, tier: string, interval = 'monthly') {
  const stripe = getStripe();
  const priceKey = `${tier}_${interval}`.toUpperCase();
  const priceId = PRICE_IDS[priceKey];
  
  if (!priceId) {
    throw new Error(`Invalid tier or interval: ${tier} ${interval}`);
  }
  
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${appUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
    metadata: { userId, tier, interval },
  });
  
  return session;
}

export async function handleWebhook(event: Stripe.Event) {
  // Handle subscription events
  console.log(`[Stripe Webhook] Received event of type: ${event.type}`);
}
