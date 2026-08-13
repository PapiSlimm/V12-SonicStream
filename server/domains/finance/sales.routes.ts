import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { authenticateToken, AuthRequest } from '../identity/auth.js';
import { config } from '../../config.js';
import { AppError } from '../../middleware/error.js';
import { db as firestore, isFirebaseAvailable } from '../../firebase-admin.js';
import { isCatalogSku, resolveCatalogItem } from './catalog.js';

/**
 * Marketplace sales checkout.
 *
 * The storefront lists products from Firestore (client-side), but a checkout
 * must never trust client-supplied prices. This route re-reads each product
 * from Firestore server-side, builds Stripe line items from the AUTHORITATIVE
 * price, and returns a Checkout Session URL. Fulfillment/settlement is driven
 * by the Stripe webhook (stripe_events) downstream.
 */
const router = Router();

let stripeClient: Stripe | null = null;
const getStripe = (): Stripe => {
  if (!stripeClient) {
    if (!config.STRIPE_SECRET_KEY) throw new AppError('Payments are not configured', 503);
    stripeClient = new Stripe(config.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().max(100),
      })
    )
    .min(1)
    .max(50),
});

// POST /api/sales/checkout
router.post('/checkout', authenticateToken, async (req: AuthRequest, res) => {
  const { items } = checkoutSchema.parse(req.body);

  // Merge duplicate productIds into a single quantity.
  const qtyById = new Map<string, number>();
  for (const it of items) {
    qtyById.set(it.productId, (qtyById.get(it.productId) ?? 0) + it.quantity);
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const purchased: Array<{ id: string; qty: number; cents: number }> = [];

  for (const [productId, quantity] of qtyById) {
    // 1. Built-in catalog SKUs (beats / services / tickets) — price is authoritative here.
    if (isCatalogSku(productId)) {
      const line = resolveCatalogItem(productId);
      if (!line) throw new AppError(`Item not found: ${productId}`, 404);
      line_items.push({
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: line.unitAmountCents,
          product_data: { name: line.name },
        },
      });
      purchased.push({ id: productId, qty: quantity, cents: line.unitAmountCents });
      continue;
    }

    // 2. Real, user-listed products live in Firestore — read the price from there.
    if (!isFirebaseAvailable || !firestore) {
      throw new AppError('Marketplace storefront is temporarily unavailable', 503);
    }
    const snap = await firestore.collection('products').doc(productId).get();
    if (!snap.exists) throw new AppError(`Product not found: ${productId}`, 404);

    const p = (snap.data() ?? {}) as {
      name?: string;
      description?: string;
      imageUrl?: string;
      price?: number;
      priceCents?: number;
      status?: string;
    };

    if (p.status && p.status !== 'active') {
      throw new AppError(`Product is not available for purchase: ${p.name ?? productId}`, 409);
    }

    // Authoritative price: prefer integer cents, else derive from dollars.
    const cents = Number.isInteger(p.priceCents)
      ? (p.priceCents as number)
      : Math.round(Number(p.price) * 100);

    if (!Number.isInteger(cents) || cents < 50) {
      throw new AppError(`This product has an invalid price and cannot be sold: ${p.name ?? productId}`, 422);
    }

    line_items.push({
      quantity,
      price_data: {
        currency: 'usd',
        unit_amount: cents,
        product_data: {
          name: String(p.name ?? 'Product'),
          ...(p.description ? { description: String(p.description).slice(0, 300) } : {}),
          ...(p.imageUrl && /^https?:\/\//.test(String(p.imageUrl)) ? { images: [String(p.imageUrl)] } : {}),
        },
      },
    });
    purchased.push({ id: productId, qty: quantity, cents });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items,
    success_url: `${config.APP_URL}/success?sessionId={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.APP_URL}/marketplace?checkout=cancelled`,
    metadata: {
      kind: 'marketplace',
      userId: req.user?.id?.toString() ?? '',
      // compact manifest for webhook-side fulfillment (Stripe caps values at 500 chars)
      productIds: purchased.map((x) => `${x.id}x${x.qty}`).join(',').slice(0, 480),
    },
  });

  res.json({ url: session.url });
});

export default router;
