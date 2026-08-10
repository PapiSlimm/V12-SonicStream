// backend/routes/webhooks.ts
import express from 'express';
import { getStripe } from '../services/stripeService.ts';
import prisma from '../db/client.ts';

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET not set, skipping signature verification (NOT FOR PRODUCTION)');
      // For development purposes, if the secret isn't set, we might just parse the body
      // but strictly we should have it.
      event = JSON.parse(req.body.toString());
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'identity.verification_session.verified': {
        const session = event.data.object as any;
        const userId = session.metadata.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true }
          });
          console.log(`User ${userId} verified via Stripe Identity`);
        }
        break;
      }
      case 'identity.verification_session.requires_input': {
        const session = event.data.object as any;
        console.log(`Identity verification requires input for session ${session.id}`);
        break;
      }
      case 'identity.verification_session.canceled':
      case 'identity.verification_session.redacted': {
         const session = event.data.object as any;
         const userId = session.metadata.userId;
         if (userId) {
           await prisma.user.update({
             where: { id: userId },
             data: { isVerified: false }
           });
         }
         break;
      }
      default:
        // Other events
    }
  } catch (err) {
    console.error('Error processing webhook event:', err);
  }

  res.json({ received: true });
});

export default router;
