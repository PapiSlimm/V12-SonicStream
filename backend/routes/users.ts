// backend/routes/users.ts
import express from 'express';
import prisma from '../db/client.ts';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { id: true, email: true, name: true, createdAt: true, subscription: true, isVerified: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  if (req.user?.id !== req.params.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }
  const { name } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name },
      select: { id: true, email: true, name: true }
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Update failed.' });
  }
});

export default router;
