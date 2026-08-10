import { Router } from 'express';
import Stripe from 'stripe';
import { get } from '../db.js';
import { authenticateToken, AuthRequest } from '../domains/identity/auth.js';
import { AppError } from '../middleware/error.js';
import { Track } from '../types.js';

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

router.post('/sell-direct', authenticateToken, async (req: AuthRequest, res) => {
  const { trackId, price } = req.body;
  
  if (!trackId || !price) {
    throw new AppError('Track ID and price are required', 400);
  }

  const track = await get<Track & { artist_stripe_id: string, artist_name: string }>(
    'SELECT t.*, u.stripe_account_id as artist_stripe_id, u.name as artist_name FROM tracks t JOIN users u ON t.user_id = u.id WHERE t.id = ?',
    [trackId]
  );

  if (!track) {
    throw new AppError('Track not found', 404);
  }

  if (!track.artist_stripe_id) {
    throw new AppError('Artist has not connected Stripe yet', 400);
  }

  // Create Stripe checkout for direct sale
  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${track.title} - Digital Download`,
          description: `by ${track.artist_name}`,
          images: [track.artwork_url || 'https://picsum.photos/seed/artwork/500/500']
        },
        unit_amount: Math.round(price * 100), // Stripe cents
      },
      quantity: 1
    }],
    success_url: `${process.env.APP_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/track/${trackId}`,
    metadata: { 
      trackId: trackId.toString(), 
      artistId: track.user_id.toString(),
      artistStripeId: track.artist_stripe_id,
      type: 'digital_sale'
    }
  });
  
  res.json({ url: session.url });
});

export default router;
