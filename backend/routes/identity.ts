// backend/routes/identity.ts
import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.ts';
import { getStripe } from '../services/stripeService.ts';
import prisma from '../db/client.ts';

const router = express.Router();

router.post('/create-session', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const stripe = getStripe();
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Create a VerificationSession
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        userId: userId,
      },
    });

    // Update user with session ID
    await prisma.user.update({
      where: { id: userId },
      data: { stripeVerificationId: session.id }
    });

    res.json({ client_secret: session.client_secret });
  } catch (error: any) {
    console.error('Stripe Identity Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create verification session' });
  }
});

router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true }
    });
    res.json({ isVerified: user?.isVerified || false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch verification status' });
  }
});

// SIMULATION ENDPOINT FOR DEMO
router.post('/simulate-success', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Simulation failed' });
  }
});

export default router;
