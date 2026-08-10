import { Router } from 'express';
import Stripe from 'stripe';
import { run } from '../db.js';

let stripeClient: Stripe | null = null;
const getStripe = (): Stripe => {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required. Set it in .env');
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};
const router = Router();

const ROYALTY_RATE = 0.85; // 85% to artist

// Stripe Webhook Handler for Bandcamp-style direct sales
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;
  
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;
 
    if (metadata?.type === 'digital_sale') {
      const trackId = metadata.trackId;
      const artistStripeId = metadata.artistStripeId;
      const amountTotal = session.amount_total || 0;
 
      // Pay artist 85% (platform keeps 15%)
      try {
        await getStripe().transfers.create({
          amount: Math.round(amountTotal * ROYALTY_RATE),
          currency: 'usd',
          destination: artistStripeId,
          source_transaction: session.payment_intent as string
        });
        
        // Record sale in DB
        await run(
          'INSERT INTO direct_sales (track_id, amount, artist_revenue, platform_revenue) VALUES (?, ?, ?, ?)',
          [trackId, amountTotal / 100, (amountTotal * ROYALTY_RATE) / 100, (amountTotal * 0.15) / 100]
        );
      } catch (error) {
        console.error('Transfer failed:', error);
      }
    }
  }
  
  res.json({ received: true });
});

export default router;
